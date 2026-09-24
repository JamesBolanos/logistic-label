import { describe, expect, it } from 'vitest';
import {
  PRODUCTION_MIGRATION_CONFIRMATION,
  resolveMigrationTarget
} from '../../src/lib/server/db/migrationTarget.js';

describe('migration target guard', () => {
  it('defaults to nonproduction', () => {
    expect(resolveMigrationTarget({})).toBe('nonproduction');
  });

  it('accepts an explicit nonproduction target without confirmation', () => {
    expect(resolveMigrationTarget({ migrationTarget: 'nonproduction' })).toBe('nonproduction');
  });

  it('rejects an unsupported target', () => {
    expect(() => resolveMigrationTarget({ migrationTarget: 'preview' })).toThrow(
      'MIGRATION_TARGET must be either nonproduction or production.'
    );
  });

  it('requires the exact confirmation phrase for production', () => {
    expect(() => resolveMigrationTarget({ migrationTarget: 'production' })).toThrow(
      'Production migrations require'
    );

    expect(
      resolveMigrationTarget({
        migrationTarget: 'production',
        productionConfirmation: PRODUCTION_MIGRATION_CONFIRMATION
      })
    ).toBe('production');
  });
});
