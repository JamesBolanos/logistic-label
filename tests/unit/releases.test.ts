import { describe, expect, it } from 'vitest';
import {
  formatReleaseDate,
  getPublishedReleases,
  getRecentPublishedReleases,
  type ReleaseUpdate
} from '../../src/lib/content/releases.js';

const updates: ReleaseUpdate[] = [
  {
    id: '2026-09-20-improvement',
    publishedAt: '2026-09-20',
    category: 'improvement',
    status: 'published',
    title: 'Older improvement',
    benefit: 'An older published change.'
  },
  {
    id: '2026-09-24-draft',
    publishedAt: '2026-09-24',
    category: 'new feature',
    status: 'draft',
    title: 'Unreleased work',
    benefit: 'This must remain hidden.'
  },
  {
    id: '2026-09-24-fix',
    publishedAt: '2026-09-24',
    category: 'fix',
    status: 'published',
    title: 'Recent fix',
    benefit: 'The newest published change.'
  }
];

describe('release updates', () => {
  it('shows only published entries in newest-first order', () => {
    expect(getPublishedReleases(updates).map((update) => update.id)).toEqual([
      '2026-09-24-fix',
      '2026-09-20-improvement'
    ]);
  });

  it('limits the dashboard list without changing the source list', () => {
    expect(getRecentPublishedReleases(1, updates).map((update) => update.id)).toEqual([
      '2026-09-24-fix'
    ]);
    expect(updates).toHaveLength(3);
  });

  it('supports an empty published state', () => {
    expect(getPublishedReleases(updates.filter((update) => update.status === 'draft'))).toEqual([]);
  });

  it('formats date-only release values without a timezone shift', () => {
    expect(formatReleaseDate('2026-09-24')).toBe('September 24, 2026');
  });
});
