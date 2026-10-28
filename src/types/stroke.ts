export interface StrokePoint {
  x: number;
  y: number;
  pressure: number;
  tiltX?: number;
  tiltY?: number;
  t: number; // millisecond timestamp
}

export type ToolType = 'pen' | 'calligraphy' | 'pencil' | 'highlighter' | 'eraser';

export type PaperType = 'blank' | 'ruled' | 'french' | 'grid' | 'dots' | 'isometric';

export type AspectRatio = '16:10' | '16:9' | '4:3' | '3:2' | '1:1' | 'fit';

export interface BrushOptions {
  size: number;
  thinning: number;
  smoothing: number;
  streamline: number;
  simulatePressure: boolean;
  nibAngle?: number; // for calligraphy nib, in degrees (e.g. 45)
}

export interface Stroke {
  id: string;
  tool: ToolType;
  color: string;
  size: number;
  opacity: number;
  points: StrokePoint[];
  timestamp: number;
}

export interface CanvasDimensions {
  width: number;
  height: number;
  dpr: number;
  scale: number;
}
