import { expect, test } from '@playwright/test';

test('Google sign-in failures show safe retry guidance', async ({ page }) => {
  let socialSignInRequest;

  await page.route('**/*', async (route) => {
    if (new URL(route.request().url()).pathname === '/api/auth/sign-in/social') {
      socialSignInRequest = route.request().postDataJSON();
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'private start failure' })
      });
      return;
    }

    await route.continue();
  });

  await page.goto(
    '/login?returnUrl=%2Flabels&error=access_denied&error_description=private-provider-details',
    { waitUntil: 'networkidle' }
  );

  await expect(
    page.getByText('Google sign-in was cancelled. You can try again when you are ready.')
  ).toBeVisible();
  await expect(page.getByText('private-provider-details')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();

  await page.getByRole('button', { name: 'Continue with Google' }).click();
  await expect
    .poll(() => socialSignInRequest)
    .toMatchObject({
      provider: 'google',
      callbackURL: '/labels?authMethod=google',
      errorCallbackURL: '/login?returnUrl=%2Flabels'
    });
  await expect(
    page.getByText('Unable to start Google sign-in. Please try again or use email and password.')
  ).toBeVisible();
  await expect(page.getByText('private start failure')).toHaveCount(0);

  await page.goto('/signup?error=unknown_provider_failure&error_description=do-not-display', {
    waitUntil: 'networkidle'
  });

  await expect(
    page.getByText(
      'Google sign-in could not be completed. Please try again or use email and password.'
    )
  ).toBeVisible();
  await expect(page.getByText('do-not-display')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
});
