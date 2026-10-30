import type { AspectRatio, PaperType, Stroke, StrokePoint, ToolType } from '../../types/stroke';
import { BrushRenderer } from './BrushRenderer';
import { GuidesRenderer } from './GuidesRenderer';

export interface CanvasEngineOptions {
  onscreenCanvas: HTMLCanvasElement;
  theme: 'dark' | 'light';
  paperType: PaperType;
  aspectRatio: AspectRatio;
  slantAngle: number;
}

export class CanvasEngine {
  private onscreenCanvas: HTMLCanvasElement;
  private onscreenCtx: CanvasRenderingContext2D | null = null;
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D | null = null;

  private theme: 'dark' | 'light' = 'dark';
  private paperType: PaperType = 'ruled';
  private aspectRatio: AspectRatio = '16:10';
  private slantAngle = 52;

  private dpr = 1;
  private logicalWidth = 1280;
  private logicalHeight = 800; // 16:10 default

  // Active stroke state
  private isDrawing = false;
  private activePoints: StrokePoint[] = [];
  private predictedPoints: StrokePoint[] = [];
  private activeTool: ToolType = 'pen';
  private activeColor = '#008bd8';
  private activeSize = 4;
  private activeOpacity = 1.0;

  private rafId: number | null = null;
  private isDirty = true;

  constructor(options: CanvasEngineOptions) {
    this.onscreenCanvas = options.onscreenCanvas;
    this.theme = options.theme;
    this.paperType = options.paperType;
    this.aspectRatio = options.aspectRatio;
    this.slantAngle = options.slantAngle;

    // Create offscreen layer
    this.offscreenCanvas = document.createElement('canvas');

    // Standard composited 2D context (desynchronized: false prevents DirectComposition swapchain tearing & black flashes on Windows)
    this.onscreenCtx = this.onscreenCanvas.getContext('2d', {
      desynchronized: false,
      alpha: false
    }) as CanvasRenderingContext2D;

    this.offscreenCtx = this.offscreenCanvas.getContext('2d', {
      alpha: false
    }) as CanvasRenderingContext2D;

    this.scheduleRender();
  }

  destroy() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  setTheme(theme: 'dark' | 'light') {
    this.theme = theme;
    this.scheduleRender();
  }

  setPaperType(paperType: PaperType) {
    this.paperType = paperType;
    this.scheduleRender();
  }

  setAspectRatio(ratio: AspectRatio) {
    this.aspectRatio = ratio;
  }

  setSlantAngle(angle: number) {
    this.slantAngle = angle;
    this.scheduleRender();
  }

  getDimensions() {
    return {
      width: this.logicalWidth,
      height: this.logicalHeight,
      dpr: this.dpr
    };
  }

  /**
   * Resizes canvases based on container dimensions and requested aspect ratio
   */
  resize(containerWidth: number, containerHeight: number, committedStrokes: Stroke[] = []) {
    this.dpr = Math.min(window.devicePixelRatio || 1, 3);

    // Calculate aspect ratio target
    let targetRatio = 16 / 10; // Gaomon S620 default
    switch (this.aspectRatio) {
      case '16:9': targetRatio = 16 / 9; break;
      case '4:3': targetRatio = 4 / 3; break;
      case '3:2': targetRatio = 3 / 2; break;
      case '1:1': targetRatio = 1 / 1; break;
      case 'fit': targetRatio = containerWidth / containerHeight; break;
      case '16:10':
      default:
        targetRatio = 16 / 10;
        break;
    }

    const availW = Math.max(300, containerWidth);
    const availH = Math.max(200, containerHeight);

    let w = availW;
    let h = availW / targetRatio;
    if (h > availH) {
      h = availH;
      w = availH * targetRatio;
    }

    const nextLogicalW = Math.floor(w);
    const nextLogicalH = Math.floor(h);

    const physicalW = Math.round(nextLogicalW * this.dpr);
    const physicalH = Math.round(nextLogicalH * this.dpr);

    const sizeChanged =
      this.onscreenCanvas.width !== physicalW ||
      this.onscreenCanvas.height !== physicalH ||
      this.logicalWidth !== nextLogicalW ||
      this.logicalHeight !== nextLogicalH;

    this.logicalWidth = nextLogicalW;
    this.logicalHeight = nextLogicalH;

    if (sizeChanged) {
      // Make canvas bitmap size equal CSS size * devicePixelRatio on mount and resize
      this.onscreenCanvas.width = physicalW;
      this.onscreenCanvas.height = physicalH;
      if (this.onscreenCanvas.style.width !== `${this.logicalWidth}px`) {
        this.onscreenCanvas.style.width = `${this.logicalWidth}px`;
      }
      if (this.onscreenCanvas.style.height !== `${this.logicalHeight}px`) {
        this.onscreenCanvas.style.height = `${this.logicalHeight}px`;
      }

      this.offscreenCanvas.width = physicalW;
      this.offscreenCanvas.height = physicalH;
    }

    // Apply ctx.scale(dpr, dpr) once on mount and resize so no CSS scaling remains
    this.onscreenCtx?.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.offscreenCtx?.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    // Redraw committed layer at new resolution
    this.rebuildOffscreenLayer(committedStrokes);

    // Synchronously paint to onscreenCanvas to eliminate any blank frame flash
    this.renderFrame();
  }

  /**
   * Redraws paper background, guides, and all committed strokes into the offscreen buffer
   */
  rebuildOffscreenLayer(strokes: Stroke[]) {
    if (!this.offscreenCtx) return;

    // 1. Draw paper rulings and background in logical space with dpr transform
    this.offscreenCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const bgFill = this.theme === 'dark' ? '#0f111a' : '#f5f7fa';
    this.offscreenCtx.fillStyle = bgFill;
    this.offscreenCtx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);

    GuidesRenderer.drawGuides(this.offscreenCtx, this.logicalWidth, this.logicalHeight, {
      paperType: this.paperType,
      theme: this.theme,
      slantAngle: this.slantAngle,
      showSlantLines: true
    });

    // 2. Draw committed strokes using mapped coordinates (1:1 bitmap pixels)
    this.offscreenCtx.setTransform(1, 0, 0, 1, 0, 0);
    for (let i = 0; i < strokes.length; i++) {
      BrushRenderer.drawStroke(this.offscreenCtx, strokes[i]);
    }

    // Restore to dpr transform
    this.offscreenCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.scheduleRender();
  }

  /**
   * Bakes a newly finished stroke into the offscreen canvas
   */
  commitStroke(stroke: Stroke) {
    if (!this.offscreenCtx) return;

    // Stroke points are in canvas bitmap space, draw 1:1 without double-scaling
    this.offscreenCtx.setTransform(1, 0, 0, 1, 0, 0);
    BrushRenderer.drawStroke(this.offscreenCtx, stroke);
    this.offscreenCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    this.isDrawing = false;
    this.activePoints = [];
    this.predictedPoints = [];
    this.scheduleRender();
  }

  beginActiveStroke(point: StrokePoint, tool: ToolType, color: string, size: number, opacity: number) {
    this.isDrawing = true;
    this.activeTool = tool;
    this.activeColor = color;
    this.activeSize = size;
    this.activeOpacity = opacity;
    this.activePoints = [point];
    this.predictedPoints = [];
    this.scheduleRender();
  }

  updateActiveStroke(coalescedPoints: StrokePoint[], predictedPoints: StrokePoint[]) {
    for (let i = 0; i < coalescedPoints.length; i++) {
      this.activePoints.push(coalescedPoints[i]);
    }
    this.predictedPoints = predictedPoints;
    this.scheduleRender();
  }

  /**
   * On-demand frame scheduler: runs at 60/120+ fps during active drawing,
   * but idles with zero CPU/GPU overhead when not drawing or modifying state.
   */
  scheduleRender() {
    this.isDirty = true;
    if (this.rafId === null) {
      this.rafId = requestAnimationFrame(this.renderLoopTick);
    }
  }

  private renderLoopTick = () => {
    this.rafId = null;
    if (this.isDirty && this.onscreenCtx) {
      this.renderFrame();
      this.isDirty = this.isDrawing;
      if (this.isDrawing) {
        // While pen is active, continue scheduling next frame
        this.rafId = requestAnimationFrame(this.renderLoopTick);
      }
    }
  };

  private renderFrame() {
    if (!this.onscreenCtx) return;

    // 1. Bit blit from offscreen canvas at 1:1 bitmap pixels
    this.onscreenCtx.setTransform(1, 0, 0, 1, 0, 0);
    this.onscreenCtx.drawImage(this.offscreenCanvas, 0, 0);

    // 2. Draw in-progress active stroke directly in mapped bitmap coordinates
    if (this.isDrawing && this.activePoints.length > 0) {
      const allPoints = this.predictedPoints.length > 0
        ? [...this.activePoints, ...this.predictedPoints]
        : this.activePoints;

      BrushRenderer.drawStroke(this.onscreenCtx, {
        id: 'active',
        tool: this.activeTool,
        color: this.activeColor,
        size: this.activeSize * this.dpr,
        opacity: this.activeOpacity,
        points: allPoints,
        timestamp: performance.now()
      });
    }

    // Restore context transform to dpr
    this.onscreenCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  /**
   * Export canvas contents as high-resolution Data URL (PNG)
   */
  toDataURL(type = 'image/png'): string {
    return this.offscreenCanvas.toDataURL(type);
  }
}
