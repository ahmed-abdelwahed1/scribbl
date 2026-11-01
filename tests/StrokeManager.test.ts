import { describe, it, expect } from 'vitest';
import { StrokeManager } from '../src/core/stroke/StrokeManager';
import type { Stroke } from '../src/types/stroke';

describe('StrokeManager', () => {
  const dummyStroke: Stroke = {
    id: '1',
    tool: 'pen',
    color: '#008bd8',
    size: 4,
    opacity: 1,
    points: [
      { x: 10, y: 10, pressure: 0.5, t: 100 },
      { x: 20, y: 20, pressure: 0.6, t: 150 }
    ],
    timestamp: 100
  };

  it('manages undo and redo stacks correctly', () => {
    const sm = new StrokeManager();
    expect(sm.getStrokes().length).toBe(0);
    expect(sm.canUndo()).toBe(false);

    sm.addStroke(dummyStroke);
    expect(sm.getStrokes().length).toBe(1);
    expect(sm.canUndo()).toBe(true);
    expect(sm.canRedo()).toBe(false);

    // Undo
    expect(sm.undo()).toBe(true);
    expect(sm.getStrokes().length).toBe(0);
    expect(sm.canUndo()).toBe(false);
    expect(sm.canRedo()).toBe(true);

    // Redo
    expect(sm.redo()).toBe(true);
    expect(sm.getStrokes().length).toBe(1);
  });

  it('serializes and deserializes strokes accurately via JSON and SVG', () => {
    const sm = new StrokeManager();
    sm.addStroke(dummyStroke);

    const json = sm.toJSON();
    expect(json).toContain('"version": "1.0.0"');
    expect(json).toContain('#008bd8');

    const sm2 = new StrokeManager();
    expect(sm2.loadJSON(json)).toBe(true);
    expect(sm2.getStrokes().length).toBe(1);
    expect(sm2.getStrokes()[0].points.length).toBe(2);

    const svg = sm.toSVG(800, 500);
    expect(svg).toContain('<svg');
    expect(svg).toContain('<path');
    expect(svg).toContain('viewBox="0 0 800 500"');
  });
});
