import { expect, test } from '@playwright/test';
import {
  createTestUserEmail,
  deleteTestUser,
  getOperationalEventNames
} from './helpers/cleanupTestUser.js';

test('signed-in user can generate a label preview', async ({ page }, testInfo) => {
  const testRunId = /** @type {{ testRunId?: string }} */ (testInfo.config.metadata).testRunId;
  const email = createTestUserEmail(testRunId);
  let accountCreationConfirmed = false;

  try {
    await page.goto('/signup', { waitUntil: 'networkidle' });

    await page.getByLabel('Email Address').fill(email);
    await page.getByLabel('Password', { exact: true }).fill('Password123');
    await page.getByLabel('Confirm Password').fill('Password123');

    const signUpResponsePromise = page.waitForResponse((response) => {
      const requestUrl = new URL(response.url());
      return (
        requestUrl.pathname === '/api/auth/sign-up/email' && response.request().method() === 'POST'
      );
    });

    await page.getByRole('button', { name: 'Create Account' }).click();

    const signUpResponse = await signUpResponsePromise;
    accountCreationConfirmed = signUpResponse.ok();
    expect(signUpResponse.ok()).toBe(true);

    await expect(page).toHaveURL(/\/dashboard|\/labels/, { timeout: 10000 });

    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: "What's new", exact: true })).toBeVisible();
    await expect(page.getByText('Password recovery is available')).toBeVisible();

    const ownerStatisticsResponse = await page.request.get('/admin/statistics');
    expect(ownerStatisticsResponse.status()).toBe(403);

    await page.getByRole('link', { name: 'View all updates' }).click();
    await expect(page).toHaveURL(/\/updates$/);
    await expect(page.getByRole('heading', { name: "What's new", exact: true })).toBeVisible();

    const invalidPreviewResponse = await page.request.post('/api/pdf/preview', { data: {} });
    expect(invalidPreviewResponse.status()).toBe(400);

    await page.goto('/settings');
    await page.getByLabel('Company Name').fill('Preview Test Company');
    await page.getByLabel('GS1 Company Prefix').fill('1234567');
    await page.getByLabel('Extension Digit').fill('0');
    await page.getByLabel('Next Serial Reference').fill('1');
    await page.getByRole('button', { name: 'Save Settings' }).click();
    await expect(page.getByText('Label settings saved.')).toBeVisible({ timeout: 15000 });

    await page.goto('/labels');

    await page.getByLabel('GTIN (14 digits)').fill('00012345600012');
    await page.getByLabel('Lot Number').fill('LOT123ABC');
    await page.getByLabel('Production Date').fill('2026-05-24');
    await page.getByLabel('Quantity').fill('12');
    await page.getByLabel('Weight (lbs)').fill('10.5');

    const previewResponsePromise = page.waitForResponse((response) => {
      const requestUrl = new URL(response.url());
      return requestUrl.pathname === '/api/pdf/preview' && response.request().method() === 'POST';
    });

    await page.getByRole('button', { name: 'Preview Label' }).click();

    const previewResponse = await previewResponsePromise;
    expect(previewResponse.ok()).toBe(true);

    const previewFrame = page.locator('iframe[title="Label Preview"]');

    await expect(previewFrame).toBeVisible({ timeout: 10000 });
    await expect(previewFrame).toHaveAttribute('src', /^blob:/);

    await page.getByRole('button', { name: 'Generate PDF Label' }).click();
    await expect(page.getByText('Label generated successfully and saved to history.')).toBeVisible({
      timeout: 10000
    });
    await expect(page.getByRole('cell', { name: '00012345600012' })).toBeVisible();

    const resetSettingsResponse = await page.request.post('/api/settings', {
      data: {
        company_name: 'Preview Test Company',
        gs1_company_prefix: '1234567',
        extension_digit: '0',
        next_serial_reference: 1
      }
    });
    expect(resetSettingsResponse.ok()).toBe(true);

    const concurrentLabelCount = 8;
    const concurrentResponses = await Promise.all(
      Array.from({ length: concurrentLabelCount }, (_, index) =>
        page.request.post('/api/labels/create', {
          data: {
            gtin: '00012345600012',
            lot_number: `RACE${index + 1}`,
            production_date: '2026-05-24',
            quantity: 12,
            weight_pounds: 10.5
          }
        })
      )
    );

    for (const response of concurrentResponses) {
      expect(response.ok()).toBe(true);
    }

    const concurrentLabels = await Promise.all(
      concurrentResponses.map(async (response) => (await response.json()).label)
    );
    const concurrentSSCCs = concurrentLabels.map((label) => label.sscc);
    expect(new Set(concurrentSSCCs).size).toBe(concurrentLabelCount);

    const settingsResponse = await page.request.get('/api/settings');
    expect(settingsResponse.ok()).toBe(true);
    const settingsBody = await settingsResponse.json();
    expect(settingsBody.settings.next_serial_reference).toBe(10);

    const labelsResponse = await page.request.get('/api/labels/list?limit=100');
    expect(labelsResponse.ok()).toBe(true);
    const labelsBody = await labelsResponse.json();
    expect(labelsBody.labels).toHaveLength(concurrentLabelCount + 1);
    expect(new Set(labelsBody.labels.map((label) => label.sscc)).size).toBe(
      concurrentLabelCount + 1
    );

    await expect
      .poll(() => getOperationalEventNames(email))
      .toEqual(
        expect.arrayContaining([
          'sign_up',
          'login',
          'company_settings_saved',
          'label_preview_succeeded',
          'label_saved',
          'pdf_response_succeeded',
          'workflow_failed'
        ])
      );
  } finally {
    await deleteTestUser(email, { requireExisting: accountCreationConfirmed });
  }
});
