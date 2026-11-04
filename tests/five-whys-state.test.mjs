import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
const root = new URL('../.agents/skills/pensive/frameworks/five_whys/', import.meta.url),
  require = createRequire(import.meta.url);
function core() {
  assert.ok(existsSync(new URL('state.js', root)), '5 Whys state missing');
  return require(fileURLToPath(new URL('state.js', root)));
}
function fixture() {
  const w = core(),
    s = w.initialState();
  w.editText(s, 'root', 'Orders arrive late');
  const a = w.addChild(s, 'root', 'Hypothesis: queue delay');
  const b = w.addChild(s, 'root', 'Hypothesis: transport delay');
  const c = w.addChild(s, a, 'Hypothesis: staffing gap');
  return { w, s, a, b, c };
}
test('blank state matches schema; root framing and stable tree identity', () => {
  const w = core(),
    s = w.initialState();
  assert.equal(
    new Ajv().compile(JSON.parse(readFileSync(new URL('canvas.schema.json', root))))(s),
    true,
  );
  assert.deepEqual(s.cursor, ['root']);
  assert.equal(s.content.tree.text, '');
  assert.equal(w.framing.length, 4);
  w.editFraming(s, 'observable_symptom', 'Observed late deliveries');
  w.editText(s, 'root', 'Late deliveries');
  const a = w.addChild(s, 'root', 'Hypothesis: late dispatch');
  assert.throws(() => w.editText(s, 'root', 'Changed'), /locked/);
  w.editText(s, a, 'Hypothesis: queue delay');
  assert.equal(w.find(s, a).node.text, 'Hypothesis: queue delay');
  w.deleteNode(s, a);
  w.editText(s, 'root', 'Reframed');
  assert.equal(s.content.tree.id, 'root');
});
test('V2 strand navigation prefers first-child continuation and exposes sibling side doors', () => {
  const { w, s, a, b, c } = fixture();
  w.navigate(s, a);
  assert.deepEqual(s.cursor, ['root', a, c]);
  let strand = w.strand(s);
  assert.equal(strand[1].side_doors[0].target_node_id, b);
  const alternative = w.addChild(s, a, 'Alternative staffing mechanism');
  assert.deepEqual(s.cursor, ['root', a, alternative]);
  strand = w.strand(s);
  assert.equal(strand[2].side_doors[0].target_node_id, c);
  w.navigate(s, b);
  assert.deepEqual(s.cursor, ['root', b]);
});
test('overview preserves V2 leaf-width geometry and orthogonal edges', () => {
  const { w, s, a, b, c } = fixture(),
    v = w.overview(s);
  assert.equal(v.nodes.length, 4);
  assert.equal(v.edges.length, 3);
  assert.deepEqual(
    v.nodes.map((n) => [n.id, n.x, n.y]),
    [
      ['root', 236, 52],
      [a, 122, 200],
      [c, 122, 348],
      [b, 350, 200],
    ],
  );
  assert.equal(v.board_width, 960);
  assert.equal(v.board_height, 548);
  assert.equal(v.edges[0].path, 'M 236.00 95.00 L 236.00 126.00 L 122.00 126.00 L 122.00 157.00');
});
test('closure, reopening and deletion preserve unrelated branches and repair cursor', () => {
  const { w, s, a, b, c } = fixture();
  assert.throws(() => w.closeBranch(s, a, 'Do something'), /leaf/);
  assert.throws(() => w.closeBranch(s, 'root', 'x'));
  w.closeBranch(s, c, 'Test staffing adjustment');
  assert.throws(() => w.addChild(s, c, 'No'), /closed/);
  w.reopen(s, c);
  assert.equal(w.find(s, c).node.output, null);
  const other = structuredClone(w.find(s, b).node);
  w.deleteNode(s, a);
  assert.deepEqual(s.cursor, ['root', b]);
  assert.deepEqual(w.find(s, b).node, other);
  assert.throws(() => w.deleteNode(s, 'root'));
});
test('more than three siblings and five levels remain navigable with no invented completion', () => {
  const w = core(),
    s = w.initialState();
  w.editText(s, 'root', 'Effect');
  let deep = 'root';
  for (let i = 0; i < 12; i++) deep = w.addChild(s, deep, 'Cause ' + i);
  for (let i = 0; i < 7; i++) w.addChild(s, 'root', 'Alternative ' + i);
  w.navigate(s, deep);
  w.validate(s);
  assert.equal(s.cursor.length, 13);
  assert.equal(w.overview(s).nodes.length, 20);
  assert.equal(w.strand(s)[0].show_trifurcation_hint, true);
});
test('malformed states and failed operations are rejected without mutation', () => {
  const w = core();
  for (const change of [
    (s) => (s.extra = 1),
    (s) => (s.framework = 'swot'),
    (s) => (s.schema_version = '2'),
    (s) => (s.cursor = ['missing']),
    (s) => (s.content.tree.children = [s.content.tree]),
    (s) => (s.content.tree.is_terminal = true),
    (s) => (s.content.tree.output = 'bad'),
    (s) => (s.content.framing.extra = 'x'),
    (s) => (s.content.tree.children = [{ ...s.content.tree }]),
    (s) => (s.content.tree.text = 3),
  ]) {
    const s = w.initialState();
    change(s);
    assert.throws(() => w.validate(s));
  }
  const { s } = fixture(),
    before = structuredClone(s);
  for (const op of [
    () => w.addChild(s, 'missing', 'x'),
    () => w.editText(s, 'root', 'x'),
    () => w.editText(s, s.cursor.at(-1), ''),
    () => w.navigate(s, 'missing'),
    () => w.editFraming(s, '__proto__', 'x'),
  ]) {
    assert.throws(op);
    assert.deepEqual(s, before);
  }
});
test('standalone build and safe state-slot packaging are deterministic', async () => {
  const w = core();
  assert.ok(existsSync(new URL('canvas.html', root)), '5 Whys canvas missing');
  const { buildCanvas } = await import(new URL('../../scripts/package-five-whys.mjs', root));
  const html = readFileSync(new URL('canvas.html', root), 'utf8');
  assert.equal(await buildCanvas(), html);
  const s = w.initialState();
  s.content.tree.text = '</script><img src=x onerror=alert(1)>&\u2028';
  const out = w.packageHtml(html, s),
    slot = /<!--pensive-state-start-->[\s\S]*?<!--pensive-state-end-->/;
  assert.equal(out.replace(slot, ''), html.replace(slot, ''));
  assert.deepEqual(
    w.parseState(
      out.match(/<script id="canvas-state" type="application\/json">([\s\S]*?)<\/script>/)[1],
    ),
    s,
  );
});
test('Reflect handoff clones complete state and produces only an evaluation thought', () => {
  const { w, s } = fixture(),
    before = structuredClone(s);
  assert.equal(typeof w.buildRequest, 'function', 'Reflect request unavailable');
  const request = w.buildRequest(s, {
    id: 'evaluate',
    comment: 'Test evidence gaps',
    use_thoughts: false,
  });
  assert.deepEqual(request.canvas, s);
  request.canvas.content.tree.text = 'Changed';
  assert.deepEqual(s, before);
  const out = w.composeResult(w.buildRequest(s, { id: 'evaluate' }), {
    thought:
      'The queue explanation is plausible, but timing evidence is absent. Compare dispatch and delivery timestamps.',
  });
  assert.deepEqual(out.content, s.content);
  assert.deepEqual(out.cursor, s.cursor);
  assert.equal(out.thoughts[0].kind, 'evaluation');
  w.validate(out);
  for (const action of [
    { id: 'improve' },
    { id: 'evaluate', target: { type: 'node', id: 'root' } },
    { id: 'evaluate', research: true },
    { id: 'evaluate', use_thoughts: 1 },
  ])
    assert.throws(() => w.buildRequest(s, action));
  assert.throws(() =>
    w.composeResult({ canvas: s, action: { id: 'evaluate' }, extra: 1 }, { thought: 'x' }),
  );
  assert.throws(() =>
    w.composeResult(
      { canvas: s, action: { id: 'evaluate' } },
      { thought: 'x', content: s.content },
    ),
  );
  assert.throws(() => w.composeResult({ canvas: s, action: { id: 'evaluate' } }, { thought: '' }));
  assert.deepEqual(s, before);
});
test('Expand Deepen proposes direct children only; review preserves IDs and unrelated branches', () => {
  const { w, s, a, b } = fixture(),
    before = structuredClone(s);
  assert.equal(typeof w.resolveProposal, 'function', 'Append review unavailable');
  const request = w.buildRequest(s, {
      id: 'expand',
      target: { type: 'node', id: a },
      mode: 'deepen',
      comment: 'Consider alternative direct mechanisms',
    }),
    out = w.composeResult(request, {
      thought: 'These are hypotheses to test.',
      children: [{ text: 'Hypothesis: arrival rate exceeds service capacity' }],
    });
  assert.deepEqual(out.content, s.content);
  assert.deepEqual(out.proposals[0].target, request.action.target);
  assert.equal(out.proposals[0].parent_id, a);
  assert.equal(out.proposals[0].children.length, 1);
  assert.throws(() => w.buildRequest(out, { id: 'evaluate' }), /pending/);
  w.navigate(out, b);
  w.resolveProposal(out, 'accept');
  assert.equal(w.find(out, a).node.children.length, 2);
  assert.deepEqual(w.find(out, b).node, w.find(before, b).node);
  assert.deepEqual(out.content.framing, before.content.framing);
  assert.deepEqual(out.cursor, ['root', b]);
  assert.equal(out.proposals, undefined);
  assert.equal(out.thoughts.at(-1).kind, 'expansion');
  assert.deepEqual(s, before);
});
test('Expand Branch targets an explanation but may append siblings only', () => {
  const { w, s, a, b } = fixture(),
    request = w.buildRequest(s, { id: 'expand', mode: 'branch', target: { type: 'node', id: a } }),
    out = w.composeResult(request, {
      thought: 'Transport is a complementary possibility, not proven.',
      children: [{ text: 'Hypothesis: address validation delay' }],
    });
  assert.equal(out.proposals[0].parent_id, 'root');
  const aBefore = structuredClone(w.find(s, a).node);
  w.resolveProposal(out, 'accept');
  assert.deepEqual(w.find(out, a).node, aBefore);
  assert.deepEqual(w.find(out, b).node, w.find(s, b).node);
  assert.equal(out.content.tree.children.length, 3);
  assert.throws(
    () => w.buildRequest(s, { id: 'expand', mode: 'branch', target: { type: 'node', id: 'root' } }),
    /root/,
  );
});
test('Expand no-result, reject, stale guards and imported proposal tampering are safe', () => {
  const { w, s, a, b, c } = fixture(),
    req = w.buildRequest(s, { id: 'expand', mode: 'deepen', target: { type: 'node', id: a } });
  const no = w.composeResult(req, {
    thought: 'Insufficient evidence; compare timestamps first.',
    children: [],
  });
  assert.equal(no.proposals, undefined);
  assert.deepEqual(no.content, s.content);
  const out = w.composeResult(req, {
      thought: 'Possible cause.',
      children: [{ text: 'Hypothesis: workload spike' }],
    }),
    before = structuredClone(out);
  w.editText(out, b, 'Local revision');
  assert.throws(() => w.resolveProposal(out, 'accept'), /stale/i);
  assert.equal(w.find(out, a).node.children.length, 1);
  w.resolveProposal(out, 'reject');
  assert.equal(w.find(out, b).node.text, 'Local revision');
  assert.equal(out.thoughts, undefined);
  for (const tamper of [
    (p) => (p.parent_id = b),
    (p) => (p.target.id = b),
    (p) => (p.mode = 'branch'),
    (p) => (p.children[0].id = c),
    (p) => (p.children[0].children = [{ id: 'x' }]),
    (p) => (p.extra = 1),
    (p) => (p.action = 'improve'),
    (p) => (p.base_content.framing.observable_symptom = 3),
  ]) {
    const bad = structuredClone(before);
    tamper(bad.proposals[0]);
    assert.throws(() => w.validate(bad));
  }
  w.editFraming(before, 'observable_symptom', 'Revised framing');
  assert.throws(() => w.resolveProposal(before, 'accept'), /stale/i);
  assert.throws(() =>
    w.composeResult(req, { thought: 'x', children: [{ id: 'arbitrary', text: 'bad' }] }),
  );
  assert.throws(() =>
    w.composeResult(req, {
      thought: 'x',
      children: [{ text: 'Hypothesis: dispatch queue' }],
      parent_id: b,
    }),
  );
});
test('node actions reject missing/incompatible targets and cannot append to closed nodes', () => {
  const { w, s, c } = fixture();
  for (const action of [
    { id: 'expand' },
    { id: 'expand', mode: 'branch', target: { type: 'canvas', id: c } },
    { id: 'expand', mode: 'deepen', target: { type: 'node', id: 'missing' } },
    { id: 'expand', mode: 'unknown', target: { type: 'node', id: c } },
  ])
    assert.throws(() => w.buildRequest(s, action));
  w.closeBranch(s, c, 'Test adjustment');
  assert.throws(
    () => w.buildRequest(s, { id: 'expand', mode: 'deepen', target: { type: 'node', id: c } }),
    /closed/,
  );
});
test('retained actual V2 helper results match strand side doors, navigation, coordinates and SVG paths', () => {
  const w = core(),
    fixtures = JSON.parse(
      readFileSync(new URL('methodology/five-whys-v2-parity.json', import.meta.url)),
    );
  for (const f of fixtures) {
    const s = w.initialState();
    s.content.tree = f.tree;
    s.cursor = f.cursor;
    const strand = w.strand(s);
    assert.deepEqual(
      strand.map((n) => [
        n.id,
        n.depth,
        n.is_root,
        n.is_terminal,
        n.can_edit_text,
        n.is_cursor_tip,
        n.side_doors,
      ]),
      f.strand.map((n) => [
        n.id,
        n.depth,
        n.is_root,
        n.is_terminal,
        n.can_edit_text,
        n.is_cursor_tip,
        n.side_doors,
      ]),
    );
    const overview = w.overview(s),
      expected = f.overview.levels.flat().sort((a, b) => a.id.localeCompare(b.id)),
      actual = [...overview.nodes].sort((a, b) => a.id.localeCompare(b.id));
    assert.deepEqual(
      actual.map((n) => [
        n.id,
        n.x,
        n.y,
        n.text,
        n.output_text,
        n.is_cursor_tip,
        n.is_active_strand,
      ]),
      expected.map((n) => [
        n.id,
        n.x,
        n.y,
        n.text,
        n.output_text,
        n.is_cursor_tip,
        n.is_active_strand,
      ]),
    );
    assert.deepEqual(overview.edges, f.overview.edges);
    assert.equal(overview.board_width, f.overview.layout.board_width);
    assert.equal(overview.board_height, f.overview.layout.board_height);
    for (const [id, path] of Object.entries(f.navigation)) {
      w.navigate(s, id);
      assert.deepEqual(s.cursor, path);
    }
  }
});
test('packager refuses overwrite/invalid input and validates action response through the real CLI', async () => {
  const { mkdtemp, writeFile, rm } = await import('node:fs/promises'),
    { tmpdir } = await import('node:os'),
    { join } = await import('node:path'),
    { execFileSync } = await import('node:child_process'),
    dir = await mkdtemp(join(tmpdir(), 'whys-cli-')),
    script = fileURLToPath(new URL('../../scripts/package-five-whys.mjs', root)),
    w = core();
  try {
    const s = w.initialState();
    await writeFile(join(dir, 'state.json'), JSON.stringify(s));
    execFileSync(process.execPath, [script, join(dir, 'state.json'), join(dir, 'out.html')]);
    assert.throws(() =>
      execFileSync(process.execPath, [script, join(dir, 'state.json'), join(dir, 'out.html')], {
        stdio: 'pipe',
      }),
    );
    await writeFile(join(dir, 'bad.json'), '{}');
    assert.throws(() =>
      execFileSync(process.execPath, [script, join(dir, 'bad.json'), join(dir, 'bad.html')], {
        stdio: 'pipe',
      }),
    );
    assert.equal(existsSync(join(dir, 'bad.html')), false);
    await writeFile(
      join(dir, 'request.json'),
      JSON.stringify(w.buildRequest(s, { id: 'evaluate' })),
    );
    await writeFile(
      join(dir, 'response.json'),
      JSON.stringify({ thought: 'State the observed effect first.' }),
    );
    execFileSync(process.execPath, [
      script,
      '--result',
      join(dir, 'request.json'),
      join(dir, 'response.json'),
      join(dir, 'result.html'),
    ]);
    const html = readFileSync(join(dir, 'result.html'), 'utf8'),
      out = w.parseState(
        html.match(/<script id="canvas-state" type="application\/json">([\s\S]*?)<\/script>/)[1],
      );
    assert.deepEqual(out.content, s.content);
    assert.equal(out.thoughts[0].text, 'State the observed effect first.');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
test('side-door truncation retains V2 48-character labels and untitled fallback', () => {
  const w = core(),
    s = w.initialState();
  w.editText(s, 'root', 'Observed effect');
  const a = w.addChild(s, 'root', 'A'.repeat(60));
  w.addChild(s, 'root', 'Other cause');
  assert.equal(w.strand(s)[1].side_doors[0].label, 'A'.repeat(47) + '…');
  w.find(s, a).node.text = '';
  assert.equal(w.strand(s)[1].side_doors[0].label, '(untitled)');
});
