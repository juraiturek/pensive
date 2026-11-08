import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile, rm, access } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
const require = createRequire(import.meta.url),
  base = new URL('../.agents/skills/pensive/', import.meta.url),
  f = require(fileURLToPath(new URL('frameworks/five_forces/state.js', base)));
function ready() {
  const s = f.initialState();
  Object.assign(s.content.framing, {
    industry: 'Electric passenger vehicles',
    geography: 'Canada',
    objective: 'Assess entry attractiveness',
    rivals: 'Automakers',
    buyers: 'Private buyers and fleets',
    suppliers: 'Battery makers',
    substitutes: 'Transit; investigate need-specific alternatives',
    entrants: 'Unknown; investigate adjacent manufacturers',
  });
  return s;
}
test('Five Forces routing loads the same force catalogue for guidance, analysis, evaluation and Research', async () => {
  const skill = await readFile(new URL('SKILL.md', base), 'utf8');
  assert.match(skill, /Create, package or analyze Five Forces/);
  for (const section of f.sections) {
    const method = await readFile(
      new URL(`frameworks/five_forces/methods/${section}.md`, base),
      'utf8',
    );
    assert.match(
      method,
      /manual analysis, AI interpretation, host Research and quality evaluation/,
    );
    const html = await readFile(
      new URL('frameworks/five_forces/canvas.html', base),
      'utf8',
    );
    const embedded = JSON.parse(
      html.match(
        /<script id="force-guidance" type="application\/json">([\s\S]*?)<\/script>/,
      )[1],
    );
    assert.equal(embedded[section], method);
  }
});
test('Five Forces real CLI packages creation and reviewed results without wider mutation or overwriting', async () => {
  const tmp = await mkdtemp(join(tmpdir(), 'forces-cli-'));
  try {
    const s = ready(),
      cli = fileURLToPath(new URL('scripts/package-five-forces.mjs', base)),
      state = join(tmp, 'state.json'),
      req = join(tmp, 'request.json'),
      res = join(tmp, 'response.json');
    await writeFile(state, JSON.stringify(s));
    function run(args) {
      return spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });
    }
    const out = join(tmp, 'draft.html');
    assert.equal(run([state, out]).status, 0);
    assert.notEqual(run([state, out]).status, 0);
    for (const [action, response] of [
      [
        { id: 'evaluate' },
        {
          thought:
            'Input price inflation alone does not establish supplier power.',
        },
      ],
      [
        { id: 'improve', target: { type: 'section', id: 'suppliers' } },
        {
          content: {
            ...structuredClone(s.content),
            suppliers: {
              strength: null,
              confidence: 0.25,
              analysis: [
                {
                  id: 'supplier_reason',
                  text: 'Cost inflation observed; bargaining mechanism unestablished.',
                },
              ],
              research_notes:
                'User observation only; concentration and alternatives remain unverified.',
            },
          },
          thought:
            'Keep force strength unassigned pending structural evidence.',
        },
      ],
      [
        { id: 'research', target: { type: 'section', id: 'suppliers' } },
        {
          report:
            'No structural inference justified by the available evidence.',
          sources: [],
        },
      ],
      [
        { id: 'formulate_takeaways' },
        {
          takeaways:
            'T1 — Provisional industry view\nT4 — Supplier leverage remains unverified.',
          rationale: 'Retain uncertainty.',
        },
      ],
      [
        {
          id: 'six_hats',
          hat: 'black',
          target: { type: 'section', id: 'suppliers' },
        },
        { observations: ['Supplier concentration has not been established.'] },
      ],
    ]) {
      const request = f.buildRequest(s, action),
        before = JSON.stringify(request);
      await writeFile(req, before);
      await writeFile(res, JSON.stringify(response));
      const path = join(tmp, crypto.randomUUID() + '.html'),
        result = run(['--result', req, res, path]);
      assert.equal(result.status, 0, result.stderr);
      const html = await readFile(path, 'utf8'),
        embedded = f.parseState(
          html.match(
            /<script id="canvas-state" type="application\/json">([\s\S]*?)<\/script>/,
          )[1],
        );
      assert.deepEqual(embedded.content, s.content);
      assert.equal(await readFile(req, 'utf8'), before);
      f.validate(embedded);
    }
    const bad = join(tmp, 'invalid.html');
    await writeFile(req, JSON.stringify(f.buildRequest(s, { id: 'evaluate' })));
    await writeFile(res, JSON.stringify({ thought: 'x', content: s.content }));
    assert.notEqual(run(['--result', req, res, bad]).status, 0);
    await assert.rejects(access(bad));
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});
test('retained independent methodology cases validate and preserve explicit mutation boundaries', async () => {
  const record = JSON.parse(
    await readFile(
      new URL('methodology/five-forces-agent-observed.json', import.meta.url),
      'utf8',
    ),
  );
  assert.equal(record.cases.length, 6);
  for (const c of record.cases) {
    if (c.kind === 'create') {
      f.validate(c.output.canvas);
      f.requireFraming(c.output.canvas.content);
    } else {
      const request = c.input.request,
        response = c.output.response ?? c.output,
        result = f.composeResult(request, response);
      assert.deepEqual(result.content, request.canvas.content);
      if (request.action.id === 'improve') {
        f.acceptProposal(result);
        assert.deepEqual(
          result.content.framing,
          request.canvas.content.framing,
        );
        const target = request.action.target;
        if (target?.type === 'section')
          for (const k of f.sections)
            if (k !== target.id)
              assert.deepEqual(result.content[k], request.canvas.content[k]);
      }
    }
  }
});
