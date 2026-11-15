// Snapshots and head.json retain metadata; current.json is portable framework state.
import {
  mkdir,
  open,
  readFile,
  readdir,
  rename,
  unlink,
} from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
const kinds = new Set([
  "initialize",
  "manual_save",
  "ai_result",
  "proposal_accept",
  "proposal_reject",
  "baseline_reset",
  "import",
]);
const id = (value) =>
  typeof value === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(value);
const filename = (r) =>
  `${String(r.revision_number).padStart(6, "0")}-${r.revision_id}.json`;
export function validateEnvelope(r, validate) {
  if (
    !r ||
    r.storage_version !== "1.0" ||
    !id(r.canvas_id) ||
    !id(r.revision_id) ||
    !Number.isSafeInteger(r.revision_number) ||
    r.revision_number < 1 ||
    !(r.parent_revision_id === null || id(r.parent_revision_id)) ||
    typeof r.saved_at !== "string" ||
    !/^\d{4}-\d\d-\d\dT.*Z$/.test(r.saved_at) ||
    !Number.isFinite(Date.parse(r.saved_at)) ||
    !r.event ||
    !kinds.has(r.event.kind) ||
    !["host", "browser"].includes(r.event.source) ||
    !id(r.operation_id)
  )
    throw new Error("Invalid revision envelope.");
  validate(r.canvas);
  return r;
}
async function exclusive(path, value) {
  const handle = await open(path, "wx", 0o600);
  try {
    await handle.writeFile(JSON.stringify(value, null, 2) + "\n");
    await handle.sync();
  } finally {
    await handle.close();
  }
}
export async function openStore(
  dir,
  validate,
  { fault = async () => {} } = {},
) {
  await mkdir(dir, { recursive: true });
  const lockPath = join(dir, ".writer-lock");
  let lock;
  try {
    lock = await open(lockPath, "wx", 0o600);
  } catch (e) {
    if (e.code === "EEXIST")
      throw new Error(
        "Working folder has a writer lock. Stop its owner; inspect stale lock before recovery.",
      );
    throw e;
  }
  await lock.writeFile(
    JSON.stringify({ pid: process.pid, started_at: new Date().toISOString() }),
  );
  let closed = false,
    queue = Promise.resolve(),
    poisoned = false;
  async function close() {
    if (closed) return;
    closed = true;
    await queue;
    await lock.close();
    await unlink(lockPath);
  }
  const load = async (path) =>
    validateEnvelope(JSON.parse(await readFile(path, "utf8")), validate);
  async function current() {
    return load(join(dir, "head.json"));
  }
  async function history() {
    await mkdir(join(dir, "history"), { recursive: true });
    const files = await readdir(join(dir, "history"));
    const revisions = [];
    for (const file of files) {
      if (!/^\d+-[A-Za-z0-9_-]+\.json$/.test(file))
        throw new Error(
          "Unexpected history file; inspect recovery before continuing.",
        );
      const r = await load(join(dir, "history", file));
      if (file !== filename(r))
        throw new Error("History filename does not match revision metadata.");
      revisions.push(r);
    }
    revisions.sort((a, b) => a.revision_number - b.revision_number);
    const seen = new Set();
    for (let i = 0; i < revisions.length; i++) {
      const r = revisions[i],
        prev = revisions[i - 1];
      if (
        r.revision_number !== i + 1 ||
        r.parent_revision_id !== (prev?.revision_id ?? null) ||
        (prev && r.canvas_id !== prev.canvas_id) ||
        seen.has(r.revision_id) ||
        seen.has(`op:${r.operation_id}`)
      )
        throw new Error("Broken history chain.");
      seen.add(r.revision_id);
      seen.add(`op:${r.operation_id}`);
    }
    return revisions;
  }
  try {
    const records = await history();
    let head;
    try {
      head = await current();
    } catch (e) {
      if (e.code !== "ENOENT") throw e;
    }
    if (records.length && !isDeepStrictEqual(head, records.at(-1)))
      throw new Error(
        "Orphan or inconsistent history: inspect snapshots and explicitly recover head.json and current.json.",
      );
    if (head) {
      const portable = JSON.parse(await readFile(join(dir, 'current.json'), 'utf8'));
      if (!isDeepStrictEqual(portable, head.canvas)) throw new Error('Portable current.json differs from head; inspect recovery.');
    }
    if (head && !records.length)
      throw new Error("Current revision is missing its history snapshot.");
  } catch (e) {
    await close();
    throw e;
  }
  function serial(fn) {
    if (closed) return Promise.reject(new Error("Store closed."));
    const result = queue.then(() => {
      if (poisoned)
        throw new Error(
          "Publication interrupted; close and inspect history recovery.",
        );
      return fn();
    });
    queue = result.catch(() => {});
    return result;
  }
  async function publish(r) {
    const temp = join(dir, `.head-${randomUUID()}.tmp`);
    const portable = join(dir, `.current-${randomUUID()}.tmp`);
    try {
      await fault("before_snapshot");
      await exclusive(join(dir, "history", filename(r)), r);
      await fault("after_snapshot");
      await exclusive(temp, r);
      await fault("before_replace");
      await rename(temp, join(dir, "head.json"));
      await exclusive(portable, r.canvas);
      await rename(portable, join(dir, 'current.json'));
      await fault("after_replace");
      return structuredClone(r);
    } catch (e) {
      poisoned = true;
      throw e;
    } finally {
      await unlink(portable).catch(e => { if (e.code !== "ENOENT") throw e; });
      await unlink(temp).catch((e) => {
        if (e.code !== "ENOENT") throw e;
      });
    }
  }
  return {
    close,
    current,
    history,
    initialize(canvas) {
      return serial(async () => {
        validate(canvas);
        if ((await history()).length)
          throw new Error("Folder already initialized.");
        return publish({
          storage_version: "1.0",
          canvas_id: randomUUID(),
          revision_id: randomUUID(),
          parent_revision_id: null,
          revision_number: 1,
          saved_at: new Date().toISOString(),
          operation_id: randomUUID(),
          event: { kind: "initialize", source: "host" },
          canvas: structuredClone(canvas),
        });
      });
    },
    commit(input) {
      const submitted = structuredClone(input);
      return serial(async () => {
        const { parent_revision_id, operation_id, event, canvas } = submitted;
        if (!id(operation_id)) throw new Error("Invalid operation ID.");
        validate(canvas);
        const head = await current(),
          records = await history();
        const prior = records.find((r) => r.operation_id === operation_id);
        if (prior) {
          if (
            prior.parent_revision_id !== parent_revision_id ||
            !isDeepStrictEqual(prior.canvas, canvas) ||
            !isDeepStrictEqual(prior.event, event)
          )
            throw new Error("Operation ID reuse with a different payload.");
          return structuredClone(prior);
        }
        if (parent_revision_id !== head.revision_id)
          throw new Error(
            "Revision conflict: reload latest or export local edits.",
          );
        const next = {
          storage_version: "1.0",
          canvas_id: head.canvas_id,
          revision_id: randomUUID(),
          parent_revision_id,
          revision_number: head.revision_number + 1,
          saved_at: new Date().toISOString(),
          operation_id,
          event,
          canvas,
        };
        validateEnvelope(next, validate);
        return publish(next);
      });
    },
  };
}
