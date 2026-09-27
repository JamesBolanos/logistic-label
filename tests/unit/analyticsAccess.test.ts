import { describe, expect, it } from 'vitest';
import {
  isConfiguredAnalyticsOwner,
  parseAnalyticsUserIds
} from '../../src/lib/analytics/access.js';

describe('analytics access configuration', () => {
  it('normalizes and deduplicates configured user IDs', () => {
    expect(parseAnalyticsUserIds(' owner-1, test-1,owner-1, ,test-2 ')).toEqual([
      'owner-1',
      'test-1',
      'test-2'
    ]);
  });

  it('allows only a configured owner ID', () => {
    expect(isConfiguredAnalyticsOwner('owner-1', 'owner-1,owner-2')).toBe(true);
    expect(isConfiguredAnalyticsOwner('user-1', 'owner-1,owner-2')).toBe(false);
    expect(isConfiguredAnalyticsOwner(null, 'owner-1')).toBe(false);
  });
});
