export type DatabaseEnvironment = 'production' | 'nonproduction';

export interface DatabaseConfiguration {
  databaseUrl?: string;
  databaseEnvironment?: string;
  neonProjectId?: string;
  expectedNeonProjectId?: string;
}

interface DatabaseOperation {
  expectedEnvironment: DatabaseEnvironment;
  operation?: string;
}

const SUPPORTED_DATABASE_ENVIRONMENTS = new Set<string>(['production', 'nonproduction']);

export function assertDatabaseEnvironment(
  configuration: DatabaseConfiguration,
  options: DatabaseOperation
): string {
  const operation = options.operation || 'Database operation';
  const databaseUrl = normalize(configuration.databaseUrl);
  const databaseEnvironment = normalize(configuration.databaseEnvironment);
  const neonProjectId = normalize(configuration.neonProjectId);
  const expectedNeonProjectId = normalize(configuration.expectedNeonProjectId);

  const missing = [
    ['LOGISTIC_LABEL_DATABASE_URL', databaseUrl],
    ['DATABASE_ENVIRONMENT', databaseEnvironment],
    ['LOGISTIC_LABEL_NEON_PROJECT_ID', neonProjectId],
    ['EXPECTED_NEON_PROJECT_ID', expectedNeonProjectId]
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(`${operation} refused. Missing: ${missing.join(', ')}`);
  }

  if (!SUPPORTED_DATABASE_ENVIRONMENTS.has(databaseEnvironment)) {
    throw new Error(`${operation} refused. DATABASE_ENVIRONMENT is invalid.`);
  }

  if (databaseEnvironment !== options.expectedEnvironment) {
    throw new Error(`${operation} refused. The database environment does not match the operation.`);
  }

  if (neonProjectId !== expectedNeonProjectId) {
    throw new Error(`${operation} refused. The Neon project identity does not match.`);
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(databaseUrl);
  } catch {
    throw new Error(`${operation} refused. LOGISTIC_LABEL_DATABASE_URL is not a valid URL.`);
  }

  if (!['postgres:', 'postgresql:'].includes(parsedUrl.protocol)) {
    throw new Error(`${operation} refused. The database URL must use PostgreSQL.`);
  }

  return databaseUrl;
}

export function resolveExpectedDatabaseEnvironment(
  vercelEnvironment?: string,
  appEnvironment?: string
): DatabaseEnvironment {
  if (normalize(vercelEnvironment) === 'production' || normalize(appEnvironment) === 'production') {
    return 'production';
  }

  return 'nonproduction';
}

function normalize(value: string | undefined): string {
  return value?.trim() || '';
}
