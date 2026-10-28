export interface PointerSample {
  pointerId: number;
  pointerType: string;
  x: number;
  y: number;
  pressure: number;
  tiltX: number;
  tiltY: number;
  twist: number;
  buttons: number;
  button: number;
  coalescedCount: number;
  predictedCount: number;
  timestamp: number;
}

export interface HardwareDiagnostics {
  pointerType: string;
  isTabletPen: boolean;
  pressureSupported: boolean;
  tiltSupported: boolean;
  minDetectedPressure: number;
  maxDetectedPressure: number;
  currentPressure: number;
  currentTiltX: number;
  currentTiltY: number;
  currentTwist: number;
  eventRatePPS: number;
  lastCoalescedCount: number;
  lastPredictedCount: number;
  activeButtons: number;
  isBarrelButton1Pressed: boolean;
  isBarrelButton2Pressed: boolean;
  isEraserTip: boolean;
}
