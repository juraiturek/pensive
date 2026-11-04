import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
const root = new URL('../.agents/skills/pensive/', import.meta.url),
  w = createRequire(import.meta.url)(fileURLToPath(new URL('frameworks/five_whys/state.js', root))),
  observed = JSON.parse(
    readFileSync(new URL('methodology/five-whys-observed.json', import.meta.url)),
  ),
  schema = new Ajv().compile(
    JSON.parse(readFileSync(new URL('frameworks/five_whys/canvas.schema.json', root))),
  );
test('retained creation and causal-method examples validate and package through actual handoffs', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'whys-method-')),
    script = fileURLToPath(new URL('scripts/package-five-whys.mjs', root));
  try {
    for (const c of observed.creation) {
      w.validate(c.output);
      assert.equal(schema(c.output), true);
      await writeFile(join(dir, c.name + '.json'), JSON.stringify(c.output));
      execFileSync(process.execPath, [
        script,
        join(dir, c.name + '.json'),
        join(dir, c.name + '.html'),
      ]);
    }
    for (const c of observed.cases) {
      const before = structuredClone(c.canvas),
        request = w.buildRequest(c.canvas, c.action),
        out = w.composeResult(request, c.response);
      assert.equal(schema(out), true);
      assert.deepEqual(c.canvas, before);
      assert.deepEqual(out.content, c.canvas.content);
      if (c.action.id === 'expand' && c.response.children.length) {
        const target = w.find(out, c.action.target.id),
          parent = c.action.mode === 'deepen' ? target.node : target.parent,
          beforeParent = structuredClone(parent),
          accepted = structuredClone(out);
        w.resolveProposal(accepted, 'accept');
        assert.equal(
          w.find(accepted, parent.id).node.children.length,
          beforeParent.children.length + c.response.children.length,
        );
        assert.deepEqual(accepted.content.framing, c.canvas.content.framing);
        assert.deepEqual(accepted.cursor, c.canvas.cursor);
        for (const child of beforeParent.children)
          assert.deepEqual(w.find(accepted, child.id).node, child);
      }
      await writeFile(join(dir, c.name + '-request.json'), JSON.stringify(request));
      await writeFile(join(dir, c.name + '-response.json'), JSON.stringify(c.response));
      execFileSync(process.execPath, [
        script,
        '--result',
        join(dir, c.name + '-request.json'),
        join(dir, c.name + '-response.json'),
        join(dir, c.name + '.html'),
      ]);
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('fresh-agent skill applications validate and package with protected branches and framing', async () => {
  const data = JSON.parse(
      readFileSync(new URL('methodology/five-whys-agent-observed.json', import.meta.url)),
    ),
    dir = await mkdtemp(join(tmpdir(), 'whys-agent-')),
    script = fileURLToPath(new URL('scripts/package-five-whys.mjs', root));
  try {
    for (const c of data.creation) {
      w.validate(c.output);
      assert.equal(schema(c.output), true);
      await writeFile(join(dir, c.name + '.json'), JSON.stringify(c.output));
      execFileSync(process.execPath, [
        script,
        join(dir, c.name + '.json'),
        join(dir, c.name + '.html'),
      ]);
    }
    for (const c of data.cases) {
      const before = structuredClone(c.request),
        out = w.composeResult(c.request, c.response);
      assert.deepEqual(c.request, before);
      assert.equal(schema(out), true);
      assert.deepEqual(out.content, before.canvas.content);
      assert.deepEqual(out.cursor, before.canvas.cursor);
      if (out.proposals?.length) {
        const p = out.proposals[0],
          existing = w.overview(before.canvas).nodes.map((n) => n.id);
        w.resolveProposal(out, 'accept');
        assert.deepEqual(out.content.framing, before.canvas.content.framing);
        assert.deepEqual(out.cursor, before.canvas.cursor);
        assert.equal(w.overview(out).nodes.length, existing.length + c.response.children.length);
        for (const id of existing) {
          const prior = w.find(before.canvas, id).node,
            now = w.find(out, id).node;
          assert.equal(now.text, prior.text);
          assert.equal(now.output, prior.output);
          assert.equal(now.is_terminal, prior.is_terminal);
          if (id !== p.parent_id)
            assert.deepEqual(
              now.children.map((n) => n.id),
              prior.children.map((n) => n.id),
            );
        }
      }
      await writeFile(join(dir, c.name + '-request.json'), JSON.stringify(c.request));
      await writeFile(join(dir, c.name + '-response.json'), JSON.stringify(c.response));
      execFileSync(process.execPath, [
        script,
        '--result',
        join(dir, c.name + '-request.json'),
        join(dir, c.name + '-response.json'),
        join(dir, c.name + '.html'),
      ]);
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
