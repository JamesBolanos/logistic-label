import { expect, test } from '@playwright/test';

test('user can request a password reset without exposing account existence', async ({ page }) => {
  await page.goto('/reset-password', { waitUntil: 'networkidle' });

  await expect(page.getByRole('heading', { name: 'Reset your password' })).toBeVisible();
  await page.getByLabel('Email Address').fill(`password-reset-${Date.now()}@example.invalid`);

  const resetRequest = page.waitForResponse((response) => {
    const requestUrl = new URL(response.url());
    return (
      requestUrl.pathname === '/api/auth/request-password-reset' &&
      response.request().method() === 'POST'
    );
  });

  await page.getByRole('button', { name: 'Send reset link' }).click();

  const response = await resetRequest;
  expect(response.ok(), await response.text()).toBe(true);

  await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible();
  await expect(page.getByText(/If an account exists/)).toBeVisible();
});

test('invalid reset token shows a safe recovery message', async ({ page }) => {
  await page.goto('/reset-password?token=invalid-token', { waitUntil: 'networkidle' });

  await page.getByLabel('New Password').fill('Password123');
  await page.getByLabel('Confirm Password').fill('Password123');
  await page.getByRole('button', { name: 'Update password' }).click();

  await expect(page.getByText('This password reset link is invalid or has expired.')).toBeVisible();
});
