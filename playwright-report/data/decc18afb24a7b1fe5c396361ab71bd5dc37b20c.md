# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: label-preview.spec.js >> signed-in user can generate a label preview
- Location: tests/label-preview.spec.js:3:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('iframe[title="Label Preview"]')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('iframe[title="Label Preview"]')

```

```yaml
- navigation:
  - link "GS1 Label Generator":
    - /url: /
  - link "Home":
    - /url: /
  - link "Dashboard":
    - /url: /dashboard
  - link "Labels":
    - /url: /labels
  - link "Settings":
    - /url: /settings
  - text: preview-1780022144330
  - button "Logout"
- main:
  - heading "Generate Logistic Labels" [level=1]
  - heading "Create GS1-128 Logistic Label" [level=2]
  - text: GTIN (14 digits)
  - textbox "GTIN (14 digits)":
    - /placeholder: "00123456789012"
  - paragraph: Enter the 14-digit Global Trade Item Number
  - text: Lot Number
  - textbox "Lot Number":
    - /placeholder: LOT123ABC
  - paragraph: Enter the batch or lot number (alphanumeric, max 20 chars)
  - text: Production Date
  - textbox "Production Date": 2026-05-29
  - text: Quantity
  - spinbutton "Quantity"
  - paragraph: Enter the number of items in the logistic unit
  - text: Weight (lbs)
  - spinbutton "Weight (lbs)"
  - paragraph: Enter the weight in pounds (max 9,999.9)
  - button "Reset"
  - button "Preview Label"
  - heading "Label Preview" [level=3]
  - img
  - paragraph: Fill out the form to see a preview of your GS1-128 label
  - heading "Label History" [level=2]
  - heading "Label History" [level=3]
  - textbox "Search by GTIN, lot number, or SSCC..."
  - button "Search"
  - paragraph: No labels found. Create a new label to see it here.
- contentinfo:
  - link "Home":
    - /url: /
  - link "GS1 Website":
    - /url: https://gs1.org
  - link "Privacy Policy":
    - /url: /privacy
  - paragraph: © 2026 GS1-128 Logistic Label Generator. All rights reserved.
  - paragraph: This application complies with GS1 standards for barcode generation. GS1 is a registered trademark.
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test';
  2  | 
  3  | test('signed-in user can generate a label preview', async ({ page }) => {
  4  |   const email = `preview-${Date.now()}@example.com`;
  5  | 
  6  |   await page.goto('/signup');
  7  | 
  8  |   await page.getByLabel('Email Address').fill(email);
  9  |   await page.getByLabel('Password', { exact: true }).fill('Password123');
  10 |   await page.getByLabel('Confirm Password').fill('Password123');
  11 | 
  12 |   await page.getByRole('button', { name: 'Create Account' }).click();
  13 | 
  14 |   await expect(page).toHaveURL(/\/dashboard|\/labels/, { timeout: 10000 });
  15 | 
  16 |   await page.goto('/settings');
  17 |   await page.getByLabel('Company Name').fill('Preview Test Company');
  18 |   await page.getByLabel('GS1 Company Prefix').fill('1234567');
  19 |   await page.getByLabel('Extension Digit').fill('0');
  20 |   await page.getByLabel('Next Serial Reference').fill('1');
  21 |   await page.getByRole('button', { name: 'Save Settings' }).click();
  22 |   await expect(page.getByText('Label settings saved.')).toBeVisible({ timeout: 15000 });
  23 | 
  24 |   await page.goto('/labels');
  25 | 
  26 |   await page.getByLabel('GTIN (14 digits)').fill('00012345600012');
  27 |   await page.getByLabel('Lot Number').fill('LOT123ABC');
  28 |   await page.getByLabel('Production Date').fill('2026-05-24');
  29 |   await page.getByLabel('Quantity').fill('12');
  30 |   await page.getByLabel('Weight (lbs)').fill('10.5');
  31 | 
  32 |   await page.getByRole('button', { name: 'Preview Label' }).click();
  33 | 
  34 |   const previewFrame = page.locator('iframe[title="Label Preview"]');
  35 | 
> 36 |   await expect(previewFrame).toBeVisible({ timeout: 10000 });
     |                              ^ Error: expect(locator).toBeVisible() failed
  37 |   await expect(previewFrame).toHaveAttribute('src', /^blob:/);
  38 | 
  39 |   await page.getByRole('button', { name: 'Generate PDF Label' }).click();
  40 |   await expect(page.getByText('Label generated successfully and saved to history.')).toBeVisible({
  41 |     timeout: 10000
  42 |   });
  43 |   await expect(page.getByRole('cell', { name: '00012345600012' })).toBeVisible();
  44 | });
  45 | 
```