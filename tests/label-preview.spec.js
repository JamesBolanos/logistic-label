import { expect, test } from '@playwright/test';

test('signed-in user can generate a label preview', async ({ page }) => {
  const email = `preview-${Date.now()}@example.com`;

  await page.goto('/signup');

  await page.getByLabel('Email Address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill('Password123');
  await page.getByLabel('Confirm Password').fill('Password123');

  await page.getByRole('button', { name: 'Create Account' }).click();

  await expect(page).toHaveURL(/\/dashboard|\/labels/, { timeout: 10000 });

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

  await page.getByRole('button', { name: 'Preview Label' }).click();

  const previewFrame = page.locator('iframe[title="Label Preview"]');

  await expect(previewFrame).toBeVisible({ timeout: 10000 });
  await expect(previewFrame).toHaveAttribute('src', /^blob:/);

  await page.getByRole('button', { name: 'Generate PDF Label' }).click();
  await expect(page.getByText('Label generated successfully and saved to history.')).toBeVisible({
    timeout: 10000
  });
  await expect(page.getByRole('cell', { name: '00012345600012' })).toBeVisible();
});
