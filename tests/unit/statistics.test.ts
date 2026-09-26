import { describe, expect, it } from 'vitest';
import {
  createRollingWindow,
  percentage,
  resolveReportingDays
} from '../../src/lib/analytics/statistics.js';

describe('owner statistics reporting helpers', () => {
  it('supports the agreed rolling windows and defaults to 30 days', () => {
    expect(resolveReportingDays('7')).toBe(7);
    expect(resolveReportingDays(30)).toBe(30);
    expect(resolveReportingDays('90')).toBe(30);
    expect(resolveReportingDays(null)).toBe(30);
  });

  it('creates an exact rolling window ending at the supplied time', () => {
    const now = new Date('2026-09-25T12:00:00.000Z');
    const window = createRollingWindow(7, now);

    expect(window.end.toISOString()).toBe('2026-09-25T12:00:00.000Z');
    expect(window.start.toISOString()).toBe('2026-09-18T12:00:00.000Z');
  });

  it('reports one-decimal percentages and no percentage for an empty cohort', () => {
    expect(percentage(2, 3)).toBe(66.7);
    expect(percentage(0, 0)).toBeNull();
  });
});
