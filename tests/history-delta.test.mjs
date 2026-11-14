import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath as fromUrl } from "node:url";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { openStore } from "../.agents/skills/pensive/scripts/lib/revision-store.mjs";
const Swot = createRequire(import.meta.url)(
  "../.agents/skills/pensive/frameworks/swot/state.js",
);
const script = fromUrl(
  new URL(
    "../.agents/skills/pensive/scripts/history_delta.py",
    import.meta.url,
  ),
);
const run = (dir, ...args) =>
  spawnSync("python3", [script, dir, ...args], { encoding: "utf8" });
async function fixture(t) {
  const dir = await mkdtemp(join(tmpdir(), "pensive-delta-"));
  const store = await openStore(dir, Swot.validate);
  t.after(async () => {
    await store.close();
    await rm(dir, { recursive: true, force: true });
  });
  const canvas = Swot.initialState();
  canvas.content.strengths = [
    { id: "a", text: "Alpha" },
    { id: "b", text: "Beta" },
  ];
  return { dir, store, first: await store.initialize(canvas) };
}
test("delta matches identities and distinguishes edits, movement, reorder and additions", async (t) => {
  const { dir, store, first } = await fixture(t);
  const canvas = structuredClone(first.canvas);
  canvas.content.strengths = [
    { id: "b", text: "Beta" },
    { id: "c", text: "Alpha" },
  ];
  canvas.content.weaknesses = [{ id: "a", text: "Changed α" }];
  canvas.takeaways = "Takeaway";
  await store.commit({
    parent_revision_id: first.revision_id,
    operation_id: "next",
    event: { kind: "manual_save", source: "browser" },
    canvas,
  });
  const result = run(dir, "--format", "json");
  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout),
    changes = output.transitions[0].changes;
  assert.ok(changes.some((c) => c.kind === "move" && c.id === "a"));
  assert.ok(
    changes.some(
      (c) => c.kind === "edit" && c.id === "a" && c.after === "Changed α",
    ),
  );
  assert.ok(changes.some((c) => c.kind === "add" && c.id === "c"));
  assert.ok(changes.some((c) => c.path === "/takeaways"));
  assert.equal(run(dir, "--format", "json").stdout, result.stdout);
  const packet = run(dir, "--packet", "--include-current");
  assert.equal(packet.status, 0, packet.stderr);
  assert.deepEqual(JSON.parse(packet.stdout).starting_state, first.canvas);
  assert.deepEqual(JSON.parse(packet.stdout).current_state, canvas);
  const markdown = run(dir, "--format", "markdown");
  assert.equal(markdown.status, 0, markdown.stderr);
  assert.match(markdown.stdout, /manual_save/);
});
test("same text with a new ID remains deletion and addition; bad chain refuses output", async (t) => {
  const { dir, store, first } = await fixture(t);
  const canvas = structuredClone(first.canvas);
  canvas.content.strengths[0].id = "replacement";
  const next = await store.commit({
    parent_revision_id: first.revision_id,
    operation_id: "next",
    event: { kind: "manual_save", source: "browser" },
    canvas,
  });
  let out = run(dir);
  assert.equal(out.status, 0, out.stderr);
  const changes = JSON.parse(out.stdout).transitions[0].changes;
  assert.ok(changes.some((c) => c.kind === "remove" && c.id === "a"));
  assert.ok(changes.some((c) => c.kind === "add" && c.id === "replacement"));
  const file = join(dir, "history", `000002-${next.revision_id}.json`);
  next.parent_revision_id = "missing";
  await writeFile(file, JSON.stringify(next));
  out = run(dir);
  assert.notEqual(out.status, 0);
  assert.match(out.stderr, /chain|parent/i);
});

test("retained five-revision example separates proposed, partially accepted and rejected changes", () => {
  const folder = fromUrl(
    new URL("./fixtures/history/kaizen-swot/", import.meta.url),
  );
  const result = run(folder, "--packet", "--include-current");
  assert.equal(result.status, 0, result.stderr);
  const packet = JSON.parse(result.stdout);
  assert.deepEqual(
    packet.transitions.map((t) => t.event.kind),
    ["manual_save", "ai_result", "proposal_accept", "proposal_reject"],
  );
  const ai = packet.transitions[1];
  assert.ok(ai.changes.some((c) => c.path === "/proposals"));
  assert.equal(
    packet.current_state.content.weaknesses[0].text,
    packet.starting_state.content.weaknesses[0].text,
  );
  assert.notEqual(
    packet.current_state.content.strengths[0].text,
    packet.starting_state.content.strengths[0].text,
  );
  assert.deepEqual(
    packet.current_state.annotations,
    packet.starting_state.annotations,
  );
});

for (const [label, change] of [
  [
    "foreign canvas",
    (r) => {
      r.canvas_id = "foreign";
    },
  ],
  [
    "duplicate sequence",
    (r) => {
      r.revision_number = 1;
    },
  ],
  [
    "incompatible schema",
    (r) => {
      r.canvas.schema_version = "999";
    },
  ],
  [
    "malformed canvas",
    (r) => {
      r.canvas = [];
    },
  ],
  [
    "invalid event",
    (r) => {
      r.event.kind = "invented_event";
    },
  ],
  [
    "invalid time",
    (r) => {
      r.saved_at = "tomorrow";
    },
  ],
])
  test(`history refuses ${label}`, async (t) => {
    const { dir, store, first } = await fixture(t);
    const next = await store.commit({
      parent_revision_id: first.revision_id,
      operation_id: "next",
      event: { kind: "manual_save", source: "browser" },
      canvas: first.canvas,
    });
    const file = join(dir, "history", `000002-${next.revision_id}.json`);
    change(next);
    await writeFile(file, JSON.stringify(next));
    const result = run(dir);
    assert.notEqual(result.status, 0);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, /History error/);
  });
