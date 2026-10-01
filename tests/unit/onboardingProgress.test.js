import { describe, expect, it } from 'vitest';
import { buildOnboardingProgress } from '../../src/lib/onboarding/progress.js';

describe('first-label onboarding progress', () => {
  it('directs a new account to label settings', () => {
    expect(buildOnboardingProgress()).toEqual({
      completed: false,
      completedCount: 1,
      totalSteps: 4,
      steps: {
        accountCreated: true,
        settingsConfigured: false,
        previewCompleted: false,
        firstLabelSaved: false
      },
      nextAction: {
        href: '/settings',
        label: 'Configure label settings'
      }
    });
  });

  it('directs a configured account to its first preview', () => {
    expect(buildOnboardingProgress({ settingsConfigured: true }).nextAction).toEqual({
      href: '/labels',
      label: 'Preview your first label'
    });
  });

  it('does not skip settings when an inconsistent preview signal exists', () => {
    const progress = buildOnboardingProgress({ previewCompleted: true });

    expect(progress.completedCount).toBe(1);
    expect(progress.steps.previewCompleted).toBe(false);
    expect(progress.nextAction.label).toBe('Configure label settings');
  });

  it('directs a user who previewed to save the first label', () => {
    const progress = buildOnboardingProgress({
      settingsConfigured: true,
      previewCompleted: true
    });

    expect(progress.completedCount).toBe(3);
    expect(progress.nextAction).toEqual({
      href: '/labels',
      label: 'Create and save your first label'
    });
  });

  it('treats an existing saved label as completed onboarding', () => {
    const progress = buildOnboardingProgress({ totalLabels: 1 });

    expect(progress.completed).toBe(true);
    expect(progress.completedCount).toBe(4);
    expect(progress.steps).toEqual({
      accountCreated: true,
      settingsConfigured: true,
      previewCompleted: true,
      firstLabelSaved: true
    });
  });
});
