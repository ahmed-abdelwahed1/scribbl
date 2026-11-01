import Dexie, { type EntityTable } from 'dexie';
import type { Stroke } from '../../types/stroke';
import type { HandwritingScoreResult, DrillMetric } from '../../types/scoring';

export interface SessionRecord {
  id?: number;
  title: string;
  mode: 'handwriting' | 'drills' | 'free';
  aspectRatio: string;
  strokes: Stroke[];
  durationMs: number;
  createdAt: number;
}

export interface ScoreRecord {
  id?: number;
  mode: 'handwriting' | 'drills';
  target: string;
  score: number;
  handwritingResult?: HandwritingScoreResult;
  drillResult?: DrillMetric;
  createdAt: number;
}

export interface StreakRecord {
  date: string; // YYYY-MM-DD
  count: number;
  durationMs: number;
}

export interface UserSettings {
  id: string; // 'current'
  theme: 'dark' | 'light';
  aspectRatio: string;
  pressureCurve: 'linear' | 'soft' | 'hard' | 'custom';
  defaultTool: string;
  defaultColor: string;
  defaultSize: number;
  paperType: string;
  onboardingCompleted: boolean;
  slantAngle: number;
}

export class ScribblDatabase extends Dexie {
  sessions!: EntityTable<SessionRecord, 'id'>;
  scores!: EntityTable<ScoreRecord, 'id'>;
  streaks!: EntityTable<StreakRecord, 'date'>;
  settings!: EntityTable<UserSettings, 'id'>;

  constructor() {
    super('ScribblDatabase');
    this.version(1).stores({
      sessions: '++id, mode, createdAt',
      scores: '++id, mode, target, score, createdAt',
      streaks: 'date',
      settings: 'id'
    });
  }
}

export const db = new ScribblDatabase();
