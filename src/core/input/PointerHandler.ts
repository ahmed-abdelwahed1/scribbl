import type { StrokePoint } from '../../types/stroke';
import type { HardwareDiagnostics } from '../../types/diagnostics';
import { PressureCurves, type PressureCurveType } from './PressureCurves';
import { mapPointerEventToCanvas } from './PointerMapping';

export interface PointerHandlerCallbacks {
  onStrokeStart: (point: StrokePoint, isEraser: boolean) => void;
  onStrokeMove: (coalescedPoints: StrokePoint[], predictedPoints: StrokePoint[]) => void;
  onStrokeEnd: (lastPoint: StrokePoint) => void;
  onHoverMove: (point: StrokePoint) => void;
  onHoverLeave: () => void;
  onBarrelButton?: (buttonIndex: number) => void;
  onDiagnosticsUpdate?: (diag: HardwareDiagnostics) => void;
}

export class PointerHandler {
  private canvas: HTMLCanvasElement | null = null;
  private isDrawing = false;
  private activePointerId: number | null = null;
  private callbacks: PointerHandlerCallbacks;
  private pressureCurve: PressureCurveType = 'linear';

  // Real-time diagnostics state
  private eventCountWindow: number[] = [];
  private minPressure = 1.0;
  private maxPressure = 0.0;
  private lastDiagnostics: HardwareDiagnostics = {
    pointerType: 'none',
    isTabletPen: false,
    pressureSupported: false,
    tiltSupported: false,
    minDetectedPressure: 0,
    maxDetectedPressure: 1,
    currentPressure: 0,
    currentTiltX: 0,
    currentTiltY: 0,
    currentTwist: 0,
    eventRatePPS: 0,
    lastCoalescedCount: 1,
    lastPredictedCount: 0,
    activeButtons: 0,
    isBarrelButton1Pressed: false,
    isBarrelButton2Pressed: false,
    isEraserTip: false
  };

  constructor(callbacks: PointerHandlerCallbacks, pressureCurve: PressureCurveType = 'linear') {
    this.callbacks = callbacks;
    this.pressureCurve = pressureCurve;
  }

  setPressureCurve(curve: PressureCurveType) {
    this.pressureCurve = curve;
  }

  attach(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    // Apply strict non-touch gesture CSS directly on the canvas element
    canvas.style.touchAction = 'none';
    canvas.style.userSelect = 'none';
    canvas.style.webkitUserSelect = 'none';

    canvas.addEventListener('pointerdown', this.handlePointerDown, { passive: false });
    canvas.addEventListener('pointermove', this.handlePointerMove, { passive: false });
    canvas.addEventListener('pointerup', this.handlePointerUp, { passive: false });
    canvas.addEventListener('pointercancel', this.handlePointerCancel, { passive: false });
    canvas.addEventListener('pointerleave', this.handlePointerLeave, { passive: false });
    canvas.addEventListener('contextmenu', this.handleContextMenu, { passive: false });
  }

  detach() {
    if (!this.canvas) return;
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    this.canvas.removeEventListener('pointerup', this.handlePointerUp);
    this.canvas.removeEventListener('pointercancel', this.handlePointerCancel);
    this.canvas.removeEventListener('pointerleave', this.handlePointerLeave);
    this.canvas.removeEventListener('contextmenu', this.handleContextMenu);
    this.canvas = null;
  }

  private handleContextMenu = (e: MouseEvent) => {
    // Prevent browser context menu so tablet barrel buttons can be freely mapped
    e.preventDefault();
  };

  private getPointFromEvent(e: PointerEvent): StrokePoint {
    if (!this.canvas) {
      return { x: e.clientX, y: e.clientY, pressure: e.pressure, t: performance.now() };
    }

    // Map through the shared formula: x = (e.clientX - rect.left) * (canvas.width / rect.width)
    const mapped = mapPointerEventToCanvas(e, this.canvas);
    const rawPressure = e.pressure !== undefined && e.pressure > 0
      ? e.pressure
      : (e.buttons > 0 ? 0.5 : 0); // fallback for simple mouse without pressure
    
    const transformedPressure = PressureCurves.apply(rawPressure, this.pressureCurve);

    return {
      x: mapped.x,
      y: mapped.y,
      pressure: transformedPressure,
      tiltX: e.tiltX ?? 0,
      tiltY: e.tiltY ?? 0,
      t: performance.now()
    };
  }

  private updateDiagnostics(e: PointerEvent, coalescedCount = 1, predictedCount = 0) {
    const now = performance.now();
    this.eventCountWindow.push(now);
    // Keep 1 second window
    while (this.eventCountWindow.length > 0 && this.eventCountWindow[0] < now - 1000) {
      this.eventCountWindow.shift();
    }
    const pps = this.eventCountWindow.length;

    const rawPressure = e.pressure ?? 0;
    if (rawPressure > 0) {
      this.minPressure = Math.min(this.minPressure, rawPressure);
      this.maxPressure = Math.max(this.maxPressure, rawPressure);
    }

    const isPen = e.pointerType === 'pen';
    const isEraser = e.pointerType === 'eraser' || (e.buttons & 32) !== 0 || e.button === 5;
    const isBarrel1 = (e.buttons & 2) !== 0 || e.button === 2;
    const isBarrel2 = (e.buttons & 32) !== 0 || (e.buttons & 4) !== 0;

    this.lastDiagnostics = {
      pointerType: e.pointerType || 'mouse',
      isTabletPen: isPen,
      pressureSupported: rawPressure > 0 || this.maxPressure > 0,
      tiltSupported: (e.tiltX !== 0 || e.tiltY !== 0),
      minDetectedPressure: this.minPressure === 1.0 ? 0 : Number(this.minPressure.toFixed(3)),
      maxDetectedPressure: Number(this.maxPressure.toFixed(3)),
      currentPressure: Number(rawPressure.toFixed(3)),
      currentTiltX: e.tiltX ?? 0,
      currentTiltY: e.tiltY ?? 0,
      currentTwist: e.twist ?? 0,
      eventRatePPS: pps,
      lastCoalescedCount: coalescedCount,
      lastPredictedCount: predictedCount,
      activeButtons: e.buttons,
      isBarrelButton1Pressed: isBarrel1,
      isBarrelButton2Pressed: isBarrel2,
      isEraserTip: isEraser
    };

    if (this.callbacks.onDiagnosticsUpdate) {
      this.callbacks.onDiagnosticsUpdate(this.lastDiagnostics);
    }
  }

  private handlePointerDown = (e: PointerEvent) => {
    e.preventDefault();

    // Secondary button press / barrel button without drawing
    if (e.button === 2) {
      if (this.callbacks.onBarrelButton) {
        this.callbacks.onBarrelButton(1);
      }
    }

    this.activePointerId = e.pointerId;
    if (this.canvas && this.canvas.setPointerCapture) {
      try {
        this.canvas.setPointerCapture(e.pointerId);
      } catch {
        // Pointer capture may fail on certain synthetic events
      }
    }

    this.isDrawing = true;
    const isEraser = e.pointerType === 'eraser' || (e.buttons & 32) !== 0 || e.button === 5;
    const point = this.getPointFromEvent(e);

    this.updateDiagnostics(e, 1, 0);
    this.callbacks.onStrokeStart(point, isEraser);
  };

  private handlePointerMove = (e: PointerEvent) => {
    e.preventDefault();

    // Extract coalesced micro-events
    const rawCoalesced = typeof e.getCoalescedEvents === 'function'
      ? e.getCoalescedEvents()
      : [e];
    const coalescedEvents = rawCoalesced.length > 0 ? rawCoalesced : [e];

    // Extract predicted events
    const rawPredicted = typeof e.getPredictedEvents === 'function'
      ? e.getPredictedEvents()
      : [];
    const predictedEvents = rawPredicted ?? [];

    this.updateDiagnostics(e, coalescedEvents.length, predictedEvents.length);

    if (this.isDrawing && (this.activePointerId === null || e.pointerId === this.activePointerId)) {
      const coalescedPoints = coalescedEvents.map(evt => this.getPointFromEvent(evt));
      const predictedPoints = predictedEvents.map(evt => this.getPointFromEvent(evt));

      this.callbacks.onStrokeMove(coalescedPoints, predictedPoints);
    } else {
      // Hover mode (pen in proximity, not touching tablet)
      const hoverPoint = this.getPointFromEvent(e);
      this.callbacks.onHoverMove(hoverPoint);
    }
  };

  private handlePointerUp = (e: PointerEvent) => {
    e.preventDefault();
    if (!this.isDrawing) return;

    if (this.canvas && this.canvas.releasePointerCapture && this.activePointerId !== null) {
      try {
        this.canvas.releasePointerCapture(this.activePointerId);
      } catch {
        // Released
      }
    }

    this.isDrawing = false;
    this.activePointerId = null;
    const point = this.getPointFromEvent(e);
    this.updateDiagnostics(e, 1, 0);
    this.callbacks.onStrokeEnd(point);
  };

  private handlePointerCancel = (e: PointerEvent) => {
    if (this.isDrawing) {
      this.handlePointerUp(e);
    }
  };

  private handlePointerLeave = (_e: PointerEvent) => {
    if (!this.isDrawing) {
      this.callbacks.onHoverLeave();
    }
  };
}
