// Pure geometry for region-of-interest crops on a photo. Rectangles are in source-image pixels.

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface Size {
  width: number;
  height: number;
}

// Boxes smaller than this on either edge are treated as accidental clicks, not crops.
export const MIN_CROP_EDGE_PX = 8;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

// Builds a rectangle from two drag corners, whichever direction the drag went.
export function rectFromPoints(a: Point, b: Point): Rect {
  return {
    left: Math.min(a.x, b.x),
    top: Math.min(a.y, b.y),
    width: Math.abs(a.x - b.x),
    height: Math.abs(a.y - b.y),
  };
}

// Keeps a rectangle inside the image bounds.
export function clampRect(rect: Rect, bounds: Size): Rect {
  const left = clamp(rect.left, 0, bounds.width);
  const top = clamp(rect.top, 0, bounds.height);
  const right = clamp(rect.left + rect.width, 0, bounds.width);
  const bottom = clamp(rect.top + rect.height, 0, bounds.height);
  return { left, top, width: right - left, height: bottom - top };
}

// Expands a rectangle to whole pixels so the crop covers the whole selected area.
export function snapRectToPixels(rect: Rect): Rect {
  const left = Math.floor(rect.left);
  const top = Math.floor(rect.top);
  const right = Math.ceil(rect.left + rect.width);
  const bottom = Math.ceil(rect.top + rect.height);
  return { left, top, width: right - left, height: bottom - top };
}

export function isUsableRect(rect: Rect): boolean {
  return rect.width >= MIN_CROP_EDGE_PX && rect.height >= MIN_CROP_EDGE_PX;
}

// Maps a pointer position inside the displayed image (CSS pixels) to source-image pixels, clamped to the image.
export function displayPointToImage(point: Point, displaySize: Size, imageSize: Size): Point {
  const scaleX = displaySize.width > 0 ? imageSize.width / displaySize.width : 1;
  const scaleY = displaySize.height > 0 ? imageSize.height / displaySize.height : 1;
  return {
    x: clamp(point.x * scaleX, 0, imageSize.width),
    y: clamp(point.y * scaleY, 0, imageSize.height),
  };
}
