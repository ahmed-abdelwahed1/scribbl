import { describe, it, expect, vi } from 'vitest';
import { mapPointerEventToCanvas, canvasPointToCss } from '../src/core/input/PointerMapping';

describe('PointerMapping - mapPointerEventToCanvas', () => {
  it('correctly maps client coordinates with DPR = 1 (1:1 scale)', () => {
    const mockCanvas = {
      width: 800,
      height: 500,
      getBoundingClientRect: () => ({
        left: 100,
        top: 50,
        width: 800,
        height: 500
      })
    };

    const event = { clientX: 350, clientY: 250 };
    const point = mapPointerEventToCanvas(event, mockCanvas);

    // x = (350 - 100) * (800 / 800) = 250
    // y = (250 - 50) * (500 / 500) = 200
    expect(point.x).toBe(250);
    expect(point.y).toBe(200);
  });

  it('correctly maps client coordinates with DPR = 2 (Retina / High-DPI display)', () => {
    const dpr = 2.0;
    const cssWidth = 800;
    const cssHeight = 500;

    const mockCanvas = {
      width: cssWidth * dpr, // 1600
      height: cssHeight * dpr, // 1000
      getBoundingClientRect: () => ({
        left: 120,
        top: 60,
        width: cssWidth, // 800
        height: cssHeight // 500
      })
    };

    const event = { clientX: 520, clientY: 310 };
    const point = mapPointerEventToCanvas(event, mockCanvas);

    // x = (520 - 120) * (1600 / 800) = 400 * 2 = 800
    // y = (310 - 60) * (1000 / 500) = 250 * 2 = 500
    expect(point.x).toBe(800);
    expect(point.y).toBe(500);

    // Round-trip verification: canvasPointToCss should match CSS client offset exactly
    const cssCoords = canvasPointToCss(point, mockCanvas);
    expect(cssCoords.x).toBe(400); // 520 - 120
    expect(cssCoords.y).toBe(250); // 310 - 60
  });

  it('correctly handles fractional Windows DPI scaling (e.g. DPR = 1.25 or 1.5)', () => {
    const dpr = 1.25;
    const cssWidth = 1000;
    const cssHeight = 600;

    const mockCanvas = {
      width: Math.round(cssWidth * dpr), // 1250
      height: Math.round(cssHeight * dpr), // 750
      getBoundingClientRect: () => ({
        left: 50,
        top: 80,
        width: cssWidth,
        height: cssHeight
      })
    };

    const event = { clientX: 450, clientY: 280 };
    const point = mapPointerEventToCanvas(event, mockCanvas);

    // x = (450 - 50) * (1250 / 1000) = 400 * 1.25 = 500
    // y = (280 - 80) * (750 / 600) = 200 * 1.25 = 250
    expect(point.x).toBeCloseTo(500, 2);
    expect(point.y).toBeCloseTo(250, 2);
  });

  it('queries getBoundingClientRect fresh on each event invocation', () => {
    let currentLeft = 100;
    const getBoundingClientRect = vi.fn(() => ({
      left: currentLeft,
      top: 50,
      width: 500,
      height: 300
    }));

    const mockCanvas = {
      width: 1000,
      height: 600,
      getBoundingClientRect
    };

    const e1 = { clientX: 200, clientY: 150 };
    const pt1 = mapPointerEventToCanvas(e1, mockCanvas);
    expect(pt1.x).toBe((200 - 100) * (1000 / 500)); // 200
    expect(getBoundingClientRect).toHaveBeenCalledTimes(1);

    // Simulate canvas moving due to responsive layout change or scroll
    currentLeft = 150;
    const e2 = { clientX: 200, clientY: 150 };
    const pt2 = mapPointerEventToCanvas(e2, mockCanvas);
    expect(pt2.x).toBe((200 - 150) * (1000 / 500)); // 100
    expect(getBoundingClientRect).toHaveBeenCalledTimes(2);
  });
});
