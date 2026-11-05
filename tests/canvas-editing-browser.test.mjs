import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { chromium } from 'playwright';

const require = createRequire(import.meta.url);
let browser, temporary;
before(async () => {
  temporary = await mkdtemp(join(tmpdir(), 'pensive-editing-'));
  await mkdir('test-results', { recursive: true });
  browser = await chromium.launch();
});
after(async () => { await browser?.close(); if (temporary) await rm(temporary, { recursive: true, force: true }); });

async function open(t, framework, state, touch = false) {
  const context = await browser.newContext({ offline: true, acceptDownloads: true,
    viewport: touch ? { width: 390, height: 844 } : { width: 1440, height: 1000 }, hasTouch: touch, isMobile: touch });
  const page = await context.newPage(), errors = [], network = [];
  page.setDefaultTimeout(6000);
  page.on('pageerror', e => errors.push(e.message));
  context.on('request', r => { if (/^(https?|wss?):/.test(r.url())) network.push(r.url()); });
  t.after(async () => { assert.deepEqual(errors, []); assert.deepEqual(network, []); await context.close(); });
  const core = require(`../.agents/skills/pensive/frameworks/${framework}/state.js`);
  const html = await readFile(new URL(`../.agents/skills/pensive/frameworks/${framework}/canvas.html`, import.meta.url), 'utf8');
  const file = join(temporary, `${crypto.randomUUID()}.html`);
  await writeFile(file, core.packageHtml(html, state || core.initialState()));
  await page.goto(pathToFileURL(file).href);
  return { page, core };
}
async function exported(page) {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.locator('#copy').click();
  return JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
}
async function reopen(page) {
  const download = page.waitForEvent('download');
  await page.locator('#save').click();
  const file = join(temporary, `${crypto.randomUUID()}.html`);
  await (await download).saveAs(file);
  await page.goto(pathToFileURL(file).href);
}
async function editAndFinish(input, text = 'First line') {
  await input.fill(text);
  await input.press('End');
  await input.press('Shift+Enter');
  await input.press('x');
  assert.equal(await input.inputValue(), `${text}\nx`);
  assert.equal(await input.evaluate(el => el === document.activeElement), true);
  await input.press('Enter');
  assert.equal(await input.inputValue(), `${text}\nx`);
  assert.equal(await input.evaluate(el => el === document.activeElement), false);
}
async function checkComposition(input) {
  await input.focus();
  for (const composition of [{ isComposing: true }, { keyCode: 229 }]) {
    const accepted = await input.evaluate((el, options) => el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', ...options, bubbles: true, cancelable: true })), composition);
    assert.equal(accepted, true, 'composition-confirming Enter must not finish editing');
    assert.equal(await input.evaluate(el => el === document.activeElement), true);
  }
}

for (const framework of ['swot', 'pages', 'vpc']) {
  test(`${framework}: Enter finishes bullets/framing; Shift+Enter and composition remain available after save`, async t => {
    const { page, core } = await open(t, framework);
    for (const section of core.sections || [...core.factors, ...core.strategies]) {
      if (core.strategies?.includes(section)) await page.locator('#tows-toggle').click();
      const group = page.locator(`[data-section="${section}"]`);
      await group.getByRole('button', { name: 'Add', exact: true }).click();
      const input = group.locator('textarea').first();
      const id = await input.getAttribute('data-id');
      await checkComposition(input);
      await editAndFinish(input);
      assert.equal(await group.locator('.item').count(), 1);
      const state = await exported(page);
      assert.deepEqual(core.collection(state, section), [{ id, text: 'First line\nx' }]);
    }
    for (const field of core.framing) {
      const input = page.locator(`[data-framing="${field}"]`);
      if (!await input.isVisible()) await page.locator('.framing details').evaluate(el => { el.open = true; });
      await editAndFinish(input, field);
    }
    const state = await exported(page);
    await reopen(page);
    assert.deepEqual(await exported(page), state);
    await editAndFinish(page.locator('[data-framing]').first(), 'Reopened');
    await page.locator('[data-ai="evaluate"]').click();
    const guidance = page.locator('#ai-guidance');
    await guidance.fill('First'); await guidance.press('End'); await guidance.press('Enter');
    assert.equal(await guidance.inputValue(), 'First\n');
    assert.equal(await guidance.evaluate(el => el === document.activeElement), true);
    await page.locator('#cancel-ai').click();
    if (framework !== 'swot') {
      await page.locator('#import').click();
      const json = page.locator('#import-json'); await json.fill('{'); await json.press('End'); await json.press('Enter');
      assert.equal(await json.inputValue(), '{\n');
      assert.equal(await json.evaluate(el => el === document.activeElement), true);
    }
  });

  test(`${framework}: collection drag remains uniform with persistence and pending guards`, async t => {
    const core = require(`../.agents/skills/pensive/frameworks/${framework}/state.js`);
    const state = core.initialState(), section = (core.sections || core.factors)[0];
    core.collection(state, section).push({ id: 'one', text: 'First' }, { id: 'two', text: 'Second\nMore detail' }, { id: 'three', text: 'Third' });
    if (framework === 'pages') core.resetBaseline(state);
    const { page } = await open(t, framework, state);
    const group = page.locator(`[data-section="${section}"]`);
    await group.locator('.items').evaluate(el => el.scrollIntoView({ block: 'end' }));
    await page.mouse.move(0, 0);
    assert.equal(await group.locator('.drag-handle').first().evaluate(el => getComputedStyle(el).opacity), '0');
    await group.locator('.item').first().hover();
    const handle = await group.locator('.drag-handle').first().boundingBox();
    const last = await group.locator('.item').last().boundingBox();
    const scrollBeforeDrop = await page.evaluate(() => scrollY);
    await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
    await page.mouse.down();
    await page.mouse.move(last.x + last.width / 2, last.y + last.height - 2, { steps: 8 });
    assert.equal(await group.locator('.drop-before, .drop-after').count(), 1, JSON.stringify(await group.evaluate(el => ({
      list: el.querySelector('.items').getBoundingClientRect().toJSON(),
      rows: [...el.querySelectorAll('.item')].map(row => ({ box: row.getBoundingClientRect().toJSON(), classes: row.className })),
      handle: { disabled: el.querySelector('.drag-handle').disabled, pointerEvents: getComputedStyle(el.querySelector('.drag-handle')).pointerEvents }, scroll: scrollY
    }))));
    await page.screenshot({ path: `test-results/${framework}-shared-ordering.png`, fullPage: true });
    assert.equal(await page.evaluate(() => scrollY), scrollBeforeDrop, 'a fully visible list must not autoscroll away from its drop target');
    await page.mouse.up();
    const reordered = await exported(page);
    assert.deepEqual(core.collection(reordered, section).map(x => x.id), ['two', 'three', 'one']);
    if (framework === 'pages') { assert.deepEqual(reordered.ripple_baseline, state.ripple_baseline); assert.deepEqual(core.changes(reordered), []); }
    await reopen(page); assert.deepEqual(await exported(page), reordered);
    const candidate = structuredClone(reordered.content);
    core.collection({ content: candidate }, section)[0].text = 'Proposed';
    const proposed = core.composeResult(core.buildRequest(reordered, { id: 'improve' }), { content: candidate, thought: 'Clarify.' });
    const pending = await open(t, framework, proposed);
    assert.equal(await pending.page.locator(`[data-section="${section}"] .drag-handle`).first().isDisabled(), true);
  });
}

for (const framework of ['pages', 'vpc']) test(`${framework}: touch reveals a handle and supports cancelled and valid drops`, async t => {
  const core = require(`../.agents/skills/pensive/frameworks/${framework}/state.js`);
  const initial = core.initialState(), section = core.sections[0];
  core.collection(initial, section).push({ id: 'a', text: 'First' }, { id: 'b', text: 'Second' }, { id: 'c', text: 'Third' });
  if (framework === 'pages') core.resetBaseline(initial);
  const { page } = await open(t, framework, initial, true);
  const group = page.locator(`[data-section="${section}"]`);
  const client = await page.context().newCDPSession(page);
  async function drag(cancel) {
    await group.locator('.items').scrollIntoViewIfNeeded();
    await group.locator('textarea').first().tap();
    assert.equal(await group.locator('.drag-handle').first().evaluate(el => getComputedStyle(el).opacity), '1');
    assert.equal(await group.locator('.drag-handle').nth(1).evaluate(el => getComputedStyle(el).opacity), '0');
    const handle = await group.locator('.drag-handle').first().boundingBox();
    const last = await group.locator('.item').last().boundingBox();
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: handle.x + handle.width / 2, y: handle.y + handle.height / 2 }] });
    await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: last.x + last.width / 2, y: last.y + last.height - 2 }] });
    await client.send('Input.dispatchTouchEvent', { type: cancel ? 'touchCancel' : 'touchEnd', touchPoints: [] });
  }
  await drag(true);
  assert.deepEqual(await exported(page), initial);
  await drag(false);
  const reordered = await exported(page);
  assert.deepEqual(core.collection(reordered, section).map(x => x.id), ['b', 'c', 'a']);
  if (framework === 'pages') assert.deepEqual(reordered.ripple_baseline, initial.ripple_baseline);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.screenshot({ path: `test-results/${framework}-shared-ordering-touch.png`, fullPage: true });
});

test('5 Whys: Enter finishes framing, node text and countermeasure without disrupting multiline or composition', async t => {
  const { page, core } = await open(t, 'five_whys');
  await page.locator('#framing-tab').click();
  for (const field of core.framing) await editAndFinish(page.locator(`[data-framing="${field}"]`), field);
  await page.locator('#investigation-tab').click();
  await page.locator('[data-tree-node-id="root"]').getByRole('button', { name: /^Edit / }).click();
  const input = page.getByLabel('Node text', { exact: true });
  await input.fill('Issue');
  await checkComposition(input);
  await input.press('End'); await input.press('Shift+Enter'); await input.press('x'); await input.press('Enter');
  assert.equal(await page.getByLabel('Node text', { exact: true }).count(), 0);
  assert.equal((await exported(page)).content.tree.text, 'Issue\nx');
  await page.getByRole('button', { name: 'Add cause', exact: true }).click();
  await page.getByLabel('Direct cause', { exact: true }).fill('Hypothesis: conditions');
  await page.getByLabel('Direct cause', { exact: true }).press('Enter');
  await page.getByRole('button', { name: 'Close branch', exact: true }).click();
  const countermeasure = page.getByLabel('Countermeasure', { exact: true });
  await countermeasure.fill('Check conditions'); await checkComposition(countermeasure);
  await countermeasure.press('End'); await countermeasure.press('Shift+Enter'); await countermeasure.press('x'); await countermeasure.press('Enter');
  assert.equal(await page.getByLabel('Countermeasure', { exact: true }).count(), 0);
  const state = await exported(page);
  assert.equal(state.content.tree.children[0].output, 'Check conditions\nx');
  await reopen(page); assert.deepEqual(await exported(page), state);
});
