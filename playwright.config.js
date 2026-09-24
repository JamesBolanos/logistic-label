import { defineConfig, devices } from '@playwright/test';

const configuredTestRunId = process.env.E2E_TEST_RUN_ID?.trim();

if (process.env.CI && !configuredTestRunId) {
  throw new Error('E2E_TEST_RUN_ID is required when Playwright runs in CI.');
}

const testRunId = configuredTestRunId || `local-${Date.now()}`;

if (!/^[a-z0-9][a-z0-9-]{0,39}$/.test(testRunId)) {
  throw new Error(
    'E2E_TEST_RUN_ID must start with a lowercase letter or number and contain only lowercase letters, numbers, or hyphens.'
  );
}

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',
  metadata: { testRunId },
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry'
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5173',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
});
