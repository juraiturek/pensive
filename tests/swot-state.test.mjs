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

test('reordering changes only collection order and survives JSON packaging', () => {
  const core = getCore();
  for (const section of [...core.factors, ...core.strategies]) {
    const state = core.initialState();
    core.collection(state, section).push(item('a', 'First'), item('b', 'Second'), item('c', 'Third'));
    core.reorderItem(state, section, 'a', 2);
    assert.deepEqual(core.collection(state, section), [item('b', 'Second'), item('c', 'Third'), item('a', 'First')]);
    core.reorderItem(state, section, 'a', 0);
    core.reorderItem(state, section, 'b', 1);
    assert.deepEqual(core.collection(core.parseState(JSON.stringify(state)), section), [item('a', 'First'), item('b', 'Second'), item('c', 'Third')]);
  }
});

test('invalid reorder targets and pending collection moves fail without mutation', () => {
  const core = getCore();
  const state = core.initialState(); state.content.strengths.push(item('a', 'First'), item('b', 'Second'));
  const before = structuredClone(state);
  for (const [section, id, index] of [['strengths', 'a', -1], ['strengths', 'a', 2], ['strengths', 'a', 0.5], ['strengths', 'a', '1'], ['strengths', 'absent', 0], ['weaknesses', 'a', 0], ['invalid', 'a', 0]]) {
    assert.throws(() => core.reorderItem(state, section, id, index));
    assert.deepEqual(state, before);
  }
  const content = structuredClone(state.content); content.strengths[0].text = 'Proposed';
  const proposed = core.composeResult(core.buildRequest(state, { id: 'improve' }), { content, thought: 'Clarified.' });
  const pending = structuredClone(proposed);
  assert.throws(() => core.reorderItem(proposed, 'strengths', 'a', 1), /review|pending|resolve/i);
  assert.deepEqual(proposed, pending);
  core.rejectProposal(proposed);
  core.reorderItem(proposed, 'strengths', 'a', 1);
  assert.equal(proposed.content.strengths[0].id, 'b');
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

test('AI requests clone complete state and validate action scopes without mutation', () => {
  const core = getCore();
  assert.equal(typeof core.buildRequest, 'function');
  const state = core.initialState();
  const id = core.addItem(state, 'strengths'); core.editItem(state, 'strengths', id, 'Expert team');
  const request = core.buildRequest(state, { id: 'evaluate', scope: 'both', comment: 'Focus on evidence', use_thoughts: true });
  assert.deepEqual(Object.keys(request), ['canvas', 'action']);
  assert.deepEqual(request.canvas, state);
  state.content.strengths[0].text = 'User edit';
  assert.equal(request.canvas.content.strengths[0].text, 'Expert team');
  assert.throws(() => core.buildRequest(state, { id: 'evaluate', scope: 'unknown', comment: '', use_thoughts: false }));
  assert.throws(() => core.buildRequest(state, { id: 'strategize', mode: 'unknown', comment: '', use_thoughts: false }));
  for (const action of [{ id: 'evaluate', scope: null }, { id: 'strategize', mode: null }, { id: 'improve', comment: null }, { id: 'improve', use_thoughts: null }]) assert.throws(() => core.buildRequest(state, action));
});

test('evaluation adds an inert thought while content and prior thoughts remain intact', () => {
  const core = getCore();
  assert.equal(typeof core.composeResult, 'function');
  const state = core.initialState();
  const request = core.buildRequest(state, { id: 'evaluate', scope: 'swot', comment: '', use_thoughts: true });
  const result = core.composeResult(request, { thought: 'The opportunity is an action, not an external condition.' });
  assert.deepEqual(result.content, state.content);
  assert.equal(result.thoughts[0].kind, 'evaluation');
  assert.ok(result.thoughts[0].id);
  assert.throws(() => core.composeResult(request, { content: state.content, thought: 'Rewrite' }));
  assert.doesNotThrow(() => core.validate(result));
  const check = new Ajv().compile(JSON.parse(readFileSync(new URL('canvas.schema.json', root))));
  assert.equal(check(result), true);
  const again = core.composeResult(core.buildRequest(result, request.action), { thought: 'A second evaluation.' });
  assert.equal(again.thoughts.length, 2);
  assert.deepEqual(again.thoughts[0], result.thoughts[0]);
});

test('whole transformation proposal preserves content until acceptance; stale acceptance is atomic', () => {
  const core = getCore();
  assert.equal(typeof core.composeResult, 'function');
  const state = core.initialState();
  const factor = core.addItem(state, 'strengths'); core.editItem(state, 'strengths', factor, 'Original strength');
  const content = structuredClone(state.content); content.strengths[0].text = 'Clearer strength';
  const request = core.buildRequest(state, { id: 'improve', comment: 'Be concrete', use_thoughts: true });
  const proposed = core.composeResult(request, { content, thought: 'Clarified the existing factor without adding unsupported claims.' });
  assert.deepEqual(proposed.content, state.content);
  assert.equal(proposed.proposals.length, 1);
  assert.throws(() => core.buildRequest(proposed, request.action), /proposal/i);
  const rejected = structuredClone(proposed); core.rejectProposal(rejected);
  assert.deepEqual(rejected.content, state.content);
  assert.equal(rejected.proposals.length, 0);
  assert.equal((rejected.thoughts || []).length, 0);
  const accepted = structuredClone(proposed); core.acceptProposal(accepted);
  assert.equal(accepted.content.strengths[0].id, factor);
  assert.equal(accepted.content.strengths[0].text, 'Clearer strength');
  assert.equal(accepted.thoughts[0].kind, 'improvement');
  const stale = structuredClone(proposed); stale.content.strengths[0].text = 'Local edit after proposal';
  const before = JSON.stringify(stale);
  assert.throws(() => core.acceptProposal(stale), /changed|stale/i);
  assert.equal(JSON.stringify(stale), before);
  assert.equal(new Ajv().compile(JSON.parse(readFileSync(new URL('canvas.schema.json', root))))(proposed), true);
});

test('Strategize enforces SWOT boundaries and extend mode preserves manually written strategies', () => {
  const core = getCore();
  assert.equal(typeof core.composeResult, 'function');
  const state = core.initialState();
  const id = core.addItem(state, 'so'); core.editItem(state, 'so', id, 'My manual strategy');
  const action = { id: 'strategize', mode: 'extend', comment: '', use_thoughts: true };
  const request = core.buildRequest(state, action);
  const content = structuredClone(state.content);
  content.strategies.so.push({ id: 'strategy-new', text: 'Another grounded strategy' });
  const result = core.composeResult(request, { content, thought: 'Added a complementary choice.' });
  assert.equal(result.proposals[0].content.strategies.so[0].id, id);
  content.strengths.push({ id: 'factor-new', text: 'Not permitted' });
  assert.throws(() => core.composeResult(request, { content, thought: 'Changed factors' }), /SWOT|factor/i);
  content.strengths = []; content.strategies.so.shift();
  assert.throws(() => core.composeResult(request, { content, thought: 'Deleted manual work' }), /preserve|existing/i);
  assert.doesNotThrow(() => core.composeResult(core.buildRequest(state, { ...action, mode: 'replace' }), { content, thought: 'Regenerated strategies at your request.' }));
});

test('invalid thought/proposal metadata is rejected and a second accepted cycle preserves annotations', () => {
  const core = getCore();
  const initial = core.initialState();
  const evaluation = core.composeResult(core.buildRequest(initial, { id: 'evaluate' }), { thought: 'Initial grounded evaluation.' });
  const candidate = structuredClone(evaluation.content);
  candidate.strategies.so.push({ id: 'new-so', text: '</script> A conditional strategy.' });
  const proposed = core.composeResult(core.buildRequest(evaluation, { id: 'strategize' }), { content: candidate, thought: '<img onerror=alert(1)> Reasoning remains plain text.' });
  for (const mutate of [
    s => { s.thoughts[0].kind = 'unknown'; },
    s => { s.proposals.push(structuredClone(s.proposals[0])); },
    s => { s.proposals[0].thought.id = s.thoughts[0].id; },
    s => { s.proposals[0].content.strategies.so[0].id = s.thoughts[0].id; },
    s => { s.proposals[0].content.framing.objective = 'Silently changed'; },
    s => { s.proposals[0].content.strengths.push({ id: 'extra-s', text: 'Strategize cannot change SWOT' }); }
  ]) {
    const state = structuredClone(proposed); mutate(state);
    assert.throws(() => core.validate(state));
  }
  const html = readFileSync(new URL('canvas.html', root), 'utf8');
  const packaged = core.packageHtml(html, proposed);
  assert.deepEqual(core.parseState(packaged.match(/<script id="canvas-state" type="application\/json">([\s\S]*?)<\/script>/)[1]), proposed);
  core.acceptProposal(proposed);
  assert.equal(proposed.thoughts.length, 2);
  assert.deepEqual(proposed.thoughts[0], evaluation.thoughts[0]);
  const second = core.composeResult(core.buildRequest(proposed, { id: 'evaluate', scope: 'tows' }), { thought: 'Second cycle assessment.' });
  assert.equal(second.thoughts.length, 3);
  assert.deepEqual(second.content, proposed.content);
});

test('result CLI packages an AI response and refuses invalid action output without creating a file', async () => {
  const { mkdtempSync, writeFileSync, rmSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { spawnSync } = await import('node:child_process');
  const temp = mkdtempSync(join(tmpdir(), 'pensive action '));
  try {
    const core = getCore();
    const request = core.buildRequest(core.initialState(), { id: 'evaluate', scope: 'both', comment: 'Prioritize coherence' });
    const input = join(temp, 'request.json'), response = join(temp, 'response.json'), output = join(temp, 'result.html');
    writeFileSync(input, JSON.stringify(request));
    writeFileSync(response, JSON.stringify({ thought: 'Sparse factors limit strategic inference.' }));
    const args = [fileURLToPath(new URL('../.agents/skills/pensive/scripts/package-swot.mjs', import.meta.url)), '--result', input, response, output];
    const run = spawnSync(process.execPath, args, { encoding: 'utf8' });
    assert.equal(run.status, 0, run.stderr);
    const state = core.parseState(readFileSync(output, 'utf8').match(/<script id="canvas-state" type="application\/json">([\s\S]*?)<\/script>/)[1]);
    assert.deepEqual(state.content, request.canvas.content);
    assert.equal(state.thoughts[0].text, 'Sparse factors limit strategic inference.');
    writeFileSync(response, JSON.stringify({ content: request.canvas.content, thought: 'Not allowed for Evaluate' }));
    args[4] = join(temp, 'invalid.html');
    const invalid = spawnSync(process.execPath, args, { encoding: 'utf8' });
    assert.notEqual(invalid.status, 0);
    assert.equal(existsSync(args[4]), false);
  } finally { rmSync(temp, { recursive: true }); }
});

test('unchanged retained concepts cannot receive new IDs; consolidation preserves an existing matching ID', () => {
  const core = getCore();
  const state = core.initialState();
  state.content.strengths = [{ id: 'original', text: 'Expert team' }, { id: 'duplicate', text: 'Expert team' }];
  const request = core.buildRequest(state, { id: 'improve' });
  const content = structuredClone(state.content);
  content.strengths = [{ id: 'replacement', text: 'Expert team' }];
  assert.throws(() => core.composeResult(request, { content, thought: 'Consolidated duplicate.' }), /identity|ID/i);
  content.strengths[0].id = 'original';
  assert.doesNotThrow(() => core.composeResult(request, { content, thought: 'Consolidated duplicate while preserving the existing ID.' }));
});

test('observed independent methodology responses satisfy action and packaging contracts', () => {
  const core = getCore();
  const observed = JSON.parse(readFileSync(new URL('methodology/swot-actions-observed.json', import.meta.url)));
  const before = JSON.stringify(observed.canvas);
  for (const entry of observed.cases) {
    const result = core.composeResult(core.buildRequest(observed.canvas, entry.action), entry.response);
    assert.deepEqual(result.content, observed.canvas.content);
    if (entry.action.id === 'evaluate') assert.equal(result.thoughts.length, 1);
    else { core.acceptProposal(result); assert.equal(result.proposals.length, 0); }
    assert.doesNotThrow(() => core.packageHtml(readFileSync(new URL('canvas.html', root), 'utf8'), result));
    assert.equal(JSON.stringify(observed.canvas), before);
  }
});
