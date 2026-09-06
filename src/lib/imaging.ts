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

/** B/W + gaussian grain, like the original PHOTOBOOTH_NOISE_STD = 15 */
export function applyPhotobooth(c: HTMLCanvasElement, std = 15): void {
  const ctx = c.getContext("2d")!;
  const img = ctx.getImageData(0, 0, c.width, c.height);
  const p = img.data;
  for (let i = 0; i < p.length; i += 4) {
    const lum = 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2];
    const v = Math.max(0, Math.min(255, lum + gauss() * std));
    p[i] = p[i + 1] = p[i + 2] = v;
  }
  ctx.putImageData(img, 0, 0);
}

/** mirrored crop of the live video, processed */
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
  applyPhotobooth(c);
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
  ctx.fillText("HAND-FRAME CAPTURE", c.width - pad, pad + 14);
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
  ctx.fillText("— TIRA COMPLETA · 3/3 —", c.width / 2, c.height - pad / 1.4);
  return c.toDataURL("image/png");
}

export function downloadDataUrl(url: string, filename: string): void {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
}
