import { describe, it, expect } from 'vitest';
import {
  rectFromPoints,
  clampRect,
  snapRectToPixels,
  isUsableRect,
  displayPointToImage,
} from '../../src/domain/crop.ts';

describe('crop domain', () => {
  describe('rectFromPoints', () => {
    it('normalizes a drag made from bottom-right to top-left', () => {
      expect(rectFromPoints({ x: 50, y: 40 }, { x: 10, y: 20 })).toEqual({ left: 10, top: 20, width: 40, height: 20 });
    });
  });

  describe('clampRect', () => {
    it('keeps the rectangle inside the image bounds', () => {
      const clamped = clampRect({ left: -10, top: 80, width: 50, height: 40 }, { width: 100, height: 100 });
      expect(clamped).toEqual({ left: 0, top: 80, width: 40, height: 20 });
    });

    it('leaves a rectangle that is already inside unchanged', () => {
      const rect = { left: 5, top: 5, width: 10, height: 10 };
      expect(clampRect(rect, { width: 100, height: 100 })).toEqual(rect);
    });
  });

  describe('snapRectToPixels', () => {
    it('covers the fractional area with whole pixels', () => {
      expect(snapRectToPixels({ left: 1.2, top: 2.7, width: 10.1, height: 3.2 })).toEqual({
        left: 1,
        top: 2,
        width: 11,
        height: 4,
      });
    });
  });

  describe('isUsableRect', () => {
    it('rejects boxes too small to be a deliberate crop', () => {
      expect(isUsableRect({ left: 0, top: 0, width: 4, height: 100 })).toBe(false);
      expect(isUsableRect({ left: 0, top: 0, width: 100, height: 7 })).toBe(false);
    });

    it('accepts boxes at the minimum edge length', () => {
      expect(isUsableRect({ left: 0, top: 0, width: 8, height: 8 })).toBe(true);
    });
  });

  describe('displayPointToImage', () => {
    it('scales a point from displayed size to natural image pixels', () => {
      expect(
        displayPointToImage({ x: 50, y: 25 }, { width: 200, height: 100 }, { width: 1000, height: 500 })
      ).toEqual({ x: 250, y: 125 });
    });

    it('clamps points dragged outside the image', () => {
      expect(
        displayPointToImage({ x: -20, y: 150 }, { width: 200, height: 100 }, { width: 1000, height: 500 })
      ).toEqual({ x: 0, y: 500 });
    });
  });
});
