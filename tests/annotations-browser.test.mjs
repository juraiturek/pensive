import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { test } from 'node:test';
import { chromium } from 'playwright';

const require = createRequire(import.meta.url);

for (const framework of ['pages', 'five_whys']) {
  test(`${framework} supports contextual notes in a standalone canvas`, async t => {
    const browser = await chromium.launch({ executablePath: process.env.PENSIVE_BROWSER });
    t.after(() => browser.close());
    const touch = framework === 'five_whys';
    const context = await browser.newContext({
      offline: true, acceptDownloads: true, hasTouch: touch,
      viewport: touch ? { width: 390, height: 844 } : { width: 1280, height: 900 }
    });
    const page = await context.newPage();
    page.setDefaultTimeout(5000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    t.after(() => assert.deepEqual(errors, []));
    await page.goto(new URL(`../.agents/skills/pensive/frameworks/${framework}/canvas.html`, import.meta.url).href);
    const mode = page.getByRole('button', { name: 'Annotation Mode', exact: true });
    await mode.click({ timeout: 2000 });
    const exit = page.getByRole('button', { name: 'Exit annotation mode' });
    const general = page.getByRole('button', { name: 'Add general thought' });
    assert.equal(await mode.isVisible(), false);
    assert.equal((await exit.boundingBox())?.height, (await general.boundingBox())?.height);
    const target = framework === 'pages'
      ? page.locator('[data-section="parts"]')
      : page.locator('[data-tree-node-id="root"]');
    const framing = page.locator('[data-framing]').first();
    assert.equal(await framing.evaluate(input => input.readOnly), true);
    if (framework === 'pages') assert.equal(await target.getByRole('button', { name: 'Add', exact: true, includeHidden: true }).isDisabled(), true);
    else {
      assert.equal(await target.getByRole('button', { name: 'Edit Problem', exact: false, includeHidden: true }).count(), 0);
      assert.equal(await page.getByRole('button', { name: 'View full tree' }).isEnabled(), true);
    }
    const panel = page.getByRole('dialog', { name: 'Annotations' });
    for (const note of ['Check the premise.', 'Find supporting evidence.']) {
      await page.getByRole('button', { name: 'Add general thought' }).click();
      await panel.getByRole('textbox', { name: 'Annotation text' }).fill(note);
      await panel.getByRole('button', { name: 'Save note' }).click();
      await panel.getByRole('button', { name: 'Close notes' }).click();
    }
    await page.getByRole('button', { name: 'Show thoughts (2) for Whole canvas', exact: true }).click();
    await panel.getByRole('button', { name: 'Edit note' }).first().click();
    await panel.getByRole('textbox', { name: 'Annotation text' }).fill('Check the revised premise.');
    await panel.getByRole('button', { name: 'Save note' }).click();
    await panel.getByRole('button', { name: 'Close notes' }).click();
    await exit.click();
    assert.equal(await framing.evaluate(input => input.readOnly), false);
    const badge = page.getByRole('button', { name: '2 general thoughts, 0 specific thoughts' });
    assert.equal(await badge.textContent(), '2 | 0');
    await badge.focus();
    await badge.press('Enter');
    assert.equal(await panel.getByText('Check the revised premise.').isVisible(), true);
    assert.equal(await panel.getByRole('button', { name: 'Edit note' }).count(), 0);
    await panel.getByRole('button', { name: 'Close notes' }).click();
    assert.equal(await badge.evaluate(node => node === document.activeElement), true);

    const core = require(`../.agents/skills/pensive/frameworks/${framework}/state.js`);
    const state = core.initialState();
    const isPages = framework === 'pages';
    const id = isPages ? core.addItem(state, 'parts') : (() => {
      core.editText(state, 'root', 'The problem');
      return core.addChild(state, 'root', 'A cause');
    })();
    if (isPages) core.editItem(state, 'parts', id, 'A part');
    const importState = async state => {
      await page.getByRole('button', { name: 'Import JSON', exact: true }).click();
      await page.getByRole('textbox', { name: 'Import canvas JSON' }).fill(JSON.stringify(state));
      page.once('dialog', dialog => dialog.accept());
      await page.getByRole('button', { name: 'Replace canvas', exact: true }).click();
    };
    await importState(state);
    await mode.click();
    if (isPages) {
      const dimension = target.locator('.band-heading').getByRole('button', { name: 'Add thought for Parts' });
      await dimension.click();
      assert.equal(await panel.getByRole('heading', { name: 'Parts', exact: true }).isVisible(), true);
      await panel.getByRole('textbox', { name: 'Annotation text' }).fill('Dimension thought.');
      await panel.getByRole('button', { name: 'Save note' }).click();
      await page.keyboard.press('Escape');
      assert.equal(await dimension.evaluate(node => node === document.activeElement), true);
    }
    const targetBadge = page.locator(`[data-annotation-target="${id}"]`).getByRole('button', { name: /^Add thought for/ });
    if (touch) await targetBadge.tap();
    else await targetBadge.click();
    await panel.getByRole('textbox', { name: 'Annotation text' }).fill('Attached note.');
    await panel.getByRole('button', { name: 'Save note' }).click();
    await panel.getByRole('button', { name: 'Close notes' }).click();
    await exit.click();
    const specific = isPages ? 2 : 1;
    const summary = page.getByRole('button', { name: `0 general thoughts, ${specific} specific thoughts` });
    assert.equal(await summary.textContent(), `0 | ${specific}`);
    await summary.click();
    assert.equal(await panel.getByText('Attached note.').isVisible(), true);
    await panel.getByRole('button', { name: 'Close notes' }).click();
    const badgeName = isPages ? '1 note for A part' : '1 note for A cause';
    assert.equal(await page.getByRole('button', { name: badgeName }).isVisible(), true);

    if (isPages) {
      await page.locator(`textarea[data-id="${id}"]`).fill('Renamed part');
      assert.equal(await page.getByRole('button', { name: '1 note for Renamed part' }).isVisible(), true);
      await target.getByRole('button', { name: 'Delete parts 1' }).click();
    } else {
      page.once('dialog', async dialog => {
        assert.match(dialog.message(), /1 attached note/);
        await dialog.accept();
      });
      await page.locator(`[data-tree-node-id="${id}"]`).getByRole('button', { name: 'Delete subtree' }).click();
    }
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.getByRole('button', { name: 'Export to clipboard' }).click();
    await page.waitForFunction(() => document.querySelector('#status').textContent.includes('Copied'));
    const exported = JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
    assert.deepEqual(exported.annotations.map(note => note.target), isPages
      ? [{ type: 'section', id: 'parts' }, { type: 'item', id }]
      : [{ type: 'node', id }]);
    await importState(exported);

    const missing = page.getByRole('button', { name: 'Unavailable targets (1)', exact: true });
    await missing.click();
    assert.equal(await panel.getByText('Attached note.').isVisible(), true);
    await panel.getByRole('button', { name: 'Close notes' }).click();

    const dir = await mkdtemp(join(tmpdir(), 'pensive-annotations-'));
    t.after(() => rm(dir, { recursive: true, force: true }));
    const downloaded = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Save to File' }).click();
    const path = join(dir, 'saved.html');
    await (await downloaded).saveAs(path);
    await page.goto(pathToFileURL(path).href);
    await missing.click();
    await panel.getByRole('button', { name: 'Manage unavailable notes' }).click();
    page.once('dialog', dialog => dialog.accept());
    await panel.getByRole('button', { name: 'Delete note' }).click();
    assert.equal(await panel.getByText('Attached note.').count(), 0);
    assert.equal(await missing.isVisible(), false);
  });
}
