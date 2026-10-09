import type { Rect } from '../../domain/crop.ts';

// Longest edge of a saved step photo. Larger crops are downscaled to keep recipe payloads small.
const MAX_EDGE_PX = 1024;
const JPEG_QUALITY = 0.85;

// Decodes a user-chosen file so it can be drawn to a canvas and read by OCR.
export function loadImageFile(file: File): Promise<{ image: HTMLImageElement; objectUrl: string }> {
  const objectUrl = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ image, objectUrl });
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('The file could not be read as an image'));
    };
    image.src = objectUrl;
  });
}

// Cuts `rect` (source-image pixels) out of the photo and returns it as a JPEG data URL.
export function cropToDataUrl(image: HTMLImageElement, rect: Rect): string {
  const scale = Math.min(1, MAX_EDGE_PX / Math.max(rect.width, rect.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(rect.width * scale));
  canvas.height = Math.max(1, Math.round(rect.height * scale));

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context is not available');
  ctx.drawImage(image, rect.left, rect.top, rect.width, rect.height, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
}
