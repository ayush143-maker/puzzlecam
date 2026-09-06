import type { Box } from "./hands";

let spare: number | null = null;
function gauss(): number {
  if (spare !== null) { const s = spare; spare = null; return s; }
  const u = Math.random() || 1e-9;
  const v = Math.random();
  const m = Math.sqrt(-2 * Math.log(u));
  spare = m * Math.sin(2 * Math.PI * v);
  return m * Math.cos(2 * Math.PI * v);
}

const clamp255 = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v);
const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);

/**
 * DUSK/01 — snapchat-style dusky grade:
 * indigo shadows, amber highlights, vignette, matte fade, film grain.
 */
export function applyDuskyFilter(c: HTMLCanvasElement, grain = 10): void {
  const ctx = c.getContext("2d")!;
  const img = ctx.getImageData(0, 0, c.width, c.height);
  const p = img.data;
  const W = c.width, H = c.height;
  const cx = W / 2, cy = H / 2;
  const maxD = Math.hypot(cx, cy) || 1;

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      let r = p[i], g = p[i + 1], b = p[i + 2];
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

      // dusk grade: amber highlights / indigo shadows
      const warm = smooth(clamp01((lum - 0.42) / 0.58));
      const cool = 1 - warm;
      r += 30 * warm - 16 * cool;
      g += 8 * warm - 4 * cool;
      b += -18 * warm + 34 * cool;

      // vignette
      const dist = Math.hypot(x - cx, y - cy) / maxD;
      const vig = 1 - 0.42 * smooth(clamp01((dist - 0.55) / 0.45));
      r *= vig; g *= vig; b *= vig;

      // matte fade (lifted blacks)
      r = 12 + r * 0.9;
      g = 12 + g * 0.9;
      b = 14 + b * 0.9;

      // film grain
      const n = gauss() * grain;
      p[i] = clamp255(r + n);
      p[i + 1] = clamp255(g + n);
      p[i + 2] = clamp255(b + n);
    }
  }
  ctx.putImageData(img, 0, 0);
}

/** mirrored crop of the live video, then DUSK grade baked in */
export function captureFrame(video: HTMLVideoElement, box: Box, targetW = 480): HTMLCanvasElement {
  const c = document.createElement("canvas");
  const vw = video.videoWidth, vh = video.videoHeight;
  c.width = targetW;
  c.height = Math.max(1, Math.round(targetW * (box.h / box.w)));
  const ctx = c.getContext("2d")!;
  ctx.save();
  ctx.translate(c.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(
    video,
    (1 - box.x - box.w) * vw, box.y * vh, box.w * vw, box.h * vh,
    0, 0, c.width, c.height,
  );
  ctx.restore();
  applyDuskyFilter(c);
  return c;
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });
}

/** vertical photobooth strip: paper border + captions */
export async function buildStrip(shots: string[]): Promise<string> {
  const imgs = await Promise.all(shots.map(loadImg));
  const pad = 28, gap = 22, head = 64, foot = 64;
  const w = Math.max(...imgs.map((i) => i.width));
  const h =
    head + foot + pad * 2 +
    imgs.reduce((a, i) => a + i.height, 0) + gap * (imgs.length - 1);
  const c = document.createElement("canvas");
  c.width = w + pad * 2;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#f2f0e9";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = "#111";
  ctx.font = "600 16px monospace";
  ctx.fillText("PUZZLE-CAM", pad, pad + 14);
  ctx.textAlign = "right";
  ctx.fillText("DUSK/01", c.width - pad, pad + 14);
  ctx.textAlign = "left";
  let y = head + pad;
  imgs.forEach((img, i) => {
    ctx.drawImage(img, pad, y);
    ctx.fillStyle = "#111";
    ctx.font = "12px monospace";
    ctx.fillText(`00${i + 1}`, pad, y + img.height + 16);
    y += img.height + gap + 12;
  });
  ctx.fillStyle = "#111";
  ctx.font = "12px monospace";
  ctx.textAlign = "center";
  ctx.fillText("— FULL STRIP · 3/3 —", c.width / 2, c.height - pad / 1.4);
  return c.toDataURL("image/png");
}

export function downloadDataUrl(url: string, filename: string): void {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
}
