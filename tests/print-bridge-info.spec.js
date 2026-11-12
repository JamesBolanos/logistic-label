import { expect, test } from '@playwright/test';

test('public Print Bridge page explains the optional local printing workflow', async ({ page }) => {
  await page.goto('/print-bridge');

  await expect(
    page.getByRole('heading', { name: 'Print labels directly to your network printer' })
  ).toBeVisible();
  await expect(
    page.getByText('You can continue to download PDF and ZPL files without installing it.')
  ).toBeVisible();
  await expect(page.locator('ol').getByRole('listitem')).toHaveCount(3);

  await expect(page.getByRole('link', { name: 'View Print Bridge on GitHub' })).toHaveAttribute(
    'href',
    'https://github.com/JamesBolanos/print-bridge'
  );
  await expect(page.getByRole('link', { name: 'View downloads' })).toHaveAttribute(
    'href',
    'https://github.com/JamesBolanos/print-bridge/releases/latest'
  );
  await expect(page.getByRole('link', { name: 'Print Bridge setup guide' })).toHaveAttribute(
    'href',
    'https://github.com/JamesBolanos/print-bridge/blob/main/DOCS/sscc-labels-setup.md'
  );
  await expect(page.locator('footer').getByRole('link', { name: 'Print Bridge' })).toHaveAttribute(
    'href',
    '/print-bridge'
  );

  await page.setViewportSize({ width: 390, height: 844 });
  const horizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth
  );
  expect(horizontalOverflow).toBe(false);
});
