import { expect, test } from '@playwright/test';
import { createTestUserEmail, deleteTestUser } from './helpers/cleanupTestUser.js';

test('signed-in user can generate a label preview', async ({ page }, testInfo) => {
  const testRunId = /** @type {{ testRunId?: string }} */ (testInfo.config.metadata).testRunId;
  const email = createTestUserEmail(testRunId);
  let accountCreationConfirmed = false;

  try {
    await page.goto('/signup');

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
    await expect(page.getByText("What's new is now visible")).toBeVisible();
    await page.getByRole('link', { name: 'View all updates' }).click();
    await expect(page).toHaveURL(/\/updates$/);
    await expect(page.getByRole('heading', { name: "What's new", exact: true })).toBeVisible();

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
  } finally {
    await deleteTestUser(email, { requireExisting: accountCreationConfirmed });
  }
});
