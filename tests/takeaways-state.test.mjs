import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import Ajv from 'ajv';

const require = createRequire(import.meta.url);
for (const framework of ['swot', 'pages', 'vpc', 'five_whys']) {
  const core = require(`../.agents/skills/pensive/frameworks/${framework}/state.js`);
  test(`${framework} preserves optional Takeaways and validates its type`, () => {
    const canvas = core.initialState();
    core.validate(canvas);
    canvas.takeaways = 'First line\nSecond line';
    assert.equal(core.validate(canvas).takeaways, canvas.takeaways);
    canvas.takeaways = false;
    assert.throws(() => core.validate(canvas), /Takeaways/);
  });
  test(`${framework} reviews Takeaways atomically and detects stale input`, () => {
    const canvas = core.initialState();
    const formulate = { id: 'formulate_takeaways' };
    const review = { id: 'review_takeaways', include_annotations: true, comment: 'Keep it provisional.' };
    assert.throws(() => core.buildRequest(canvas, review), /existing Takeaways/i);
    const request = core.buildRequest(canvas, formulate);
    assert.throws(() => core.composeResult(request, { takeaways: 'Draft', content: {} }), /response/i);
    const pending = core.composeResult(request, { takeaways: 'Draft', rationale: 'Limited evidence.' });
    const schema = require(`../.agents/skills/pensive/frameworks/${framework}/canvas.schema.json`);
    const schemaCheck = new Ajv().compile(schema);
    assert.equal(schemaCheck(pending), true, JSON.stringify(schemaCheck.errors));
    assert.equal(pending.takeaways, undefined);
    assert.equal(pending.proposals[0].base_annotations, undefined);
    assert.throws(() => core.buildRequest(pending, formulate), /pending proposal/i);
    const accept = state => framework === 'five_whys' ? core.resolveProposal(state, 'accept') : core.acceptProposal(state);
    const reject = state => framework === 'five_whys' ? core.resolveProposal(state, 'reject') : core.rejectProposal(state);
    pending.content.framing = Object.fromEntries(Object.entries(pending.content.framing).reverse());
    accept(pending);
    assert.deepEqual(pending, { ...canvas, takeaways: 'Draft' });

    const revise = core.buildRequest(pending, review);
    const fresh = core.composeResult(revise, { takeaways: 'Revised', rationale: 'Qualify the finding.' });
    const staleCore = structuredClone(fresh);
    const key = Object.keys(staleCore.content.framing)[0];
    staleCore.content.framing[key] = 'New framing';
    assert.throws(() => accept(staleCore), /stale/i);
    accept(fresh);
    assert.equal(fresh.takeaways, 'Revised');
    const next = core.composeResult(revise, { takeaways: 'Revised', rationale: 'Qualify the finding.' });
    next.annotations = [{ id: 'note-1', target: { type: 'canvas' }, target_label: 'Canvas', text: 'I prefer the first draft.' }];
    assert.throws(() => accept(next), /stale/i);
    next.takeaways = 'Manual edit';
    reject(next);
    assert.equal(next.takeaways, 'Manual edit');
    assert.equal(next.proposals, undefined);
    const evaluated = core.composeResult(core.buildRequest(next, { id: 'evaluate' }), { thought: 'Assessment.' });
    assert.equal(evaluated.takeaways, 'Manual edit');

    if (framework === 'five_whys') {
      core.editText(evaluated, 'root', 'Delayed batches');
      const expand = core.buildRequest(evaluated, { id: 'expand', mode: 'deepen', target: { type: 'node', id: 'root' } });
      const expanded = core.composeResult(expand, { thought: 'Plausible explanation.', children: [{ text: 'Sensor resets.' }] });
      accept(expanded);
      assert.equal(expanded.takeaways, 'Manual edit');
    } else {
      const content = structuredClone(evaluated.content);
      const collection = framework === 'swot' ? 'strengths' : core.sections[0];
      content[collection].push({ id: 'new-item', text: 'New analytical finding.' });
      const improved = core.composeResult(core.buildRequest(evaluated, { id: 'improve' }), { content, thought: 'New finding.' });
      accept(improved);
      assert.equal(improved.takeaways, 'Manual edit');
    }
  });
}
