import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
for (const framework of ['pages', 'vpc']) {
  const core = require(`../.agents/skills/pensive/frameworks/${framework}/state.js`);
  const fixture = () => {
    const state = core.initialState();
    for (const section of core.sections) core.collection(state, section).push(
      { id: `${section}-a`, text: 'First' },
      { id: `${section}-b`, text: 'Second' },
      { id: `${section}-c`, text: 'Third' }
    );
    state.thoughts = [{ id: 'prior-thought', kind: 'evaluation', text: 'Prior observation.' }];
    if (framework === 'pages') core.resetBaseline(state);
    return state;
  };

  test(`${framework}: reorder all collections without changing identities, annotations or unrelated content`, () => {
    for (const section of core.sections) {
      const state = fixture(), before = structuredClone(state);
      core.reorderItem(state, section, `${section}-a`, 2);
      const expected = structuredClone(before);
      expected.content[section] = [before.content[section][1], before.content[section][2], before.content[section][0]];
      assert.deepEqual(state, expected);
      assert.deepEqual(core.parseState(JSON.stringify(state)), expected);
      core.reorderItem(state, section, `${section}-a`, 0);
      assert.deepEqual(state, before);
      core.reorderItem(state, section, `${section}-b`, 1);
      assert.deepEqual(state, before, 'a no-op must preserve the complete state');
    }
  });

  test(`${framework}: invalid reorder requests are atomic`, () => {
    assert.equal(typeof core.reorderItem, 'function');
    const state = fixture(), section = core.sections[0], before = structuredClone(state);
    for (const [target, id, index] of [
      [section, `${section}-a`, -1], [section, `${section}-a`, 3],
      [section, `${section}-a`, 0.5], [section, `${section}-a`, '1'],
      [section, `${section}-a`, NaN], [section, 'missing', 0],
      [core.sections[1], `${section}-a`, 0], ['unknown', `${section}-a`, 0]
    ]) {
      assert.throws(() => core.reorderItem(state, target, id, index));
      assert.deepEqual(state, before);
    }
  });

  test(`${framework}: pending changed collections are locked; resolved and unaffected moves retain stale review safety`, () => {
    const initial = fixture(), [first, second, unaffected] = core.sections;
    const content = structuredClone(initial.content);
    content[first][0].text = 'Proposed first'; content[second][0].text = 'Proposed second';
    const pending = core.composeResult(core.buildRequest(initial, { id: 'improve' }), { content, thought: 'Clarified two collections.' });
    const before = structuredClone(pending);
    assert.throws(() => core.reorderItem(pending, first, `${first}-a`, 2), /review|pending|resolve/i);
    assert.deepEqual(pending, before);
    // A no-op is still protected while its collection awaits review.
    assert.throws(() => core.reorderItem(pending, first, `${first}-a`, 0), /review|pending|resolve/i);
    assert.deepEqual(pending, before);
    core.reorderItem(pending, unaffected, `${unaffected}-a`, 2);
    const manual = structuredClone(pending);
    assert.throws(() => core.acceptProposal(pending), /changed/i);
    assert.deepEqual(pending, manual);
    core.rejectProposal(pending);
    assert.deepEqual(pending.content, manual.content, 'rejection preserves local ordering');

    const partial = structuredClone(before);
    core.resolveProposal(partial, [first], 'accept');
    const baseline = structuredClone(partial.ripple_baseline);
    core.reorderItem(partial, first, `${first}-a`, 2);
    assert.equal(core.collection(partial, first)[2].id, `${first}-a`);
    assert.deepEqual(partial.ripple_baseline, baseline);
    const reordered = structuredClone(partial);
    assert.throws(() => core.resolveProposal(partial, [second], 'accept'), /changed/i);
    assert.deepEqual(partial, reordered);
    core.rejectProposal(partial);
    assert.deepEqual(partial.content, reordered.content);
  });

  if (framework === 'pages') test('pages: reorder alone preserves the Ripple baseline and does not create semantic changes', () => {
    const state = fixture(), baseline = structuredClone(state.ripple_baseline);
    for (const section of core.sections) core.reorderItem(state, section, `${section}-a`, 2);
    assert.deepEqual(state.ripple_baseline, baseline);
    assert.deepEqual(core.changes(state), []);
    assert.throws(() => core.buildRequest(state, { id: 'ripple', sources: [core.sections[0]] }), /changed/i);
  });
}
