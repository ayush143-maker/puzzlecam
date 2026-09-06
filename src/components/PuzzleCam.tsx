"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { HandLandmarker } from "@mediapipe/tasks-vision";
import {
  HAND_CONNECTIONS, loadHandLandmarker, isFist, isOpen, isPinch, pinchPoint,
  handsBox, lerpBox, boxDelta,
  type Box, type Hand,
} from "@/lib/hands";
import { buildStrip, captureFrame, downloadDataUrl } from "@/lib/imaging";
import Strip from "./Strip";

type Phase = "boot" | "tracking" | "countdown" | "puzzle" | "solved" | "complete";
type Piece = {
  id: number; cell: number; locked: boolean;
  px?: number; py?: number;         // drag position (normalized stage coords)
  tx: number; ty: number; rot: number; // shatter-settle entrance
};

const HOLD_MS = 900;
const COUNT_STEP = 700;
const FIST_MS = 600;
const SHOTS = 3;

export default function PuzzleCam() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const lmRef = useRef<HandLandmarker | null>(null);

  const [phase, setPhase] = useState<Phase>("boot");
  const [error, setError] = useState<string | null>(null);
  const [shots, setShots] = useState<string[]>([]);
  const [, setTick] = useState(0);

  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const handsRef = useRef<Hand[]>([]);
  const boxRef = useRef<Box | null>(null);
  const holdSinceRef = useRef<number | null>(null);
  const countStartRef = useRef(0);
  const piecesRef = useRef<Piece[]>([]);
  const dragRef = useRef<{ id: number; dx: number; dy: number } | null>(null);
  const fistSinceRef = useRef<number | null>(null);
  const shotRef = useRef<string | null>(null);
  const boardRef = useRef<Box | null>(null);
  const shotsRef = useRef<string[]>([]);

  /* ---------- boot: camera + model ---------- */
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
        if (!cancelled) setError("no se pudo abrir la cámara — permite el acceso y usa https");
      }
    })();
    return () => { cancelled = true; stream?.getTracks().forEach((t) => t.stop()); };
  }, []);

  /* ---------- helpers ---------- */
  const cellRect = (b: Box, cell: number): Box => ({
    x: b.x + (cell % 3) * (b.w / 3),
    y: b.y + Math.floor(cell / 3) * (b.h / 3),
    w: b.w / 3,
    h: b.h / 3,
  });

  function doCapture() {
    const box = boxRef.current;
    const v = videoRef.current;
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
    setPhase("puzzle");
  }

  function dropPiece() {
    const drag = dragRef.current!;
    const p = piecesRef.current[drag.id];
    const b = boardRef.current!;
    dragRef.current = null;
    const cx = (p.px ?? 0) + b.w / 6;
    const cy = (p.py ?? 0) + b.h / 6;
    const target = cellRect(b, p.id);
    const tol = 0.15;
    const inside =
      cx > target.x - target.w * tol && cx < target.x + target.w * (1 + tol) &&
      cy > target.y - target.h * tol && cy < target.y + target.h * (1 + tol);
    if (inside) {
      const occ = piecesRef.current.find((q) => q.id !== p.id && q.cell === p.id);
      if (occ) { occ.cell = p.cell; occ.px = occ.py = undefined; }
      p.locked = true;
      p.cell = p.id;
    }
    p.px = p.py = undefined;
    if (piecesRef.current.every((q) => q.locked)) {
      fistSinceRef.current = null;
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
    setPhase("tracking");
  }, []);

  const onDownload = useCallback(async () => {
    downloadDataUrl(await buildStrip(shotsRef.current), "puzzle-cam-tira.png");
  }, []);

  /* ---------- state machine step ---------- */
  function step(now: number) {
    const ph = phaseRef.current;
    const hands = handsRef.current;

    if (ph === "tracking" || ph === "countdown") {
      const open = hands.filter((h) => isOpen(h.lm));
      if (open.length === 2) {
        const raw = handsBox(open);
        const prev = boxRef.current;
        const box = prev ? lerpBox(prev, raw, 0.35) : raw;
        boxRef.current = box;
        if (ph === "tracking") {
          if (prev && boxDelta(prev, box) < 0.012) {
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
      if (ph === "countdown" && now - countStartRef.current >= COUNT_STEP * 3) {
        doCapture();
      }
      return;
    }

    if (ph === "puzzle") {
      let pinch: { x: number; y: number } | null = null;
      for (const h of hands) {
        if (isPinch(h.lm, dragRef.current != null)) {
          const p = pinchPoint(h.lm);
          pinch = { x: 1 - p.x, y: p.y };
          break;
        }
      }
      if (dragRef.current && pinch) {
        const p = piecesRef.current[dragRef.current.id];
        p.px = pinch.x - dragRef.current.dx;
        p.py = pinch.y - dragRef.current.dy;
      } else if (dragRef.current) {
        dropPiece();
      } else if (pinch) {
        const b = boardRef.current!;
        const hit = piecesRef.current.find(
          (p) => !p.locked && (() => {
            const r = cellRect(b, p.cell);
            return pinch!.x >= r.x && pinch!.x <= r.x + r.w && pinch!.y >= r.y && pinch!.y <= r.y + r.h;
          })(),
        );
        if (hit) {
          const r = cellRect(b, hit.cell);
          dragRef.current = { id: hit.id, dx: pinch.x - r.x, dy: pinch.y - r.y };
          hit.px = r.x; hit.py = r.y;
        }
      }
      return;
    }

    if (ph === "solved") {
      const fist = hands.some((h) => isFist(h.lm));
      if (fist) {
        if (fistSinceRef.current == null) fistSinceRef.current = now;
        else if (now - fistSinceRef.current > FIST_MS) saveShot();
      } else fistSinceRef.current = null;
    }
  }

  /* ---------- overlay: hand skeletons ---------- */
  function drawOverlay() {
    const c = overlayRef.current, stage = stageRef.current;
    if (!c || !stage) return;
    const W = stage.clientWidth, H = stage.clientHeight;
    if (c.width !== W) c.width = W;
    if (c.height !== H) c.height = H;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, W, H);
    for (const h of handsRef.current) {
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
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
      step(performance.now());
      drawOverlay();
      setTick((t) => (t + 1) % 1e9);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- render ---------- */
  const SW = stageRef.current?.clientWidth ?? 640;
  const SH = stageRef.current?.clientHeight ?? 480;
  const hands = handsRef.current;
  const openCount = hands.filter((h) => isOpen(h.lm)).length;
  const box = boxRef.current;
  const board = boardRef.current;
  const shot = shotRef.current;
  const locked = piecesRef.current.filter((p) => p.locked).length;
  const countN = Math.max(1, 3 - Math.floor((performance.now() - countStartRef.current) / COUNT_STEP));

  const status: Record<Phase, { dot: string; text: string; cls?: string }> = {
    boot: { dot: "bg-paper/50", text: "CARGANDO MODELO…" },
    tracking: {
      dot: openCount === 2 ? "bg-signal" : "bg-signal blink",
      text: openCount === 2 ? "MANOS EN SEGUIMIENTO — MANTÉN EL MARCO" : "BUSCANDO MANOS…",
    },
    countdown: { dot: "bg-bad blink", text: `CAPTURANDO EN ${countN}…` },
    puzzle: { dot: "bg-signal", text: "ARMA EL ROMPECABEZAS CON PINCH" },
    solved: { dot: "bg-ok", text: "¡COMPLETO! — PUÑO PARA GUARDAR", cls: "border-ok/50 text-ok" },
    complete: { dot: "bg-ok", text: "TIRA COMPLETA — DESCARGA O REINICIA", cls: "border-ok/50 text-ok" },
  };
  const st = status[phase];

  return (
    <div className="flex h-screen overflow-hidden">
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-line px-4 py-3">
          <div className="flex items-baseline gap-3">
            <h1 className="text-sm font-bold tracking-[0.2em] text-signal">PUZZLE-CAM</h1>
            <span className="text-[10px] tracking-[0.25em] text-paper/50">HAND-FRAME CAPTURE</span>
          </div>
          <div className={`flex items-center gap-2 border border-line px-3 py-1.5 text-[10px] tracking-[0.2em] ${st.cls ?? "text-paper/80"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
            {st.text}
          </div>
        </header>

        <div ref={wrapRef} className="relative flex min-h-0 flex-1 items-center justify-center">
          <div ref={stageRef} className="scanlines relative overflow-hidden border border-line bg-black">
            <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 h-full w-full -scale-x-100 object-fill" />
            <canvas ref={overlayRef} className="absolute inset-0" />

            {/* hand frame + countdown */}
            {(phase === "tracking" || phase === "countdown") && box && (
              <div
                className="absolute border-2 border-signal"
                style={{ left: box.x * SW, top: box.y * SH, width: box.w * SW, height: box.h * SH }}
              >
                {phase === "countdown" && (
                  <span className="absolute inset-0 grid place-items-center text-7xl font-bold text-signal drop-shadow-[0_2px_0_rgba(0,0,0,0.8)]">
                    {countN}
                  </span>
                )}
              </div>
            )}

            {/* puzzle board */}
            {(phase === "puzzle" || phase === "solved") && board && shot && (
              <>
                <div
                  className={`absolute border-2 ${phase === "solved" ? "border-ok" : "border-signal"}`}
                  style={{ left: board.x * SW, top: board.y * SH, width: board.w * SW, height: board.h * SH }}
                />
                {piecesRef.current.map((p) => {
                  const r = p.px != null && p.py != null ? { ...cellRect(board, 0), x: p.px, y: p.py } : cellRect(board, p.cell);
                  const col = p.id % 3, row = Math.floor(p.id / 3);
                  return (
                    <div
                      key={p.id}
                      className={`absolute border ${p.locked ? "border-ok/70" : "border-black/60 shadow-[0_0_0_1px_rgba(255,255,255,0.25)]"}`}
                      style={{
                        left: r.x * SW, top: r.y * SH, width: r.w * SW, height: r.h * SH,
                        backgroundImage: `url(${shot})`,
                        backgroundSize: `${board.w * SW}px ${board.h * SH}px`,
                        backgroundPosition: `-${col * r.w * SW}px -${row * r.h * SH}px`,
                        zIndex: dragRef.current?.id === p.id ? 30 : p.locked ? 10 : 15,
                        animation: p.locked ? undefined : `settle 0.45s ${p.id * 40}ms cubic-bezier(0.2,0.8,0.3,1) both`,
                        ["--tx" as string]: `${p.tx}px`,
                        ["--ty" as string]: `${p.ty}px`,
                        ["--rot" as string]: `${p.rot}deg`,
                      } as React.CSSProperties}
                    />
                  );
                })}
              </>
            )}

            {phase === "solved" && (
              <p className="absolute inset-x-0 top-1/2 z-40 -translate-y-1/2 text-center text-lg tracking-[0.15em] text-ok drop-shadow-[0_1px_0_#000]">
                ¡COMPLETO! — puño para guardar
              </p>
            )}

            {phase === "puzzle" && (
              <span className="absolute right-2 top-2 z-40 border border-line bg-ink/80 px-2 py-1 text-[10px] tracking-[0.2em] text-signal">
                {locked} / 9 PIEZAS COLOCADAS
              </span>
            )}

            {error && (
              <p className="absolute inset-x-4 top-4 z-50 border border-bad bg-ink/90 p-3 text-center text-[11px] tracking-[0.15em] text-bad">
                {error}
              </p>
            )}
          </div>
        </div>
      </main>

      <Strip shots={shots} complete={shots.length >= SHOTS} onDownload={onDownload} onReset={resetAll} />
    </div>
  );
}
