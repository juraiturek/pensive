import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = new URL('../.agents/skills/pensive/', import.meta.url);
const Vpc = createRequire(import.meta.url)(fileURLToPath(new URL('frameworks/vpc/state.js', root)));
const observed = JSON.parse(await readFile(new URL('methodology/vpc-observed.json', import.meta.url), 'utf8'));
const slot = /<!--pensive-state-start-->[\s\S]*?<!--pensive-state-end-->/;

// These tests establish protocol compatibility of retained observations, not reasoning quality.
test('observed rich and elicited sparse VPC drafts validate and package without losing unsupported empties', async () => {
  const html = await readFile(new URL('frameworks/vpc/canvas.html', root), 'utf8');
  const states = observed.creation_cases.filter(example => example.state);
  assert.ok(states.length >= 2);
  for (const { state } of states) {
    Vpc.validate(state);
    const packaged = Vpc.packageHtml(html, state);
    const embedded = packaged.match(/<script id="canvas-state" type="application\/json">([\s\S]*?)<\/script>/)[1];
    assert.deepEqual(Vpc.parseState(embedded), state);
    assert.equal(packaged.replace(slot, ''), html.replace(slot, ''));
    assert.deepEqual(state.content.pain_relievers, []);
    assert.deepEqual(state.content.gain_creators, []);
  }
});

test('observed VPC Evaluate and Improve responses obey boundaries through the real result CLI', async () => {
  const temporary = await mkdtemp(join(tmpdir(), 'vpc-methodology-'));
  try {
    for (const example of observed.action_cases) {
      Vpc.validateRequest(example.request);
      const result = Vpc.composeResult(example.request, example.response);
      assert.deepEqual(result.content, example.request.canvas.content);
      if (example.request.action.id === 'improve') {
        assert.deepEqual(result.proposals[0].content.framing, example.request.canvas.content.framing);
        const accepted = structuredClone(result);
        Vpc.acceptProposal(accepted);
        assert.deepEqual(accepted.content, example.response.content);
      } else {
        assert.equal(result.thoughts.at(-1).text, example.response.thought);
      }
      const requestPath = join(temporary, example.id + '-request.json');
      const responsePath = join(temporary, example.id + '-response.json');
      const outputPath = join(temporary, example.id + '.html');
      await writeFile(requestPath, JSON.stringify(example.request));
      await writeFile(responsePath, JSON.stringify(example.response));
      execFileSync(process.execPath, [fileURLToPath(new URL('scripts/package-vpc.mjs', root)), '--result', requestPath, responsePath, outputPath]);
      const embedded = (await readFile(outputPath, 'utf8')).match(/<script id="canvas-state" type="application\/json">([\s\S]*?)<\/script>/)[1];
      assert.deepEqual(Vpc.parseState(embedded).content, example.request.canvas.content);
    }
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});
