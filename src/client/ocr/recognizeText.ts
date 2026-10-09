import { createWorker, type Worker as OcrWorker } from 'tesseract.js';
import type { Rect } from '../../domain/crop.ts';

// tesseract.js runs recognition in its own Web Worker, so the UI thread stays responsive.
// One worker is shared by every region in an import session and loads both language packs once.
let workerPromise: Promise<OcrWorker> | null = null;

function getWorker(): Promise<OcrWorker> {
  workerPromise ??= createWorker(['eng', 'deu']);
  return workerPromise;
}

// Reads the text inside `rect` (source-image pixels) of an image that is already decoded.
export async function recognizeRegion(image: HTMLImageElement, rect: Rect): Promise<string> {
  const worker = await getWorker();
  const { data } = await worker.recognize(image, { rectangle: rect }, { text: true });
  return data.text.trim();
}

// Stops the OCR worker and frees its language data. Safe to call when no worker was started.
export async function releaseOcrWorker(): Promise<void> {
  const pending = workerPromise;
  workerPromise = null;
  if (pending) {
    const worker = await pending;
    await worker.terminate();
  }
}
