import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const core = require('../.agents/skills/pensive/frameworks/swot/state.js');
const observed = JSON.parse(readFileSync(new URL('methodology/swot-collaboration-observed.json', import.meta.url)));
const html = readFileSync(new URL('../.agents/skills/pensive/frameworks/swot/canvas.html', import.meta.url), 'utf8');

// Protocol checks on actual retained application outputs; not a reasoning-quality score.
test('collaboration observations preserve submitted state, identities and review boundaries', () => {
  const cases = [observed.baseline.C, observed.revised.C, observed.revised.B2];
  for (const { request, response } of cases) {
    const before = structuredClone(request);
    const result = core.composeResult(request, response);
    assert.deepEqual(request, before);
    assert.deepEqual(result.content, request.canvas.content);
    assert.deepEqual(result.proposals[0].content.framing, request.canvas.content.framing);
    const ids = state => [...core.factors, ...core.strategies].flatMap(section => core.collection(state, section).map(item => item.id)).sort();
    assert.deepEqual(ids({ content: response.content }), ids(request.canvas));
    const packaged = core.packageHtml(html, result);
    const embedded = JSON.parse(packaged.match(/<script id="canvas-state" type="application\/json">([\s\S]*?)<\/script>/)[1]);
    assert.deepEqual(embedded, result);
    assert.equal(packaged.replace(/<!--pensive-state-start-->[\s\S]*?<!--pensive-state-end-->/, ''), html.replace(/<!--pensive-state-start-->[\s\S]*?<!--pensive-state-end-->/, ''));
    core.acceptProposal(result);
    assert.deepEqual(result.content, response.content);
  }
});
