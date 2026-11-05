import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { chromium } from 'playwright';

const require = createRequire(import.meta.url);
let browser, temp;
before(async () => {
  temp = await mkdtemp(join(tmpdir(), 'pensive-six-hats-'));
  browser = await chromium.launch({ ...(process.env.PENSIVE_BROWSER ? { executablePath: process.env.PENSIVE_BROWSER } : {}) });
});
after(async () => {
  await browser?.close();
  if (temp) await rm(temp, { recursive: true, force: true });
});

for (const framework of ['swot', 'pages', 'vpc', 'five_whys']) {
  test(`${framework} shares the picker and preserves reflections through JSON and HTML`, async t => {
    const root = new URL(`../.agents/skills/pensive/frameworks/${framework}/`, import.meta.url);
    const core = require(fileURLToPath(new URL('state.js', root)));
    const canvas = core.initialState();
    const label = 'Manual review delays dispatch';
    const type = { swot: 'factor', pages: 'item', vpc: 'item', five_whys: 'node' }[framework];
    const section = { swot: 'weaknesses', pages: 'actions', vpc: 'pains' }[framework];
    const id = section ? 'review' : canvas.content.tree.id;
    if (section) canvas.content[section].push({ id, text: label });
    else canvas.content.tree.text = label;

    const template = await readFile(new URL('canvas.html', root), 'utf8');
    const initial = join(temp, `${framework}.html`);
    await writeFile(initial, core.packageHtml(template, canvas));
    const context = await browser.newContext({ offline: true, acceptDownloads: true });
    t.after(() => context.close());
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const page = await context.newPage();
    page.setDefaultTimeout(8000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(pathToFileURL(initial).href);
    await page.getByRole('button', { name: 'Thinking tools', exact: true }).click();
    const picker = page.getByRole('dialog', { name: 'Six Thinking Hats' });
    assert.equal(await picker.locator('select[name="hat"] option').count(), 6);
    await picker.getByLabel('Thinking hat').selectOption('white');
    await picker.getByLabel('Target').selectOption('1');
    await picker.getByRole('button', { name: 'Copy AI request' }).click();
    await page.waitForFunction(() => document.querySelector('#status').textContent.includes('Copied Six Hats request'));
    const request = JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
    assert.deepEqual(request.canvas, canvas);
    assert.deepEqual(request.action.target, { type, id });
    assert.equal(request.action.use_thoughts, false);

    const result = core.composeResult(request, { observations: ['No delay frequency is recorded.'] });
    await page.getByRole('button', { name: 'Import JSON', exact: true }).click();
    await page.locator('#import-json').fill(JSON.stringify(result));
    page.once('dialog', dialog => dialog.accept());
    await page.locator('#import-form button[type="submit"]').click();
    assert.match(await page.locator('#thoughts').innerText(), /White Hat.*Manual review delays dispatch/s);
    assert.match(await page.locator('#thoughts').innerText(), /Observations/);
    assert.doesNotMatch(await page.locator('#thoughts').innerText(), /Suggestions/);
    await page.locator('#copy').click();
    await page.waitForFunction(async () => (await navigator.clipboard.readText()).includes('No delay frequency is recorded.'));
    assert.deepEqual(JSON.parse(await page.evaluate(() => navigator.clipboard.readText())), result);

    const pending = page.waitForEvent('download');
    await page.locator('#save').click();
    const saved = join(temp, `${framework}-saved.html`);
    await (await pending).saveAs(saved);
    await page.goto(pathToFileURL(saved).href);
    assert.match(await page.locator('#thoughts').innerText(), /No delay frequency is recorded/);
    assert.deepEqual(errors, []);
  });
}
