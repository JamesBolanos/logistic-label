import { expect, test } from '@playwright/test';

test('public guide explains and links all supported labels', async ({ page }) => {
  await page.goto('/guide', { waitUntil: 'networkidle' });

  await expect(
    page.getByRole('heading', { name: 'Which label fits your shipment?' })
  ).toBeVisible();
  await expect(page.getByText('DEMO — NOT VALID FOR SHIPPING')).toHaveCount(3);

  const firstLabelGuide = page.locator('#first-label');
  await expect(
    firstLabelGuide.getByRole('heading', {
      name: 'Set up your company before creating a real SSCC'
    })
  ).toBeVisible();
  await expect(firstLabelGuide.locator('ol li')).toHaveCount(5);
  await expect(firstLabelGuide).toContainText(
    'The licensed prefix is required to allocate a real SSCC'
  );
  await expect(firstLabelGuide).toContainText('The prefix contributes to the SSCC');
  await expect(
    firstLabelGuide.getByRole('link', { name: 'Create a free account' })
  ).toHaveAttribute('href', '/signup');

  await expect(page.getByText('0 0614141 123456789 0')).toHaveCount(0);
  await expect(page.getByText('(00) 006141411234567890')).toHaveCount(0);
  await expect(page.getByText('(00) 0 0123456 000000001 8')).toHaveCount(0);
  await expect(page.getByText('00012345600012')).toHaveCount(0);

  const transportGuide = page.getByRole('article').filter({
    has: page.getByRole('heading', { name: 'Track one pallet, carton, or parcel' })
  });
  const transportSample = transportGuide.locator('[data-print-layout]');
  await expect(transportSample).toHaveAttribute('data-print-layout', '4x6_single');
  await expect(transportSample).toHaveAttribute('data-label-size', '4 × 6');
  await expect(transportSample).toContainText('NON-SCANNABLE BARCODE');
  await expect(transportGuide).toContainText('(00) SSCC-18');
  await expect(transportGuide.getByRole('link', { name: 'Create this label' })).toHaveAttribute(
    'href',
    '/labels?type=sscc_only'
  );

  const identicalGuide = page.getByRole('article').filter({
    has: page.getByRole('heading', { name: 'Ship multiple identical cases or items' })
  });
  const identicalSample = identicalGuide.locator('[data-print-layout]');
  await expect(identicalSample).toHaveAttribute('data-print-layout', '4x6_single');
  await expect(identicalSample).toHaveAttribute('data-label-size', '4 × 6');
  await expect(identicalSample.getByText('NON-SCANNABLE CONTENT BARCODE')).toBeVisible();
  await expect(identicalSample.getByText('NON-SCANNABLE SSCC BARCODE')).toBeVisible();
  await expect(identicalGuide).toContainText('(02) CONTENT + (37) COUNT');
  await expect(identicalGuide).toContainText('(00) SSCC-18 at the bottom');
  await expect(identicalGuide.getByRole('link', { name: 'Create this label' })).toHaveAttribute(
    'href',
    '/labels?type=homogeneous_unit'
  );

  const basicGuide = page.getByRole('article').filter({
    has: page.getByRole('heading', { name: 'Create a basic SSCC label' })
  });
  const basicSample = basicGuide.locator('[data-print-layout]');
  await expect(basicSample).toHaveAttribute('data-print-layout', '4x3_single');
  await expect(basicSample).toHaveAttribute('data-label-size', '4 × 3');
  await expect(basicSample).toContainText('(00) [SSCC]');
  await expect(basicSample).toContainText('NON-SCANNABLE BARCODE');
  await expect(basicGuide).toContainText('(00) SSCC-18');
  await expect(basicGuide.getByRole('link', { name: 'Create this label' })).toHaveAttribute(
    'href',
    '/labels?type=sscc_basic'
  );

  await expect(
    page.getByRole('heading', { name: 'Need something beyond the free generator?' })
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Follow a retailer or customer routing guide' })
  ).toBeVisible();

  const requestForm = page.locator('#custom-request');
  await expect(requestForm.getByRole('heading', { name: 'Tell me what you need' })).toBeVisible();
  await expect(requestForm.getByRole('radio', { name: /Suggest an improvement/ })).toBeVisible();
  await expect(
    requestForm.getByRole('radio', { name: /Discuss a tailored project/ })
  ).toBeVisible();
  await expect(requestForm.getByLabel('Email address')).toHaveAttribute('required', '');
  await expect(requestForm.getByLabel(/What are you trying to do/)).toBeVisible();
  await expect(requestForm.getByRole('link', { name: 'Contact me directly' })).toHaveAttribute(
    'href',
    'mailto:jbolanosdiaz@gmail.com'
  );

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/guide#custom-request');
  const horizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth
  );
  expect(horizontalOverflow).toBe(false);

  await page.route('**/*', async (route) => {
    if (route.request().method() === 'POST') {
      await route.abort();
      return;
    }
    await route.continue();
  });
  await page.locator('input[name="requestType"][value="tailored_project"]').check();
  await page.getByLabel('Email address').fill('visitor@example.com');
  await page.getByLabel(/What are you trying to do/).fill('Need a tailored printer workflow.');
  await page.locator('#custom-request button[type="submit"]').click();
  await expect(page.getByRole('alert')).toContainText('could not confirm your request was sent');
  await expect(page.getByLabel('Email address')).toHaveValue('visitor@example.com');
  await expect(page.getByLabel(/What are you trying to do/)).toHaveValue(
    'Need a tailored printer workflow.'
  );
  await page.unroute('**/*');

  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Need a tailored project?' })).toHaveAttribute(
    'href',
    '/guide#custom-request'
  );
  await expect(
    page.getByRole('link', { name: 'Suggest or discuss a tailored project' })
  ).toHaveAttribute('href', '/guide#custom-request');
});
