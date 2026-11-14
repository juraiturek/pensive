import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, readFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const Swot = require("../.agents/skills/pensive/frameworks/swot/state.js");
const modulePath = "../.agents/skills/pensive/scripts/lib/revision-store.mjs";
async function setup(t) {
  const { openStore } = await import(modulePath);
  const dir = await mkdtemp(join(tmpdir(), "pensive-revisions-"));
  const store = await openStore(dir, Swot.validate);
  t.after(async () => {
    await store.close();
    await rm(dir, { recursive: true, force: true });
  });
  return { store, dir, openStore };
}
test("complete snapshots are ordered, immutable and retries are idempotent", async (t) => {
  const { store, dir } = await setup(t);
  const first = await store.initialize(Swot.initialState());
  const canvas = structuredClone(first.canvas);
  canvas.takeaways = "A new conclusion";
  const input = {
    parent_revision_id: first.revision_id,
    operation_id: "save-1",
    event: { kind: "manual_save", source: "browser" },
    canvas,
  };
  const second = await store.commit(input);
  assert.equal(second.revision_number, 2);
  assert.equal(second.canvas_id, first.canvas_id);
  assert.deepEqual(await store.commit(input), second);
  await assert.rejects(
    store.commit({ ...input, canvas: first.canvas }),
    /operation.*reuse/i,
  );
  await assert.rejects(
    store.commit({ ...input, operation_id: "stale" }),
    /conflict/i,
  );
  assert.equal((await readdir(join(dir, "history"))).length, 2);
  assert.deepEqual(
    JSON.parse(await readFile(join(dir, "current.json"), "utf8")),
    second,
  );
  const snapshots = await readdir(join(dir, "history"));
  assert.deepEqual(
    JSON.parse(await readFile(join(dir, "history", snapshots[0]), "utf8")),
    first,
  );
});
test("invalid states and concurrent owners cannot change the head", async (t) => {
  const { store, dir, openStore } = await setup(t);
  const first = await store.initialize(Swot.initialState());
  await assert.rejects(openStore(dir, Swot.validate), /lock|owner/i);
  await assert.rejects(
    store.commit({
      parent_revision_id: first.revision_id,
      operation_id: "bad",
      event: { kind: "manual_save", source: "browser" },
      canvas: {},
    }),
  );
  assert.deepEqual(await store.current(), first);
});
test("interrupted publication retains valid head and exposes orphan on reopen", async (t) => {
  const { store, dir, openStore } = await setup(t);
  const first = await store.initialize(Swot.initialState());
  const original = await readFile(join(dir, "current.json"), "utf8");
  const { writeFile } = await import("node:fs/promises");
  const orphan = {
    ...first,
    revision_id: crypto.randomUUID(),
    parent_revision_id: first.revision_id,
    revision_number: 2,
  };
  await writeFile(
    join(dir, "history", `000002-${orphan.revision_id}.json`),
    JSON.stringify(orphan),
  );
  await store.close();
  await assert.rejects(openStore(dir, Swot.validate), /orphan|history/i);
  assert.equal(await readFile(join(dir, "current.json"), "utf8"), original);
});
test("simultaneous saves serialize and only one expected parent wins", async (t) => {
  const { store } = await setup(t);
  const first = await store.initialize(Swot.initialState());
  const outcomes = await Promise.allSettled(
    ["a", "b"].map((operation_id) =>
      store.commit({
        parent_revision_id: first.revision_id,
        operation_id,
        event: { kind: "manual_save", source: "browser" },
        canvas: first.canvas,
      }),
    ),
  );
  assert.equal(outcomes.filter((x) => x.status === "fulfilled").length, 1);
  assert.equal(outcomes.filter((x) => x.status === "rejected").length, 1);
});
for (const stage of [
  "before_snapshot",
  "after_snapshot",
  "before_replace",
  "after_replace",
])
  test(`publication failure at ${stage} preserves recoverable snapshots`, async (t) => {
    const { store, dir, openStore } = await setup(t);
    const first = await store.initialize(Swot.initialState());
    await store.close();
    const failing = await openStore(dir, Swot.validate, {
      fault: async (point) => {
        if (point === stage) throw new Error("injected write failure");
      },
    });
    await assert.rejects(
      failing.commit({
        parent_revision_id: first.revision_id,
        operation_id: "fault",
        event: { kind: "manual_save", source: "host" },
        canvas: first.canvas,
      }),
      /injected/,
    );
    const head = JSON.parse(await readFile(join(dir, "current.json"), "utf8"));
    assert.equal(head.revision_number, stage === "after_replace" ? 2 : 1);
    await failing.close();
    if (["after_snapshot", "before_replace"].includes(stage))
      await assert.rejects(openStore(dir, Swot.validate), /orphan/i);
    else {
      const reopened = await openStore(dir, Swot.validate);
      assert.deepEqual(await reopened.current(), head);
      await reopened.close();
    }
  });
