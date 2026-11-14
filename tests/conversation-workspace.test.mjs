import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url),
  Pages = require("../.agents/skills/pensive/frameworks/pages/state.js"),
  Swot = require("../.agents/skills/pensive/frameworks/swot/state.js");
async function fixture(t) {
  const api = await import(
    "../.agents/skills/pensive/scripts/conversation.mjs"
  );
  const output = await mkdtemp(join(tmpdir(), "pensive-chat-"));
  t.after(() => rm(output, { recursive: true, force: true }));
  return { api, output };
}
test("one chat folder groups frameworks and repeated creation reuses one HTML", async (t) => {
  const { api, output } = await fixture(t);
  const options = { conversation: "chat-1", title: "Raffin case" };
  const pages = await api.createCanvas(output, Pages.initialState(), options);
  const before = await readFile(pages.html, "utf8");
  const changed = Pages.initialState();
  changed.takeaways = "Must not overwrite existing analysis";
  const reused = await api.createCanvas(output, changed, options);
  assert.equal(reused.reused, true);
  assert.equal(reused.html, pages.html);
  assert.equal(await readFile(pages.html, "utf8"), before);
  const head = JSON.parse(
    await readFile(join(pages.folder, "current.json"), "utf8"),
  );
  assert.equal(head.canvas.takeaways, undefined);
  const swot = await api.createCanvas(output, Swot.initialState(), options);
  assert.equal(swot.conversation_folder, pages.conversation_folder);
  assert.notEqual(swot.folder, pages.folder);
  const registry = JSON.parse(
    await readFile(
      join(pages.conversation_folder, "conversation.json"),
      "utf8",
    ),
  );
  assert.equal(registry.conversation_id, "chat-1");
  assert.equal(registry.canvases.length, 2);
  assert.deepEqual(
    (await readdir(pages.folder)).filter((p) => p.endsWith(".html")),
    ["canvas.html"],
  );
});
test("explicit new analysis adds distinct identity while different chats remain separate", async (t) => {
  const { api, output } = await fixture(t);
  const state = Pages.initialState();
  const one = await api.createCanvas(output, state, {
    conversation: "chat-1",
    title: "Raffin",
  });
  const two = await api.createCanvas(output, state, {
    conversation: "chat-1",
    title: "Renamed title",
    newAnalysis: true,
  });
  assert.equal(two.conversation_folder, one.conversation_folder);
  assert.notEqual(two.canvas_id, one.canvas_id);
  assert.notEqual(two.html, one.html);
  const active = await api.createCanvas(output, state, {
    conversation: "chat-1",
    title: "Raffin",
  });
  assert.equal(active.folder, two.folder);
  const other = await api.createCanvas(output, state, {
    conversation: "chat-2",
    title: "Raffin",
  });
  assert.notEqual(other.conversation_folder, one.conversation_folder);
});
test("conversation identity is required and hostile labels cannot escape outputs", async (t) => {
  const { api, output } = await fixture(t);
  await assert.rejects(
    api.createCanvas(output, Pages.initialState(), {
      conversation: "../elsewhere",
      title: "x",
    }),
    /conversation/i,
  );
  const canvas = await api.createCanvas(output, Pages.initialState(), {
    conversation: "chat-safe",
    title: "../../<unsafe>/Raffin",
  });
  assert.ok(canvas.folder.startsWith(output + "/"));
  assert.ok(!canvas.conversation_folder.slice(output.length + 1).includes("/"));
});
test("host launch starts and reuses one authorized service without user server setup", async (t) => {
  const { createCanvas, launch } = await import(
    "../.agents/skills/pensive/scripts/conversation.mjs"
  );
  const root = await mkdtemp(join(tmpdir(), "pensive-launch-"));
  let running;
  t.after(async () => {
    if (running) {
      process.kill(running.pid, "SIGTERM");
      for (let n = 0; n < 100; n++) {
        try {
          await readFile(join(running.folder, ".writer-lock"));
          await new Promise((r) => setTimeout(r, 25));
        } catch (e) {
          if (e.code === "ENOENT") break;
          throw e;
        }
      }
    }
    await rm(root, { recursive: true, force: true });
  });
  const canvas = await createCanvas(root, Pages.initialState(), {
    conversation: "launch-chat",
    title: "Raffin",
  });
  running = await launch(canvas.folder);
  assert.equal(running.reused, false);
  assert.ok(running.url.startsWith("http://127.0.0.1:"));
  const again = await launch(canvas.folder);
  assert.equal(again.reused, true);
  assert.equal(again.url, running.url);
  assert.equal(again.pid, running.pid);
  const url = new URL(running.url),
    token = url.hash.slice(1);
  const response = await fetch(url.origin + "/api/current", {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).canvas_id, canvas.canvas_id);
});
test("unregistered canvas left by interrupted registry publication blocks reuse instead of hiding history", async (t) => {
  const { api, output } = await fixture(t);
  const first = await api.createCanvas(output, Pages.initialState(), {
    conversation: "orphan-chat",
    title: "Raffin",
  });
  const { initialize } = await import(
    "../.agents/skills/pensive/scripts/workspace.mjs"
  );
  await initialize(
    join(first.conversation_folder, "pages-2"),
    Pages.initialState(),
  );
  await assert.rejects(
    api.createCanvas(output, Pages.initialState(), {
      conversation: "orphan-chat",
      title: "Raffin",
    }),
    /orphan|unregistered/i,
  );
});
