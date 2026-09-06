import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

export type Pt = { x: number; y: number; z?: number };
export type Hand = { lm: Pt[]; label: string };
export type Box = { x: number; y: number; w: number; h: number };

export const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];

let singleton: HandLandmarker | null = null;

export async function loadHandLandmarker(): Promise<HandLandmarker> {
  if (singleton) return singleton;
  const fileset = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm",
  );
  const opts = (delegate: "GPU" | "CPU") => ({
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
      delegate,
    },
    runningMode: "VIDEO" as const,
    numHands: 2,
    minHandDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });
  try {
    singleton = await HandLandmarker.createFromOptions(fileset, opts("GPU"));
  } catch {
    singleton = await HandLandmarker.createFromOptions(fileset, opts("CPU"));
  }
  return singleton;
}

const d = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
const FINGERS: [number, number][] = [[6, 8], [10, 12], [14, 16], [18, 20]];

export function extendedCount(lm: Pt[]): number {
  let n = 0;
  for (const [pip, tip] of FINGERS) {
    if (d(lm[0], lm[tip]) > d(lm[0], lm[pip]) * 1.12) n++;
  }
  return n;
}

export const isFist = (lm: Pt[]) => extendedCount(lm) <= 1;

/** tight to grab (0.35), loose to keep holding (0.7) = no flicker */
export function isPinch(lm: Pt[], holding = false): boolean {
  const scale = d(lm[0], lm[9]) || 1e-6;
  return d(lm[4], lm[8]) / scale < (holding ? 0.7 : 0.35);
}

export function pinchPoint(lm: Pt[]): Pt {
  return { x: (lm[4].x + lm[8].x) / 2, y: (lm[4].y + lm[8].y) / 2 };
}

/** two pinch points (mirrored) = two corners of the capture frame */
export function pinchBox(a: Pt, b: Pt, pad = 0.05): Box {
  const ax = 1 - a.x, bx = 1 - b.x;
  const x0 = Math.min(ax, bx), x1 = Math.max(ax, bx);
  const y0 = Math.min(a.y, b.y), y1 = Math.max(a.y, b.y);
  const w0 = x1 - x0, h0 = y1 - y0;
  let x = x0 - w0 * pad;
  let y = y0 - h0 * pad;
  let w = w0 * (1 + 2 * pad);
  let h = h0 * (1 + 2 * pad);
  x = Math.min(Math.max(x, 0), 0.8);
  y = Math.min(Math.max(y, 0), 0.8);
  w = Math.min(Math.max(w, 0.2), 1 - x);
  h = Math.min(Math.max(h, 0.2), 1 - y);
  return { x, y, w, h };
}

export const lerpBox = (a: Box, b: Box, t: number): Box => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
  w: a.w + (b.w - a.w) * t,
  h: a.h + (b.h - a.h) * t,
});

export const boxDelta = (a: Box, b: Box) =>
  Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.w - b.w) + Math.abs(a.h - b.h);
