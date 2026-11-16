import {test, before, after} from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdtemp, readFile, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';

const require = createRequire(import.meta.url);
let browser, temp;
before(async () => { temp = await mkdtemp(join(tmpdir(), 'pensive-clipboard-')); browser = await chromium.launch(); });
after(async () => { await browser?.close(); if (temp) await rm(temp, {recursive:true, force:true}); });

for (const id of ['swot', 'pages', 'vpc', 'vars', 'five_whys', 'five_forces', 'issue_tree']) {
  test(`${id}: AI copying detects denial/missing API, selects exact request, and recovers on success`, async t => {
    const core = require(`../.agents/skills/pensive/frameworks/${id}/state.js`);
    const state = core.initialState();
    if (typeof state.content.framing === 'string') state.content.framing = 'Investigate service delays';
    else for (const field of Object.keys(state.content.framing)) state.content.framing[field] = `Context for ${field}`;
    if (id === 'five_whys') state.content.tree.text = 'Observed service delays';
    if (id === 'issue_tree') state.content.tree.title = 'Why are service delays increasing?';
    const html = await readFile(new URL(`../.agents/skills/pensive/frameworks/${id}/canvas.html`, import.meta.url), 'utf8');
    const path = join(temp, `${id}.html`);
    await writeFile(path, core.packageHtml(html, state));
    const context = await browser.newContext({offline:true, viewport:{width:390,height:750}});
    t.after(() => context.close());
    const page = await context.newPage(); page.setDefaultTimeout(3000);
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      window.copyMode = 'denied'; window.copied = null;
      const clipboard = {writeText: async text => {
        if (window.copyMode === 'denied') throw new DOMException('Denied', 'NotAllowedError');
        window.copied = text;
      }};
      Object.defineProperty(navigator, 'clipboard', {get: () => window.copyMode === 'missing' ? undefined : clipboard});
    });
    await page.goto(pathToFileURL(path).href);
    for (const mode of ['denied', 'missing', 'success']) {
      await page.evaluate(value => { window.copyMode = value; }, mode);
      await page.locator('[data-ai="evaluate"]').click();
      await page.locator('#ai-guidance').fill('Preserve this exact steering');
      await page.locator('#ai-form button[type=submit]').click();
      let request;
      if (mode === 'success') {
        await page.waitForFunction(() => window.copied !== null);
        assert.equal(await page.locator('#clipboard-fallback').isVisible(), false);
        request = JSON.parse(await page.evaluate(() => window.copied));
        assert.match(await page.locator('#status').textContent(), /Copied/);
      } else {
        await page.locator('#clipboard-json').waitFor({state:'visible'});
        assert.match(await page.locator('#clipboard-fallback').textContent(), /⌘C.*Ctrl\+C/);
        const selected = await page.locator('#clipboard-json').evaluate(node => ({
          value:node.value, start:node.selectionStart, end:node.selectionEnd,
          focused:document.activeElement === node,
          visible:node.getBoundingClientRect().top >= 0 && node.getBoundingClientRect().bottom <= innerHeight,
        }));
        assert.equal(selected.focused, true); assert.equal(selected.visible, true);
        assert.equal(selected.start, 0); assert.equal(selected.end, selected.value.length);
        assert.doesNotMatch(await page.locator('#status').textContent(), /^Copied/);
        request = JSON.parse(selected.value);
      }
      assert.equal(request.action.id, 'evaluate');
      assert.match(request.action.comment, /Preserve this exact steering/);
      assert.deepEqual(request.canvas, state);
    }
    // Shared action families also use the same guarded copy path.
    await page.evaluate(() => { window.copyMode = 'denied'; });
    for (const [trigger, dialog, action] of [
      ['#thinking-tools', '#thinking-tools-dialog', 'six_hats'],
      ['#takeaways-formulate', '#takeaways-dialog', 'formulate_takeaways'],
      ['#research', '#research-dialog', 'research'],
    ]) {
      if (!await page.locator(trigger).count()) continue;
      await page.locator(trigger).click();
      await page.locator(`${dialog} button[type=submit]`).click();
      await page.waitForFunction(expected => {
        try { return JSON.parse(document.querySelector('#clipboard-json').value).action.id === expected; }
        catch { return false; }
      }, action);
      const request = JSON.parse(await page.locator('#clipboard-json').inputValue());
      assert.equal(request.action.id, action); assert.deepEqual(request.canvas, state);
      assert.equal(await page.locator('#clipboard-json').evaluate(n => document.activeElement === n && n.selectionEnd === n.value.length), true);
    }
    await page.locator('#copy').click();
    await page.waitForFunction(() => !JSON.parse(document.querySelector('#clipboard-json').value).action);
    assert.deepEqual(JSON.parse(await page.locator('#clipboard-json').inputValue()), state);
    assert.deepEqual(errors, []);
  });
}
