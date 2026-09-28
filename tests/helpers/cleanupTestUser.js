import { neon } from '@neondatabase/serverless';
import { loadEnv } from 'vite';
import { assertDatabaseEnvironment } from '../../src/lib/server/db/databaseEnvironment.js';
import { generateSSCC } from '../../src/lib/utils/gs1Utils.js';

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
      (SELECT count(*) FROM "logistic_label" WHERE "user_id" = ${userId}) AS logistic_labels,
      (SELECT count(*) FROM "operational_event" WHERE "user_id" = ${userId}) AS operational_events
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

export async function getOperationalEvents(email) {
  if (!testUserEmailPattern.test(email)) {
    throw new Error(`Refusing to inspect a non-test user: ${email}`);
  }

  const rows = await sql`
    SELECT
      event."event_name",
      event."operation_id",
      event."auth_method",
      event."setup_type",
      event."workflow_step",
      event."error_category",
      event."document_format",
      event."download_source",
      event."label_type",
      event."label_size",
      event."template_version",
      event."is_internal"
    FROM "operational_event" AS event
    INNER JOIN "user" AS account ON account."id" = event."user_id"
    WHERE account."email" = ${email}
    ORDER BY event."created_at", event."id"
  `;

  return rows;
}

export async function createLegacyLabelForTestUser(email) {
  if (!testUserEmailPattern.test(email)) {
    throw new Error(`Refusing to create a legacy label for a non-test user: ${email}`);
  }

  const serialReference = Number(String(Date.now()).slice(-9));
  const sscc = generateSSCC({
    gs1CompanyPrefix: '1234567',
    serialReference,
    extensionDigit: '9'
  });

  const rows = await sql`
    INSERT INTO "logistic_label" (
      "user_id",
      "gtin",
      "lot_number",
      "production_date",
      "quantity",
      "weight_pounds",
      "sscc"
    )
    SELECT
      account."id",
      '00012345600012',
      'LEGACY123',
      '2026-09-28',
      12,
      25.5,
      ${sscc}
    FROM "user" AS account
    WHERE account."email" = ${email}
    RETURNING "id", "sscc", "label_type", "template_version", "print_layout"
  `;

  if (rows.length !== 1) {
    throw new Error(`Expected one test user for the legacy-label fixture, found ${rows.length}.`);
  }

  return rows[0];
}
