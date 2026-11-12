import { expect, test } from '@playwright/test';
import { createTestUserEmail, deleteTestUser } from './helpers/cleanupTestUser.js';

test('tailored generator scenario opens a prefilled request form for signed-in users', async ({
  page
}, testInfo) => {
  test.setTimeout(60_000);

  const testRunId = /** @type {{ testRunId?: string }} */ (testInfo.config.metadata).testRunId;
  const email = createTestUserEmail(testRunId);
  const name = email.split('@')[0];
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

    const guideResponse = await page.goto('/guide?requestType=tailored_project#custom-request');
    expect(guideResponse.headers()['cache-control']).toContain('private');
    expect(guideResponse.headers()['cache-control']).toContain('no-store');
    await expect(page.locator('#request-name')).toHaveValue(name);
    await expect(page.locator('#request-email')).toHaveValue(email);
    await expect(page.locator('#request-company')).toHaveValue('');

    await page.goto('/settings');
    await page.getByLabel('Company Name').fill('Tailored Request Test Company');
    await page.getByLabel('GS1 Company Prefix').fill('1234567');
    await page.getByLabel('Extension Digit').fill('0');
    await page.getByLabel('Next Serial Reference').fill('1');
    await page.getByRole('button', { name: 'Save Settings' }).click();
    await expect(page.getByText('Label settings saved.')).toBeVisible({ timeout: 15000 });

    await page.goto('/labels');
    const availableScenarios = page.getByRole('button', { name: / — Available$/ });
    await expect(availableScenarios).toHaveCount(3);
    for (const scenario of await availableScenarios.all()) {
      await expect(scenario).toBeEnabled();
    }

    const tailoredScenario = page.getByRole('link', {
      name: 'Follow a retailer or customer routing guide — Discuss a tailored project'
    });
    await expect(tailoredScenario).toBeVisible();
    await expect(tailoredScenario).toHaveAttribute(
      'href',
      '/guide?requestType=tailored_project#custom-request'
    );
    await tailoredScenario.click();

    await expect(page).toHaveURL(/\/guide\?requestType=tailored_project#custom-request$/);
    expect(page.url()).not.toContain(email);
    expect(page.url()).not.toContain(name);
    expect(page.url()).not.toContain('Tailored Request Test Company');
    await expect(page.getByRole('radio', { name: /Discuss a tailored project/ })).toBeChecked();
    await expect(page.locator('#request-name')).toHaveValue(name);
    await expect(page.locator('#request-email')).toHaveValue(email);
    await expect(page.locator('#request-company')).toHaveValue('Tailored Request Test Company');

    await page.locator('#request-name').fill('Edited Request Name');
    await page.locator('#request-email').fill('edited@example.com');
    await page.locator('#request-company').fill('Edited Request Company');
    await expect(page.locator('#request-name')).toHaveValue('Edited Request Name');
    await expect(page.locator('#request-email')).toHaveValue('edited@example.com');
    await expect(page.locator('#request-company')).toHaveValue('Edited Request Company');
  } finally {
    if (accountCreationConfirmed) {
      await deleteTestUser(email);
    }
  }
});
