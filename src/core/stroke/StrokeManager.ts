import { getStroke } from 'perfect-freehand';
import type { Stroke, StrokePoint, ToolType } from '../../types/stroke';

export class StrokeManager {
  private strokes: Stroke[] = [];
  private undoStack: Stroke[][] = [];
  private redoStack: Stroke[][] = [];
  private maxUndoSteps = 50;

  getStrokes(): Stroke[] {
    return this.strokes;
  }

  setStrokes(strokes: Stroke[]) {
    this.saveUndoState();
    this.strokes = [...strokes];
    this.redoStack = [];
  }

  addStroke(stroke: Stroke) {
    this.saveUndoState();
    this.strokes.push(stroke);
    this.redoStack = [];
  }

  undo(): boolean {
    if (this.undoStack.length === 0) return false;
    const previous = this.undoStack.pop()!;
    this.redoStack.push([...this.strokes]);
    this.strokes = previous;
    return true;
  }

  redo(): boolean {
    if (this.redoStack.length === 0) return false;
    const next = this.redoStack.pop()!;
    this.undoStack.push([...this.strokes]);
    this.strokes = next;
    return true;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  clear(): boolean {
    if (this.strokes.length === 0) return false;
    this.saveUndoState();
    this.strokes = [];
    this.redoStack = [];
    return true;
  }

  private saveUndoState() {
    this.undoStack.push([...this.strokes]);
    if (this.undoStack.length > this.maxUndoSteps) {
      this.undoStack.shift();
    }
  }

  /**
   * Export strokes to lossless JSON string
   */
  toJSON(metadata: Record<string, unknown> = {}): string {
    return JSON.stringify(
      {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        metadata,
        strokes: this.strokes
      },
      null,
      2
    );
  }

  /**
   * Load strokes from JSON string
   */
  loadJSON(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.strokes)) {
        this.setStrokes(data.strokes);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to parse stroke JSON', e);
      return false;
    }
  }

  /**
   * Export strokes to vector SVG XML string
   */
  toSVG(width: number, height: number, backgroundColor = '#0b0f17'): string {
    const paths: string[] = [];

    for (const stroke of this.strokes) {
      if (stroke.points.length === 0 || stroke.tool === 'eraser') continue;

      const inputPoints: [number, number, number][] = stroke.points.map(p => [
        p.x,
        p.y,
        Math.max(0.05, p.pressure)
      ]);

      const outline = getStroke(inputPoints, {
        size: stroke.size,
        thinning: 0.5,
        smoothing: 0.5,
        streamline: 0.5
      });

      if (outline.length === 0) continue;

      let d = `M ${outline[0][0].toFixed(2)} ${outline[0][1].toFixed(2)}`;
      for (let i = 1; i < outline.length; i++) {
        d += ` L ${outline[i][0].toFixed(2)} ${outline[i][1].toFixed(2)}`;
      }
      d += ' Z';

      const opacity = stroke.tool === 'highlighter' ? 0.35 : (stroke.opacity ?? 1.0);
      paths.push(
        `<path d="${d}" fill="${stroke.color}" opacity="${opacity}" />`
      );
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <rect width="100%" height="100%" fill="${backgroundColor}" />
  <g id="strokes">
    ${paths.join('\n    ')}
  </g>
</svg>`;
  }
}
