import type { PaperType } from '../../types/stroke';

export interface GuideConfig {
  paperType: PaperType;
  theme: 'dark' | 'light';
  slantAngle?: number; // e.g. 52 deg
  showSlantLines?: boolean;
}

export class GuidesRenderer {
  static drawGuides(ctx: CanvasRenderingContext2D, width: number, height: number, config: GuideConfig) {
    ctx.save();

    const isDark = config.theme === 'dark';
    const primaryColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)';
    const subtleColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)';
    const baselineColor = isDark ? 'rgba(0, 139, 216, 0.5)' : 'rgba(0, 139, 216, 0.4)';
    const descenderColor = isDark ? 'rgba(244, 63, 94, 0.35)' : 'rgba(244, 63, 94, 0.25)';

    switch (config.paperType) {
      case 'ruled':
        this.drawHandwritingRuling(ctx, width, height, {
          baselineColor,
          descenderColor,
          subtleColor,
          slantAngle: config.slantAngle ?? 52,
          showSlant: config.showSlantLines ?? true
        });
        break;

      case 'french':
        this.drawSeyesRuling(ctx, width, height, isDark);
        break;

      case 'grid':
        this.drawSquareGrid(ctx, width, height, primaryColor, 28);
        break;

      case 'dots':
        this.drawDotGrid(ctx, width, height, primaryColor, 28);
        break;

      case 'isometric':
        this.drawIsometricGrid(ctx, width, height, subtleColor, 32);
        break;

      case 'blank':
      default:
        // No grid overlay
        break;
    }

    ctx.restore();
  }

  private static drawHandwritingRuling(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    options: {
      baselineColor: string;
      descenderColor: string;
      subtleColor: string;
      slantAngle: number;
      showSlant: boolean;
    }
  ) {
    // 4-line ruling system: Ascender, Midline (x-height), Baseline, Descender
    // Standard rule height: e.g. 140px per set
    const rowHeight = 160;
    const xHeightRatio = 0.4;
    const ascenderRatio = 0.3;
    const descenderRatio = 0.3;

    const startY = 40;
    const endY = height - 40;

    for (let y = startY; y + rowHeight <= endY; y += rowHeight + 30) {
      const ascenderY = y;
      const midlineY = y + rowHeight * ascenderRatio;
      const baselineY = midlineY + rowHeight * xHeightRatio;
      const descenderY = baselineY + rowHeight * descenderRatio;

      // Ascender line (dashed)
      ctx.strokeStyle = options.subtleColor;
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(30, ascenderY);
      ctx.lineTo(width - 30, ascenderY);
      ctx.stroke();

      // Midline (dotted)
      ctx.strokeStyle = options.subtleColor;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(30, midlineY);
      ctx.lineTo(width - 30, midlineY);
      ctx.stroke();

      // Baseline (solid primary)
      ctx.strokeStyle = options.baselineColor;
      ctx.lineWidth = 1.8;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(30, baselineY);
      ctx.lineTo(width - 30, baselineY);
      ctx.stroke();

      // Descender line (dashed faint rose)
      ctx.strokeStyle = options.descenderColor;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(30, descenderY);
      ctx.lineTo(width - 30, descenderY);
      ctx.stroke();

      // Slant guide lines (e.g. 52 deg)
      if (options.showSlant) {
        ctx.strokeStyle = options.subtleColor;
        ctx.lineWidth = 0.8;
        ctx.setLineDash([2, 5]);

        const rad = (options.slantAngle * Math.PI) / 180;
        const dx = (baselineY - ascenderY) / Math.tan(rad);

        for (let x = 60; x < width - 40; x += 55) {
          ctx.beginPath();
          ctx.moveTo(x + dx, ascenderY);
          ctx.lineTo(x, baselineY);
          ctx.stroke();
        }
      }
    }
  }

  private static drawSeyesRuling(ctx: CanvasRenderingContext2D, width: number, height: number, isDark: boolean) {
    const mainColor = isDark ? 'rgba(0, 139, 216, 0.4)' : 'rgba(0, 139, 216, 0.35)';
    const subColor = isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.06)';
    const marginColor = isDark ? 'rgba(244, 63, 94, 0.4)' : 'rgba(244, 63, 94, 0.3)';

    // Seyes: 8mm main line spacing, divided into 4 intervals of 2mm
    const majorInterval = 48;
    const minorInterval = majorInterval / 4;

    ctx.lineWidth = 1;
    ctx.setLineDash([]);

    // Horizontal minor lines
    ctx.strokeStyle = subColor;
    for (let y = 0; y < height; y += minorInterval) {
      if (y % majorInterval !== 0) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }

    // Horizontal major lines
    ctx.strokeStyle = mainColor;
    for (let y = 0; y < height; y += majorInterval) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Vertical major lines
    ctx.strokeStyle = subColor;
    for (let x = 0; x < width; x += majorInterval) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Left French margin
    ctx.strokeStyle = marginColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(majorInterval * 2, 0);
    ctx.lineTo(majorInterval * 2, height);
    ctx.stroke();
  }

  private static drawSquareGrid(ctx: CanvasRenderingContext2D, width: number, height: number, color: string, step: number) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.setLineDash([]);

    ctx.beginPath();
    for (let x = 0; x < width; x += step) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = 0; y < height; y += step) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();
  }

  private static drawDotGrid(ctx: CanvasRenderingContext2D, width: number, height: number, color: string, step: number) {
    ctx.fillStyle = color;
    for (let x = step / 2; x < width; x += step) {
      for (let y = step / 2; y < height; y += step) {
        ctx.beginPath();
        ctx.arc(x, y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private static drawIsometricGrid(ctx: CanvasRenderingContext2D, width: number, height: number, color: string, step: number) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.8;
    ctx.setLineDash([]);

    const h = step * Math.sin(Math.PI / 3);

    ctx.beginPath();
    // Vertical lines
    for (let x = 0; x < width; x += step) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    // 30 degree diagonal lines
    const diagCount = Math.ceil((width + height) / h);
    for (let i = -diagCount; i < diagCount; i++) {
      const yStart = i * h;
      ctx.moveTo(0, yStart);
      ctx.lineTo(width, yStart + width * Math.tan(Math.PI / 6));

      ctx.moveTo(0, yStart);
      ctx.lineTo(width, yStart - width * Math.tan(Math.PI / 6));
    }
    ctx.stroke();
  }
}
