import { neon } from '@neondatabase/serverless';
import { loadEnv } from 'vite';
import { assertDatabaseEnvironment } from '../../src/lib/server/db/databaseEnvironment.js';

const env = loadEnv('development', process.cwd(), '');
const readEnvironmentVariable = (name) => process.env[name] || env[name];
const databaseUrl = assertDatabaseEnvironment(
  {
    databaseUrl: readEnvironmentVariable('LOGISTIC_LABEL_DATABASE_URL'),
    databaseEnvironment: readEnvironmentVariable('DATABASE_ENVIRONMENT'),
    neonProjectId: readEnvironmentVariable('LOGISTIC_LABEL_NEON_PROJECT_ID'),
    expectedNeonProjectId: readEnvironmentVariable('EXPECTED_NEON_PROJECT_ID')
  },
  {
    expectedEnvironment: 'nonproduction',
    operation: 'E2E test cleanup'
  }
);
const sql = neon(databaseUrl);
const testRunIdPattern = /^[a-z0-9][a-z0-9-]{0,39}$/;
const testUserEmailPattern = /^e2e-[a-z0-9][a-z0-9-]{0,39}-\d+@example\.com$/;

export function createTestUserEmail(testRunId) {
  if (!testRunIdPattern.test(testRunId)) {
    throw new Error('Refusing to create a test email with an invalid test-run ID.');
  }

  return `e2e-${testRunId}-${Date.now()}@example.com`;
}

export async function deleteTestUser(email, { requireExisting = false } = {}) {
  if (!testUserEmailPattern.test(email)) {
    throw new Error(`Refusing to delete a non-test user: ${email}`);
  }

  const deletedUsers = await sql`
    DELETE FROM "user"
    WHERE "email" = ${email}
    RETURNING "id"
  `;

  if (deletedUsers.length === 0) {
    if (requireExisting) {
      throw new Error(`E2E cleanup could not find the confirmed test account: ${email}`);
    }

    return false;
  }

  if (deletedUsers.length > 1) {
    throw new Error(`Expected to delete at most one test user, deleted ${deletedUsers.length}.`);
  }

  const userId = deletedUsers[0].id;
  const [remainingRecords] = await sql`
    SELECT
      (SELECT count(*) FROM "user" WHERE "id" = ${userId}) AS users,
      (SELECT count(*) FROM "account" WHERE "user_id" = ${userId}) AS accounts,
      (SELECT count(*) FROM "session" WHERE "user_id" = ${userId}) AS sessions,
      (SELECT count(*) FROM "label_settings" WHERE "user_id" = ${userId}) AS label_settings,
      (SELECT count(*) FROM "logistic_label" WHERE "user_id" = ${userId}) AS logistic_labels
  `;

  const remainingCount = Object.values(remainingRecords).reduce(
    (total, count) => total + Number(count),
    0
  );

  if (remainingCount !== 0) {
    throw new Error(`Test user cleanup left related records for ${email}.`);
  }

  return true;
}
