import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  getCore,
  supportedFrameworks,
} from "../.agents/skills/pensive/scripts/lib/framework-core.mjs";
import { openStore } from "../.agents/skills/pensive/scripts/lib/revision-store.mjs";
const script = fileURLToPath(
  new URL(
    "../.agents/skills/pensive/scripts/history_delta.py",
    import.meta.url,
  ),
);
for (const framework of supportedFrameworks)
  test(`${framework}: history validates its own snapshots and prepares a reflection packet`, async (t) => {
    const dir = await mkdtemp(join(tmpdir(), "pensive-history-framework-"));
    const core = getCore(framework),
      store = await openStore(dir, core.validate);
    t.after(async () => {
      await store.close();
      await rm(dir, { recursive: true, force: true });
    });
    const canvas = core.initialState();
    if (framework === "pages") {
      canvas.content.parts = [{ id: "p1", text: "Supplier" }];
      core.resetBaseline(canvas);
    }
    const first = await store.initialize(canvas);
    const changed = structuredClone(canvas);
    changed.takeaways = "A saved reflection";
    if (framework === "pages") {
      changed.content.parts[0].text = "Lifecycle partner";
    }
    await store.commit({
      parent_revision_id: first.revision_id,
      operation_id: "manual",
      event: { kind: "manual_save", source: "browser" },
      canvas: changed,
    });
    const result = spawnSync("python3", [script, dir, "--packet"], {
      encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr);
    const packet = JSON.parse(result.stdout);
    assert.equal(packet.framework, framework);
    assert.deepEqual(packet.starting_state, canvas);
    assert.ok(
      packet.transitions[0].changes.some((c) => c.path === "/takeaways"),
    );
    if (framework === "pages")
      assert.ok(
        packet.transitions[0].changes.some(
          (c) =>
            c.id === "p1" &&
            c.kind === "edit" &&
            c.after === "Lifecycle partner",
        ),
      );
  });
