export type ReleaseCategory = 'fix' | 'improvement' | 'new feature';
export type ReleaseStatus = 'draft' | 'published';

export interface ReleaseUpdate {
  id: string;
  publishedAt: string;
  category: ReleaseCategory;
  status: ReleaseStatus;
  title: string;
  benefit: string;
  href?: string;
  linkLabel?: string;
}

export const releaseUpdates: readonly ReleaseUpdate[] = [
  {
    id: '2026-09-24-whats-new-panel',
    publishedAt: '2026-09-24',
    category: 'new feature',
    status: 'published',
    title: "What's new is now visible",
    benefit:
      'See recently released fixes, improvements, and features from your dashboard and review the complete update history.',
    href: '/updates',
    linkLabel: 'View update history'
  }
];

export function getPublishedReleases(
  updates: readonly ReleaseUpdate[] = releaseUpdates
): ReleaseUpdate[] {
  return updates
    .filter((update) => update.status === 'published')
    .sort(
      (first, second) =>
        second.publishedAt.localeCompare(first.publishedAt) || second.id.localeCompare(first.id)
    );
}

export function getRecentPublishedReleases(
  limit: number,
  updates: readonly ReleaseUpdate[] = releaseUpdates
): ReleaseUpdate[] {
  return getPublishedReleases(updates).slice(0, Math.max(0, limit));
}

export function formatReleaseDate(publishedAt: string): string {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'long',
    timeZone: 'UTC'
  }).format(new Date(`${publishedAt}T00:00:00Z`));
}
