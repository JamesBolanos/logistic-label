import { expect, test } from '@playwright/test';

test('public guide explains and links both supported labels', async ({ page }) => {
  await page.goto('/guide', { waitUntil: 'networkidle' });

  await expect(
    page.getByRole('heading', { name: 'Which label fits your shipment?' })
  ).toBeVisible();
  await expect(page.getByText('Simplified layout preview—not to scale')).toHaveCount(2);

  const transportGuide = page.getByRole('article').filter({
    has: page.getByRole('heading', { name: 'Track one pallet, carton, or parcel' })
  });
  await expect(transportGuide).toContainText('(00) SSCC-18');
  await expect(transportGuide.getByRole('link', { name: 'Create this label' })).toHaveAttribute(
    'href',
    '/labels?type=sscc_only'
  );

  const identicalGuide = page.getByRole('article').filter({
    has: page.getByRole('heading', { name: 'Ship multiple identical cases or items' })
  });
  await expect(identicalGuide).toContainText('(02) CONTENT + (37) COUNT');
  await expect(identicalGuide).toContainText('(00) SSCC-18 at the bottom');
  await expect(identicalGuide.getByRole('link', { name: 'Create this label' })).toHaveAttribute(
    'href',
    '/labels?type=homogeneous_unit'
  );

  await expect(
    page.getByRole('heading', { name: 'Requirements outside the free generator' })
  ).toBeVisible();
});
