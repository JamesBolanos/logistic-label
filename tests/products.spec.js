import { expect, test } from '@playwright/test';
import { createTestUserEmail, deleteTestUser } from './helpers/cleanupTestUser.js';

// Covers the PRODUCT-001 acceptance path: save a product in Settings, edit and
// delete products safely, then create a label whose GTIN comes from the
// saved product picker without retyping the identifier.
test('saved products fill the label GTIN for repeat creation', async ({ page }, testInfo) => {
  test.setTimeout(120_000);

  const testRunId = /** @type {{ testRunId?: string }} */ (testInfo.config.metadata).testRunId;
  const email = createTestUserEmail(testRunId);
  let accountCreationConfirmed = false;

  // Rows keep a stable data-product-id attribute so a locator stays valid
  // while the row switches between display and edit modes.
  const captureProductCreation = () =>
    page.waitForResponse((response) => {
      const requestUrl = new URL(response.url());
      return requestUrl.pathname === '/api/products' && response.request().method() === 'POST';
    });

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

    await page.goto('/settings');
    await page.getByLabel('Company Name').fill('Product Test Company');
    await page.getByLabel('GS1 Company Prefix').fill('1234567');
    await page.getByLabel('Extension Digit').fill('0');
    await page.getByLabel('Next Serial Reference').fill('1');
    await page.getByRole('button', { name: 'Save Settings' }).click();
    await expect(page.getByText('Label settings saved.')).toBeVisible({ timeout: 15000 });

    await page.goto('/products');
    const savedProducts = page.getByRole('region', { name: 'Saved products' });
    await expect(savedProducts).toBeVisible();
    await expect(
      savedProducts.getByText('No saved products yet. Add your first one below.')
    ).toBeVisible();

    // A saved GTIN-13 is stored in its padded 14-digit form.
    await savedProducts.getByLabel('Product Name').fill('Blue case');
    await savedProducts.getByLabel('Internal Reference').fill('REF-1');
    await savedProducts.getByLabel('GTIN', { exact: true }).fill('4006381333931');
    const blueCreation = captureProductCreation();
    await savedProducts.getByRole('button', { name: 'Save product' }).click();
    const blueProduct = (await (await blueCreation).json()).product;
    const blueRow = savedProducts.locator(`li[data-product-id="${blueProduct.id}"]`);

    await expect(blueRow).toBeVisible({ timeout: 10000 });
    await expect(blueRow).toContainText('GTIN 04006381333931');
    await expect(blueRow).toContainText('Reference REF-1');

    // Editing keeps the product list working without touching label history.
    await blueRow.getByRole('button', { name: 'Edit' }).click();
    await blueRow.getByLabel('Product Name').fill('Blue case XL');
    await blueRow.getByRole('button', { name: 'Save changes' }).click();
    await expect(blueRow).toContainText('Blue case XL');
    await expect(blueRow).toContainText('Reference REF-1');

    // An uncorrected number keeps its warning but can still be saved; the
    // stored product is flagged as not a valid GS1 GTIN.
    await savedProducts.getByLabel('Product Name').fill('Red case');
    await savedProducts.getByLabel('GTIN', { exact: true }).fill('4006381333930');
    await expect(
      savedProducts.getByText('This number does not pass the GS1 check digit')
    ).toBeVisible();
    const redCreation = captureProductCreation();
    await savedProducts.getByRole('button', { name: 'Save product' }).click();
    const redProduct = (await (await redCreation).json()).product;
    expect(redProduct.gs1_valid).toBe(false);
    const redRow = savedProducts.locator(`li[data-product-id="${redProduct.id}"]`);

    await expect(redRow).toBeVisible({ timeout: 10000 });
    await expect(redRow).toContainText('GTIN 04006381333930');
    await expect(redRow).toContainText('Not a valid GS1 GTIN');
    // A second click confirms so an accidental click cannot remove data.
    await redRow.getByRole('button', { name: 'Delete', exact: true }).click();
    await redRow.getByRole('button', { name: 'Confirm delete' }).click();
    await expect(redRow).toHaveCount(0);
    await expect(blueRow).toBeVisible();

    // The label form picker fills the GTIN from the saved product.
    await page.goto('/labels?type=homogeneous_unit');
    await expect(page.getByRole('group', { name: 'Transport information' })).toBeVisible({
      timeout: 10000
    });
    const productPicker = page.getByLabel('Use a saved product');
    const savedOption = productPicker.locator('option').filter({ hasText: 'Blue case XL' });
    await productPicker.selectOption(await savedOption.getAttribute('value'));
    await expect(page.getByLabel('Contained trade item GTIN')).toHaveValue('04006381333931');

    await page.getByLabel('Ship From').fill('Product Test Company\n10 Origin Road');
    await page.getByLabel('Ship To').fill('Customer DC\n20 Destination Road');
    await page.getByLabel('What does this GTIN identify?').selectOption('case');
    await page.getByLabel('Number of trade items identified by this GTIN').fill('12');

    await page.getByRole('button', { name: 'Review label' }).click();
    await expect(page.locator('iframe[title="Label Preview"]')).toBeVisible({
      timeout: 10000
    });

    await page.getByRole('button', { name: 'Generate and save label' }).click();
    await expect(
      page.getByText(/Label generated successfully and saved to history/)
    ).toBeVisible({
      timeout: 10000
    });

    // The saved label appears on the Saved Labels page.
    await page.goto('/labels/history');
    const historyRow = page
      .getByRole('table')
      .getByRole('row')
      .filter({ hasText: 'GTIN 04006381333931' });
    await expect(historyRow).toBeVisible();

    // Deleting the product never changes saved labels.
    await page.goto('/products');
    const settingsProducts = page.getByRole('region', { name: 'Saved products' });
    const blueRowAfterReload = settingsProducts.locator(`li[data-product-id="${blueProduct.id}"]`);
    await blueRowAfterReload.getByRole('button', { name: 'Delete', exact: true }).click();
    await blueRowAfterReload.getByRole('button', { name: 'Confirm delete' }).click();
    await expect(
      settingsProducts.getByText('No saved products yet. Add your first one below.')
    ).toBeVisible();

    // The label survives the product deletion.
    await page.goto('/labels/history');
    await expect(
      page
        .getByRole('table')
        .getByRole('row')
        .filter({ hasText: 'GTIN 04006381333931' })
    ).toBeVisible();
  } finally {
    if (accountCreationConfirmed) {
      await deleteTestUser(email);
    }
  }
});
