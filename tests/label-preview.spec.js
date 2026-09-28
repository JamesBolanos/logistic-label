import { expect, test } from '@playwright/test';
import {
  createTestUserEmail,
  deleteTestUser,
  getOperationalEventNames
} from './helpers/cleanupTestUser.js';

test('signed-in user can generate both guided label scenarios', async ({ page }, testInfo) => {
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
    await expect(page.getByText('Labels now begin with a clear logistics scenario')).toBeVisible();

    const ownerStatisticsResponse = await page.request.get('/admin/statistics');
    expect(ownerStatisticsResponse.status()).toBe(403);

    await page.getByRole('link', { name: 'View all updates' }).click();
    await expect(page).toHaveURL(/\/updates$/);
    await expect(page.getByRole('heading', { name: "What's new", exact: true })).toBeVisible();
    await expect(page.getByText('Password recovery is available')).toBeVisible();

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

    await expect(page.getByRole('button', { name: /Logistic unit that is a trade item/ })).toBeDisabled();
    await expect(page.getByRole('button', { name: /Mixed-pallet content workflow/ })).toBeDisabled();

    await page.getByRole('button', { name: /SSCC-only label/ }).click();
    await expect(page.getByText('The barcode will contain only AI (00)')).toBeVisible();

    const ssccPreviewResponsePromise = page.waitForResponse((response) => {
      const requestUrl = new URL(response.url());
      return requestUrl.pathname === '/api/pdf/preview' && response.request().method() === 'POST';
    });

    await page.getByRole('button', { name: 'Review label' }).click();

    const ssccPreviewResponse = await ssccPreviewResponsePromise;
    expect(ssccPreviewResponse.ok()).toBe(true);
    const ssccPreviewPdf = (await ssccPreviewResponse.body()).toString('utf8');
    expect(ssccPreviewPdf).toContain('\\(00\\)');
    expect(ssccPreviewPdf).not.toContain('\\(02\\)');
    expect(ssccPreviewPdf).not.toContain('\\(37\\)');

    const previewFrame = page.locator('iframe[title="Label Preview"]');

    await expect(previewFrame).toBeVisible({ timeout: 10000 });
    await expect(previewFrame).toHaveAttribute('src', /^blob:/);

    await page.getByRole('button', { name: 'Generate and save label' }).click();
    await expect(page.getByText('Label generated successfully and saved to history.')).toBeVisible({
      timeout: 10000
    });
    await expect(page.getByText('SSCC-only', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Change workflow' }).click();
    await page.getByRole('button', { name: /Homogeneous logistic unit/ }).click();
    await page.getByLabel('Contained trade item GTIN').fill('00012345600012');
    await page.getByLabel('What does this GTIN identify?').selectOption('case');
    await page.getByLabel('Number of trade items identified by this GTIN').fill('12');
    await page
      .getByLabel(
        'I confirm that every trade item counted on this logistic unit has the same GTIN entered above.'
      )
      .check();

    const homogeneousPreviewResponsePromise = page.waitForResponse((response) => {
      const requestUrl = new URL(response.url());
      return requestUrl.pathname === '/api/pdf/preview' && response.request().method() === 'POST';
    });

    await page.getByRole('button', { name: 'Review label' }).click();

    const homogeneousPreviewResponse = await homogeneousPreviewResponsePromise;
    expect(homogeneousPreviewResponse.ok()).toBe(true);
    const homogeneousPreviewPdf = (await homogeneousPreviewResponse.body()).toString('utf8');
    expect(homogeneousPreviewPdf).toContain('\\(00\\)');
    expect(homogeneousPreviewPdf).toContain('\\(02\\)00012345600012\\(37\\)12');

    await page.getByRole('button', { name: 'Generate and save label' }).click();
    await expect(page.getByText('Label generated successfully and saved to history.')).toBeVisible({
      timeout: 10000
    });
    await expect(page.getByText('Homogeneous unit', { exact: true })).toBeVisible();
    await expect(page.getByText('GTIN 00012345600012')).toBeVisible();

    const maximumCountPreviewResponse = await page.request.post('/api/pdf/preview', {
      data: {
        label_type: 'homogeneous_unit',
        gtin: '00012345600012',
        packaging_level: 'case',
        quantity: 9999,
        contents_are_homogeneous: true
      }
    });
    expect(maximumCountPreviewResponse.ok()).toBe(true);

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
      Array.from({ length: concurrentLabelCount }, () =>
        page.request.post('/api/labels/create', {
          data: {
            label_type: 'homogeneous_unit',
            gtin: '00012345600012',
            packaging_level: 'case',
            quantity: 12,
            contents_are_homogeneous: true
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
    expect(concurrentLabels.every((label) => label.label_type === 'homogeneous_unit')).toBe(true);
    expect(concurrentLabels.every((label) => label.template_version === 'v2')).toBe(true);

    const settingsResponse = await page.request.get('/api/settings');
    expect(settingsResponse.ok()).toBe(true);
    const settingsBody = await settingsResponse.json();
    expect(settingsBody.settings.next_serial_reference).toBe(11);

    const labelsResponse = await page.request.get('/api/labels/list?limit=100');
    expect(labelsResponse.ok()).toBe(true);
    const labelsBody = await labelsResponse.json();
    expect(labelsBody.labels).toHaveLength(concurrentLabelCount + 2);
    expect(new Set(labelsBody.labels.map((label) => label.sscc)).size).toBe(
      concurrentLabelCount + 2
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
