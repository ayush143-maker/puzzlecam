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
const FINGERS: [number, number][] = [[6, 8], [10, 12], [14, 16], [18, 20]]; // pip, tip

export function extendedCount(lm: Pt[]): number {
  let n = 0;
  for (const [pip, tip] of FINGERS) {
    if (d(lm[0], lm[tip]) > d(lm[0], lm[pip]) * 1.12) n++;
  }
  return n;
}

export const isOpen = (lm: Pt[]) => extendedCount(lm) >= 3;
export const isFist = (lm: Pt[]) => extendedCount(lm) <= 1;

/** pinch with hysteresis: tighter to start, looser to keep holding */
export function isPinch(lm: Pt[], holding = false): boolean {
  const scale = d(lm[0], lm[9]) || 1e-6;
  return d(lm[4], lm[8]) / scale < (holding ? 0.6 : 0.4);
}

export function pinchPoint(lm: Pt[]): Pt {
  return { x: (lm[4].x + lm[8].x) / 2, y: (lm[4].y + lm[8].y) / 2 };
}

/** bounding box of two open hands, mirrored + padded, normalized */
export function handsBox(hands: Hand[]): Box {
  let minX = 1, minY = 1, maxX = 0, maxY = 0;
  for (const h of hands) {
    for (const p of h.lm) {
      const x = 1 - p.x;
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
    }
  }
  const pad = 0.14;
  const w0 = maxX - minX, h0 = maxY - minY;
  let x = minX - w0 * pad;
  let y = minY - h0 * pad;
  let w = w0 * (1 + pad * 2);
  let h = h0 * (1 + pad * 2);
  x = Math.min(Math.max(x, 0), 0.8);
  y = Math.min(Math.max(y, 0), 0.8);
  w = Math.min(Math.max(w, 0.25), 1 - x);
  h = Math.min(Math.max(h, 0.25), 1 - y);
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
