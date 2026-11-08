import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import Ajv from 'ajv';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const root = new URL(
  '../.agents/skills/pensive/frameworks/five_forces/',
  import.meta.url,
);
function core() {
  assert.ok(existsSync(new URL('state.js', root)), 'Five Forces state missing');
  return require(fileURLToPath(new URL('state.js', root)));
}
function ready(f) {
  const s = f.initialState();
  Object.assign(s.content.framing, {
    industry: 'Passenger electric vehicle manufacturing',
    geography: 'Canada',
    objective: 'Assess entry attractiveness',
    rivals: 'Established automakers',
    buyers: 'Private buyers and fleets',
    suppliers: 'Battery and component suppliers',
    substitutes: 'Public transit and existing vehicles',
    entrants: 'Unknown; investigate adjacent manufacturers',
  });
  return s;
}
function changed(s) {
  const c = structuredClone(s.content);
  Object.assign(c.buyers, {
    strength: 'strong',
    confidence: 0.8,
    analysis: [
      { id: 'reason1', text: 'Fleet concentration enables negotiation.' },
    ],
    research_notes: '## Evidence\n[Source](https://example.org/industry)',
  });
  return c;
}
test('Five Forces blank state allows manual work, nullable structured assessments, snippets and draft trajectories', () => {
  const f = core(),
    s = f.initialState();
  f.validate(s);
  assert.equal(s.content.buyers.strength, null);
  assert.equal(s.content.buyers.confidence, null);
  for (const strength of [null, ...f.strengths]) {
    s.content.buyers.strength = strength;
    for (const confidence of [null, 0, 0.805, 1]) {
      s.content.buyers.confidence = confidence;
      f.validate(s);
    }
  }
  s.content.buyers.analysis = [
    { id: 'a1', text: 'Observation → mechanism → implication' },
  ];
  s.content.buyers.trajectory = {
    direction: 'uncertain',
    horizon: '2027–2030',
    confidence: 0.4,
    analysis: [{ id: 'a2', text: 'Assumption: fleet consolidation continues' }],
    research_notes: '',
  };
  f.validate(s);
  assert.deepEqual(f.parseState(JSON.stringify(s)), s);
  const valid = new Ajv().compile(
    JSON.parse(readFileSync(new URL('canvas.schema.json', root))),
  );
  assert.ok(valid(s), JSON.stringify(valid.errors));
});
test('Five Forces rejects malformed values, duplicate identities and schema/runtime mismatches', () => {
  const f = core();
  for (const mutate of [
    (s) => (s.content.buyers.confidence = 1.1),
    (s) => (s.content.buyers.confidence = -0.1),
    (s) => (s.content.buyers.confidence = NaN),
    (s) => (s.content.buyers.strength = 'not_assessed'),
    (s) => (s.content.buyers.analysis = ['not a stable snippet']),
    (s) =>
      (s.content.buyers.analysis = [
        { id: 'same', text: 'x' },
        { id: 'same', text: 'y' },
      ]),
    (s) => (s.content.buyers.trajectory = { direction: 'up' }),
    (s) => (s.content.framing.participants = {}),
    (s) => (s.extra = true),
  ]) {
    const s = f.initialState();
    mutate(s);
    assert.throws(() => f.validate(s));
  }
  const s = f.initialState();
  s.content.buyers.analysis = [{ id: 'same', text: 'x' }];
  s.annotations = [
    {
      id: 'same',
      target: { type: 'section', id: 'buyers' },
      target_label: 'Buyers',
      text: 'Note',
    },
  ];
  assert.throws(() => f.validate(s), /duplicate|collision/i);
});
test('all substantive AI actions gate missing framing including shared action routes', () => {
  const f = core(),
    s = f.initialState();
  for (const action of [
    { id: 'evaluate' },
    { id: 'improve' },
    { id: 'research', target: { type: 'canvas' } },
    { id: 'formulate_takeaways' },
    { id: 'six_hats', hat: 'white', target: { type: 'canvas' } },
  ])
    assert.throws(() => f.buildRequest(s, action), /framing/i);
  const r = ready(f);
  for (const k of f.framing) {
    if (['industry', 'geography', 'objective'].includes(k)) {
      const x = structuredClone(r);
      x.content.framing[k] = ' ';
      assert.throws(() => f.buildRequest(x, { id: 'evaluate' }), /framing/i);
    }
  }
  const x = ready(f);
  for (const k of f.participants) x.content.framing[k] = '';
  assert.throws(
    () => f.buildRequest(x, { id: 'evaluate' }),
    /participant|framing/i,
  );
  assert.equal(
    f.buildRequest(r, { id: 'evaluate' }).canvas.framework,
    'five_forces',
  );
});
test('evaluation is thought-only and force improvement is atomic with partial/bulk review', () => {
  const f = core(),
    s = ready(f),
    request = f.buildRequest(s, { id: 'evaluate' });
  const e = f.composeResult(request, {
    thought: 'Buyer power conclusion lacks evidence.',
  });
  assert.deepEqual(e.content, s.content);
  assert.throws(() =>
    f.composeResult(request, { thought: 'x', content: changed(s) }),
  );
  const c = changed(s);
  c.suppliers.strength = 'weak';
  const r = f.composeResult(f.buildRequest(s, { id: 'improve' }), {
    content: c,
    thought: 'Explain structural mechanisms',
  });
  assert.deepEqual(r.content, s.content);
  assert.deepEqual(
    f.proposalSections(r).map((x) => x.section),
    ['buyers', 'suppliers'],
  );
  f.resolveProposal(r, ['buyers'], 'accept');
  assert.deepEqual(r.content.buyers, c.buyers);
  f.rejectProposal(r);
  assert.equal(r.content.suppliers.strength, null);
  assert.match(r.thoughts[0].text, /Rejected nodes: suppliers/);
});
test('scoped improvements preserve framing, other forces, snippet identity and manual context', () => {
  const f = core(),
    s = ready(f);
  s.content.buyers.analysis = [{ id: 'b1', text: 'Existing reasoning' }];
  const req = f.buildRequest(s, {
      id: 'improve',
      target: { type: 'section', id: 'buyers' },
    }),
    c = changed(s);
  c.buyers.analysis = s.content.buyers.analysis;
  f.composeResult(req, { content: c, thought: 'x' });
  c.suppliers.strength = 'strong';
  assert.throws(
    () => f.composeResult(req, { content: c, thought: 'x' }),
    /target/i,
  );
  delete c.suppliers.strength;
  c.suppliers.strength = null;
  c.framing.geography = 'Worldwide';
  assert.throws(
    () => f.composeResult(req, { content: c, thought: 'x' }),
    /framing/i,
  );
  const renamed = structuredClone(s.content);
  renamed.buyers.analysis[0].id = 'new';
  assert.throws(
    () => f.composeResult(req, { content: renamed, thought: 'x' }),
    /identity|ID/i,
  );
});
test('stale force acceptance is atomic, navigation irrelevant and rejection preserves local edits', () => {
  const f = core(),
    s = ready(f),
    r = f.composeResult(f.buildRequest(s, { id: 'improve' }), {
      content: changed(s),
      thought: 'x',
    });
  r.content.framing.industry = 'A different industry';
  const before = structuredClone(r);
  assert.throws(() => f.acceptProposal(r), /changed|stale/i);
  assert.deepEqual(r, before);
  f.rejectProposal(r);
  assert.equal(r.content.framing.industry, 'A different industry');
  assert.throws(() =>
    f.buildRequest(s, {
      id: 'improve',
      target: { type: 'section', id: 'bogus' },
    }),
  );
});
test('Research supports fixed force targets, report-only and bounded candidate acceptance', () => {
  const f = core(),
    s = ready(f);
  assert.deepEqual(
    f.researchTargets(s).map((t) => t.type),
    ['canvas', ...f.sections.map(() => 'section')],
  );
  const req = f.buildRequest(s, {
    id: 'research',
    target: { type: 'section', id: 'buyers' },
    include_annotations: true,
  });
  assert.equal(req.action.use_thoughts, false);
  const response = {
    report: 'Fleet evidence is provisional',
    sources: [{ title: 'Industry', url: 'https://example.org/industry' }],
    content: changed(s),
  };
  const r = f.composeResult(req, response);
  assert.deepEqual(r.content, s.content);
  f.acceptProposal(r);
  assert.equal(r.content.buyers.confidence, 0.8);
  assert.equal(r.thoughts[0].kind, 'research');
  const report = f.composeResult(req, {
    report: 'No revision justified',
    sources: [],
  });
  f.acceptProposal(report);
  assert.deepEqual(report.content, s.content);
  const c = changed(s);
  c.rivalry.strength = 'strong';
  assert.throws(
    () => f.composeResult(req, { ...response, content: c }),
    /target/i,
  );
});
test('Takeaways and section-targeted Hats preserve assessment and review guards', () => {
  const f = core(),
    s = ready(f);
  s.annotations = [
    {
      id: 'note1',
      target: { type: 'section', id: 'buyers' },
      target_label: 'Buyers',
      text: 'Check concentration',
    },
  ];
  const h = f.composeResult(
    f.buildRequest(s, {
      id: 'six_hats',
      hat: 'black',
      target: { type: 'section', id: 'buyers' },
    }),
    { observations: ['The evidence is incomplete'] },
  );
  assert.deepEqual(h.content, s.content);
  const r = f.composeResult(
    f.buildRequest(h, { id: 'formulate_takeaways', include_annotations: true }),
    {
      takeaways: 'T1 — Provisional structure\nT4 — Evidence gaps',
      rationale: 'Do not overclaim',
    },
  );
  r.annotations[0].text = 'Changed';
  assert.throws(() => f.acceptProposal(r), /stale/i);
  f.rejectProposal(r);
  assert.deepEqual(r.content, s.content);
});
test('deterministic packaging safely preserves source and optional trajectory compatibility', async () => {
  const f = core(),
    { buildCanvas } = await import(
      '../.agents/skills/pensive/scripts/package-five-forces.mjs'
    );
  const html = readFileSync(new URL('canvas.html', root), 'utf8');
  assert.equal(await buildCanvas(), html);
  const s = ready(f);
  s.content.buyers.research_notes =
    '</script><img src=x onerror=alert(1)> & \u2028';
  delete s.content.buyers.trajectory;
  const output = f.packageHtml(html, s);
  assert.deepEqual(
    f.parseState(
      output.match(
        /<script id="canvas-state" type="application\/json">([\s\S]*?)<\/script>/,
      )[1],
    ),
    s,
  );
  const scrub = (x) =>
    x.replace(
      /<script id="canvas-state" type="application\/json">[\s\S]*?<\/script>/,
      'STATE',
    );
  assert.equal(scrub(output), scrub(html));
});
test('Research rejects candidate/manual-note ID collisions before creating pending state', () => {
  const f = core(),
    s = ready(f);
  s.annotations = [
    {
      id: 'reason1',
      target: { type: 'section', id: 'buyers' },
      target_label: 'Buyers',
      text: 'User note',
    },
  ];
  assert.throws(
    () =>
      f.composeResult(
        f.buildRequest(s, {
          id: 'research',
          target: { type: 'section', id: 'buyers' },
        }),
        { report: 'Evidence', sources: [], content: changed(s) },
      ),
    /collision|collides|duplicate/i,
  );
});
test('matching text in distinct forces can have distinct identities, but existing identities cannot move', () => {
  const f = core(),
    s = ready(f);
  s.content.buyers.analysis = [{ id: 'b1', text: 'Switching costs matter.' }];
  const c = structuredClone(s.content);
  c.suppliers.analysis = [{ id: 's1', text: 'Switching costs matter.' }];
  f.composeResult(f.buildRequest(s, { id: 'improve' }), {
    content: c,
    thought: 'Distinct participants and mechanisms',
  });
  c.suppliers.analysis[0].id = 'b1';
  c.buyers.analysis = [];
  assert.throws(
    () =>
      f.composeResult(f.buildRequest(s, { id: 'improve' }), {
        content: c,
        thought: 'x',
      }),
    /identity|ID/,
  );
});
test('pending force and Research proposals round-trip through schema and stale rejection preserves notes', () => {
  const f = core(),
    s = ready(f),
    valid = new Ajv().compile(
      JSON.parse(readFileSync(new URL('canvas.schema.json', root))),
    );
  for (const research of [false, true]) {
    const req = f.buildRequest(
        s,
        research
          ? {
              id: 'research',
              target: { type: 'canvas' },
              include_annotations: true,
              use_thoughts: true,
            }
          : { id: 'improve' },
      ),
      r = f.composeResult(
        req,
        research
          ? {
              report: 'Evidence is tentative',
              sources: [],
              content: changed(s),
            }
          : { content: changed(s), thought: 'Provisional' },
      );
    assert.ok(valid(r), JSON.stringify(valid.errors));
    assert.deepEqual(f.parseState(JSON.stringify(r)), r);
    r.content.buyers.research_notes = 'Local note';
    const before = structuredClone(r);
    assert.throws(() => f.acceptProposal(r), /stale|changed/);
    assert.deepEqual(r, before);
    f.rejectProposal(r);
    assert.equal(r.content.buyers.research_notes, 'Local note');
  }
});
test('persisted Six Hats reflections reject nonexistent permanent force targets in runtime and schema', () => {
  const f = core(),
    s = ready(f),
    h = f.composeResult(
      f.buildRequest(s, {
        id: 'six_hats',
        hat: 'white',
        target: { type: 'section', id: 'buyers' },
      }),
      { observations: ['Evidence gap'] },
    );
  h.thoughts[0].target.id = 'nonexistent';
  const valid = new Ajv().compile(
    JSON.parse(readFileSync(new URL('canvas.schema.json', root))),
  );
  assert.equal(valid(h), false);
  assert.throws(() => f.parseState(JSON.stringify(h)), /target|force/i);
});
