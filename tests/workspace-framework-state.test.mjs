import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import {
  initialize,
  prepareRequest,
  applyResult,
} from "../.agents/skills/pensive/scripts/workspace.mjs";
const require = createRequire(import.meta.url);
const ids = ["swot", "pages", "vpc", "vars", "five_whys", "five_forces"];
const core = (id) =>
  require(`../.agents/skills/pensive/frameworks/${id}/state.js`);
function initial(id) {
  const c = core(id),
    canvas = c.initialState();
  canvas.takeaways = `Private ${id} takeaway`;
  if (id === "five_forces")
    Object.assign(canvas.content.framing, {
      industry: "Mining equipment",
      geography: "US",
      objective: "Assess rivalry",
      rivals: "Specialist manufacturers",
      buyers: "Mining operators",
      suppliers: "Component manufacturers",
      substitutes: "Alternative processing equipment",
      entrants: "Unknown entrants",
    });
  return canvas;
}
async function folder(t, id) {
  const temp = await mkdtemp(join(tmpdir(), "pensive-framework-")),
    dir = join(temp, "canvas");
  let store;
  t.after(async () => {
    await store?.close();
    await rm(temp, { recursive: true, force: true });
  });
  const canvas = initial(id);
  await initialize(dir, canvas);
  const { openStore } = await import("../.agents/skills/pensive/scripts/lib/revision-store.mjs");
  store = await openStore(dir, core(id).validate);
  return { dir, service: {store}, canvas };
}
for (const id of ids)
  test(`${id}: working folder uses framework-owned initialization and evaluation`, async (t) => {
    const { dir, service, canvas } = await folder(t, id);
    const first = await service.store.current();
    assert.deepEqual(first.canvas, canvas);
    const html = await readFile(join(dir, "canvas.html"), "utf8");
    const slot = html.match(
      /<script id="canvas-state" type="application\/json">([\s\S]*?)<\/script>/,
    );
    assert.deepEqual(JSON.parse(slot[1]), canvas);
    assert.ok(html.includes(`Private ${id} takeaway`));
    const handoff = await prepareRequest(service.store, {
      parent_revision_id: first.revision_id,
      action: { id: "evaluate" },
    });
    assert.equal(handoff.request.canvas.framework, id);
    const result = await applyResult(service.store, handoff, {
      thought: "Observed evaluation for this framework.",
    });
    assert.equal(
      result.canvas.thoughts.at(-1).text,
      "Observed evaluation for this framework.",
    );
    assert.deepEqual(result.canvas.content, canvas.content);
    assert.equal(result.canvas.takeaways, canvas.takeaways);
    assert.equal(await readFile(join(dir, "canvas.html"), "utf8"), html);
  });
test("PAGES Ripple retains source changes, baseline and pending review across saved revisions", async (t) => {
  const { dir, service } = await folder(t, "pages"),
    p = core("pages");
  let head = await service.store.current();
  let canvas = structuredClone(head.canvas);
  canvas.content.self_concepts = [
    { id: "identity", text: "Equipment supplier" },
  ];
  canvas.content.actions = [{ id: "activity", text: "Build conveyors" }];
  p.resetBaseline(canvas);
  head = await service.store.commit({
    parent_revision_id: head.revision_id,
    operation_id: "source-state",
    event: { kind: "manual_save", source: "browser" },
    canvas,
  });
  const before = structuredClone(head.canvas.ripple_baseline);
  canvas = structuredClone(head.canvas);
  canvas.content.self_concepts[0].text = "Mine reliability partner";
  head = await service.store.commit({
    parent_revision_id: head.revision_id,
    operation_id: "identity-edit",
    event: { kind: "manual_save", source: "browser" },
    canvas,
  });
  const html = await readFile(join(dir, "canvas.html"), "utf8");
  const handoff = await prepareRequest(service.store, {
    parent_revision_id: head.revision_id,
    action: { id: "ripple", sources: ["self_concepts"] },
  });
  const content = structuredClone(canvas.content);
  content.actions[0].text = "Test preventative maintenance support";
  const result = await applyResult(service.store, handoff, {
    content,
    thought: "The changed identity suggests testing reliability services.",
  });
  assert.deepEqual(result.canvas.ripple_baseline, before);
  assert.deepEqual(result.canvas.content, canvas.content);
  assert.equal(result.canvas.proposals[0].action, "ripple");
  assert.deepEqual(result.canvas.proposals[0].sources, ["self_concepts"]);
  assert.equal(await readFile(join(dir, "canvas.html"), "utf8"), html);
  const approved = structuredClone(result.canvas);
  p.resolveProposal(approved, ["actions"], "accept");
  const saved = await service.store.commit({
    parent_revision_id: result.revision_id,
    operation_id: "accept-action",
    event: { kind: "proposal_accept", source: "browser" },
    canvas: approved,
  });
  assert.deepEqual(saved.canvas.ripple_baseline, before);
  assert.equal(saved.canvas.content.actions[0].text, content.actions[0].text);
});
test("working folders reject replacing their framework and cross-framework result substitution", async (t) => {
  const { service } = await folder(t, "pages");
  const head = await service.store.current();
  await assert.rejects(
    service.store.commit({
      parent_revision_id: head.revision_id,
      operation_id: "foreign",
      event: { kind: "manual_save", source: "browser" },
      canvas: initial("swot"),
    }),
    /framework/i,
  );
  const handoff = await prepareRequest(service.store, {
    parent_revision_id: head.revision_id,
    action: { id: "evaluate" },
  });
  handoff.request.canvas = initial("swot");
  await assert.rejects(
    applyResult(service.store, handoff, { thought: "Do not save" }),
    /exact|revision/i,
  );
  assert.deepEqual(await service.store.current(), head);
});
