import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
const Swot = createRequire(import.meta.url)(
  "../.agents/skills/pensive/frameworks/swot/state.js",
);
import { openStore } from "../.agents/skills/pensive/scripts/lib/revision-store.mjs";
import {
  prepareRequest,
  applyResult,
} from "../.agents/skills/pensive/scripts/workspace.mjs";
async function fixture(t) {
  const dir = await mkdtemp(join(tmpdir(), "pensive-actions-"));
  const store = await openStore(dir, Swot.validate);
  t.after(async () => {
    await store.close();
    await rm(dir, { recursive: true, force: true });
  });
  const state = Swot.initialState();
  state.content.strengths.push({ id: "s1", text: "Established strength" });
  return { store, first: await store.initialize(state) };
}
test("AI result preserves review boundary and exact request; retries are idempotent", async (t) => {
  const { store, first } = await fixture(t);
  const handoff = await prepareRequest(store, {
    parent_revision_id: first.revision_id,
    action: { id: "improve" },
  });
  const content = structuredClone(first.canvas.content);
  content.strengths[0].text = "Clarified strength";
  const response = { content, thought: "Clarified the factor." };
  const result = await applyResult(store, handoff, response);
  assert.equal(result.event.kind, "ai_result");
  assert.deepEqual(result.canvas.content, first.canvas.content);
  assert.equal(result.canvas.proposals.length, 1);
  const concurrent = await Promise.all([
    applyResult(store, handoff, response),
    applyResult(store, handoff, response),
  ]);
  assert.deepEqual(concurrent, [result, result]);
  await assert.rejects(
    applyResult(store, handoff, { ...response, thought: "Different response" }),
    /reuse/i,
  );
  const tampered = structuredClone(handoff);
  tampered.request.canvas.takeaways = "Not saved";
  await assert.rejects(applyResult(store, tampered, response), /exact/i);
});
test("manual edits after submission reject late responses without data loss", async (t) => {
  const { store, first } = await fixture(t);
  const handoff = await prepareRequest(store, {
    parent_revision_id: first.revision_id,
    action: { id: "evaluate" },
  });
  const canvas = structuredClone(first.canvas);
  canvas.takeaways = "Keep this local work";
  const saved = await store.commit({
    parent_revision_id: first.revision_id,
    operation_id: "manual",
    event: { kind: "manual_save", source: "browser" },
    canvas,
  });
  await assert.rejects(
    applyResult(store, handoff, { thought: "Evaluation" }),
    /conflict/i,
  );
  assert.deepEqual(await store.current(), saved);
});

test("simultaneous first submissions of the same result produce exactly one revision", async (t) => {
  const { store, first } = await fixture(t);
  const handoff = await prepareRequest(store, {
    parent_revision_id: first.revision_id,
    action: { id: "evaluate" },
  });
  const results = await Promise.all([
    applyResult(store, handoff, { thought: "Evaluation" }),
    applyResult(store, handoff, { thought: "Evaluation" }),
  ]);
  assert.deepEqual(results[0], results[1]);
  assert.equal((await store.history()).length, 2);
});
