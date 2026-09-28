import { expect, test } from '@playwright/test';
import {
  createLegacyLabelForTestUser,
  createTestUserEmail,
  deleteTestUser,
  getOperationalEventNames
} from './helpers/cleanupTestUser.js';

test('signed-in user can generate both guided label scenarios', async ({ page }, testInfo) => {
  test.setTimeout(60_000);

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

    const labelSettingsResponsePromise = page.waitForResponse((response) => {
      const requestUrl = new URL(response.url());
      return requestUrl.pathname === '/api/settings' && response.request().method() === 'GET';
    });

    await page.goto('/labels');
    const labelSettingsResponse = await labelSettingsResponsePromise;
    expect(labelSettingsResponse.ok()).toBe(true);

    const legacyLabel = await createLegacyLabelForTestUser(email);
    expect(legacyLabel).toMatchObject({
      label_type: 'legacy_demo',
      template_version: 'v1',
      print_layout: '4x6_single'
    });

    const legacyDownloadResponse = await page.request.get(`/api/pdf/download/${legacyLabel.id}`, {
      headers: { 'X-Download-Source': 'history' }
    });
    expect(legacyDownloadResponse.ok()).toBe(true);
    expect(legacyDownloadResponse.headers()['content-type']).toContain('application/pdf');
    const legacyPdf = (await legacyDownloadResponse.body()).toString('utf8');
    expect(legacyPdf).toContain('LEGACY123');
    expect(legacyPdf).toContain('9/28/2026');
    expect(legacyPdf).toContain(
      '\\(01\\)00012345600012\\(11\\)260928\\(10\\)LEGACY123\\(30\\)12'
    );
    expect(legacyPdf).toContain(`\\(00\\)${legacyLabel.sscc}`);
    expect(legacyPdf).not.toContain('\\(02\\)');
    expect(legacyPdf).not.toContain('\\(37\\)');

    await expect(page.getByRole('button', { name: /Logistic unit that is a trade item/ })).toBeDisabled();
    await expect(page.getByRole('button', { name: /Mixed-pallet content workflow/ })).toBeDisabled();

    await page.getByRole('button', { name: /^SSCC-only label/ }).click();
    await expect(page.getByText('The barcode will contain only AI (00)')).toBeVisible({
      timeout: 10000
    });
    await expect(page.getByRole('radio', { name: /^3 × 3 — unavailable/ })).toBeDisabled();
    await page.getByRole('radio', { name: /^4 × 6 — two copies/ }).check();

    const ssccPreviewResponsePromise = page.waitForResponse((response) => {
      const requestUrl = new URL(response.url());
      return requestUrl.pathname === '/api/pdf/preview' && response.request().method() === 'POST';
    });

    await page.getByRole('button', { name: 'Review label' }).click();

    const ssccPreviewResponse = await ssccPreviewResponsePromise;
    expect(ssccPreviewResponse.ok()).toBe(true);
    expect(ssccPreviewResponse.request().postDataJSON()).toMatchObject({
      label_type: 'sscc_only',
      print_layout: '4x6_two_up'
    });
    expect(ssccPreviewResponse.headers()['content-type']).toContain('application/pdf');
    expect(Number(ssccPreviewResponse.headers()['content-length'])).toBeGreaterThan(0);

    const ssccTwoUpPdfResponse = await page.request.post('/api/pdf/preview', {
      data: { label_type: 'sscc_only', print_layout: '4x6_two_up' }
    });
    expect(ssccTwoUpPdfResponse.ok()).toBe(true);
    const ssccTwoUpPdf = (await ssccTwoUpPdfResponse.body()).toString('utf8');
    expect(ssccTwoUpPdf).toContain('/MediaBox [0 0 288 432]');
    expect(ssccTwoUpPdf.split('\\(00\\)')).toHaveLength(3);
    expect(ssccTwoUpPdf).toContain('[4 4] 0 d');
    expect(ssccTwoUpPdf).not.toContain('SSCC-ONLY LOGISTIC LABEL');
    expect(ssccTwoUpPdf).not.toContain('contents are not encoded');
    expect(ssccTwoUpPdf).not.toContain('\\(02\\)');
    expect(ssccTwoUpPdf).not.toContain('\\(37\\)');

    const ssccSinglePdfResponse = await page.request.post('/api/pdf/preview', {
      data: { label_type: 'sscc_only', print_layout: '4x6_single' }
    });
    expect(ssccSinglePdfResponse.ok()).toBe(true);
    const ssccSinglePdf = (await ssccSinglePdfResponse.body()).toString('utf8');
    expect(ssccSinglePdf).toContain('/MediaBox [0 0 288 432]');
    expect(ssccSinglePdf.split('\\(00\\)')).toHaveLength(2);

    const ssccCompactPdfResponse = await page.request.post('/api/pdf/preview', {
      data: { label_type: 'sscc_only', print_layout: '4x3_single' }
    });
    expect(ssccCompactPdfResponse.ok()).toBe(true);
    const ssccCompactPdf = (await ssccCompactPdfResponse.body()).toString('utf8');
    expect(ssccCompactPdf).toContain('/MediaBox [0 0 288 216]');
    expect(ssccCompactPdf.split('\\(00\\)')).toHaveLength(2);

    const unsupportedCompactResponse = await page.request.post('/api/pdf/preview', {
      data: { label_type: 'sscc_only', print_layout: '3x3_single' }
    });
    expect(unsupportedCompactResponse.status()).toBe(400);

    const previewFrame = page.locator('iframe[title="Label Preview"]');

    await expect(previewFrame).toBeVisible({ timeout: 10000 });
    await expect(previewFrame).toHaveAttribute('src', /^blob:/);

    await page.getByRole('button', { name: 'Generate and save label' }).click();
    await expect(page.getByText('Label generated successfully and saved to history.')).toBeVisible({
      timeout: 10000
    });
    await expect(page.getByText('SSCC-only', { exact: true })).toBeVisible();
    await expect(page.getByText('4 × 6 — two copies', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Change workflow' }).click();
    await page.getByRole('button', { name: /Homogeneous logistic unit/ }).click();
    await page.getByLabel('Contained trade item GTIN').fill('00012345600012');
    await page.getByLabel('What does this GTIN identify?').selectOption('case');
    await page.getByLabel('Number of trade items identified by this GTIN').fill('12');
    await page.getByLabel('Batch or lot number — AI (10)').fill('123456');
    await page.getByLabel('GS1 date type').selectOption('13');
    await page.getByLabel('Date', { exact: true }).fill('2026-09-28');
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
    expect(homogeneousPreviewResponse.request().postDataJSON()).toMatchObject({
      label_type: 'homogeneous_unit',
      gtin: '00012345600012',
      packaging_level: 'case',
      quantity: 12,
      lot_number: '123456',
      date_ai: '13',
      date_value: '2026-09-28',
      contents_are_homogeneous: true,
      print_layout: '4x6_single'
    });
    expect(homogeneousPreviewResponse.headers()['content-type']).toContain('application/pdf');
    expect(Number(homogeneousPreviewResponse.headers()['content-length'])).toBeGreaterThan(0);
    const homogeneousPreviewPdf = (await homogeneousPreviewResponse.body()).toString('utf8');
    expect(homogeneousPreviewPdf).toContain('PACK DATE');
    expect(homogeneousPreviewPdf).toContain('BATCH/LOT');
    expect(homogeneousPreviewPdf).toContain('\\(13\\)260928\\(10\\)123456');
    expect(homogeneousPreviewPdf).not.toContain('HOMOGENEOUS LOGISTIC UNIT');
    expect(homogeneousPreviewPdf).not.toContain('Contained trade item level');

    await page.getByRole('button', { name: 'Generate and save label' }).click();
    await expect(page.getByText('Label generated successfully and saved to history.')).toBeVisible({
      timeout: 10000
    });
    await expect(page.getByText('Homogeneous unit', { exact: true })).toBeVisible();
    await expect(page.getByText('GTIN 00012345600012')).toBeVisible();
    await expect(page.getByText('Lot: 123456')).toBeVisible();
    await expect(page.getByText('Packaging date: 2026-09-28')).toBeVisible();

    const oversizedTraceabilityResponse = await page.request.post('/api/pdf/preview', {
      data: {
        label_type: 'homogeneous_unit',
        gtin: '00012345600012',
        packaging_level: 'case',
        quantity: 12,
        lot_number: 'ABCDEFGHIJKLMNOPQRST',
        date_ai: '17',
        date_value: '2026-09-28',
        contents_are_homogeneous: true
      }
    });
    expect(oversizedTraceabilityResponse.status()).toBe(400);
    expect(await oversizedTraceabilityResponse.json()).toMatchObject({
      message: expect.stringContaining('too wide')
    });

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
    const maximumCountPreviewPdf = (await maximumCountPreviewResponse.body()).toString('utf8');
    expect(maximumCountPreviewPdf).toContain('\\(00\\)');
    expect(maximumCountPreviewPdf).toContain('\\(02\\)00012345600012\\(37\\)9999');

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
    expect(labelsBody.labels).toHaveLength(concurrentLabelCount + 3);
    expect(new Set(labelsBody.labels.map((label) => label.sscc)).size).toBe(
      concurrentLabelCount + 3
    );
    expect(labelsBody.labels).toContainEqual(
      expect.objectContaining({
        id: legacyLabel.id,
        label_type: 'legacy_demo',
        template_version: 'v1',
        print_layout: '4x6_single',
        sscc: legacyLabel.sscc
      })
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
