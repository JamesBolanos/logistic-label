export type ReleaseCategory = 'fix' | 'improvement' | 'new feature';
export type ReleaseStatus = 'draft' | 'published';

export interface ReleaseUpdate {
  id: string;
  publishedAt: string;
  category: ReleaseCategory;
  status: ReleaseStatus;
  title: string;
  benefit: string;
  featureKey: string;
  href?: string;
  linkLabel?: string;
}

export const releaseUpdates: readonly ReleaseUpdate[] = [
  {
    id: '2026-09-29-business-scenario-labels',
    publishedAt: '2026-09-29',
    category: 'improvement',
    status: 'published',
    title: 'Choose a label by the shipping problem it solves',
    benefit:
      'Start with a real-world shipping situation. Both available options now use clear transport zones, while identical-content shipments can use a larger 6 × 8 layout for lot and date traceability.',
    featureKey: 'business_scenario_labels',
    href: '/labels',
    linkLabel: 'Choose a shipping label'
  },
  {
    id: '2026-09-28-analytics-validation',
    publishedAt: '2026-09-28',
    category: 'improvement',
    status: 'published',
    title: 'Privacy-safe usage signals are more reliable',
    benefit:
      'Public contact actions now use controlled analytics values, while configured owner sessions stop sending product analytics after sign-in.',
    featureKey: 'analytics_validation',
    href: '/privacy',
    linkLabel: 'Review analytics privacy'
  },
  {
    id: '2026-09-28-guided-label-workflows',
    publishedAt: '2026-09-28',
    category: 'improvement',
    status: 'published',
    title: 'Labels now begin with a clear logistics scenario',
    benefit:
      'Choose practical transport-label layouts or describe multiple identical contained items with optional batch/lot and a selected GS1 date type.',
    featureKey: 'guided_label_workflows',
    href: '/labels',
    linkLabel: 'Create a guided label'
  },
  {
    id: '2026-09-27-atomic-sscc-allocation',
    publishedAt: '2026-09-27',
    category: 'fix',
    status: 'published',
    title: 'Simultaneous label creation is safer',
    benefit:
      'Each label now reserves its SSCC serial in the database, preventing simultaneous requests from receiving the same number.',
    featureKey: 'atomic_sscc_allocation'
  },
  {
    id: '2026-09-26-password-recovery',
    publishedAt: '2026-09-26',
    category: 'fix',
    status: 'published',
    title: 'Password recovery is available',
    benefit:
      'Request a secure, time-limited reset link from the sign-in page and choose a new password without support intervention.',
    featureKey: 'password_recovery',
    href: '/reset-password',
    linkLabel: 'Reset a password'
  },
  {
    id: '2026-09-25-private-usage-statistics',
    publishedAt: '2026-09-25',
    category: 'improvement',
    status: 'published',
    title: 'Product decisions now use aggregate statistics',
    benefit:
      'Private aggregate reporting now helps prioritize onboarding and reliability improvements while keeping emails, company names, and label contents out of the report.',
    featureKey: 'owner_statistics',
    href: '/privacy',
    linkLabel: 'Review analytics privacy'
  },
  {
    id: '2026-09-24-usage-tracking-foundation',
    publishedAt: '2026-09-24',
    category: 'improvement',
    status: 'published',
    title: 'Usage signals now guide improvements',
    benefit:
      'Successful workflow milestones and controlled failure categories can now show where the label journey needs improvement without sending label contents to analytics.',
    featureKey: 'usage_tracking',
    href: '/privacy',
    linkLabel: 'Review analytics privacy'
  },
  {
    id: '2026-09-24-whats-new-panel',
    publishedAt: '2026-09-24',
    category: 'new feature',
    status: 'published',
    title: "What's new is now visible",
    featureKey: 'release_history',
    benefit:
      'See recently released fixes, improvements, and features from the public home page and review the complete update history.',
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
