import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const skill = fileURLToPath(new URL('../.agents/skills/pensive/', import.meta.url));
const observed = JSON.parse(readFileSync(new URL('methodology/cross-framework-fit-observed.json', import.meta.url)));
const Ajv = require('ajv');
const ajv = new Ajv({ strict: false });
const packages = Object.fromEntries(['swot', 'pages'].map(id => [id, {
  state: require(join(skill, 'frameworks', id, 'state.js')),
  schema: ajv.compile(JSON.parse(readFileSync(join(skill, 'frameworks', id, 'canvas.schema.json')))),
  html: readFileSync(join(skill, 'frameworks', id, 'canvas.html'), 'utf8')
}]));
const slot = /<!--pensive-state-start-->[\s\S]*?<!--pensive-state-end-->/;

// These checks establish protocol compatibility, not the quality of synthetic reasoning.
test('retained fit observations preserve state, action and artifact contracts', () => {
  const temporary = mkdtempSync(join(tmpdir(), 'pensive-fit-'));
  function validate(state) {
    const pkg = packages[state.framework];
    pkg.state.validate(state);
    assert.ok(pkg.schema(state), JSON.stringify(pkg.schema.errors));
  }
  function packageCase(id, framework, inputs) {
    const paths = inputs.map((input, index) => {
      const path = join(temporary, `${id}-${index}.json`);
      writeFileSync(path, JSON.stringify(input));
      return path;
    });
    const output = join(temporary, `${id}.html`);
    execFileSync(process.execPath, [join(skill, 'scripts', `package-${framework}.mjs`),
      ...(inputs.length === 2 ? ['--result'] : []), ...paths, output]);
    const html = readFileSync(output, 'utf8');
    assert.equal(html.replace(slot, ''), packages[framework].html.replace(slot, ''));
    const state = JSON.parse(html.match(/<script id="canvas-state" type="application\/json">([\s\S]*?)<\/script>/)[1]);
    validate(state);
    return state;
  }
  try {
    for (const { id, state } of observed.creation_cases) {
      validate(state);
      if (state.framework === 'pages') assert.deepEqual(packages.pages.state.changes(state), []);
      else assert.ok(Object.values(state.content.strategies).every(items => items.length === 0));
      assert.deepEqual(packageCase(id, state.framework, [state]), state);
    }
    for (const { id, request, response } of observed.action_cases) {
      const method = packages[request.canvas.framework].state;
      const before = structuredClone(request);
      method.validateRequest(request);
      const result = method.composeResult(request, response);
      assert.deepEqual(request, before);
      validate(result);
      assert.deepEqual(result.content, request.canvas.content);
      assert.deepEqual(result.ripple_baseline, request.canvas.ripple_baseline);
      if (request.action.id === 'evaluate') {
        assert.equal(result.thoughts.at(-1).text, response.thought);
      } else {
        assert.deepEqual(result.proposals[0].content.framing, request.canvas.content.framing);
        for (const source of request.action.sources || []) {
          assert.deepEqual(result.proposals[0].content[source], request.canvas.content[source]);
        }
        const accepted = structuredClone(result);
        method.acceptProposal(accepted);
        assert.deepEqual(accepted.content, response.content);
        assert.deepEqual(accepted.ripple_baseline, request.canvas.ripple_baseline);
        validate(accepted);
        const invalid = structuredClone(response);
        const key = Object.keys(invalid.content.framing)[0];
        invalid.content.framing[key] += ' altered';
        assert.throws(() => method.composeResult(request, invalid), /preserve framing/);
      }
      const packaged = packageCase(id, request.canvas.framework, [request, response]);
      assert.deepEqual(packaged.content, request.canvas.content);
      assert.deepEqual(packaged.ripple_baseline, request.canvas.ripple_baseline);
      if (request.action.id === 'evaluate') assert.equal(packaged.thoughts.at(-1).text, response.thought);
      else assert.deepEqual(packaged.proposals[0].content, response.content);
    }
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});
