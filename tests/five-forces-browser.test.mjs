import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdtemp, rm, readFile, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
const require = createRequire(import.meta.url),
  root = new URL(
    '../.agents/skills/pensive/frameworks/five_forces/',
    import.meta.url,
  );
let browser, temp;
before(async () => {
  assert.ok(
    existsSync(new URL('canvas.html', root)),
    'Five Forces canvas missing',
  );
  temp = await mkdtemp(join(tmpdir(), 'pensive-forces-browser-'));
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
      viewport: { width: 1440, height: 1050 },
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
  let url = new URL('canvas.html', root).href;
  if (state) {
    const f = require(fileURLToPath(new URL('state.js', root))),
      path = join(temp, crypto.randomUUID() + '.html');
    await writeFile(
      path,
      f.packageHtml(
        await readFile(new URL('canvas.html', root), 'utf8'),
        state,
      ),
    );
    url = pathToFileURL(path).href;
  }
  await page.goto(url);
  return page;
}
async function exported(p) {
  await p.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await p
    .getByRole('button', { name: 'Export to clipboard', exact: true })
    .click();
  return JSON.parse(await p.evaluate(() => navigator.clipboard.readText()));
}
function ready() {
  const f = require(fileURLToPath(new URL('state.js', root))),
    s = f.initialState();
  Object.assign(s.content.framing, {
    industry: 'Electric passenger vehicles',
    geography: 'Canada',
    objective: 'Assess entry',
    rivals: 'Automakers',
  });
  return s;
}
test('blank canvas allows manual assessment, snippets, percentage confidence and separate Markdown research notes', async (t) => {
  const p = await open(t);
  await p
    .getByRole('button', {
      name: 'Focus Bargaining power of buyers',
      exact: true,
    })
    .click();
  await p.getByLabel('Force strength', { exact: true }).selectOption('strong');
  await p.getByLabel('Confidence (%)', { exact: true }).fill('80');
  await p
    .getByRole('button', { name: 'Add analysis point', exact: true })
    .click();
  await p
    .getByLabel('Analysis point 1', { exact: true })
    .fill('Fleet concentration increases leverage.');
  await p
    .getByRole('button', {
      name: 'Edit supporting research notes',
      exact: true,
    })
    .click();
  await p
    .getByLabel('Supporting research notes', { exact: true })
    .fill(
      '## Evidence\n\n[Industry data](https://example.org)\n\n<img src=x onerror=alert(1)>',
    );
  await p
    .getByRole('button', { name: 'Done editing research notes', exact: true })
    .click();
  assert.equal(await p.locator('#notes-preview img').count(), 0);
  const s = await exported(p);
  assert.equal(s.content.buyers.confidence, 0.8);
  assert.equal(
    s.content.buyers.analysis[0].text,
    'Fleet concentration increases leverage.',
  );
  assert.equal(s.content.buyers.strength, 'strong');
  await p.getByRole('button', { name: 'Evaluate', exact: true }).click();
  await p.getByRole('button', { name: 'Copy AI request', exact: true }).click();
  await p.getByText(/Complete framing:/).waitFor();
});
test('current/trajectory toggle preserves assessments and arrows describe competitive pressure', async (t) => {
  const p = await open(t, ready());
  await p
    .getByRole('button', { name: 'Focus Threat of new entrants', exact: true })
    .click();
  await p.getByLabel('Force strength', { exact: true }).selectOption('weak');
  await p
    .getByRole('button', { name: 'Structural trajectory', exact: true })
    .click();
  await p
    .getByLabel('Pressure direction', { exact: true })
    .selectOption('increasing');
  await p.getByLabel('Time horizon', { exact: true }).fill('2027–2030');
  await p.getByLabel('Confidence (%)', { exact: true }).fill('65');
  await p
    .getByRole('button', { name: 'Add analysis point', exact: true })
    .click();
  await p
    .getByLabel('Analysis point 1', { exact: true })
    .fill('Assumption: licensing barriers decline.');
  assert.equal(
    await p
      .locator('[data-section="new_entrants"] .trajectory-indicator')
      .getAttribute('aria-label'),
    'Increasing competitive pressure',
  );
  await p
    .getByRole('button', { name: 'Current structure', exact: true })
    .click();
  assert.equal(
    await p.getByLabel('Force strength', { exact: true }).inputValue(),
    'weak',
  );
  const s = await exported(p);
  assert.equal(s.content.new_entrants.trajectory.confidence, 0.65);
  assert.equal(s.content.new_entrants.trajectory.horizon, '2027–2030');
  await p
    .getByRole('button', { name: 'Back to Overview', exact: true })
    .click();
  assert.equal(
    await p
      .locator('[data-section="buyers"] .trajectory-indicator')
      .textContent(),
    '',
  );
  await p.setViewportSize({ width: 390, height: 844 });
  assert.ok(
    await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  );
  await mkdir('test-results', { recursive: true });
  await p.screenshot({
    path: 'test-results/five-forces-narrow.png',
    fullPage: true,
  });
});
test('force and Research proposals show full structured diffs and preserve explicit acceptance', async (t) => {
  const f = require(fileURLToPath(new URL('state.js', root))),
    s = ready(),
    c = structuredClone(s.content);
  Object.assign(c.buyers, {
    strength: 'strong',
    confidence: 0.8,
    research_notes: 'Evidence',
    analysis: [{ id: 'b1', text: 'Concentration strengthens leverage' }],
  });
  for (const research of [false, true]) {
    const r = f.composeResult(
      f.buildRequest(
        s,
        research
          ? { id: 'research', target: { type: 'section', id: 'buyers' } }
          : { id: 'improve' },
      ),
      research
        ? { content: c, report: 'Provisional evidence', sources: [] }
        : { content: c, thought: 'Explain mechanisms' },
    );
    const p = await open(t, r);
    await p
      .getByText(
        research ? 'Review proposed canvas changes' : 'Review proposed changes',
        { exact: true },
      )
      .click();
    await p.getByText('80%', { exact: false }).first().waitFor();
    assert.equal((await exported(p)).content.buyers.strength, null);
    await p
      .getByRole('button', {
        name: research ? 'Accept Research' : 'Accept All',
        exact: true,
      })
      .click();
    assert.equal((await exported(p)).content.buyers.strength, 'strong');
  }
});
test('full-state actions, framing reassessment cue and guided Takeaways use existing review', async (t) => {
  const p = await open(t, ready());
  await p.getByLabel('Geographic scope', { exact: true }).fill('North America');
  await p.getByText(/Framing changed/).waitFor();
  await p
    .getByRole('button', {
      name: 'Focus Bargaining power of buyers',
      exact: true,
    })
    .click();
  await p.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await p.getByRole('button', { name: 'Improve', exact: true }).click();
  await p.getByRole('button', { name: 'Copy AI request', exact: true }).click();
  const req = JSON.parse(
    await p.evaluate(() => navigator.clipboard.readText()),
  );
  assert.deepEqual(req.action.target, { type: 'section', id: 'buyers' });
  assert.equal(req.canvas.content.framing.geography, 'North America');
  await p
    .getByText('T4 — Open questions and assumptions', { exact: true })
    .waitFor();
  const f = require(fileURLToPath(new URL('state.js', root))),
    s = ready(),
    r = f.composeResult(f.buildRequest(s, { id: 'formulate_takeaways' }), {
      takeaways: 'T1 — Provisional\nT4 — Evidence gaps',
      rationale: 'Preserve uncertainty',
    }),
    q = await open(t, r);
  await q
    .getByRole('button', { name: 'Accept Takeaways', exact: true })
    .click();
  assert.equal(
    (await exported(q)).takeaways,
    'T1 — Provisional\nT4 — Evidence gaps',
  );
});
test('save/reopen, validated import and clipboard fallback preserve complete analysis', async (t) => {
  const p = await open(t, ready());
  await p
    .getByRole('button', {
      name: 'Focus Rivalry among existing competitors',
      exact: true,
    })
    .click();
  await p.getByLabel('Confidence (%)', { exact: true }).fill('0');
  const download = p.waitForEvent('download');
  await p.getByRole('button', { name: /Save to File/ }).click();
  const d = await download,
    path = join(temp, 'saved.html');
  await d.saveAs(path);
  await p.goto(pathToFileURL(path).href);
  assert.equal((await exported(p)).content.rivalry.confidence, 0);
  await p.getByRole('button', { name: 'Import JSON', exact: true }).click();
  await p
    .getByLabel('Import canvas JSON', { exact: true })
    .fill('{"framework":"invalid"}');
  await p.getByRole('button', { name: 'Replace canvas', exact: true }).click();
  await p
    .locator('#import-error')
    .filter({ hasText: /invalid|expected/i })
    .waitFor();
  await p.getByRole('button', { name: 'Cancel import', exact: true }).click();
  await p.evaluate(() =>
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: async () => {
          throw new Error('denied');
        },
      },
      configurable: true,
    }),
  );
  await p
    .getByRole('button', { name: 'Export to clipboard', exact: true })
    .click();
  assert.equal(
    JSON.parse(await p.locator('#clipboard-json').inputValue()).content.rivalry
      .confidence,
    0,
  );
});
test('AI and Research handoffs carry the selected current or trajectory perspective as steering', async (t) => {
  const p = await open(t, ready());
  await p.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await p
    .getByRole('button', {
      name: 'Focus Bargaining power of buyers',
      exact: true,
    })
    .click();
  for (const temporal of [false, true]) {
    await p
      .getByRole('button', {
        name: temporal ? 'Structural trajectory' : 'Current structure',
        exact: true,
      })
      .click();
    await p.getByRole('button', { name: 'Improve', exact: true }).click();
    await p
      .getByRole('button', { name: 'Copy AI request', exact: true })
      .click();
    let req = JSON.parse(
      await p.evaluate(() => navigator.clipboard.readText()),
    );
    assert.match(
      req.action.comment,
      temporal ? /Structural trajectory/ : /Current structure/,
    );
    await p.getByRole('button', { name: 'Research', exact: true }).click();
    await p
      .getByRole('button', { name: 'Copy Research request', exact: true })
      .click();
    req = JSON.parse(await p.evaluate(() => navigator.clipboard.readText()));
    assert.match(
      req.action.comment,
      temporal ? /Structural trajectory/ : /Current structure/,
    );
    assert.deepEqual(req.action.target, { type: 'section', id: 'buyers' });
  }
});
test('force annotations lock analysis, preserve context and survive confirmed JSON import', async (t) => {
  const p = await open(t, ready());
  await p
    .getByRole('button', {
      name: 'Focus Bargaining power of buyers',
      exact: true,
    })
    .click();
  await p.getByRole('button', { name: 'Annotation Mode', exact: true }).click();
  assert.equal(
    await p.getByLabel('Force strength', { exact: true }).isDisabled(),
    true,
  );
  assert.equal(
    await p
      .getByLabel('Geographic scope', { exact: true })
      .evaluate((n) => n.readOnly),
    true,
  );
  await p
    .getByRole('button', {
      name: 'Add thought for Bargaining power of buyers',
      exact: true,
    })
    .click();
  const panel = p.getByRole('dialog', { name: 'Annotations', exact: true });
  await panel
    .getByRole('textbox', { name: 'Annotation text', exact: true })
    .fill('Check concentration evidence.');
  await panel.getByRole('button', { name: 'Save note', exact: true }).click();
  await panel.getByRole('button', { name: 'Close notes', exact: true }).click();
  await p
    .getByRole('button', { name: 'Exit annotation mode', exact: true })
    .click();
  const s = await exported(p);
  assert.deepEqual(s.annotations[0].target, { type: 'section', id: 'buyers' });
  s.content.buyers.strength = 'moderate';
  await p.getByRole('button', { name: 'Import JSON', exact: true }).click();
  await p
    .getByLabel('Import canvas JSON', { exact: true })
    .fill(JSON.stringify(s));
  p.once('dialog', (d) => d.dismiss());
  await p.getByRole('button', { name: 'Replace canvas', exact: true }).click();
  assert.equal(await p.locator('#import-dialog').evaluate((n) => n.open), true);
  p.once('dialog', (d) => d.accept());
  await p.getByRole('button', { name: 'Replace canvas', exact: true }).click();
  assert.equal((await exported(p)).content.buyers.strength, 'moderate');
  assert.equal(
    (await exported(p)).annotations[0].text,
    'Check concentration evidence.',
  );
});
test('pending review survives consecutive HTML saves and stale acceptance preserves manual framing', async (t) => {
  const f = require(fileURLToPath(new URL('state.js', root))),
    s = ready(),
    c = structuredClone(s.content);
  c.buyers.strength = 'strong';
  c.buyers.confidence = 0.7;
  const r = f.composeResult(f.buildRequest(s, { id: 'improve' }), {
      content: c,
      thought: 'Provisional buyer assessment',
    }),
    p = await open(t, r);
  for (let generation = 0; generation < 2; generation++) {
    const download = p.waitForEvent('download');
    await p.getByRole('button', { name: /Save to File/ }).click();
    const path = join(temp, `pending-${generation}.html`);
    await (await download).saveAs(path);
    await p.goto(pathToFileURL(path).href);
    assert.equal((await exported(p)).proposals.length, 1);
  }
  await p
    .getByLabel('Geographic scope', { exact: true })
    .fill('Different market');
  await p.getByRole('button', { name: 'Accept All', exact: true }).click();
  await p.getByText(/Canvas content or framing changed/).waitFor();
  assert.equal((await exported(p)).content.buyers.strength, null);
  await p.getByRole('button', { name: 'Reject All', exact: true }).click();
  assert.equal(
    (await exported(p)).content.framing.geography,
    'Different market',
  );
});
test('trajectory overview displays its horizon and confidence while retaining the current strength', async (t) => {
  const s = ready();
  s.content.buyers.strength = 'weak';
  s.content.buyers.trajectory = {
    direction: 'decreasing',
    horizon: '2027–2030',
    confidence: 0.6,
    analysis: [],
    research_notes: '',
  };
  const p = await open(t, s);
  await p
    .getByRole('button', { name: 'Structural trajectory', exact: true })
    .click();
  const tile = p.locator('[data-section="buyers"]');
  await tile.getByText('Decreasing pressure', { exact: true }).waitFor();
  await tile.getByText('2027–2030', { exact: true }).waitFor();
  await tile.getByText('Confidence 60%', { exact: true }).waitFor();
  await tile.getByText('Current strength: Weak', { exact: true }).waitFor();
});
test('focused desktop and narrow views render evidence safely and remain keyboard accessible', async (t) => {
  const s = ready();
  Object.assign(s.content.suppliers, {
    strength: 'strong',
    confidence: 0.55,
    analysis: [
      {
        id: 'supplier1',
        text: 'Concentrated critical inputs may increase supplier leverage; alternatives remain unverified.',
      },
    ],
    research_notes:
      '## Supporting evidence\n\nHypothesis only. Confirm supplier concentration, switching costs and industry dependence.\n\n| Driver | Evidence |\n| --- | --- |\n| Switching | Unknown |',
  });
  const p = await open(t, s);
  await p
    .getByRole('button', {
      name: 'Focus Bargaining power of suppliers',
      exact: true,
    })
    .focus();
  await p.keyboard.press('Enter');
  assert.equal(
    await p
      .locator('#focus-title')
      .evaluate((n) => n === document.activeElement),
    true,
  );
  await mkdir('test-results', { recursive: true });
  await p.screenshot({
    path: 'test-results/five-forces-desktop-focus.png',
    fullPage: true,
  });
  await p.setViewportSize({ width: 390, height: 844 });
  await p.waitForFunction(
    () =>
      [...document.querySelectorAll('#analysis-points textarea')].every(
        (n) => n.scrollHeight <= n.clientHeight + 2,
      ),
    {},
    { timeout: 1000 },
  );
  assert.ok(
    await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  );
  await p.screenshot({
    path: 'test-results/five-forces-narrow-focus.png',
    fullPage: true,
  });
  await p
    .getByRole('button', {
      name: 'Edit supporting research notes',
      exact: true,
    })
    .click();
  await p
    .getByLabel('Supporting research notes', { exact: true })
    .press('Control+Enter');
  assert.equal(await p.locator('#research-notes').isVisible(), false);
});

test('invalid embedded state disables analytical editing and export without running hostile text', async (t) => {
  const p = await open(t);
  const html = await readFile(new URL('canvas.html', root), 'utf8');
  const invalid = html.replace(
    /(<script id="canvas-state" type="application\/json">)[\s\S]*?(<\/script>)/,
    '$1{"framework":"unknown"}$2',
  );
  const path = join(temp, 'invalid-embedded.html');
  await writeFile(path, invalid);
  await p.goto(pathToFileURL(path).href);
  assert.match(await p.locator('#status').textContent(), /Invalid canvas/);
  assert.equal(
    await p
      .getByRole('button', { name: 'Export to clipboard', exact: true })
      .isDisabled(),
    true,
  );
  assert.equal(
    await p.getByLabel('Geographic scope', { exact: true }).isDisabled(),
    true,
  );
});
