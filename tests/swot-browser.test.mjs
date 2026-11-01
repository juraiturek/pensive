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

async function openCanvas(t, state, viewport = { width: 1440, height: 1000 }) {
  const context = await browser.newContext({ offline: true, viewport, acceptDownloads: true });
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
  const exported = JSON.parse(await page.getByLabel('Canvas JSON').inputValue());
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
