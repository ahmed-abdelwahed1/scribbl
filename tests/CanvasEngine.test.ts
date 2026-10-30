import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CanvasEngine } from '../src/core/render/CanvasEngine';
import type { StrokePoint, Stroke } from '../src/types/stroke';

describe('CanvasEngine', () => {
  let mockCanvas: HTMLCanvasElement;
  let mockCtx: any;
  let mockOffscreenCanvas: any;
  let mockOffscreenCtx: any;

  function createMockCtx() {
    return {
      save: vi.fn(),
      restore: vi.fn(),
      setTransform: vi.fn(),
      fillRect: vi.fn(),
      drawImage: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      arc: vi.fn(),
      closePath: vi.fn(),
      fillStyle: '#000000',
      strokeStyle: '#000000',
      lineWidth: 1,
      globalCompositeOperation: 'source-over',
      globalAlpha: 1.0,
      setLineDash: vi.fn()
    };
  }

  beforeEach(() => {
    mockCtx = createMockCtx();
    mockOffscreenCtx = createMockCtx();

    mockCanvas = {
      getContext: vi.fn().mockReturnValue(mockCtx),
      width: 0,
      height: 0,
      style: { width: '', height: '' }
    } as unknown as HTMLCanvasElement;

    mockOffscreenCanvas = {
      getContext: vi.fn().mockReturnValue(mockOffscreenCtx),
      width: 0,
      height: 0,
      style: { width: '', height: '' },
      toDataURL: vi.fn().mockReturnValue('data:image/png;base64,mock')
    };

    (globalThis as any).document = {
      createElement: vi.fn().mockReturnValue(mockOffscreenCanvas)
    };

    const mockRaf = vi.fn((_cb: any) => 123);
    const mockCaf = vi.fn();

    (globalThis as any).window = {
      devicePixelRatio: 1,
      requestAnimationFrame: mockRaf,
      cancelAnimationFrame: mockCaf
    };
    (globalThis as any).requestAnimationFrame = mockRaf;
    (globalThis as any).cancelAnimationFrame = mockCaf;

    class MockPath2D {
      moveTo = vi.fn();
      lineTo = vi.fn();
      closePath = vi.fn();
    }
    (globalThis as any).Path2D = MockPath2D;
  });

  afterEach(() => {
    delete (globalThis as any).document;
    delete (globalThis as any).window;
    delete (globalThis as any).requestAnimationFrame;
    delete (globalThis as any).cancelAnimationFrame;
    delete (globalThis as any).Path2D;
  });

  it('initializes with standard composited 2d context (desynchronized: false)', () => {
    const engine = new CanvasEngine({
      onscreenCanvas: mockCanvas,
      theme: 'dark',
      paperType: 'ruled',
      aspectRatio: '16:10',
      slantAngle: 52
    });

    expect(mockCanvas.getContext).toHaveBeenCalledWith('2d', {
      desynchronized: false,
      alpha: false
    });

    engine.destroy();
  });

  it('does not re-assign canvas width and height if dimensions have not changed', () => {
    const engine = new CanvasEngine({
      onscreenCanvas: mockCanvas,
      theme: 'dark',
      paperType: 'ruled',
      aspectRatio: '16:10',
      slantAngle: 52
    });

    // First resize initializes dimensions
    engine.resize(1280, 800);
    const firstW = mockCanvas.width;
    const firstH = mockCanvas.height;
    expect(firstW).toBeGreaterThan(0);
    expect(firstH).toBeGreaterThan(0);

    // Track width/height property writes
    let widthSetCount = 0;
    let heightSetCount = 0;
    let currentW = mockCanvas.width;
    let currentH = mockCanvas.height;

    Object.defineProperty(mockCanvas, 'width', {
      get: () => currentW,
      set: (val) => {
        widthSetCount++;
        currentW = val;
      }
    });

    Object.defineProperty(mockCanvas, 'height', {
      get: () => currentH,
      set: (val) => {
        heightSetCount++;
        currentH = val;
      }
    });

    // Second resize with identical dimensions should NOT re-assign canvas width/height
    engine.resize(1280, 800);
    expect(widthSetCount).toBe(0);
    expect(heightSetCount).toBe(0);

    engine.destroy();
  });

  it('schedules render frames during active drawing and commits cleanly', () => {
    const engine = new CanvasEngine({
      onscreenCanvas: mockCanvas,
      theme: 'dark',
      paperType: 'ruled',
      aspectRatio: '16:10',
      slantAngle: 52
    });

    const startPoint: StrokePoint = { x: 50, y: 50, pressure: 0.5, t: 1000 };
    engine.beginActiveStroke(startPoint, 'pen', '#008bd8', 4, 1.0);

    expect(globalThis.requestAnimationFrame).toHaveBeenCalled();

    const nextPoint: StrokePoint = { x: 60, y: 60, pressure: 0.6, t: 1016 };
    engine.updateActiveStroke([nextPoint], []);

    const stroke: Stroke = {
      id: 'test_stroke',
      tool: 'pen',
      color: '#008bd8',
      size: 4,
      opacity: 1.0,
      points: [startPoint, nextPoint],
      timestamp: 1016
    };
    engine.commitStroke(stroke);

    engine.destroy();
  });
});
