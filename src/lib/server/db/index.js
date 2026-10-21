import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import {
  APP_ENV,
  DATABASE_ENVIRONMENT,
  EXPECTED_NEON_PROJECT_ID,
  LOGISTIC_LABEL_DATABASE_URL,
  LOGISTIC_LABEL_NEON_PROJECT_ID,
  VERCEL_ENV
} from '$app/env/private';
import * as schema from './schema.js';
import {
  assertDatabaseEnvironment,
  resolveExpectedDatabaseEnvironment
} from './databaseEnvironment.js';

const rawConnectionString = LOGISTIC_LABEL_DATABASE_URL;

if (!rawConnectionString) {
  console.warn(
    'LOGISTIC_LABEL_DATABASE_URL is not set. Database-backed features will fail until it is configured.'
  );
}

const connectionString = rawConnectionString
  ? assertDatabaseEnvironment(
      {
        databaseUrl: rawConnectionString,
        databaseEnvironment: DATABASE_ENVIRONMENT,
        neonProjectId: LOGISTIC_LABEL_NEON_PROJECT_ID,
        expectedNeonProjectId: EXPECTED_NEON_PROJECT_ID
      },
      {
        expectedEnvironment: resolveExpectedDatabaseEnvironment(VERCEL_ENV, APP_ENV),
        operation: 'Application database initialization'
      }
    )
  : null;

const sql = connectionString ? neon(connectionString) : null;

export const db = sql ? drizzle(sql, { schema }) : null;
export { schema };
