import { getStroke } from 'perfect-freehand';
import type { Stroke, StrokePoint, ToolType } from '../../types/stroke';

export class BrushRenderer {
  /**
   * Generates a 2D path outline using perfect-freehand
   */
  static getSvgPathFromStroke(strokePoints: StrokePoint[], tool: ToolType, baseSize: number): Path2D {
    if (strokePoints.length === 0) return new Path2D();

    // Map stroke points to [x, y, pressure]
    const inputPoints: [number, number, number][] = strokePoints.map(p => [
      p.x,
      p.y,
      Math.max(0.05, p.pressure)
    ]);

    let size = baseSize;
    let thinning = 0.5;
    let smoothing = 0.5;
    let streamline = 0.5;
    let taperStart = 0;
    let taperEnd = 0;

    switch (tool) {
      case 'calligraphy':
        // Calligraphy nib: flatter, highly dynamic tapering
        size = baseSize * 1.6;
        thinning = 0.75;
        smoothing = 0.4;
        streamline = 0.6;
        taperStart = baseSize * 0.4;
        taperEnd = baseSize * 0.4;
        break;

      case 'pencil':
        // Pencil: thinner, low smoothing for raw textured graphite feel
        size = Math.max(1, baseSize * 0.7);
        thinning = 0.3;
        smoothing = 0.2;
        streamline = 0.3;
        break;

      case 'highlighter':
        // Highlighter: wide, consistent, minimal thinning
        size = baseSize * 3.5;
        thinning = 0.05;
        smoothing = 0.7;
        streamline = 0.8;
        break;

      case 'eraser':
        size = baseSize * 2.5;
        thinning = 0;
        smoothing = 0.5;
        streamline = 0.5;
        break;

      case 'pen':
      default:
        // Ink pen: smooth, natural flow
        size = baseSize;
        thinning = 0.55;
        smoothing = 0.5;
        streamline = 0.55;
        taperStart = 0;
        taperEnd = 0;
        break;
    }

    const outline = getStroke(inputPoints, {
      size,
      thinning,
      smoothing,
      streamline,
      start: {
        taper: taperStart,
        easing: t => t
      },
      end: {
        taper: taperEnd,
        easing: t => t
      }
    });

    return this.outlineToPath2D(outline);
  }

  private static outlineToPath2D(outline: number[][]): Path2D {
    const path = new Path2D();
    if (outline.length === 0) return path;

    path.moveTo(outline[0][0], outline[0][1]);
    for (let i = 1; i < outline.length; i++) {
      path.lineTo(outline[i][0], outline[i][1]);
    }
    path.closePath();
    return path;
  }

  /**
   * Draws a complete stroke into the provided canvas context
   */
  static drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
    if (stroke.points.length === 0) return;

    ctx.save();

    if (stroke.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = '#000000';
    } else if (stroke.tool === 'highlighter') {
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = stroke.color;
      ctx.globalAlpha = 0.35;
    } else if (stroke.tool === 'pencil') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = stroke.color;
      ctx.globalAlpha = 0.75;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = stroke.color;
      ctx.globalAlpha = stroke.opacity ?? 1.0;
    }

    // Single point dot
    if (stroke.points.length === 1) {
      const p = stroke.points[0];
      const r = (stroke.size / 2) * Math.max(0.2, p.pressure);
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    const path = this.getSvgPathFromStroke(stroke.points, stroke.tool, stroke.size);
    ctx.fill(path);
    ctx.restore();
  }
}
