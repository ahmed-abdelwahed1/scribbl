import type { StrokePoint } from './stroke';

export interface ResampledPoint {
  x: number;
  y: number;
  strokeIndex: number;
  t?: number;
}

export interface LetterTemplate {
  char: string;
  strokes: Array<Array<{ x: number; y: number }>>;
  category: 'lowercase' | 'uppercase' | 'digit';
  ascender?: boolean;
  descender?: boolean;
}

export interface StrokeScoringDetail {
  strokeIndex: number;
  shapeScore: number;       // 0 - 100
  directionScore: number;   // 0 - 100 (aligned direction)
  orderScore: number;       // 0 - 100 (was this stroke executed in correct order)
  overallScore: number;
  isDirectionCorrect: boolean;
  isOrderCorrect: boolean;
  feedback: string;
}

export interface HandwritingScoreResult {
  char: string;
  totalScore: number;        // 0 - 100
  shapeScore: number;
  orderScore: number;
  directionScore: number;
  strokeDetails: StrokeScoringDetail[];
  rating: 'perfect' | 'great' | 'good' | 'needs_practice';
  passed: boolean;
  feedbackMessage: string;
}

export type DrillType = 'line' | 'circle' | 'ellipse' | 'pressure_ramp' | 'pressure_steady';

export interface DrillMetric {
  drillType: DrillType;
  score: number;             // 0 - 100
  rating: 'perfect' | 'great' | 'good' | 'needs_practice';
  details: {
    primaryMetricName: string;
    primaryMetricValue: string;
    straightness?: number;   // for lines
    circularity?: number;    // for circles
    eccentricity?: number;   // for ellipses
    pressureSlope?: number;  // for pressure ramp
    pressureVariance?: number;// for steady pressure
    speedConsistency?: number;
  };
  feedback: string;
}
