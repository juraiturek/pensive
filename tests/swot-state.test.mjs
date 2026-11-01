import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';

const require = createRequire(import.meta.url);
const root = new URL('../.agents/skills/pensive/frameworks/swot/', import.meta.url);
const source = new URL('state.js', root);
const item = (id, text = '') => ({ id, text });
const getCore = () => {
  assert.ok(existsSync(source), 'SWOT state operations have not been implemented');
  return require(fileURLToPath(source));
};
const withoutState = html => html.replace(/<!--pensive-state-start-->[\s\S]*?<!--pensive-state-end-->/, '<STATE>');

test('initial state is schema-valid and uses independent empty collections', () => {
  const core = getCore();
  const state = core.initialState();
  const schema = JSON.parse(readFileSync(new URL('canvas.schema.json', root)));
  assert.equal(new Ajv({ allErrors: true }).compile(schema)(state), true);
  assert.doesNotThrow(() => core.validate(state));
  state.content.strengths.push(item('s1'));
  assert.equal(core.initialState().content.strengths.length, 0);
  assert.equal(state.content.weaknesses.length, 0);
});

test('runtime structural validation agrees with JSON Schema for invalid shapes', () => {
  const core = getCore();
  const check = new Ajv({ allErrors: true }).compile(JSON.parse(readFileSync(new URL('canvas.schema.json', root))));
  const mutations = [
    s => { s.framework = 'vpc'; }, s => { s.schema_version = '9'; },
    s => { s.extra = true; }, s => { delete s.content.objective; s.content.extra = []; },
    s => { s.content.strengths = null; }, s => { s.content.strategies.so = ['text']; },
    s => { s.content.strengths = [item('')]; }, s => { s.content.threats = [item('bad id')]; },
    s => { s.content.weaknesses = [{ id: 'w1', text: 7 }]; },
    s => { s.content.strategies.wt = [{ id: 'wt1', text: '', extra: true }]; },
    s => { delete s.content.framing.environment; },
    s => { s.content.framing = []; }, s => { s.content.strategies = null; }
  ];
  for (const mutate of mutations) {
    const state = core.initialState(); mutate(state);
    assert.equal(check(state), false, JSON.stringify(state));
    assert.throws(() => core.validate(state), /.+/);
  }
  for (const state of [null, [], {}, 'bad', 1]) {
    assert.equal(check(state), false);
    assert.throws(() => core.validate(state));
  }
});

test('stable IDs survive edits; duplicate IDs across factors and strategies fail', () => {
  const core = getCore();
  const state = core.initialState();
  const id = core.addItem(state, 'strengths');
  core.editItem(state, 'strengths', id, 'Useful strength');
  assert.equal(state.content.strengths[0].id, id);
  const strategy = core.addItem(state, 'so');
  core.editItem(state, 'so', strategy, 'Build on it');
  assert.notEqual(strategy, id);
  const roundtrip = core.parseState(JSON.stringify(state));
  assert.deepEqual(roundtrip, state);
  roundtrip.content.strategies.so[0].id = id;
  assert.throws(() => core.validate(roundtrip), /duplicate/i);
  core.deleteItem(state, 'strengths', id);
  assert.equal(state.content.strengths.length, 0);
  assert.equal(state.content.strategies.so[0].id, strategy);
});

test('invalid operations leave state unchanged and never replace identities', () => {
  const core = getCore();
  const state = core.initialState();
  const id = core.addItem(state, 'strengths');
  const before = JSON.stringify(state);
  for (const run of [
    () => core.addItem(state, '__proto__'),
    () => core.editItem(state, 'strengths', 'missing', 'new'),
    () => core.editItem(state, 'strengths', id, 1),
    () => core.deleteItem(state, 'so', id)
  ]) {
    assert.throws(run);
    assert.equal(JSON.stringify(state), before);
  }
});

test('safe state embedding round-trips adversarial strings and preserves implementation bytes', () => {
  const core = getCore();
  const html = readFileSync(new URL('canvas.html', root), 'utf8');
  const state = core.initialState();
  state.content.strengths.push(item('s1', '</script><script>globalThis.attacked=true</script><!-- & > " \' $& $` $\' 🧠\u2028\u2029'));
  state.content.strategies.wt.push(item('wt1', '<img src=x onerror=alert(1)>'));
  const output = core.packageHtml(html, state);
  assert.equal(withoutState(output), withoutState(html));
  const embedded = output.match(/<script id="canvas-state" type="application\/json">([\s\S]*?)<\/script>/)[1];
  assert.ok(!embedded.includes('<'));
  assert.deepEqual(core.parseState(embedded), state);
  assert.equal(core.packageHtml(html, state), output);
  assert.equal(core.packageHtml(output, state), output);
  assert.throws(() => core.packageHtml('<html>no state slot</html>', state), /slot/i);
  assert.throws(() => core.packageHtml(html + '<!--pensive-state-start-->', state), /slot/i);
  assert.throws(() => core.parseState('{"framework":"swot"}'));
});

test('committed standalone HTML is reproducible from separate source files', async () => {
  const { buildCanvas } = await import('../.agents/skills/pensive/scripts/package-swot.mjs');
  assert.equal(await buildCanvas(), readFileSync(new URL('canvas.html', root), 'utf8'));
});

test('CLI packages JSON without changing implementation and refuses overwriting an artifact', async () => {
  const { mkdtempSync, writeFileSync, rmSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { spawnSync } = await import('node:child_process');
  const temp = mkdtempSync(join(tmpdir(), 'pensive package '));
  try {
    const state = getCore().initialState();
    state.content.strategies.wo.push(item('wo-test', 'Collaborate to close a gap'));
    const input = join(temp, 'state.json'), output = join(temp, 'canvas.html');
    writeFileSync(input, JSON.stringify(state));
    const args = [fileURLToPath(new URL('../.agents/skills/pensive/scripts/package-swot.mjs', import.meta.url)), input, output];
    const run = spawnSync(process.execPath, args, { encoding: 'utf8' });
    assert.equal(run.status, 0, run.stderr);
    const html = readFileSync(output, 'utf8');
    assert.equal(withoutState(html), withoutState(readFileSync(new URL('canvas.html', root), 'utf8')));
    const again = spawnSync(process.execPath, args, { encoding: 'utf8' });
    assert.notEqual(again.status, 0);
    assert.equal(readFileSync(output, 'utf8'), html);
    writeFileSync(input, '{"framework":"invalid"}');
    const invalid = spawnSync(process.execPath, [args[0], input, join(temp, 'invalid.html')], { encoding: 'utf8' });
    assert.notEqual(invalid.status, 0);
    assert.equal(existsSync(join(temp, 'invalid.html')), false);
  } finally { rmSync(temp, { recursive: true }); }
});
