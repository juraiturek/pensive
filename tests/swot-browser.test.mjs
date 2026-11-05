import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { chromium } from 'playwright';

const require = createRequire(import.meta.url);
const root = new URL('../.agents/skills/pensive/frameworks/swot/', import.meta.url);
let browser, temp;
before(async () => {
  temp = await mkdtemp(join(tmpdir(), 'pensive-browser-'));
  browser = await chromium.launch({ ...(process.env.PENSIVE_BROWSER ? { executablePath: process.env.PENSIVE_BROWSER } : {}) });
});
after(async () => { await browser?.close(); if (temp) await rm(temp, { recursive: true, force: true }); });

async function openCanvas(t, state, viewport = { width: 1440, height: 1000 }, options = {}) {
  const context = await browser.newContext({ offline: true, viewport, acceptDownloads: true, ...options });
  const errors = [], network = [];
  context.on('request', request => { if (/^(https?|wss?):/.test(request.url())) network.push(request.url()); });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  t.after(async () => {
    assert.deepEqual(errors, [], 'browser errors');
    assert.deepEqual(network, [], 'unexpected network requests');
    await context.close();
  });
  let url = new URL('canvas.html', root).href;
  if (state) {
    const core = require(fileURLToPath(new URL('state.js', root)));
    const html = core.packageHtml(await readFile(new URL('canvas.html', root), 'utf8'), state);
    const path = join(temp, `${crypto.randomUUID()}.html`);
    await writeFile(path, html);
    url = pathToFileURL(path).href;
  }
  await page.goto(url);
  await page.waitForSelector('#swot-view:not([hidden])');
  return page;
}
async function add(page, section, text) {
  const group = page.locator(`[data-section="${section}"]`);
  await group.getByRole('button', { name: 'Add', exact: true }).click();
  const input = group.locator('textarea').last();
  await input.fill(text);
  return input.getAttribute('data-id');
}
async function copiedState(page) {
  // Grant only the test browser permission; the product still requires its copy button.
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByRole('button', { name: 'Export to clipboard', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('#status').textContent.includes('Copied'));
  return JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
}
async function save(page, name) {
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save to File', exact: true }).click();
  const download = await pending;
  assert.equal(await download.failure(), null);
  const path = join(temp, name);
  await download.saveAs(path);
  return path;
}

test('offline initial load shows only SWOT and can add, edit, delete factors with stable IDs', async t => {
  const page = await openCanvas(t);
  assert.equal(await page.locator('#tows-view').isVisible(), false);
  await mkdir('test-results', { recursive: true });
  await page.screenshot({ path: 'test-results/swot-desktop.png', fullPage: true, animations: 'disabled' });
  assert.equal(await page.getByRole('button', { name: 'Load from file' }).count(), 0);
  for (const section of ['strengths', 'weaknesses', 'opportunities', 'threats']) {
    const id = await add(page, section, section);
    const group = page.locator(`[data-section="${section}"]`);
    await group.locator('textarea').fill(`${section} edited`);
    const state = await copiedState(page);
    assert.deepEqual(state.content[section], [{ id, text: `${section} edited` }]);
    await group.getByRole('button', { name: /Delete/ }).click();
    assert.deepEqual((await copiedState(page)).content[section], []);
  }
});

test('TOWS context is read-only, all strategies are editable, toggles preserve state and indicator', async t => {
  const page = await openCanvas(t);
  await page.getByLabel('Focal entity').fill('A small studio');
  await page.getByLabel('Strategic objective').fill('Reach new customers');
  for (const section of ['strengths', 'weaknesses', 'opportunities', 'threats']) await add(page, section, `${section} context`);
  assert.equal(await page.locator('#tows-count').textContent(), '0');
  await page.getByRole('button', { name: /TOWS/ }).click();
  const context = page.locator('#tows-view [data-context]');
  assert.equal(await context.locator('textarea, input, button, [contenteditable="true"]').count(), 0);
  for (const section of ['strengths', 'weaknesses', 'opportunities', 'threats']) {
    assert.ok((await page.locator(`[data-context="${section}"]`).textContent()).includes(`${section} context`));
  }
  const strategyIds = {};
  for (const section of ['so', 'st', 'wo', 'wt']) {
    strategyIds[section] = await add(page, section, `${section} strategy`);
    await page.locator(`[data-section="${section}"] textarea`).fill(`${section} edited`);
  }
  const before = await copiedState(page);
  for (const section of ['so', 'st', 'wo', 'wt']) {
    assert.deepEqual(before.content.strategies[section], [{ id: strategyIds[section], text: `${section} edited` }]);
  }
  await mkdir('test-results', { recursive: true });
  await page.screenshot({ path: 'test-results/tows-desktop.png', fullPage: true, animations: 'disabled' });
  for (let i = 0; i < 3; i++) {
    await page.getByRole('button', { name: 'SWOT', exact: true }).click();
    assert.equal(await page.locator('#tows-count').textContent(), '4');
    await page.getByRole('button', { name: /TOWS/ }).click();
  }
  assert.deepEqual(await copiedState(page), before);
  await page.locator('[data-section="wt"]').getByRole('button', { name: /Delete/ }).click();
  assert.equal(await page.locator('#tows-count').textContent(), '3');
});

test('clipboard JSON and two generations of saved HTML round-trip with the same implementation', async t => {
  const page = await openCanvas(t);
  await add(page, 'strengths', 'Long-term relationships');
  await page.getByRole('button', { name: /TOWS/ }).click();
  await add(page, 'so', 'Partner with a distributor');
  const state = await copiedState(page);
  const implementation = await page.locator('script[data-implementation], style').allTextContents();
  const path = await save(page, 'first.html');
  await page.goto(pathToFileURL(path).href);
  assert.equal(await page.locator('#swot-view').isVisible(), true);
  assert.equal(await page.locator('#tows-view').isVisible(), false);
  assert.deepEqual(await copiedState(page), state);
  assert.deepEqual(await page.locator('script[data-implementation], style').allTextContents(), implementation);
  await page.locator('[data-section="strengths"] textarea').fill('Updated after reopening');
  const updated = await copiedState(page);
  assert.equal(updated.content.strengths[0].id, state.content.strengths[0].id);
  const second = await save(page, 'second.html');
  await page.goto(pathToFileURL(second).href);
  assert.deepEqual(await copiedState(page), updated);
  assert.deepEqual(await page.locator('script[data-implementation], style').allTextContents(), implementation);
});

test('adversarial text is inert in framing, factors, strategies and saved HTML', async t => {
  const core = require(fileURLToPath(new URL('state.js', root)));
  const state = core.initialState();
  const attack = '</script><script>globalThis.attacked=true</script><img src="https://invalid.example/x" onerror="globalThis.attacked=true"><!-- & " 🧠\u2028\u2029';
  state.content.framing.focal_entity = attack;
  state.content.strengths.push({ id: 's1', text: attack });
  state.content.strategies.so.push({ id: 'so1', text: attack });
  const page = await openCanvas(t, state);
  assert.equal(await page.getByLabel('Focal entity').inputValue(), attack);
  assert.equal(await page.locator('[data-section="strengths"] textarea').inputValue(), attack);
  await page.getByRole('button', { name: /TOWS/ }).click();
  assert.ok((await page.locator('[data-context="strengths"]').textContent()).includes(attack));
  assert.equal(await page.locator('[data-section="so"] textarea').inputValue(), attack);
  const output = await save(page, 'adversarial.html');
  await page.goto(pathToFileURL(output).href);
  assert.equal(await page.evaluate(() => globalThis.attacked), undefined);
  assert.equal(await page.locator('img').count(), 0);
  assert.deepEqual(await copiedState(page), state);
});

test('invalid embedded state fails visibly and cannot be exported as a valid canvas', async t => {
  const html = await readFile(new URL('canvas.html', root), 'utf8');
  const path = join(temp, 'invalid.html');
  await writeFile(path, html.replace(/(<script id="canvas-state" type="application\/json">)[\s\S]*?(<\/script>)/, '$1{"framework":"vpc"}$2'));
  const page = await openCanvas(t);
  await page.goto(pathToFileURL(path).href);
  assert.ok((await page.locator('#status').textContent()).includes('Invalid canvas'));
  assert.equal(await page.getByRole('button', { name: 'Save to File', exact: true }).isDisabled(), true);
  assert.equal(await page.getByRole('button', { name: 'Export to clipboard', exact: true }).isDisabled(), true);
});

test('clipboard denial offers selectable JSON without claiming successful copy', async t => {
  const page = await openCanvas(t);
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: async () => { throw new Error('Denied'); } } });
  });
  await add(page, 'strengths', 'Still exportable');
  await page.getByRole('button', { name: 'Export to clipboard', exact: true }).click();
  await page.waitForSelector('#clipboard-fallback:not([hidden])');
  const exported = JSON.parse(await page.getByLabel('Canvas JSON', { exact: true }).inputValue());
  assert.equal(exported.content.strengths[0].text, 'Still exportable');
  assert.ok(!(await page.locator('#status').textContent()).includes('Copied'));
});

test('mobile view has no horizontal overflow and visible keyboard focus', async t => {
  const page = await openCanvas(t, undefined, { width: 390, height: 844 });
  for (const mode of ['SWOT', 'TOWS']) {
    await page.getByRole('button', { name: new RegExp(`^${mode}`) }).click();
    await page.getByRole('button', { name: /Export to clipboard/ }).focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.notEqual(await page.getByRole('button', { name: /Export to clipboard/ }).evaluate(el => getComputedStyle(el).outlineStyle), 'none');
  }
  await mkdir('test-results', { recursive: true });
  await page.screenshot({ path: 'test-results/swot-mobile.png', fullPage: true, animations: 'disabled' });
});

test('empty SWOT quadrants create exactly one focused draft on click or double-click', async t => {
  const page = await openCanvas(t);
  for (const section of ['strengths', 'weaknesses', 'opportunities', 'threats']) {
    const group = page.locator(`[data-section="${section}"]`);
    assert.equal(await group.getByText('What belongs here?', { exact: true }).count(), 0);
    for (const gesture of ['click', 'dblclick']) {
      await group[gesture]({ position: { x: 100, y: gesture === 'dblclick' ? 170 : 110 } });
      assert.equal(await group.locator('textarea').count(), 1);
      assert.equal(await group.locator('textarea').evaluate(el => el === document.activeElement), true);
      await group.locator('textarea').fill(`${section} ${gesture}`);
      const exported = await copiedState(page);
      assert.equal(exported.content[section].length, 1);
      assert.equal(exported.content[section][0].text, `${section} ${gesture}`);
      await group.getByRole('button', { name: /Delete/ }).click();
    }
    // The original Add control still creates one item, without a bubbling duplicate.
    await group.getByRole('button', { name: 'Add', exact: true }).click();
    assert.equal(await group.locator('textarea').count(), 1);
    await group.click({ position: { x: 100, y: 110 } });
    assert.equal(await group.locator('textarea').count(), 1);
  }
});

test('blank space below existing SWOT factors adds the next focused bullet', async t => {
  const page = await openCanvas(t);
  for (const section of ['strengths', 'weaknesses', 'opportunities', 'threats']) {
    const group = page.locator(`[data-section="${section}"]`);
    const firstId = await add(page, section, 'First factor');
    for (const gesture of ['click', 'dblclick']) {
      const box = await group.boundingBox();
      const last = await group.locator('li.item').last().boundingBox();
      await group[gesture]({ position: { x: 100, y: last.y + last.height - box.y + 12 } });
      const expected = gesture === 'click' ? 2 : 3;
      assert.equal(await group.locator('textarea').count(), expected);
      const input = group.locator('textarea').last();
      assert.equal(await input.evaluate(el => el === document.activeElement), true);
      await input.fill(`Next factor ${expected}`);
      assert.equal((await copiedState(page)).content[section][0].id, firstId);
    }
    await group.locator('textarea').first().click();
    assert.equal(await group.locator('textarea').count(), 3);
  }
});

test('all three AI dialogs export complete current state with steering and action options offline', async t => {
  const page = await openCanvas(t);
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await add(page, 'strengths', 'Current manual edit');
  for (const id of ['strategize', 'evaluate', 'improve']) {
    const title = { strategize: 'Strategize', evaluate: 'Evaluate', improve: 'Improve' }[id];
    await page.getByRole('button', { name: title, exact: true }).click();
    await page.getByLabel('Steering guidance').fill(`Prioritize practical ${id}`);
    if (id === 'evaluate') await page.locator('#ai-form').getByLabel('Evaluate', { exact: true }).selectOption('tows');
    if (id === 'strategize') await page.getByLabel('Strategy mode').selectOption('replace');
    await page.getByLabel('Use existing thoughts as guidance').uncheck();
    if (id === 'improve') await page.screenshot({ path: 'test-results/ai-dialog-desktop.png', fullPage: true, animations: 'disabled' });
    await page.getByRole('button', { name: 'Copy AI request', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('#status').textContent.includes('Copied AI request'));
    const request = JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
    assert.deepEqual(Object.keys(request), ['canvas', 'action']);
    assert.equal(request.canvas.content.strengths[0].text, 'Current manual edit');
    assert.equal(request.action.id, id);
    assert.equal(request.action.comment, `Prioritize practical ${id}`);
    assert.equal(request.action.use_thoughts, false);
    if (id === 'evaluate') assert.equal(request.action.scope, 'tows');
    if (id === 'strategize') assert.equal(request.action.mode, 'replace');
    assert.equal(await page.locator('#ai-dialog').isVisible(), false);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Evaluate', exact: true }).click();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.screenshot({ path: 'test-results/ai-dialog-mobile.png', fullPage: true, animations: 'disabled' });
});

test('evaluation thought appears above the matrix and survives HTML save without changing factors', async t => {
  const core = require(fileURLToPath(new URL('state.js', root)));
  const initial = core.initialState(); initial.content.strengths.push({ id: 's1', text: 'Expert staff' });
  const state = core.composeResult(core.buildRequest(initial, { id: 'evaluate', scope: 'both', comment: '', use_thoughts: true }), { thought: '</script><img src=x onerror=alert(1)> Check evidence for the external risk.' });
  const page = await openCanvas(t, state);
  assert.ok((await page.locator('#thoughts').textContent()).includes('Check evidence'));
  assert.equal(await page.locator('img').count(), 0);
  const thoughtsBox = await page.locator('#thoughts').boundingBox();
  const matrixBox = await page.locator('#swot-view').boundingBox();
  assert.ok(thoughtsBox.y < matrixBox.y);
  assert.deepEqual((await copiedState(page)).content, initial.content);
  const path = await save(page, 'thought.html'); await page.goto(pathToFileURL(path).href);
  assert.deepEqual((await copiedState(page)).thoughts, state.thoughts);
});

test('whole-canvas proposals can be reviewed, accepted or rejected and remain safe after local edits', async t => {
  const core = require(fileURLToPath(new URL('state.js', root)));
  const initial = core.initialState(); initial.content.strengths.push({ id: 's1', text: 'Original' });
  const content = structuredClone(initial.content); content.strengths[0].text = 'Improved';
  const proposed = core.composeResult(core.buildRequest(initial, { id: 'improve', comment: '', use_thoughts: true }), { content, thought: 'Improved specificity while preserving the factor identity.' });
  const page = await openCanvas(t, proposed);
  assert.equal(await page.locator('[data-section="strengths"] textarea').inputValue(), 'Original');
  assert.equal(await page.getByRole('button', { name: 'Improve', exact: true }).isDisabled(), true);
  await page.getByText('Review proposed changes', { exact: true }).click();
  assert.ok((await page.locator('#proposal-panel').textContent()).includes('Improved'));
  await page.screenshot({ path: 'test-results/ai-proposal-desktop.png', fullPage: true, animations: 'disabled' });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.screenshot({ path: 'test-results/ai-proposal-mobile.png', fullPage: true, animations: 'disabled' });
  await page.setViewportSize({ width: 1440, height: 1000 });
  const saved = await save(page, 'proposal.html');
  await page.getByRole('button', { name: 'Accept All', exact: true }).click();
  assert.equal(await page.locator('[data-section="strengths"] textarea').inputValue(), 'Improved');
  assert.ok((await page.locator('#thoughts').textContent()).includes('Improved specificity'));
  assert.equal((await copiedState(page)).content.strengths[0].id, 's1');
  await page.goto(pathToFileURL(saved).href);
  await page.locator('[data-section="strengths"] textarea').fill('Later user edit');
  await page.getByRole('button', { name: 'Accept All', exact: true }).click();
  assert.ok((await page.locator('#proposal-panel [role="alert"]').textContent()).includes('changed'));
  assert.equal(await page.locator('[data-section="strengths"] textarea').inputValue(), 'Later user edit');
  await page.getByRole('button', { name: 'Reject All', exact: true }).click();
  assert.equal(await page.locator('#proposal-panel').isVisible(), false);
  assert.equal(await page.locator('[data-section="strengths"] textarea').inputValue(), 'Later user edit');
  assert.equal((await copiedState(page)).thoughts?.length || 0, 0);
});

test('AI dialog cancellation and denied clipboard leave canvas unchanged and expose the complete request', async t => {
  const page = await openCanvas(t);
  await add(page, 'strengths', 'Keep this factor');
  const before = await copiedState(page);
  await page.getByRole('button', { name: 'Improve', exact: true }).click();
  await page.getByLabel('Steering guidance').fill('Canceled guidance');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  assert.deepEqual(await copiedState(page), before);
  await page.getByRole('button', { name: 'Evaluate', exact: true }).click();
  assert.equal(await page.getByLabel('Steering guidance').inputValue(), '');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#ai-dialog').isVisible(), false);
  await page.evaluate(() => { Object.defineProperty(navigator, 'clipboard', { value: { writeText: async () => { throw new Error('Denied'); } } }); });
  await page.getByRole('button', { name: 'Strategize', exact: true }).click();
  await page.getByLabel('Steering guidance').fill('Preserve our constraints');
  await page.getByRole('button', { name: 'Copy AI request', exact: true }).click();
  await page.waitForSelector('#clipboard-fallback:not([hidden])');
  const request = JSON.parse(await page.getByLabel('AI request JSON').inputValue());
  assert.deepEqual(request.canvas, before);
  assert.equal(request.action.comment, 'Preserve our constraints');
  assert.equal(request.action.mode, 'extend');
});

test('compact thoughts show latest accepted thought and preserve earlier thoughts through save', async t => {
  const core = require(fileURLToPath(new URL('state.js', root)));
  const initial = core.initialState();
  initial.thoughts = ['First review', 'Second review', 'Latest review'].map((text, i) => ({ id: `thought-${i}`, kind: 'evaluation', text }));
  const content = structuredClone(initial.content); content.strengths.push({ id: 'pending', text: 'Proposed strength' });
  const state = core.composeResult(core.buildRequest(initial, { id: 'improve' }), { content, thought: 'Pending rationale remains separate.' });
  const page = await openCanvas(t, state);
  assert.equal(await page.getByText('Latest review', { exact: true }).isVisible(), true);
  assert.equal(await page.getByText('First review', { exact: true }).isVisible(), false);
  assert.equal(await page.getByText('Pending rationale remains separate.', { exact: true }).isVisible(), true);
  await page.getByText('Earlier thoughts (2)', { exact: true }).click();
  assert.equal(await page.getByText('First review', { exact: true }).isVisible(), true);
  assert.deepEqual((await copiedState(page)).thoughts, initial.thoughts);
  await page.goto(pathToFileURL(await save(page, 'compact-thoughts.html')).href);
  assert.equal(await page.getByText('First review', { exact: true }).isVisible(), false);
  assert.equal(await page.getByText('Latest review', { exact: true }).isVisible(), true);
  assert.deepEqual(await copiedState(page), state);
  await page.screenshot({ path: 'test-results/swot-compact-thoughts.png', fullPage: true });
});

test('state export and action request explain distinct handoffs including clipboard fallback', async t => {
  const page = await openCanvas(t);
  assert.match(await page.locator('#copy').getAttribute('title'), /discussion/i);
  await page.getByRole('button', { name: 'Strategize', exact: true }).click();
  assert.match(await page.locator('#ai-dialog .dialog-note').textContent(), /complete canvas.*action/i);
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { value: { writeText: async () => { throw Error('Denied'); } } }));
  await page.getByRole('button', { name: 'Copy AI request', exact: true }).click();
  assert.equal(await page.getByLabel('AI request JSON').isVisible(), true);
  assert.match(await page.locator('#clipboard-fallback p').textContent(), /action/i);
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await page.locator('#copy').click();
  assert.equal(await page.getByLabel('Canvas JSON', { exact: true }).isVisible(), true);
  assert.match(await page.locator('#clipboard-fallback p').textContent(), /discussion/i);
});

async function dragRow(page, section, from, to, { cancel = false } = {}) {
  const group = page.locator(`[data-section="${section}"]`);
  const row = group.locator('.item').nth(from);
  await row.hover();
  const handle = row.locator('.drag-handle');
  const start = await handle.boundingBox();
  const target = await group.locator('.item').nth(to).boundingBox();
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await page.mouse.down();
  await page.mouse.move(target.x + target.width / 2, target.y + (to > from ? target.height - 2 : 2), { steps: 8 });
  assert.equal(await group.locator('.drop-before, .drop-after').count(), 1);
  if (section === 'strengths' && from === 0 && to === 2 && !cancel) await page.screenshot({ path: 'test-results/swot-reorder-drag.png', fullPage: true });
  if (cancel) await page.keyboard.press('Escape');
  await page.mouse.up();
}

test('drag handles stay at bullet markers; mouse reorder persists factors and strategies without text shifts', async t => {
  const page = await openCanvas(t);
  for (const section of ['strengths', 'so']) {
    if (section === 'so') await page.getByRole('button', { name: /TOWS/ }).click();
    const ids = [];
    for (const text of ['First', 'Second', 'Third']) ids.push(await add(page, section, text));
    const group = page.locator(`[data-section="${section}"]`);
    await page.mouse.move(0, 0);
    const input = group.locator('textarea').first();
    const before = await input.boundingBox();
    assert.equal(await group.locator('.drag-handle').first().evaluate(el => getComputedStyle(el).opacity), '0');
    await group.locator('.item').first().hover();
    await page.waitForFunction(section => getComputedStyle(document.querySelector(`[data-section="${section}"] .drag-handle`)).opacity === '1', section);
    assert.equal((await input.boundingBox()).x, before.x);
    assert.equal((await input.boundingBox()).width, before.width);
    if (section === 'strengths') await page.screenshot({ path: 'test-results/swot-reorder-hover.png', fullPage: true });
    await dragRow(page, section, 0, 2);
    let state = await copiedState(page);
    assert.deepEqual(coreCollection(state, section).map(x => x.id), [ids[1], ids[2], ids[0]]);
    await dragRow(page, section, 2, 0);
    state = await copiedState(page);
    assert.deepEqual(coreCollection(state, section).map(x => x.id), ids);
    await dragRow(page, section, 0, 2, { cancel: true });
    assert.deepEqual(await copiedState(page), state);
  }
  await dragRow(page, 'so', 0, 2);
  const state = await copiedState(page);
  await page.goto(pathToFileURL(await save(page, 'reordered.html')).href);
  assert.deepEqual(await copiedState(page), state);
});

function coreCollection(state, section) {
  return state.content[section] || state.content.strategies[section];
}

test('drag outside collection cancels and pending collection handles explain the restriction', async t => {
  const core = require(fileURLToPath(new URL('state.js', root)));
  const initial = core.initialState(); initial.content.strengths = [{ id: 'a', text: 'One' }, { id: 'b', text: 'Two' }];
  const page = await openCanvas(t, initial);
  const handle = page.locator('[data-section="strengths"] .drag-handle').first();
  await page.locator('[data-section="strengths"] .item').first().hover();
  const point = await handle.boundingBox();
  await page.mouse.move(point.x + point.width / 2, point.y + point.height / 2);
  await page.mouse.down();
  await page.mouse.move(10, 10, { steps: 5 });
  await page.mouse.up();
  assert.deepEqual(await copiedState(page), initial);
  const content = structuredClone(initial.content); content.strengths[0].text = 'Proposed';
  const proposed = core.composeResult(core.buildRequest(initial, { id: 'improve' }), { content, thought: 'Clarify.' });
  const pendingPage = await openCanvas(t, proposed, { width: 390, height: 844 }, { hasTouch: true, isMobile: true });
  const disabled = pendingPage.locator('[data-section="strengths"] .drag-handle').first();
  assert.equal(await disabled.isDisabled(), true);
  assert.match(await disabled.getAttribute('title'), /review/i);
  await pendingPage.locator('[data-section="strengths"] textarea').first().tap();
  assert.match(await pendingPage.locator('#status').textContent(), /pending review.*reorder/i);
  await pendingPage.getByRole('button', { name: 'Reject All', exact: true }).click();
  assert.equal(await pendingPage.locator('[data-section="strengths"] .drag-handle').first().isEnabled(), true);
});

test('touch tap reveals only the selected handle; touch drag reorders and cancellation preserves state', async t => {
  const page = await openCanvas(t, undefined, { width: 390, height: 844 }, { hasTouch: true, isMobile: true });
  for (const text of ['One', 'Two', 'Three']) await add(page, 'strengths', text);
  await page.locator('#focal-entity').tap();
  const group = page.locator('[data-section="strengths"]');
  const handle = group.locator('.drag-handle').first();
  assert.equal(await handle.evaluate(el => getComputedStyle(el).opacity), '0');
  await group.locator('textarea').first().tap();
  assert.equal(await handle.evaluate(el => getComputedStyle(el).opacity), '1');
  assert.equal(await group.locator('.drag-handle').nth(1).evaluate(el => getComputedStyle(el).opacity), '0');
  const before = await copiedState(page);
  // CDP produces browser touch input and pointer cancellation rather than synthetic DOM events.
  const client = await page.context().newCDPSession(page);
  async function touchDrag(cancel) {
    await group.locator('textarea').first().tap();
    const start = await group.locator('.drag-handle').first().boundingBox();
    const target = await group.locator('.item').last().boundingBox();
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: start.x + start.width / 2, y: start.y + start.height / 2 }] });
    await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: target.x + target.width / 2, y: target.y + target.height - 2 }] });
    await client.send('Input.dispatchTouchEvent', { type: cancel ? 'touchCancel' : 'touchEnd', touchPoints: [] });
  }
  await touchDrag(true);
  assert.deepEqual(await copiedState(page), before);
  await touchDrag(false);
  const reordered = await copiedState(page);
  assert.deepEqual(reordered.content.strengths.map(x => x.text), ['Two', 'Three', 'One']);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.screenshot({ path: 'test-results/swot-reorder-touch.png', fullPage: true });
});

test('long-list drag scrolls the page and cancel leaves all bullets intact', async t => {
  const core = require(fileURLToPath(new URL('state.js', root)));
  const initial = core.initialState();
  initial.content.strengths = Array.from({ length: 30 }, (_, i) => ({ id: `long-${i}`, text: `Factor ${i + 1}${i % 3 ? '' : '\nAdditional context\nA third line'}` }));
  const page = await openCanvas(t, initial);
  const first = page.locator('[data-section="strengths"] .item').first();
  await first.hover();
  const handle = await first.locator('.drag-handle').boundingBox();
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
  await page.mouse.down();
  const beforeScroll = await page.evaluate(() => scrollY);
  await page.mouse.move(handle.x + handle.width / 2, 980, { steps: 10 });
  await page.waitForFunction(y => scrollY > y + 100, beforeScroll);
  await page.keyboard.press('Escape');
  await page.mouse.up();
  assert.deepEqual(await copiedState(page), initial);
});

test('proposal review distinguishes new and updated SWOT bullets without tagging unchanged/current bullets',async t=>{
  const p=require(fileURLToPath(new URL('state.js',root))),s=p.initialState();
  s.content.strengths=[{id:'s1',text:'Keep this strength'},{id:'s2',text:'General expertise'}];
  const content=structuredClone(s.content);content.strengths[1].text='Expertise in accessible product design';
  content.strengths.push({id:'s3',text:'An additional capability'});
  const proposed=p.composeResult(p.buildRequest(s,{id:'improve'}),{content,thought:'Specified expertise and added a capability.'});
  const page=await openCanvas(t,proposed);await page.getByText('Review proposed changes',{exact:true}).click();
  const diff=page.locator('.proposal-diff');assert.equal(await diff.locator('.proposal-tag').count(),2);
  assert.equal(await diff.locator('li').filter({hasText:'Keep this strength'}).locator('.proposal-tag').count(),0);
  assert.equal(await diff.locator('li').filter({hasText:'Expertise in accessible'}).locator('.proposal-tag').textContent(),'Updated');
  assert.equal(await diff.locator('li').filter({hasText:'An additional capability'}).locator('.proposal-tag').textContent(),'New');
  await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:'test-results/swot-proposal-tags-mobile.png',fullPage:true});
  await page.getByRole('button',{name:'Reject All',exact:true}).click();assert.deepEqual((await copiedState(page)).content,s.content);
});

test('SWOT JSON import validates and confirms before replacing complete state', async t => {
  const page = await openCanvas(t);
  await add(page, 'strengths', 'Keep until confirmed');
  const original = await copiedState(page);
  const next = structuredClone(original);
  next.content.framing.objective = 'Imported objective';
  next.content.strengths[0].text = 'Imported strength';
  await page.getByRole('button', { name: 'Import JSON', exact: true }).click();
  const input = page.getByLabel('Import canvas JSON');
  const replace = page.getByRole('button', { name: 'Replace canvas' });
  await input.fill('{"framework":"pages"}');
  await replace.click();
  assert.ok((await page.locator('#import-error').textContent()).trim());
  await input.fill(JSON.stringify(next));
  page.once('dialog', dialog => dialog.dismiss());
  await replace.click();
  await page.getByRole('button', { name: 'Cancel import' }).click();
  assert.deepEqual(await copiedState(page), original);
  await page.getByRole('button', { name: 'Import JSON', exact: true }).click();
  await input.fill(JSON.stringify(next));
  page.once('dialog', dialog => dialog.accept());
  await replace.click();
  assert.equal(await page.locator('[data-framing="objective"]').inputValue(), 'Imported objective');
  assert.deepEqual(await copiedState(page), next);
});
