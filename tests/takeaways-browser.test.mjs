import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const require = createRequire(import.meta.url);
for (const framework of ['swot', 'pages', 'vpc', 'five_whys']) {
  test(`${framework} edits, saves and reviews Takeaways offline`, async t => {
    const browser = await chromium.launch({ executablePath: process.env.PENSIVE_BROWSER });
    t.after(() => browser.close());
    const page = await browser.newPage({ offline: true, acceptDownloads: true });
    page.setDefaultTimeout(2500);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const path = `../.agents/skills/pensive/frameworks/${framework}/`;
    await page.goto(new URL(path + 'canvas.html', import.meta.url).href);
    const editor = page.getByRole('textbox', { name: 'Takeaways', exact: true });
    assert.equal(await editor.inputValue(), '');
    const manual = 'A provisional conclusion.\nCheck the evidence.';
    await editor.fill(manual);
    if (framework === 'five_whys') await page.locator('#framing-tab').click();
    await page.locator('[data-framing]').first().fill('Revised framing');
    assert.equal(await editor.inputValue(), manual);

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('#save').click(),
    ]);
    const temp = await mkdtemp(join(tmpdir(), 'pensive-takeaways-'));
    t.after(() => rm(temp, { recursive: true, force: true }));
    const saved = join(temp, 'canvas.html');
    await download.saveAs(saved);
    await page.goto(pathToFileURL(saved).href);
    assert.equal(await editor.inputValue(), manual);
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: async () => { throw new Error('Clipboard denied'); } },
      });
    });
    await page.getByRole('button', { name: 'Formulate Takeaways', exact: true }).click();
    const include = page.getByRole('checkbox', { name: 'Include user-authored Thoughts' });
    assert.equal(await include.isChecked(), false);
    await include.check();
    await page.getByRole('button', { name: 'Copy Takeaways request' }).click();
    await page.waitForSelector('#clipboard-fallback:not([hidden])');
    const copied = JSON.parse(await page.locator('#clipboard-json').inputValue());
    assert.equal(copied.action.include_annotations, true);
    assert.equal(copied.canvas.takeaways, manual);

    const core = require(path + 'state.js');
    const proposal = core.composeResult(copied, { takeaways: 'Proposed wording', rationale: 'More precise.' });
    async function importState(state) {
      await page.locator('#import').click();
      await page.locator('#import-json').fill(JSON.stringify(state));
      page.once('dialog', dialog => dialog.accept());
      await page.locator('#import-form [type=submit]').click();
    }
    await importState(proposal);
    assert.equal(await page.getByText('Proposed wording', { exact: true }).isVisible(), true);
    await editor.fill('A local revision');
    await page.getByRole('button', { name: 'Accept Takeaways', exact: true }).click();
    assert.match(await page.locator('#takeaways-error').textContent(), /stale/i);
    await page.getByRole('button', { name: 'Reject Takeaways', exact: true }).click();
    assert.equal(await editor.inputValue(), 'A local revision');
    await importState(proposal);
    await page.getByRole('button', { name: 'Accept Takeaways', exact: true }).click();
    assert.equal(await editor.inputValue(), 'Proposed wording');
    await editor.fill('');
    await page.locator('#copy').click();
    await page.waitForSelector('#clipboard-fallback:not([hidden])');
    assert.equal(JSON.parse(await page.locator('#clipboard-json').inputValue()).takeaways, '');
    await importState(core.initialState());
    assert.equal(await editor.inputValue(), '');
    assert.deepEqual(errors, []);
  });
}
