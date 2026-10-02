/**
 * Build the first-label checklist from data the application already records.
 * A saved label completes earlier milestones for accounts created before event
 * tracking existed, so established users are not shown a stale checklist.
 *
 * @param {{ settingsConfigured?: boolean, previewCompleted?: boolean, totalLabels?: number }} input
 */
export function buildOnboardingProgress(input = {}) {
  const firstLabelSaved = Number(input.totalLabels || 0) > 0;
  const settingsConfigured = Boolean(input.settingsConfigured) || firstLabelSaved;
  const previewCompleted =
    (settingsConfigured && Boolean(input.previewCompleted)) || firstLabelSaved;

  const steps = {
    accountCreated: true,
    settingsConfigured,
    previewCompleted,
    firstLabelSaved
  };
  const completedCount = Object.values(steps).filter(Boolean).length;

  let nextAction = {
    href: '/labels',
    label: 'Create your first label'
  };

  if (!settingsConfigured) {
    nextAction = {
      href: '/settings',
      label: 'Configure label settings'
    };
  } else if (!previewCompleted) {
    nextAction = {
      href: '/labels',
      label: 'Preview your first label'
    };
  } else if (!firstLabelSaved) {
    nextAction = {
      href: '/labels',
      label: 'Create and save your first label'
    };
  }

  return {
    completed: firstLabelSaved,
    completedCount,
    totalSteps: Object.keys(steps).length,
    steps,
    nextAction
  };
}
