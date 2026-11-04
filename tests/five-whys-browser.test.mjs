import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile, rm, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
const root = new URL('../.agents/skills/pensive/frameworks/five_whys/', import.meta.url),
  require = createRequire(import.meta.url);
let browser, temp;
const W = () => require(fileURLToPath(new URL('state.js', root)));
before(async () => {
  assert.ok(existsSync(new URL('canvas.html', root)), '5 Whys canvas missing');
  temp = await mkdtemp(join(tmpdir(), 'whys-browser-'));
  browser = await chromium.launch();
});
after(async () => {
  await browser?.close();
  if (temp) await rm(temp, { recursive: true, force: true });
});
async function open(t, state) {
  const ctx = await browser.newContext({
      offline: true,
      acceptDownloads: true,
      viewport: { width: 1440, height: 1000 },
    }),
    page = await ctx.newPage(),
    errors = [],
    network = [];
  page.on('pageerror', (e) => errors.push(e.message));
  ctx.on('request', (r) => {
    if (/^https?:/.test(r.url())) network.push(r.url());
  });
  t.after(async () => {
    assert.deepEqual(errors, []);
    assert.deepEqual(network, []);
    await ctx.close();
  });
  let path = new URL('canvas.html', root);
  if (state) {
    path = pathToFileURL(join(temp, crypto.randomUUID() + '.html'));
    await writeFile(
      fileURLToPath(path),
      W().packageHtml(await readFile(new URL('canvas.html', root), 'utf8'), state),
    );
  }
  await page.goto(path.href);
  return page;
}
async function exported(p) {
  await p.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await p.getByRole('button', { name: 'Export to clipboard', exact: true }).click();
  return JSON.parse(await p.evaluate(() => navigator.clipboard.readText()));
}
async function edit(p, id, text, key = 'Enter') {
  const card = p.locator(`[data-tree-node-id="${id}"]`);
  await card.getByRole('button', { name: /^Edit / }).click();
  await card.getByRole('textbox', { name: 'Node text' }).fill(text);
  await card.getByRole('textbox', { name: 'Node text' }).press(key);
}
async function add(p, id, text) {
  const zone = p.locator(`[data-tree-connector-parent="${id}"]`);
  await zone.getByRole('button', { name: 'Add cause', exact: true }).click();
  await zone.getByRole('textbox', { name: 'Direct cause' }).fill(text);
  await zone.getByRole('button', { name: 'Save cause', exact: true }).click();
  return (await exported(p)).cursor.at(-1);
}
function fixture() {
  const w = W(),
    s = w.initialState();
  w.editText(s, 'root', 'Observed: invoices arrive late');
  const a = w.addChild(s, 'root', 'Hypothesis: dispatch queue'),
    b = w.addChild(s, 'root', 'Hypothesis: transport delay');
  w.addChild(s, a, 'Hypothesis: batch processing');
  return { s, a, b };
}
test('blank canvas, inline editing, ancestor branching, side doors and root lock work offline', async (t) => {
  const p = await open(t);
  await edit(p, 'root', 'Observed: orders late');
  await p.locator('[data-tree-node-id="root"]').getByRole('button', { name: 'Expand', exact: true }).click();
  assert.equal(await p.getByRole('radio', { name: 'Deepen — direct causes of this condition', exact: true }).isChecked(), true);
  assert.equal(await p.getByRole('radio', { name: 'Branch — alternative explanations of its parent', exact: true }).isDisabled(), true);
  await p.getByRole('button', { name: 'Cancel', exact: true }).click();
  const a = await add(p, 'root', 'Hypothesis: queue delay');
  const c = await add(p, a, 'Hypothesis: staffing');
  const b = await add(p, 'root', 'Hypothesis: transport');
  assert.equal(await p.locator('[data-tree-root-editable]').count(), 0);
  await p.locator(`[data-side-door-node="${a}"]`).click();
  assert.deepEqual((await exported(p)).cursor, ['root', a, c]);
  await edit(p, c, 'Discard this', 'Escape');
  assert.equal(W().find(await exported(p), c).node.text, 'Hypothesis: staffing');
  await edit(p, c, 'Reported: shift starts late');
  assert.equal(W().find(await exported(p), c).node.text, 'Reported: shift starts late');
  await p.getByRole('button', { name: 'Framing', exact: true }).click();
  await p.getByLabel('Observable Symptom', { exact: true }).fill('Three late orders');
  assert.equal((await exported(p)).content.framing.observable_symptom, 'Three late orders');
  await p.getByRole('button', { name: 'Investigation', exact: true }).click();
  await p.getByRole('button', { name: 'View full tree', exact: true }).click();
  assert.equal(await p.locator('[data-tree-overview-node-id]').count(), 4);
  assert.equal(await p.locator('[data-tree-overview-edge]').count(), 3);
  await p.locator(`[data-tree-overview-node-id="${b}"]`).click();
  assert.equal((await exported(p)).cursor.at(-1), b);
});
test('close, unmark, confirmed delete and navigation repair preserve other branches', async (t) => {
  const { s, a, b } = fixture(),
    p = await open(t, s),
    tip = s.cursor.at(-1);
  await p.getByRole('button', { name: 'Close branch', exact: true }).click();
  await p.getByLabel('Countermeasure', { exact: true }).fill('Test a smaller dispatch batch');
  await p.getByRole('button', { name: 'Save countermeasure', exact: true }).click();
  assert.equal(W().find(await exported(p), tip).node.is_terminal, true);
  await p.getByRole('button', { name: 'Unmark', exact: true }).click();
  p.once('dialog', (d) => d.dismiss());
  await p
    .locator(`[data-tree-node-id="${a}"]`)
    .getByRole('button', { name: 'Delete subtree' })
    .click();
  assert.ok(W().find(await exported(p), a));
  p.once('dialog', (d) => d.accept());
  await p
    .locator(`[data-tree-node-id="${a}"]`)
    .getByRole('button', { name: 'Delete subtree' })
    .click();
  assert.deepEqual((await exported(p)).cursor, ['root', b]);
});
test('validated import cancellation, clipboard fallback and consecutive saved HTML preserve implementation', async (t) => {
  const { s } = fixture(),
    p = await open(t, s);
  await p.getByRole('button', { name: 'Import JSON', exact: true }).click();
  await p.getByLabel('Import canvas JSON').fill('{}');
  await p.getByRole('button', { name: 'Replace canvas', exact: true }).click();
  assert.ok(await p.locator('#import-error').textContent());
  await p.getByRole('button', { name: 'Cancel import' }).click();
  assert.deepEqual(await exported(p), s);
  await p.getByRole('button', { name: 'Import JSON', exact: true }).click();
  await p.getByLabel('Import canvas JSON').fill(JSON.stringify(W().initialState()));
  p.once('dialog', (d) => d.dismiss());
  await p.getByRole('button', { name: 'Replace canvas', exact: true }).click();
  await p.getByRole('button', { name: 'Cancel import' }).click();
  assert.deepEqual(await exported(p), s);
  const original = await readFile(new URL('canvas.html', root), 'utf8');
  let implementation;
  for (let i = 0; i < 2; i++) {
    const download = p.waitForEvent('download');
    await p.getByRole('button', { name: /^Save to File/ }).click();
    const path = join(temp, 'save' + i + '.html');
    await (await download).saveAs(path);
    const html = await readFile(path, 'utf8'),
      scripts = [...html.matchAll(/<script data-implementation(?:="")?>([\s\S]*?)<\/script>/g)].map(
        (x) => x[1],
      );
    assert.equal(scripts.length, 2);
    if (implementation) assert.deepEqual(scripts, implementation);
    else implementation = scripts;
    await p.goto(pathToFileURL(path).href);
    assert.deepEqual(await exported(p), s);
  }
  assert.ok(original.includes('canvas-tree-board'));
  await p.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: async () => {
          throw Error('blocked');
        },
      },
      configurable: true,
    });
  });
  await p.getByRole('button', { name: 'Export to clipboard', exact: true }).click();
  assert.deepEqual(JSON.parse(await p.getByLabel('Canvas JSON', { exact: true }).inputValue()), s);
});
test('wide/deep overview, long outputs, narrow navigation and hostile text remain usable', async (t) => {
  const w = W(),
    s = w.initialState();
  w.editText(s, 'root', '</script><img src=x onerror=alert(1)>');
  let id = 'root';
  for (let i = 0; i < 9; i++) id = w.addChild(s, id, 'Hypothesis: mechanism ' + i);
  w.closeBranch(s, id, 'Test: ' + 'A long countermeasure description. '.repeat(25));
  for (let i = 0; i < 6; i++) w.addChild(s, 'root', 'Alternative ' + i);
  const p = await open(t, s);
  assert.equal(await p.locator('img').count(), 0);
  await p.getByRole('button', { name: 'View full tree', exact: true }).click();
  assert.equal(await p.locator('[data-tree-overview-node-id]').count(), 16);
  await p.keyboard.press('Escape');
  await p.setViewportSize({ width: 390, height: 844 });
  assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await p.getByRole('button', { name: 'View full tree', exact: true }).click();
  assert.ok(
    await p.locator('.canvas-tree-overview-scroll').evaluate((n) => n.scrollWidth > n.clientWidth),
  );
  await p.keyboard.press('Escape');
  await mkdir('test-results', { recursive: true });
  await p.screenshot({ path: 'test-results/five-whys-mobile.png', fullPage: true });
  await p.setViewportSize({ width: 1440, height: 1000 });
  await p.screenshot({ path: 'test-results/five-whys-desktop.png', fullPage: true });
});
test('Reflect copies complete thought-only handoff and preserves existing evaluation on reopen', async (t) => {
  const { s } = fixture(),
    w = W(),
    out = w.composeResult(w.buildRequest(s, { id: 'evaluate' }), {
      thought: 'Timing evidence is missing. Compare dispatch timestamps.',
    }),
    p = await open(t, out);
  assert.ok(
    (await p.getByRole('region', { name: 'AI thoughts' }).textContent()).includes(
      'Timing evidence',
    ),
  );
  await p.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await p.getByRole('button', { name: 'Reflect', exact: true }).click();
  await p.getByLabel('Steering guidance').fill('Check missing intermediates');
  await p.getByRole('button', { name: 'Copy AI request', exact: true }).click();
  const request = JSON.parse(await p.evaluate(() => navigator.clipboard.readText()));
  assert.deepEqual(request.canvas, out);
  assert.equal(request.action.id, 'evaluate');
  assert.equal(request.action.comment, 'Check missing intermediates');
});
test('node Expand exports explicit target and mode; append review survives save and navigation', async (t) => {
  const { s, a, b } = fixture(),
    w = W(),
    p = await open(t, s);
  await p.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await p
    .locator(`[data-tree-node-id="${a}"]`)
    .getByRole('button', { name: 'Expand', exact: true })
    .click();
  assert.equal(await p.getByRole('radio', { name: 'Deepen — direct causes of this condition', exact: true }).isChecked(), true);
  await p.getByRole('radio', { name: 'Branch — alternative explanations of its parent', exact: true }).check();
  await p.getByRole('button', { name: 'Copy AI request', exact: true }).click();
  const req = JSON.parse(await p.evaluate(() => navigator.clipboard.readText()));
  assert.deepEqual(req.action.target, { type: 'node', id: a });
  assert.equal(req.action.mode, 'branch');
  const out = w.composeResult(req, {
      thought: 'Test address validation as another direct cause; this is a hypothesis.',
      children: [{ text: 'Hypothesis: address validation delay' }],
    }),
    path = join(temp, 'proposal.html');
  await writeFile(path, w.packageHtml(await readFile(new URL('canvas.html', root), 'utf8'), out));
  await p.goto(pathToFileURL(path).href);
  assert.equal(await p.getByRole('button', { name: 'Reflect', exact: true }).isDisabled(), true);
  assert.ok(
    (await p.getByRole('region', { name: 'AI expansion proposal' }).textContent()).includes(
      'address validation',
    ),
  );
  const download = p.waitForEvent('download');
  await p.getByRole('button', { name: /^Save to File/ }).click();
  const saved = join(temp, 'proposal-saved.html');
  await (await download).saveAs(saved);
  await p.goto(pathToFileURL(saved).href);
  assert.deepEqual((await exported(p)).proposals, out.proposals);
  await p.locator(`[data-side-door-node="${b}"]`).click();
  await p.getByRole('button', { name: 'Accept proposed causes', exact: true }).click();
  const accepted = await exported(p);
  assert.equal(accepted.content.tree.children.length, 3);
  assert.deepEqual(accepted.cursor, ['root', b]);
  assert.equal(accepted.proposals, undefined);
  assert.equal(accepted.thoughts.at(-1).kind, 'expansion');
});
test('stale append acceptance is visible and rejecting preserves local edits', async (t) => {
  const { s, a } = fixture(),
    w = W(),
    out = w.composeResult(
      w.buildRequest(s, { id: 'expand', mode: 'deepen', target: { type: 'node', id: a } }),
      { thought: 'A hypothesis, not proven.', children: [{ text: 'Hypothesis: workload spike' }] },
    ),
    p = await open(t, out);
  await edit(p, a, 'Hypothesis: local revision');
  await p.getByRole('button', { name: 'Accept proposed causes', exact: true }).click();
  assert.match(await p.locator('#status').textContent(), /stale/);
  await p.getByRole('button', { name: 'Reject proposed causes', exact: true }).click();
  assert.equal(W().find(await exported(p), a).node.text, 'Hypothesis: local revision');
  assert.equal((await exported(p)).proposals, undefined);
});
test('successful JSON replacement round-trips full state and invalid embedded state fails visibly', async (t) => {
  const { s } = fixture(),
    p = await open(t);
  await p.getByRole('button', { name: 'Import JSON', exact: true }).click();
  await p.getByLabel('Import canvas JSON').fill(JSON.stringify(s));
  p.once('dialog', (d) => d.accept());
  await p.getByRole('button', { name: 'Replace canvas', exact: true }).click();
  assert.deepEqual(await exported(p), s);
  const html = await readFile(new URL('canvas.html', root), 'utf8'),
    path = join(temp, 'invalid.html');
  await writeFile(
    path,
    html.replace(
      /<script id="canvas-state" type="application\/json">[\s\S]*?<\/script>/,
      '<script id="canvas-state" type="application/json">{"framework":"five_whys"}</script>',
    ),
  );
  await p.goto(pathToFileURL(path).href);
  assert.match(await p.locator('#status').textContent(), /Invalid canvas/);
  assert.equal(
    await p.getByRole('button', { name: 'Export to clipboard', exact: true }).isDisabled(),
    true,
  );
  assert.equal(await p.getByRole('button', { name: /^Save to File/ }).isDisabled(), true);
});
test('closed-node Expand offers Branch while disabling Deepen; dialog keyboard focus stays contained', async (t) => {
  const { s } = fixture(),
    w = W(),
    tip = s.cursor.at(-1);
  w.closeBranch(s, tip, 'Test smaller batch');
  const p = await open(t, s);
  await p
    .locator(`[data-tree-node-id="${tip}"]`)
    .getByRole('button', { name: 'Expand', exact: true })
    .click();
  assert.equal(await p.getByRole('radio', { name: 'Branch — alternative explanations of its parent', exact: true }).isChecked(), true);
  assert.equal(
    await p.getByRole('radio', { name: 'Deepen — direct causes of this condition', exact: true }).isDisabled(),
    true,
  );
  for (let i = 0; i < 12; i++) {
    await p.keyboard.press('Tab');
    assert.equal(
      await p.evaluate(() => document.querySelector('#ai-dialog').contains(document.activeElement)),
      true,
    );
  }
  await p.keyboard.press('Escape');
  assert.equal(await p.locator('#ai-dialog').isVisible(), false);
  await p.getByRole('button', { name: 'View full tree', exact: true }).click();
  for (let i = 0; i < 10; i++) {
    await p.keyboard.press('Tab');
    assert.equal(
      await p.evaluate(() =>
        document.querySelector('#overview-dialog').contains(document.activeElement),
      ),
      true,
    );
  }
  await p.keyboard.press('Escape');
  assert.equal(
    await p
      .getByRole('button', { name: 'View full tree', exact: true })
      .evaluate((n) => n === document.activeElement),
    true,
  );
});
