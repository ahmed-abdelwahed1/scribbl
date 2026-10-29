export type PressureCurveType = 'linear' | 'soft' | 'hard' | 'custom';

export class PressureCurves {
  static apply(pressure: number, type: PressureCurveType = 'linear'): number {
    // Clamp pressure to 0..1
    const p = Math.max(0, Math.min(1, pressure));

    switch (type) {
      case 'soft':
        // Soft curve: sensitive to light touch, reaches full pressure faster
        return Math.pow(p, 0.65);

      case 'hard':
        // Hard curve: requires deliberate, firmer pressure
        return Math.pow(p, 1.6);

      case 'custom':
        // S-curve (sigmoidal response): high contrast between delicate hairlines and bold downstrokes
        return p < 0.5
          ? 2 * Math.pow(p, 1.8)
          : 1 - 2 * Math.pow(1 - p, 1.8);

      case 'linear':
      default:
        return p;
    }
  }
}
