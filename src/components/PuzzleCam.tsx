"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { HandLandmarker } from "@mediapipe/tasks-vision";
import {
  HAND_CONNECTIONS, loadHandLandmarker, isPinch, pinchPoint, pinchBox,
  lerpBox, boxDelta,
  type Box, type Hand, type Pt,
} from "@/lib/hands";
import { buildStrip, captureFrame, downloadDataUrl } from "@/lib/imaging";
import Strip from "./Strip";

type Phase = "boot" | "tracking" | "countdown" | "puzzle" | "solved" | "complete";
type Piece = {
  id: number; cell: number; locked: boolean;
  px?: number; py?: number;
  tx: number; ty: number; rot: number;
};

const HOLD_MS = 1000;        // hold frame steady 1s -> countdown
const COUNT_STEP = 700;      // 3-2-1
const SAVE_DELAY_MS = 900;   // COMPLETE flash, then auto-save
const RELEASE_FRAMES = 4;    // debounce accidental releases
const SHOTS = 3;

export default function PuzzleCam() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const pieceEls = useRef(new Map<number, HTMLDivElement>());
  const lmRef = useRef<HandLandmarker | null>(null);

  const [phase, setPhase] = useState<Phase>("boot");
  const [error, setError] = useState<string | null>(null);
  const [shots, setShots] = useState<string[]>([]);
  const [status, setStatus] = useState({ dot: "bg-paper/50", text: "LOADING MODEL…", cls: "" });
  const [lockedCount, setLockedCount] = useState(0);
  const [, setVersion] = useState(0);

  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const handsRef = useRef<Hand[]>([]);
  const boxRef = useRef<Box | null>(null);
  const holdSinceRef = useRef<number | null>(null);
  const countStartRef = useRef(0);
  const solvedAtRef = useRef(0);
  const piecesRef = useRef<Piece[]>([]);
  const dragRef = useRef<{ id: number; dx: number; dy: number } | null>(null);
  const releaseRef = useRef(0);
  const pinchSmoothRef = useRef<Pt | null>(null);
  const shotRef = useRef<string | null>(null);
  const boardRef = useRef<Box | null>(null);
  const shotsRef = useRef<string[]>([]);
  const statusKeyRef = useRef("");

  /* ---------- boot ---------- */
  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 }, audio: false,
        });
        if (cancelled) return;
        const v = videoRef.current!;
        v.srcObject = stream;
        await v.play();
        lmRef.current = await loadHandLandmarker();
        if (!cancelled) setPhase("tracking");
      } catch {
        if (!cancelled) setError("CAMERA ERROR — allow camera access and use https");
      }
    })();
    return () => { cancelled = true; stream?.getTracks().forEach((t) => t.stop()); };
  }, []);

  const cellRect = (b: Box, cell: number): Box => ({
    x: b.x + (cell % 3) * (b.w / 3),
    y: b.y + Math.floor(cell / 3) * (b.h / 3),
    w: b.w / 3,
    h: b.h / 3,
  });

  function syncPieceDom() {
    const stage = stageRef.current, b = boardRef.current;
    if (!stage || !b) return;
    const SW = stage.clientWidth, SH = stage.clientHeight;
    for (const p of piecesRef.current) {
      const el = pieceEls.current.get(p.id);
      if (!el) continue;
      const r = cellRect(b, p.cell);
      el.style.left = `${r.x * SW}px`;
      el.style.top = `${r.y * SH}px`;
      el.style.zIndex = p.locked ? "10" : "15";
      el.classList.remove("dragging", "on-target");
    }
  }

  function doCapture() {
    const box = boxRef.current, v = videoRef.current;
    if (!box || !v) return;
    shotRef.current = captureFrame(v, box).toDataURL("image/png");
    boardRef.current = box;
    holdSinceRef.current = null;
    const order = [...Array(9).keys()];
    do {
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
    } while (order.filter((c, id) => c === id).length > 2);
    piecesRef.current = order.map((cell, id) => ({
      id, cell, locked: false,
      tx: (Math.random() * 2 - 1) * 140,
      ty: (Math.random() * 2 - 1) * 100,
      rot: (Math.random() * 2 - 1) * 24,
    }));
    dragRef.current = null;
    pinchSmoothRef.current = null;
    setLockedCount(0);
    setVersion((vv) => vv + 1);
    setPhase("puzzle");
  }

  function dropPiece(now: number) {
    const drag = dragRef.current!;
    const p = piecesRef.current[drag.id];
    const b = boardRef.current!;
    dragRef.current = null;
    releaseRef.current = 0;
    const cx = (p.px ?? 0) + b.w / 6;
    const cy = (p.py ?? 0) + b.h / 6;
    const t = cellRect(b, p.id);
    const tol = 0.18;
    const inside =
      cx > t.x - t.w * tol && cx < t.x + t.w * (1 + tol) &&
      cy > t.y - t.h * tol && cy < t.y + t.h * (1 + tol);
    if (inside) {
      const occ = piecesRef.current.find((q) => q.id !== p.id && q.cell === p.id);
      if (occ) { occ.cell = p.cell; occ.px = occ.py = undefined; }
      p.locked = true;
      p.cell = p.id;
    }
    p.px = p.py = undefined;
    syncPieceDom();
    setLockedCount(piecesRef.current.filter((q) => q.locked).length);
    setVersion((vv) => vv + 1);
    if (piecesRef.current.every((q) => q.locked)) {
      solvedAtRef.current = now;
      setPhase("solved");
    }
  }

  function saveShot() {
    const url = shotRef.current;
    if (!url) return;
    shotRef.current = null;
    piecesRef.current = [];
    boardRef.current = null;
    boxRef.current = null;
    holdSinceRef.current = null;
    shotsRef.current = [...shotsRef.current, url];
    setShots(shotsRef.current);
    setPhase(shotsRef.current.length >= SHOTS ? "complete" : "tracking");
  }

  const resetAll = useCallback(() => {
    shotsRef.current = [];
    setShots([]);
    boxRef.current = null;
    piecesRef.current = [];
    boardRef.current = null;
    setLockedCount(0);
    setPhase("tracking");
  }, []);

  const onDownload = useCallback(async () => {
    downloadDataUrl(await buildStrip(shotsRef.current), "puzzle-cam-strip.png");
  }, []);

  /* ---------- state machine ---------- */
  function step(now: number) {
    const ph = phaseRef.current;
    const hands = handsRef.current;

    if (ph === "tracking" || ph === "countdown") {
      const pinching = hands.filter((h) => isPinch(h.lm));
      if (pinching.length === 2) {
        const raw = pinchBox(pinchPoint(pinching[0].lm), pinchPoint(pinching[1].lm));
        const prev = boxRef.current;
        const box = prev ? lerpBox(prev, raw, 0.4) : raw;
        boxRef.current = box;
        if (ph === "tracking") {
          if (prev && boxDelta(prev, box) < 0.01) {
            if (holdSinceRef.current == null) holdSinceRef.current = now;
            else if (now - holdSinceRef.current > HOLD_MS) {
              countStartRef.current = now;
              setPhase("countdown");
            }
          } else holdSinceRef.current = null;
        }
      } else {
        boxRef.current = null;
        holdSinceRef.current = null;
        if (ph === "countdown") setPhase("tracking");
      }
      if (ph === "countdown" && now - countStartRef.current >= COUNT_STEP * 3) doCapture();
      return;
    }

    if (ph === "puzzle") {
      let raw: Pt | null = null;
      for (const h of hands) {
        if (isPinch(h.lm, dragRef.current != null)) { raw = pinchPoint(h.lm); break; }
      }
      const mir = raw ? { x: 1 - raw.x, y: raw.y } : null;

      if (mir) {
        releaseRef.current = 0;
        const prevP = pinchSmoothRef.current;
        const sp = prevP && dragRef.current
          ? { x: prevP.x + (mir.x - prevP.x) * 0.5, y: prevP.y + (mir.y - prevP.y) * 0.5 }
          : mir;
        pinchSmoothRef.current = sp;

        if (dragRef.current) {
          const p = piecesRef.current[dragRef.current.id];
          p.px = sp.x - dragRef.current.dx;
          p.py = sp.y - dragRef.current.dy;
          const stage = stageRef.current, b = boardRef.current!;
          const el = pieceEls.current.get(p.id);
          if (stage && el) {
            const SW = stage.clientWidth, SH = stage.clientHeight;
            el.style.left = `${p.px * SW}px`;
            el.style.top = `${p.py * SH}px`;
            const cx = p.px + b.w / 6, cy = p.py + b.h / 6;
            const t = cellRect(b, p.id);
            el.classList.toggle("on-target", cx > t.x && cx < t.x + t.w && cy > t.y && cy < t.y + t.h);
          }
        } else {
          const b = boardRef.current!;
          const hit = piecesRef.current.find((p) => {
            if (p.locked) return false;
            const r = cellRect(b, p.cell);
            return mir.x >= r.x && mir.x <= r.x + r.w && mir.y >= r.y && mir.y <= r.y + r.h;
          });
          if (hit) {
            const r = cellRect(b, hit.cell);
            dragRef.current = { id: hit.id, dx: mir.x - r.x, dy: mir.y - r.y };
            hit.px = r.x; hit.py = r.y;
            const el = pieceEls.current.get(hit.id);
            if (el) {
              el.style.animation = "none";
              el.classList.add("dragging");
              el.style.zIndex = "30";
            }
          }
        }
      } else {
        pinchSmoothRef.current = null;
        if (dragRef.current) {
          releaseRef.current++;
          if (releaseRef.current > RELEASE_FRAMES) dropPiece(now);
        }
      }
      return;
    }

    if (ph === "solved" && now - solvedAtRef.current > SAVE_DELAY_MS) saveShot();
  }

  /* ---------- skeleton overlay (ON TOP of puzzle now) ---------- */
  function drawOverlay() {
    const c = overlayRef.current, stage = stageRef.current;
    if (!c || !stage) return;
    const W = stage.clientWidth, H = stage.clientHeight;
    if (c.width !== W) c.width = W;
    if (c.height !== H) c.height = H;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, W, H);
    for (const h of handsRef.current) {
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.lineWidth = 1.5;
      for (const [a, b] of HAND_CONNECTIONS) {
        ctx.beginPath();
        ctx.moveTo((1 - h.lm[a].x) * W, h.lm[a].y * H);
        ctx.lineTo((1 - h.lm[b].x) * W, h.lm[b].y * H);
        ctx.stroke();
      }
      ctx.fillStyle = "#fff";
      for (const p of h.lm) {
        ctx.beginPath();
        ctx.arc((1 - p.x) * W, p.y * H, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  /* ---------- imperative HUD (no react re-render at 60fps) ---------- */
  function paintHud(now: number) {
    const ph = phaseRef.current;
    const stage = stageRef.current;
    if (stage) {
      const SW = stage.clientWidth, SH = stage.clientHeight;
      const fr = frameRef.current;
      const b = boxRef.current;
      const show = (ph === "tracking" || ph === "countdown") && !!b;
      if (fr) {
        fr.style.display = show ? "block" : "none";
        if (show && b) {
          fr.style.left = `${b.x * SW}px`;
          fr.style.top = `${b.y * SH}px`;
          fr.style.width = `${b.w * SW}px`;
          fr.style.height = `${b.h * SH}px`;
        }
      }
      if (countRef.current) {
        const n = Math.max(1, 3 - Math.floor((now - countStartRef.current) / COUNT_STEP));
        countRef.current.textContent = ph === "countdown" ? String(n) : "";
      }
    }
    // status text (state only when it changes)
    const bothPinch = handsRef.current.filter((h) => isPinch(h.lm)).length === 2;
    let s = { dot: "bg-paper/50", text: "LOADING MODEL…", cls: "" };
    if (ph === "tracking") {
      s = bothPinch
        ? { dot: "bg-signal", text: "FRAME LOCKED — HOLD STEADY 1s", cls: "" }
        : { dot: "bg-signal blink", text: "PINCH BOTH HANDS TO SET THE FRAME", cls: "" };
    } else if (ph === "countdown") {
      const n = Math.max(1, 3 - Math.floor((now - countStartRef.current) / COUNT_STEP));
      s = { dot: "bg-bad blink", text: `CAPTURING IN ${n}…`, cls: "" };
    } else if (ph === "puzzle") {
      s = { dot: "bg-signal", text: "SOLVE THE PUZZLE WITH PINCH", cls: "" };
    } else if (ph === "solved") {
      s = { dot: "bg-ok", text: "COMPLETE! — SAVING…", cls: "border-ok/50 text-ok" };
    } else if (ph === "complete") {
      s = { dot: "bg-ok", text: "STRIP COMPLETE — DOWNLOAD OR RESTART", cls: "border-ok/50 text-ok" };
    }
    const key = s.text + s.dot + s.cls;
    if (key !== statusKeyRef.current) {
      statusKeyRef.current = key;
      setStatus(s);
    }
  }

  /* ---------- rAF loop ---------- */
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const wrap = wrapRef.current, stage = stageRef.current;
      if (wrap && stage) {
        const s = Math.min((wrap.clientWidth - 16) / 4, (wrap.clientHeight - 16) / 3);
        stage.style.width = `${Math.floor(s * 4)}px`;
        stage.style.height = `${Math.floor(s * 3)}px`;
      }
      const v = videoRef.current;
      if (v && v.readyState >= 2 && lmRef.current) {
        const res = lmRef.current.detectForVideo(v, performance.now());
        handsRef.current = (res.landmarks ?? []).map((lm, i) => ({
          lm, label: res.handedness?.[i]?.[0]?.categoryName ?? "",
        }));
      } else handsRef.current = [];
      const now = performance.now();
      step(now);
      paintHud(now);
      drawOverlay();
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- render ---------- */
  const SW = stageRef.current?.clientWidth ?? 640;
  const SH = stageRef.current?.clientHeight ?? 480;
  const board = boardRef.current;
  const shot = shotRef.current;

  return (
    <div className="flex h-screen overflow-hidden">
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-line px-4 py-3">
          <div className="flex items-baseline gap-3">
            <h1 className="text-sm font-bold tracking-[0.2em] text-signal">PUZZLE-CAM</h1>
            <span className="text-[10px] tracking-[0.25em] text-paper/50">HAND-FRAME CAPTURE</span>
          </div>
          <div className={`flex items-center gap-2 border border-line px-3 py-1.5 text-[10px] tracking-[0.2em] ${status.cls || "text-paper/80"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
            {status.text}
          </div>
        </header>

        <div ref={wrapRef} className="relative flex min-h-0 flex-1 items-center justify-center">
          <div ref={stageRef} className="scanlines relative overflow-hidden border border-line bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 h-full w-full -scale-x-100 object-fill [filter:contrast(1.1)_saturate(0.78)_brightness(0.94)_sepia(0.14)]"
            />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgba(70,52,120,0.16),rgba(255,140,60,0.10))] mix-blend-screen" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(8,6,18,0.5)_100%)]" />

            {/* capture frame + countdown (imperative) */}
            <div ref={frameRef} className="pointer-events-none absolute z-20 border-2 border-signal" style={{ display: "none" }}>
              <span ref={countRef} className="absolute inset-0 grid place-items-center text-7xl font-bold text-signal drop-shadow-[0_2px_0_rgba(0,0,0,0.8)]" />
            </div>

            {/* puzzle board */}
            {(phase === "puzzle" || phase === "solved") && board && shot && (
              <>
                <div
                  className={`absolute border-2 ${phase === "solved" ? "border-ok" : "border-signal"}`}
                  style={{ left: board.x * SW, top: board.y * SH, width: board.w * SW, height: board.h * SH }}
                />
                {piecesRef.current.map((p) => {
                  const r = cellRect(board, p.cell);
                  const col = p.id % 3, row = Math.floor(p.id / 3);
                  return (
                    <div
                      key={p.id}
                      ref={(el) => {
                        if (el) pieceEls.current.set(p.id, el);
                        else pieceEls.current.delete(p.id);
                      }}
                      className={`absolute border ${p.locked ? "border-ok/70" : "border-black/60 shadow-[0_0_0_1px_rgba(255,255,255,0.25)]"}`}
                      style={{
                        left: r.x * SW,
                        top: r.y * SH,
                        width: r.w * SW,
                        height: r.h * SH,
                        backgroundImage: `url(${shot})`,
                        backgroundSize: `${board.w * SW}px ${board.h * SH}px`,
                        backgroundPosition: `-${col * r.w * SW}px -${row * r.h * SH}px`,
                        zIndex: p.locked ? 10 : 15,
                        animation: `settle 0.45s ${p.id * 40}ms cubic-bezier(0.2,0.8,0.3,1) both`,
                        "--tx": `${p.tx}px`,
                        "--ty": `${p.ty}px`,
                        "--rot": `${p.rot}deg`,
                      } as React.CSSProperties}
                    />
                  );
                })}
              </>
            )}

            {/* skeleton ON TOP of everything puzzle */}
            <canvas ref={overlayRef} className="pointer-events-none absolute inset-0 z-40" />

            {phase === "solved" && (
              <p className="absolute inset-x-0 top-1/2 z-40 -translate-y-1/2 text-center text-lg tracking-[0.15em] text-ok drop-shadow-[0_1px_0_#000]">
                COMPLETE! — saving…
              </p>
            )}

            {phase === "puzzle" && (
              <span className="absolute right-2 top-2 z-40 border border-line bg-ink/80 px-2 py-1 text-[10px] tracking-[0.2em] text-signal">
                {lockedCount} / 9 PIECES PLACED
              </span>
            )}

            <span className="absolute bottom-2 left-2 z-40 border border-line bg-ink/70 px-2 py-1 text-[10px] tracking-[0.2em] text-paper/70">
              FILTER — DUSK/01
            </span>

            {error && (
              <p className="absolute inset-x-4 top-4 z-50 border border-bad bg-ink/90 p-3 text-center text-[11px] tracking-[0.15em] text-bad">
                {error}
              </p>
            )}
          </div>
        </div>

        <footer className="flex items-center justify-between gap-2 border-t border-line px-4 py-2 text-[10px] tracking-[0.2em] text-paper/50">
          <span>PINCH BOTH HANDS = FRAME</span>
          <span>HOLD 1s = CAPTURE</span>
          <span>PINCH = DRAG TILE</span>
          <span className="text-signal">SOLVED = AUTO SAVE</span>
        </footer>
      </main>

      <Strip shots={shots} complete={shots.length >= SHOTS} onDownload={onDownload} onReset={resetAll} />
    </div>
  );
}
