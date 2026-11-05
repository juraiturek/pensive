import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
for (const framework of ['pages', 'five_whys']) {
  test(`${framework} preserves manual annotations separately from content`, () => {
    const core = require(`../.agents/skills/pensive/frameworks/${framework}/state.js`);
    const state = core.initialState();
    const before = structuredClone(state.content);
    state.annotations = [
      { id: 'note-1', target: { type: 'canvas' }, target_label: 'Whole canvas', text: 'Check the premise.' },
      { id: 'note-2', target: { type: framework === 'pages' ? 'item' : 'node', id: 'missing' }, target_label: 'Removed target', text: 'Still relevant.' }
    ];
    assert.deepEqual(core.parseState(JSON.stringify(state)), state);
    assert.deepEqual(state.content, before);
    assert.throws(() => core.validate({ ...state, annotations: [...state.annotations, state.annotations[0]] }));
  });
}

test('PAGES proposal resolution preserves notes on retained and replaced items', () => {
  const core = require('../.agents/skills/pensive/frameworks/pages/state.js');
  const state = core.initialState();
  const retained = core.addItem(state, 'parts');
  const replaced = core.addItem(state, 'parts');
  core.editItem(state, 'parts', retained, 'Retained concept');
  core.editItem(state, 'parts', replaced, 'Replaced concept');
  state.annotations = state.content.parts.map(item => ({
    id: 'note-' + item.id, target: { type: 'item', id: item.id },
    target_label: item.text, text: 'Look for evidence.'
  }));
  const content = structuredClone(state.content);
  content.parts = [{ id: retained, text: 'Revised concept' }, { id: 'new-item', text: 'New concept' }];
  for (const decision of ['accept', 'reject']) {
    const result = core.composeResult(core.buildRequest(state, { id: 'improve' }), { content, thought: 'Consider this change.' });
    core.resolveProposal(result, undefined, decision);
    assert.deepEqual(result.annotations, state.annotations);
    assert.equal(result.content.parts[0].id, retained);
    assert.equal(result.content.parts[1].id, decision === 'accept' ? 'new-item' : replaced);
  }
});

test('5 Whys Reflect and Six Hats preserve manual annotations alongside AI thoughts', () => {
  const core = require('../.agents/skills/pensive/frameworks/five_whys/state.js');
  const state = core.initialState();
  core.editText(state, 'root', 'Observed effect');
  state.annotations = [{
    id: 'note-1', target: { type: 'node', id: 'root' },
    target_label: 'Observed effect', text: 'Could this be a measurement artifact?'
  }];
  const reflected = core.composeResult(core.buildRequest(state, { id: 'evaluate' }), { thought: 'Check measurement consistency.' });
  const result = core.composeResult(core.buildRequest(reflected, {
    id: 'six_hats', hat: 'white', target: { type: 'node', id: 'root' }
  }), { observations: ['Measurement details are absent.'] });
  assert.deepEqual(result.annotations, state.annotations);
  assert.deepEqual(result.thoughts.map(thought => thought.kind), ['evaluation', 'six_hats']);
  assert.deepEqual(result.content, state.content);
});

test('PAGES dimension thoughts use a declared dimension key', () => {
  const core = require('../.agents/skills/pensive/frameworks/pages/state.js');
  const state = core.initialState();
  state.annotations = [{
    id: 'note-dimension', target: { type: 'section', id: 'self_concepts' },
    target_label: 'Self-concepts', text: 'Revisit this dimension.'
  }];
  assert.deepEqual(core.parseState(JSON.stringify(state)), state);
  state.annotations[0].target.id = 'unknown';
  assert.throws(() => core.validate(state));
});
