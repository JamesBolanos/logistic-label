import { defineConfig } from 'drizzle-kit';
import { loadEnv } from 'vite';
import { assertDatabaseEnvironment } from './src/lib/server/db/databaseEnvironment.ts';
import { resolveMigrationTarget } from './src/lib/server/db/migrationTarget.ts';

const fileEnvironment = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '');

function readEnvironmentVariable(name) {
  return process.env[name] || fileEnvironment[name];
}

const databaseUrl = assertDatabaseEnvironment(
  {
    databaseUrl: readEnvironmentVariable('LOGISTIC_LABEL_DATABASE_URL'),
    databaseEnvironment: readEnvironmentVariable('DATABASE_ENVIRONMENT'),
    neonProjectId: readEnvironmentVariable('LOGISTIC_LABEL_NEON_PROJECT_ID'),
    expectedNeonProjectId: readEnvironmentVariable('EXPECTED_NEON_PROJECT_ID')
  },
  {
    expectedEnvironment: resolveMigrationTarget({
      migrationTarget: readEnvironmentVariable('MIGRATION_TARGET'),
      productionConfirmation: readEnvironmentVariable('CONFIRM_PRODUCTION_MIGRATION')
    }),
    operation: 'Drizzle command'
  }
);

export default defineConfig({
  schema: './src/lib/server/db/schema.js',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl
  }
});
