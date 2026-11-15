// Short-lived file operations. Exchange complete browser JSON explicitly.
import { mkdir, readFile, writeFile, rename, rm } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { randomUUID, createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { openStore } from './lib/revision-store.mjs';
import { getCore, getFrameworkDirectory, frameworkValidator } from './lib/framework-core.mjs';
export async function initialize(dir, canvas) {
  const core = getCore(canvas?.framework);
  const validate = frameworkValidator(canvas.framework);
  validate(canvas);
  await mkdir(dirname(resolve(dir)), { recursive: true });
  await mkdir(dir, { recursive: false });
  const store = await openStore(dir, validate);
  try {
    const first = await store.initialize(canvas);
    const html = await readFile(new URL('canvas.html', getFrameworkDirectory(canvas.framework)), 'utf8');
    await writeFile(join(dir, 'canvas.html'), core.packageHtml(html, canvas), { flag: 'wx' });
    return first;
  } finally { await store.close(); }
}
// Refresh the state slot of the existing HTML; retain every renderer/style/script byte.
async function synchronizeHtml(dir, canvas) {
  const file = join(dir, 'canvas.html');
  const html = await readFile(file, 'utf8');
  const updated = getCore(canvas.framework).packageHtml(html, canvas);
  if (updated === html) return;
  const temp = join(dir, `.canvas-${randomUUID()}.tmp`);
  try {
    await writeFile(temp, updated, { flag: 'wx' });
    await rename(temp, file);
  } finally { await rm(temp, { force: true }); }
}
export async function withStore(dir, run) {
  const head = JSON.parse(await readFile(join(dir, 'head.json'), 'utf8'));
  const store = await openStore(dir, frameworkValidator(head.canvas?.framework));
  try { return await run(store); }
  finally {
    try {
      const latest = await store.current();
      const portable = JSON.parse(await readFile(join(dir, 'current.json'), 'utf8'));
      if (!isDeepStrictEqual(portable, latest.canvas)) throw new Error('Portable current.json differs from head; inspect recovery before refreshing HTML.');
      await synchronizeHtml(dir, portable);
    } finally { await store.close(); }
  }
}
export async function prepareRequest(store, { parent_revision_id, action, canvas }) {
  let head = await store.current();
  if (head.revision_id !== parent_revision_id)
    throw new Error("Revision conflict before preparing request.");
  const framework = getCore(head.canvas.framework);
  framework.validateRequest(framework.buildRequest(canvas ?? head.canvas, action));
  if (canvas && !isDeepStrictEqual(canvas, head.canvas)) {
    head = await store.commit({ parent_revision_id, operation_id: randomUUID(),
      event: { kind: 'manual_save', source: 'host' }, canvas });
  }
  return {
    storage_version: "1.0",
    canvas_id: head.canvas_id,
    revision_id: head.revision_id,
    request_id: randomUUID(),
    request: getCore(head.canvas.framework).buildRequest(head.canvas, action),
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
  const canvas = getCore(base.canvas.framework).composeResult(
    handoff.request,
    response,
  );
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
async function main(args) {
  const [command, folder, a, b] = args;
  const json = async file => JSON.parse(await readFile(file, 'utf8'));
  if (command === 'init' && args.length === 3) {
    await initialize(resolve(a), await json(folder));
    console.log(`Created portable canvas: ${resolve(a)}`);
  } else if (command === 'sync' && args.length === 2) {
    await withStore(folder, async () => {});
    console.log('Synchronized saved JSON into the existing HTML. Refresh the page.');
  } else if (command === 'request' && args.length === 4) {
    const input = await json(a);
    const handoff = await withStore(folder, async store => {
      const head = await store.current();
      return prepareRequest(store, input.action ? input : { parent_revision_id: head.revision_id, action: input });
    });
    await writeFile(b, JSON.stringify(handoff, null, 2) + '\n', { flag: 'wx' });
  } else if (command === 'result' && args.length === 4) {
    const handoff = await json(a), response = await json(b);
    const result = await withStore(folder, store => applyResult(store, handoff, response));
    console.log(`Saved revision ${result.revision_number}; refresh the existing HTML to review.`);
  } else throw new Error('Usage: workspace.mjs init state.json destination | sync folder | request folder action-or-capture.json new-handoff.json | result folder handoff.json response.json');
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main(process.argv.slice(2)).catch(error => { console.error(error.message); process.exitCode = 1; });
