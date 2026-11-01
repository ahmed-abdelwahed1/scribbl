import { db, type UserSettings, type ScoreRecord, type SessionRecord, type StreakRecord } from './db';
import type { Stroke } from '../../types/stroke';
import type { HandwritingScoreResult, DrillMetric } from '../../types/scoring';

const DEFAULT_SETTINGS: UserSettings = {
  id: 'current',
  theme: 'dark',
  aspectRatio: '16:10', // Default 16:10 matches Gaomon S620 active area ratio
  pressureCurve: 'linear',
  defaultTool: 'pen',
  defaultColor: '#008bd8',
  defaultSize: 4,
  paperType: 'ruled',
  onboardingCompleted: false,
  slantAngle: 52 // standard copperplate / cursive slant
};

export class StorageService {
  static async getSettings(): Promise<UserSettings> {
    try {
      const saved = await db.settings.get('current');
      if (saved) return saved;
      await db.settings.put(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    } catch (e) {
      console.warn('Error reading settings, returning defaults:', e);
      return DEFAULT_SETTINGS;
    }
  }

  static async updateSettings(partial: Partial<UserSettings>): Promise<UserSettings> {
    const current = await this.getSettings();
    const updated = { ...current, ...partial };
    await db.settings.put(updated);
    return updated;
  }

  static async saveSession(
    title: string,
    mode: 'handwriting' | 'drills' | 'free',
    aspectRatio: string,
    strokes: Stroke[],
    durationMs: number
  ): Promise<number> {
    const id = await db.sessions.add({
      title,
      mode,
      aspectRatio,
      strokes,
      durationMs,
      createdAt: Date.now()
    });
    await this.recordPracticeActivity(durationMs);
    return id as number;
  }

  static async getRecentSessions(limit = 20): Promise<SessionRecord[]> {
    return db.sessions.orderBy('createdAt').reverse().limit(limit).toArray();
  }

  static async saveScore(
    mode: 'handwriting' | 'drills',
    target: string,
    score: number,
    handwritingResult?: HandwritingScoreResult,
    drillResult?: DrillMetric
  ): Promise<number> {
    const id = await db.scores.add({
      mode,
      target,
      score,
      handwritingResult,
      drillResult,
      createdAt: Date.now()
    });
    await this.recordPracticeActivity(5000); // 5 sec minimum unit of practice
    return id as number;
  }

  static async getRecentScores(limit = 50): Promise<ScoreRecord[]> {
    return db.scores.orderBy('createdAt').reverse().limit(limit).toArray();
  }

  static async recordPracticeActivity(durationMs: number): Promise<void> {
    const today = new Date().toISOString().slice(0, 10);
    const existing = await db.streaks.get(today);
    if (existing) {
      await db.streaks.update(today, {
        count: existing.count + 1,
        durationMs: existing.durationMs + durationMs
      });
    } else {
      await db.streaks.put({
        date: today,
        count: 1,
        durationMs
      });
    }
  }

  static async getStreakStats(): Promise<{ currentStreak: number; totalDays: number; allRecords: StreakRecord[] }> {
    const records = await db.streaks.toArray();
    records.sort((a, b) => b.date.localeCompare(a.date)); // descending

    let streak = 0;
    const now = new Date();
    const today = now.toISOString().slice(0, 10);

    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().slice(0, 10);

    let checkDate = new Date();
    // Check if practiced today; if not, check if practiced yesterday to maintain streak
    const hasToday = records.some(r => r.date === today);
    const hasYesterday = records.some(r => r.date === yesterday);

    if (hasToday) {
      checkDate = new Date(now);
    } else if (hasYesterday) {
      checkDate = yesterdayDate;
    } else {
      return { currentStreak: 0, totalDays: records.length, allRecords: records };
    }

    // Count consecutive days backward
    while (true) {
      const dStr = checkDate.toISOString().slice(0, 10);
      const found = records.some(r => r.date === dStr);
      if (found) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return {
      currentStreak: streak,
      totalDays: records.length,
      allRecords: records
    };
  }
}
