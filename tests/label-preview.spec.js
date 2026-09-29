import { expect, test } from '@playwright/test';
import {
  createLegacyLabelForTestUser,
  createTestUserEmail,
  deleteTestUser,
  getOperationalEvents
} from './helpers/cleanupTestUser.js';

test('signed-in user can generate both available shipping situations', async ({
  page
}, testInfo) => {
  test.setTimeout(60_000);

  const testRunId = /** @type {{ testRunId?: string }} */ (testInfo.config.metadata).testRunId;
  const email = createTestUserEmail(testRunId);
  let accountCreationConfirmed = false;

  try {
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: "What's new", exact: true })).toBeVisible();
    await expect(page.getByText('Choose a label by the shipping problem it solves')).toBeVisible();
    await page.getByRole('link', { name: 'View all updates' }).click();
    await expect(page).toHaveURL(/\/updates$/);
    await expect(page.getByRole('heading', { name: "What's new", exact: true })).toBeVisible();
    await expect(page.getByText('Password recovery is available')).toBeVisible();

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

    const ownerStatisticsResponse = await page.request.get('/admin/statistics');
    expect(ownerStatisticsResponse.status()).toBe(403);

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

    await expect(
      page.getByRole('button', {
        name: 'Ship a case or pallet sold as one item — Planned',
        exact: true
      })
    ).toBeDisabled();
    await expect(
      page.getByRole('button', {
        name: 'Ship a pallet containing different products — Planned',
        exact: true
      })
    ).toBeDisabled();
    await expect(
      page.getByRole('button', {
        name: 'Follow a retailer or customer routing guide — Tailored solution',
        exact: true
      })
    ).toBeDisabled();

    await page
      .getByRole('button', {
        name: 'Track a pallet, carton, or parcel — Available',
        exact: true
      })
      .click();
    await expect(page.getByRole('group', { name: 'Transport information' })).toBeVisible({
      timeout: 10000
    });
    await page.getByLabel('Ship From').fill('Preview Test Company\n10 Origin Road');
    await page.getByLabel('Ship To').fill('Customer DC\n20 Destination Road');
    await page.getByLabel('PO Number').fill('PO-100');
    await page.getByLabel('Carrier').fill('Example Freight');
    await page.getByRole('spinbutton', { name: /^Gross Weight/ }).fill('540.5');
    await page.getByLabel('Gross Weight unit').selectOption('kg');
    await page.getByRole('spinbutton', { name: /^Count/ }).fill('12');
    await page.getByLabel('Count type').selectOption('cartons');
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
      print_layout: '4x6_two_up',
      ship_from: 'Preview Test Company\n10 Origin Road',
      ship_to: 'Customer DC\n20 Destination Road',
      purchase_order: 'PO-100',
      carrier: 'Example Freight',
      gross_weight: 540.5,
      gross_weight_unit: 'kg',
      transport_count: 12,
      transport_count_type: 'cartons'
    });
    expect(ssccPreviewResponse.headers()['content-type']).toContain('application/pdf');
    expect(Number(ssccPreviewResponse.headers()['content-length'])).toBeGreaterThan(0);

    const transportData = {
      label_type: 'sscc_only',
      ship_from: 'Preview Test Company, 10 Origin Road',
      ship_to: 'Customer DC, 20 Destination Road',
      purchase_order: 'PO-100',
      carrier: 'Example Freight',
      gross_weight: 540.5,
      gross_weight_unit: 'kg',
      transport_count: 12,
      transport_count_type: 'cartons'
    };

    const ssccTwoUpPdfResponse = await page.request.post('/api/pdf/preview', {
      data: { ...transportData, print_layout: '4x6_two_up' }
    });
    expect(ssccTwoUpPdfResponse.ok()).toBe(true);
    const ssccTwoUpPdf = (await ssccTwoUpPdfResponse.body()).toString('utf8');
    expect(ssccTwoUpPdf).toContain('/MediaBox [0 0 288 432]');
    expect(ssccTwoUpPdf.split('\\(00\\)')).toHaveLength(3);
    expect(ssccTwoUpPdf).toContain('[4 4] 0 d');
    expect(ssccTwoUpPdf).not.toContain('SSCC-ONLY LOGISTIC LABEL');
    expect(ssccTwoUpPdf).not.toContain('contents are not encoded');
    expect(ssccTwoUpPdf).toContain('SHIP FROM');
    expect(ssccTwoUpPdf).toContain('Customer DC, 20 Destination Road');
    expect(ssccTwoUpPdf).toContain('12 Cartons');
    expect(ssccTwoUpPdf).not.toContain('\\(02\\)');
    expect(ssccTwoUpPdf).not.toContain('\\(37\\)');

    const ssccSinglePdfResponse = await page.request.post('/api/pdf/preview', {
      data: { ...transportData, print_layout: '4x6_single' }
    });
    expect(ssccSinglePdfResponse.ok()).toBe(true);
    const ssccSinglePdf = (await ssccSinglePdfResponse.body()).toString('utf8');
    expect(ssccSinglePdf).toContain('/MediaBox [0 0 288 432]');
    expect(ssccSinglePdf.split('\\(00\\)')).toHaveLength(2);
    expect(ssccSinglePdf).toContain('PO-100');
    expect(ssccSinglePdf).toContain('540.5 kg');

    const ssccCompactPdfResponse = await page.request.post('/api/pdf/preview', {
      data: { ...transportData, print_layout: '4x3_single' }
    });
    expect(ssccCompactPdfResponse.ok()).toBe(true);
    const ssccCompactPdf = (await ssccCompactPdfResponse.body()).toString('utf8');
    expect(ssccCompactPdf).toContain('/MediaBox [0 0 288 216]');
    expect(ssccCompactPdf.split('\\(00\\)')).toHaveLength(2);

    const unsupportedCompactResponse = await page.request.post('/api/pdf/preview', {
      data: { ...transportData, print_layout: '3x3_single' }
    });
    expect(unsupportedCompactResponse.status()).toBe(400);

    const previewFrame = page.locator('iframe[title="Label Preview"]');

    await expect(previewFrame).toBeVisible({ timeout: 10000 });
    await expect(previewFrame).toHaveAttribute('src', /^blob:/);

    await page.getByRole('button', { name: 'Generate and save label' }).click();
    await expect(page.getByText('Label generated successfully and saved to history.')).toBeVisible({
      timeout: 10000
    });
    const ssccHistoryRow = page
      .getByRole('table')
      .getByRole('row')
      .filter({ hasText: 'Transport unit tracking' });
    await expect(ssccHistoryRow).toBeVisible();
    await expect(ssccHistoryRow).toContainText('Ship to: Customer DC 20 Destination Road');
    await expect(ssccHistoryRow).toContainText('Count: 12 Cartons');
    await expect(ssccHistoryRow).toContainText('4 × 6 — two copies');

    await page.getByRole('button', { name: 'Choose a different situation' }).click();
    await page
      .getByRole('button', {
        name: 'Ship multiple identical cases or items — Available',
        exact: true
      })
      .click();
    await page.getByLabel('Contained trade item GTIN').fill('00012345600012');
    await page.getByLabel('What does this GTIN identify?').selectOption('case');
    await page.getByLabel('Number of trade items identified by this GTIN').fill('12');
    await page.getByLabel('Batch or lot number — AI (10)').fill('123456');
    await page.getByLabel('GS1 date type').selectOption('13');
    await page.getByLabel('Date', { exact: true }).fill('2026-09-28');
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
      print_layout: '4x6_single'
    });
    expect(homogeneousPreviewResponse.headers()['content-type']).toContain('application/pdf');
    expect(Number(homogeneousPreviewResponse.headers()['content-length'])).toBeGreaterThan(0);

    await page.getByRole('button', { name: 'Generate and save label' }).click();
    await expect(page.getByText('Label generated successfully and saved to history.')).toBeVisible({
      timeout: 10000
    });
    const homogeneousHistoryRow = page
      .getByRole('table')
      .getByRole('row')
      .filter({ hasText: 'Identical contents' });
    await expect(homogeneousHistoryRow).toBeVisible();
    await expect(homogeneousHistoryRow).toContainText('GTIN 00012345600012');
    await expect(homogeneousHistoryRow).toContainText('Lot: 123456');
    await expect(homogeneousHistoryRow).toContainText('Packaging date: 2026-09-28');

    const oversizedTraceabilityResponse = await page.request.post('/api/pdf/preview', {
      data: {
        label_type: 'homogeneous_unit',
        gtin: '00012345600012',
        packaging_level: 'case',
        quantity: 12,
        lot_number: 'ABCDEFGHIJKLMNOPQRST',
        date_ai: '17',
        date_value: '2026-09-28'
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
        quantity: 9999
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
            quantity: 12
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
      .poll(async () => (await getOperationalEvents(email)).map((event) => event.event_name))
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

    const operationalEvents = await getOperationalEvents(email);
    expect(operationalEvents.every((event) => event.operation_id)).toBe(true);
    expect(operationalEvents.every((event) => event.is_internal === false)).toBe(true);
    expect(
      new Set(operationalEvents.map((event) => `${event.event_name}:${event.operation_id}`)).size
    ).toBe(operationalEvents.length);
    expect(operationalEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event_name: 'sign_up',
          auth_method: 'email'
        }),
        expect.objectContaining({
          event_name: 'company_settings_saved',
          setup_type: 'first_setup'
        }),
        expect.objectContaining({
          event_name: 'label_preview_succeeded',
          label_type: 'sscc_only',
          label_size: '4x3',
          template_version: 'v3'
        }),
        expect.objectContaining({
          event_name: 'label_saved',
          label_type: 'homogeneous_unit',
          label_size: '4x6',
          template_version: 'v2'
        }),
        expect.objectContaining({
          event_name: 'pdf_response_succeeded',
          document_format: 'pdf',
          download_source: 'history'
        }),
        expect.objectContaining({
          event_name: 'pdf_response_succeeded',
          document_format: 'pdf',
          download_source: 'new_label'
        }),
        expect.objectContaining({
          event_name: 'workflow_failed',
          workflow_step: 'label_preview',
          error_category: 'validation'
        })
      ])
    );
  } finally {
    await deleteTestUser(email, { requireExisting: accountCreationConfirmed });
  }
});
