import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const settings = {
  company_name: 'Synthetic company',
  gs1_company_prefix: '1234567',
  extension_digit: '0',
  next_serial_reference: 42,
  print_bridge_host: '127.0.0.1',
  print_bridge_port: 18080,
  printer_hostname: 'printer.test',
  printer_port: 9200,
  printer_dpi: 300
};
const label = {
  id: 'saved-label',
  label_type: 'sscc_only',
  template_version: 'v3',
  print_layout: '4x6_single',
  sscc: '012345670000000015',
  ship_to: 'Synthetic destination',
  created_at: '2026-10-15T12:00:00Z'
};
const zpl = '^XA\n^FD(00)012345670000000015^FS\n^XZ\n';

async function mountFixture(page, component) {
  const template = await readFile('src/app.html', 'utf8');
  const csp = template.match(/<meta http-equiv="Content-Security-Policy"[^>]+>/)?.[0];
  expect(csp).toBeTruthy();
  await page.route('**/tests/fixtures/print-bridge.html', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: `<!doctype html><html lang="en"><head>${csp}</head><body><div id="test-root"></div><script type="module">import { mount } from "/node_modules/.vite/deps/svelte.js"; import Component from "${component}"; mount(Component, { target: document.getElementById("test-root") });</script></body></html>`
    })
  );
  await page.goto('/tests/fixtures/print-bridge.html');
}

test('printer settings save independently and test the bridge under the app CSP', async ({
  page
}) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const writes = [];
  await page.route('**/api/settings', async (route) => {
    if (route.request().method() === 'PATCH') writes.push(route.request().postDataJSON());
    await route.fulfill({ json: { settings } });
  });
  let pings = 0;
  await page.route('http://127.0.0.1:18080/ping', (route) => {
    pings++;
    return route.fulfill({
      json: { message: 'pong' },
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  });
  await mountFixture(page, '/src/lib/components/Labels/PrintBridgeSettings.svelte');
  await expect(page.getByLabel('Printer IP address or hostname')).toHaveValue('printer.test');
  await page.getByLabel('Printer TCP port').fill('9300');
  await page.getByLabel('Printer resolution', { exact: true }).selectOption('600');
  await page.getByRole('button', { name: 'Save printer settings' }).click();
  await expect(page.getByRole('status')).toHaveText('Printer settings saved.');
  expect(writes).toEqual([
    {
      print_bridge_host: '127.0.0.1',
      print_bridge_port: 18080,
      printer_hostname: 'printer.test',
      printer_port: 9300,
      printer_dpi: 600
    }
  ]);
  await page.getByRole('button', { name: 'Test bridge connection' }).click();
  await expect(page.getByRole('status')).toContainText('Bridge is reachable');
  expect(pings).toBe(1);
  expect(errors).toEqual([]);
});

test('saved label printing preserves ZPL, guards concurrent clicks, and distinguishes uncertain and virtual results', async ({
  page
}) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/api/settings', (route) => route.fulfill({ json: { settings } }));
  await page.route('**/api/labels/list?*', (route) =>
    route.fulfill({ json: { labels: [label], pagination: { page: 1, pages: 1 } } })
  );
  await page.route('**/api/zpl/download/saved-label?dpi=300', (route) =>
    route.fulfill({ contentType: 'application/vnd.zebra-zpl', body: zpl })
  );
  let release;
  const held = new Promise((resolve) => {
    release = resolve;
  });
  const jobs = [];
  let outcome = 'physical';
  await page.route('http://127.0.0.1:18080/print', async (route) => {
    jobs.push(route.request().postDataJSON());
    if (jobs.length === 1) await held;
    if (outcome === 'unknown') return route.abort('failed');
    return route.fulfill({
      json:
        outcome === 'virtual'
          ? { message: 'OK', destination: 'virtual', jobId: 'synthetic' }
          : { message: 'OK' },
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  });
  await mountFixture(page, '/src/lib/components/Labels/LabelHistory.svelte');
  await page.getByRole('button', { name: 'Print via bridge' }).click();
  await expect(page.getByRole('button', { name: 'Sending...' })).toBeDisabled();
  await expect.poll(() => jobs.length).toBe(1);
  release();
  await expect(page.getByRole('status')).toContainText('Sent to the printer');
  expect(jobs).toEqual([{ printerHostname: 'printer.test', printerPort: 9200, text: zpl }]);
  outcome = 'unknown';
  await page.getByRole('button', { name: 'Print via bridge' }).click();
  await expect(page.getByRole('alert')).toContainText('Check the printer before trying again');
  expect(jobs).toHaveLength(2);
  outcome = 'virtual';
  await page.getByRole('button', { name: 'Print via bridge' }).click();
  await expect(page.getByRole('status')).toContainText('No physical label was printed');
  expect(jobs).toHaveLength(3);
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(errors).toEqual([]);
});
