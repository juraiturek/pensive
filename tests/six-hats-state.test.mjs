import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import Ajv from 'ajv';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
for (const framework of ['swot', 'pages', 'vpc', 'five_whys']) {
  const core = require(`../.agents/skills/pensive/frameworks/${framework}/state.js`);
  test(`${framework} appends an independent Six Hats reflection`, () => {
    const canvas = core.initialState();
    const field = Object.keys(canvas.content.framing)[0];
    canvas.content.framing[field] = 'Recurring delay in order dispatch';
    const action = { id: 'six_hats', hat: 'white', target: { type: 'canvas' } };
    const request = core.buildRequest(canvas, action);
    const response = { observations: ['The frequency of the delay is unspecified.'] };
    const result = core.composeResult(request, response);
    const { thoughts, ...original } = result;
    assert.deepEqual(original, canvas);
    assert.equal(thoughts[0].kind, 'six_hats');
    assert.equal(thoughts[0].hat, 'white');
    assert.deepEqual(thoughts[0].observations, response.observations);
    assert.equal(thoughts[0].suggestions, undefined);
    assert.deepEqual(core.validate(JSON.parse(JSON.stringify(result))), result);
    const schema = JSON.parse(readFileSync(new URL(
      `../.agents/skills/pensive/frameworks/${framework}/canvas.schema.json`, import.meta.url,
    )));
    const validateSchema = new Ajv().compile(schema);
    assert.equal(validateSchema(result), true, JSON.stringify(validateSchema.errors));
    assert.throws(() => core.composeResult(request, { ...response, content: {} }));
    assert.throws(() => core.buildRequest(canvas, { ...action, hat: 'sage' }));
  });
}

test('target IDs are explicit and captured labels survive deletion', () => {
  const core = require('../.agents/skills/pensive/frameworks/swot/state.js');
  const canvas = core.initialState();
  canvas.content.weaknesses.push({ id: 'slow-dispatch', text: 'Manual dispatch review takes time.' });
  const target = { type: 'factor', id: 'slow-dispatch' };
  const action = { id: 'six_hats', hat: 'yellow', target };
  const request = core.buildRequest(canvas, action);
  const reflected = core.composeResult(request, {
    observations: ['Manual review offers an opportunity to spot unusual orders before dispatch.'],
    suggestions: ['Investigate which review checks catch exceptions.'],
  });
  assert.deepEqual(reflected.content, canvas.content);
  assert.equal(reflected.thoughts[0].target_label, canvas.content.weaknesses[0].text);
  const next = core.composeResult(core.buildRequest(reflected, { ...action, hat: 'black' }), {
    observations: ['One reviewer could become a bottleneck during a surge.'],
  });
  assert.equal(next.thoughts.length, 2);
  assert.deepEqual(next.thoughts[0], reflected.thoughts[0]);
  next.content.weaknesses.pop();
  assert.deepEqual(core.validate(next).thoughts, next.thoughts);
  assert.throws(() => core.buildRequest(next, action), /unavailable/);
  assert.throws(() => core.buildRequest(canvas, { ...action, target: { ...target, type: 'strategy' } }), /unavailable/);
  assert.throws(() => core.composeResult(request, { observations: [' '] }), /nonblank/);
  assert.throws(() => core.composeResult(request, { observations: ['A risk'], suggestions: [] }), /suggestions/);
});
