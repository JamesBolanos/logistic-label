import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const savedLabel = {
  id: 'saved-label',
  label_type: 'sscc_only',
  template_version: 'v3',
  print_layout: '4x6_single',
  sscc: '012345670000000015',
  ship_to: 'Test Destination',
  created_at: '2026-10-08T12:00:00Z'
};

test('saved labels download ZPL at the selected resolution and recover from failures', async ({
  page
}) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  const mutations = [];
  page.on('request', (request) => {
    if (request.method() !== 'GET') mutations.push(request.method());
  });
  await page.route('**/api/labels/list?*', (route) =>
    route.fulfill({
      json: { labels: [savedLabel], pagination: { page: 1, pages: 1 } }
    })
  );
  let failDownload = true;
  await page.route('**/api/zpl/download/saved-label?dpi=300', (route) =>
    route.fulfill(
      failDownload
        ? { status: 500, body: 'Unable to download ZPL.' }
        : {
            contentType: 'application/vnd.zebra-zpl',
            body: '^XA\n^FD(00)012345670000000015^FS\n^XZ\n'
          }
    )
  );
  await page.route('**/api/pdf/download/saved-label', (route) =>
    route.fulfill({
      contentType: 'application/pdf',
      body: '%PDF-1.4\n%%EOF'
    })
  );

  // Isolate the actual history component; the endpoint's authentication and
  // owner scoping are covered by unit tests. No database or accounts needed.
  await page.route('**/tests/fixtures/label-history.html', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><html lang="en"><body><div id="test-root"></div><script type="module" >import { mount } from "/node_modules/.vite/deps/svelte.js"; import LabelHistory from "/src/lib/components/Labels/LabelHistory.svelte"; mount(LabelHistory, { target: document.getElementById("test-root") });</script></body></html>'
    })
  );
  await page.goto('/tests/fixtures/label-history.html');
  await expect(page.getByText(savedLabel.sscc)).toBeVisible();
  await page.getByLabel('ZPL printer resolution').selectOption('300');
  await page.getByRole('button', { name: 'Download ZPL', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Your label is still saved');
  await expect(page.getByText(savedLabel.sscc)).toBeVisible();

  failDownload = false;
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download ZPL', exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('gs1_label_saved-label_300dpi.zpl');
  const path = await download.path();
  expect(await readFile(path, 'utf8')).toContain('(00)012345670000000015');
  await expect(page.getByRole('alert')).toHaveCount(0);

  const pdfPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PDF', exact: true }).click();
  expect((await pdfPromise).suggestedFilename()).toBe('label_saved-label.pdf');
  expect(mutations).toEqual([]);
  expect(pageErrors).toEqual([]);
});
