export type MigrationTarget = 'nonproduction' | 'production';

export interface MigrationTargetInput {
  migrationTarget?: string;
  productionConfirmation?: string;
}

export const PRODUCTION_MIGRATION_CONFIRMATION = 'APPLY_PRODUCTION_MIGRATIONS';

export function resolveMigrationTarget(input: MigrationTargetInput): MigrationTarget {
  const target = input.migrationTarget?.trim() || 'nonproduction';

  if (target !== 'nonproduction' && target !== 'production') {
    throw new Error('MIGRATION_TARGET must be either nonproduction or production.');
  }

  if (
    target === 'production' &&
    input.productionConfirmation !== PRODUCTION_MIGRATION_CONFIRMATION
  ) {
    throw new Error(
      `Production migrations require CONFIRM_PRODUCTION_MIGRATION=${PRODUCTION_MIGRATION_CONFIRMATION}.`
    );
  }

  return target;
}
