import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
const Swot = createRequire(import.meta.url)(
  "../.agents/skills/pensive/frameworks/swot/state.js",
);
export async function fixture(t) {
  const api = await import("../.agents/skills/pensive/scripts/workspace.mjs");
  const temp = await mkdtemp(join(tmpdir(), "pensive-workspace-")),
    dir = join(temp, "analysis");
  const state = Swot.initialState();
  state.content.framing.focal_entity = "Private initial analysis";
  await api.initialize(dir, state);
  const service = await api.serve(dir);
  t.after(async () => {
    await service.close();
    await rm(temp, { recursive: true, force: true });
  });
  return {
    api,
    dir,
    service,
    headers: {
      Authorization: `Bearer ${service.token}`,
      Origin: service.origin,
      "Content-Type": "application/json",
    },
  };
}
test("initializer refuses replacement and serves only authenticated allowed state routes", async (t) => {
  const { api, dir, service, headers } = await fixture(t);
  await assert.rejects(api.initialize(dir, Swot.initialState()), /exist/i);
  assert.equal((await fetch(service.origin + "/api/current")).status, 403);
  const response = await fetch(service.origin + "/api/current", { headers });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("cache-control"), /no-store/);
  const first = await response.json();
  const html = await readFile(join(dir, "canvas.html"), "utf8");
  const canvas = structuredClone(first.canvas);
  canvas.takeaways = "Saved";
  const save = await fetch(service.origin + "/api/revisions", {
    method: "POST",
    headers,
    body: JSON.stringify({
      parent_revision_id: first.revision_id,
      operation_id: "save",
      event: { kind: "manual_save", source: "browser" },
      canvas,
    }),
  });
  assert.equal(save.status, 200);
  assert.equal(await readFile(join(dir, "canvas.html"), "utf8"), html);
  const stale = await fetch(service.origin + "/api/revisions", {
    method: "POST",
    headers,
    body: JSON.stringify({
      parent_revision_id: first.revision_id,
      operation_id: "stale",
      event: { kind: "manual_save", source: "browser" },
      canvas,
    }),
  });
  assert.equal(stale.status, 409);
  for (const path of [
    "/current.json",
    "/history/",
    "/../.writer-lock",
    "/api/unknown",
  ])
    assert.equal((await fetch(service.origin + path, { headers })).status, 404);
});
test("service rejects foreign origins, invalid content and oversized writes", async (t) => {
  const { service, headers } = await fixture(t);
  assert.equal(
    (
      await fetch(service.origin + "/api/current", {
        headers: { ...headers, Origin: "https://evil.example" },
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await fetch(service.origin + "/api/revisions", {
        method: "POST",
        headers: { ...headers, "Content-Type": "text/plain" },
        body: "{}",
      })
    ).status,
    415,
  );
  assert.equal(
    (
      await fetch(service.origin + "/api/revisions", {
        method: "DELETE",
        headers,
      })
    ).status,
    405,
  );
  assert.equal(
    (
      await fetch(service.origin + "/api/revisions", {
        method: "POST",
        headers,
        body: "x".repeat(2 * 1024 * 1024 + 1),
      })
    ).status,
    413,
  );
});
test("public renderer contains no analytical state from the private working document", async (t) => {
  const { service } = await fixture(t);
  const html = await (await fetch(service.origin + "/canvas.html")).text();
  const embedded = html.match(
    /<script id="canvas-state" type="application\/json">([\s\S]*?)<\/script>/,
  );
  assert.deepEqual(JSON.parse(embedded[1]), Swot.initialState());
});

test("closing an old service cannot delete the next owners rendezvous", async (t) => {
  const { api, service, dir } = await fixture(t);
  const originalClose = service.store.close;
  let replacement;
  service.store.close = async () => {
    await originalClose();
    replacement = await api.serve(dir);
  };
  try {
    await service.close();
    assert.equal(
      JSON.parse(await readFile(join(dir, ".service.json"), "utf8")).token,
      replacement.token,
    );
  } finally {
    await replacement?.close();
  }
});

test("actual host CLI prepares full request and commits through the running owner", async (t) => {
  const { service, dir } = await fixture(t);
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const { writeFile } = await import("node:fs/promises");
  const execute = promisify(execFile);
  const script = new URL(
    "../.agents/skills/pensive/scripts/workspace.mjs",
    import.meta.url,
  ).pathname;
  const action = join(dir, "action-input.json"),
    handoffFile = join(dir, "handoff-output.json"),
    response = join(dir, "response-input.json");
  await writeFile(action, JSON.stringify({ id: "evaluate" }));
  await execute(process.execPath, [
    script,
    "request",
    dir,
    action,
    handoffFile,
  ]);
  const handoff = JSON.parse(await readFile(handoffFile, "utf8"));
  assert.equal(
    handoff.revision_id,
    (await service.store.current()).revision_id,
  );
  assert.equal(handoff.request.action.id, "evaluate");
  await writeFile(
    response,
    JSON.stringify({ thought: "Synthetic saved evaluation." }),
  );
  const result = await execute(process.execPath, [
    script,
    "result",
    dir,
    handoffFile,
    response,
  ]);
  assert.match(result.stdout, /Saved revision 2/);
  assert.equal(
    (await service.store.current()).canvas.thoughts[0].text,
    "Synthetic saved evaluation.",
  );
  const before = await readFile(join(dir, "canvas.html"), "utf8");
  await execute(process.execPath, [
    script,
    "result",
    dir,
    handoffFile,
    response,
  ]);
  assert.equal((await service.store.history()).length, 2);
  assert.equal(await readFile(join(dir, "canvas.html"), "utf8"), before);
});
