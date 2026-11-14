// Optional SWOT working-folder service. No inference, remote binding or file browsing.
import { createServer } from "node:http";
import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { join, resolve, dirname } from "node:path";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import {
  randomBytes,
  randomUUID,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { openStore } from "./lib/revision-store.mjs";
const Swot = createRequire(import.meta.url)("../frameworks/swot/state.js");
const framework = new URL("../frameworks/swot/", import.meta.url);
const limit = 2 * 1024 * 1024;
export async function initialize(dir, canvas) {
  Swot.validate(canvas);
  await mkdir(dirname(resolve(dir)), { recursive: true });
  await mkdir(dir, { recursive: false });
  let store;
  try {
    store = await openStore(dir, Swot.validate);
    const first = await store.initialize(canvas);
    let html = await readFile(new URL("canvas.html", framework), "utf8");
    const adapter = await readFile(
      new URL("../shared/working-folder.js", import.meta.url),
      "utf8",
    );
    if (adapter.toLowerCase().includes("</script"))
      throw new Error("Unsafe adapter source.");
    const offset = html.lastIndexOf("<script data-implementation");
    html =
      html.slice(0, offset) +
      `<script data-working-folder>\n${adapter}\n</script>\n` +
      html.slice(offset);
    await writeFile(
      join(dir, "canvas.html"),
      Swot.packageHtml(html, Swot.initialState()),
      { flag: "wx" },
    );
    return first;
  } catch (e) {
    // Preserve any written snapshots for inspection, never remove a partially initialized analysis.
    throw e;
  } finally {
    await store?.close();
  }
}
function httpError(status, message) {
  return Object.assign(new Error(message), { status });
}
async function body(req) {
  if (req.headers["content-type"] !== "application/json")
    throw httpError(415, "Expected application/json.");
  let length = 0;
  const chunks = [];
  for await (const chunk of req) {
    length += chunk.length;
    if (length > limit) throw httpError(413, "JSON body too large.");
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw httpError(400, "Invalid JSON.");
  }
}
export async function serve(dir) {
  dir = resolve(dir);
  const html = await readFile(join(dir, "canvas.html"), "utf8");
  const store = await openStore(dir, Swot.validate);
  const token = randomBytes(32).toString("hex");
  let origin;
  const sameToken = (value) => {
    const bytes = Buffer.from(value || "");
    const expected = Buffer.from(`Bearer ${token}`);
    return bytes.length === expected.length && timingSafeEqual(bytes, expected);
  };
  const server = createServer(async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
    );
    const send = (code, value, type = "application/json") => {
      res.writeHead(code, { "Content-Type": `${type}; charset=utf-8` });
      res.end(type === "application/json" ? JSON.stringify(value) : value);
    };
    try {
      if (
        req.headers.host !== new URL(origin).host ||
        (req.headers.origin && req.headers.origin !== origin)
      )
        throw httpError(403, "Foreign Host or Origin.");
      if (req.url === "/canvas.html" && req.method === "GET")
        return send(200, html, "text/html");
      if (
        ![
          "/api/current",
          "/api/revisions",
          "/api/requests",
          "/api/results",
        ].includes(req.url)
      )
        throw httpError(404, "Unknown route.");
      if (!sameToken(req.headers.authorization))
        throw httpError(
          403,
          "Working-folder authorization required. Relaunch using the service URL.",
        );
      if (req.url === "/api/current" && req.method === "GET")
        return send(200, await store.current());
      if (req.method !== "POST") throw httpError(405, "Method not allowed.");
      if (req.headers.origin !== origin)
        throw httpError(403, "Same-origin write required.");
      const input = await body(req);
      if (req.url === "/api/revisions") {
        if (
          ![
            "manual_save",
            "proposal_accept",
            "proposal_reject",
            "import",
          ].includes(input.event?.kind) ||
          input.event.source !== "browser"
        )
          throw httpError(400, "Unsupported browser save event.");
        return send(200, await store.commit(input));
      }
      if (req.url === "/api/requests")
        return send(200, await prepareRequest(store, input));
      if (req.url === "/api/results")
        return send(
          200,
          await applyResult(store, input.handoff, input.response),
        );
      throw httpError(405, "Method not allowed.");
    } catch (e) {
      send(e.status || (/conflict|reuse/i.test(e.message) ? 409 : 400), {
        error: e.message,
      });
    }
  });
  try {
    await new Promise((yes, no) => {
      server.once("error", no);
      server.listen(0, "127.0.0.1", yes);
    });
    origin = `http://127.0.0.1:${server.address().port}`;
    // Private ephemeral rendezvous for host CLI. Never embed in durable canvas/state/history.
    await writeFile(
      join(dir, ".service.json"),
      JSON.stringify({ origin, token }),
      { mode: 0o600 },
    );
  } catch (e) {
    server.close();
    await store.close();
    throw e;
  }
  let closed = false;
  return {
    origin,
    token,
    url: `${origin}/canvas.html#${token}`,
    store,
    async close() {
      if (closed) return;
      closed = true;
      await new Promise((resolve) => server.close(resolve));
      await rm(join(dir, ".service.json"), { force: true });
      await store.close();
    },
  };
}
export async function prepareRequest(store, { parent_revision_id, action }) {
  const head = await store.current();
  if (head.revision_id !== parent_revision_id)
    throw new Error("Revision conflict before preparing request.");
  return {
    storage_version: "1.0",
    canvas_id: head.canvas_id,
    revision_id: head.revision_id,
    request_id: randomUUID(),
    request: Swot.buildRequest(head.canvas, action),
  };
}
const resultQueues = new WeakMap();
export function applyResult(store, handoff, response) {
  const captured = structuredClone({ handoff, response });
  const result = (resultQueues.get(store) || Promise.resolve()).then(() =>
    composeAndCommit(store, captured.handoff, captured.response),
  );
  resultQueues.set(
    store,
    result.catch(() => {}),
  );
  return result;
}
async function composeAndCommit(store, handoff, response) {
  if (
    !handoff ||
    handoff.storage_version !== "1.0" ||
    typeof handoff.request_id !== "string"
  )
    throw new Error("Invalid revision handoff.");
  const records = await store.history();
  const base = records.find((r) => r.revision_id === handoff.revision_id);
  if (
    !base ||
    base.canvas_id !== handoff.canvas_id ||
    !isDeepStrictEqual(base.canvas, handoff.request?.canvas)
  )
    throw new Error("Saved request does not match exact immutable revision.");
  const canonical = (value) =>
    JSON.stringify(
      value && typeof value === "object"
        ? Array.isArray(value)
          ? value.map((v) => JSON.parse(canonical(v)))
          : Object.fromEntries(
              Object.keys(value)
                .sort()
                .map((k) => [k, JSON.parse(canonical(value[k]))]),
            )
        : value,
    );
  const response_hash = createHash("sha256")
    .update(canonical({ request: handoff.request, response }))
    .digest("hex");
  const prior = records.find(
    (r) => r.operation_id === `result-${handoff.request_id}`,
  );
  if (prior) {
    if (
      prior.parent_revision_id !== base.revision_id ||
      prior.event.response_hash !== response_hash
    )
      throw new Error("Operation ID reuse with different result.");
    return prior;
  }
  const canvas = Swot.composeResult(handoff.request, response);
  return store.commit({
    parent_revision_id: base.revision_id,
    operation_id: `result-${handoff.request_id}`,
    event: {
      kind: "ai_result",
      source: "host",
      action_id: handoff.request.action.id,
      response_hash,
    },
    canvas,
  });
}
async function hostCall(dir, route, payload) {
  const { origin, token } = JSON.parse(
    await readFile(join(dir, ".service.json"), "utf8"),
  );
  const url = new URL(origin);
  if (
    url.protocol !== "http:" ||
    url.hostname !== "127.0.0.1" ||
    url.pathname !== "/" ||
    url.username ||
    url.password ||
    !url.port ||
    !/^[a-f0-9]{64}$/.test(token)
  )
    throw new Error("Invalid local service rendezvous.");
  const response = await fetch(origin + route, {
    method: payload ? "POST" : "GET",
    redirect: "error",
    headers: {
      Authorization: `Bearer ${token}`,
      Origin: origin,
      "Content-Type": "application/json",
    },
    ...(payload ? { body: JSON.stringify(payload) } : {}),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error);
  return data;
}
async function main(args) {
  const [command, folder, a, b] = args;
  if (command === "init" && args.length === 3) {
    // init <state.json> <destination>; never infer a reusable skill's host destination.
    const state = JSON.parse(await readFile(folder, "utf8"));
    await initialize(resolve(a), state);
    console.log(`Created working folder: ${resolve(a)}`);
  } else if (command === "serve" && args.length === 2) {
    const service = await serve(folder);
    console.log(service.url);
    for (const signal of ["SIGINT", "SIGTERM"])
      process.once(signal, async () => {
        await service.close();
        process.exit(0);
      });
  } else if (command === "request" && args.length === 4) {
    const head = await hostCall(folder, "/api/current");
    const action = JSON.parse(await readFile(a, "utf8"));
    const handoff = await hostCall(folder, "/api/requests", {
      parent_revision_id: head.revision_id,
      action,
    });
    await writeFile(b, JSON.stringify(handoff, null, 2) + "\n", { flag: "wx" });
  } else if (command === "result" && args.length === 4) {
    const handoff = JSON.parse(await readFile(a, "utf8")),
      response = JSON.parse(await readFile(b, "utf8"));
    const result = await hostCall(folder, "/api/results", {
      handoff,
      response,
    });
    console.log(
      `Saved revision ${result.revision_number}; reload the clean canvas to review.`,
    );
  } else
    throw new Error(
      "Usage: workspace.mjs init state.json destination | serve folder | request folder action.json new-handoff.json | result folder handoff.json response.json",
    );
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main(process.argv.slice(2)).catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  });
