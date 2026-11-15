// Host-operated conversation registry. Canvas content and histories stay framework-owned.
import {
  mkdir,
  readFile,
  readdir,
  writeFile,
  rename,
  rm,
  open,
  lstat,
  realpath,
} from "node:fs/promises";
import { join, resolve, basename } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { randomUUID, createHash } from "node:crypto";
import { initialize } from "./workspace.mjs";
import { getCore, supportedFrameworks } from "./lib/framework-core.mjs";
const id = (value) =>
  typeof value === "string" && /^[A-Za-z0-9_-]{1,160}$/.test(value);
const slug = (value) =>
  String(value || "conversation")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "conversation";
async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}
function validateRegistry(value) {
  if (
    !value ||
    value.storage_version !== "1.0" ||
    !id(value.conversation_id) ||
    !Array.isArray(value.canvases)
  )
    throw new Error("Invalid conversation registry.");
  const seen = new Set();
  for (const row of value.canvases) {
    getCore(row.framework);
    if (
      !id(row.canvas_id) ||
      typeof row.directory !== "string" ||
      !new RegExp(`^${row.framework}(?:-[2-9][0-9]*|-[1-9][0-9]+)?$`).test(
        row.directory,
      ) ||
      seen.has(row.directory) ||
      seen.has(row.canvas_id)
    )
      throw new Error("Invalid or duplicate conversation canvas.");
    seen.add(row.directory);
    seen.add(row.canvas_id);
  }
  return value;
}
async function replaceRegistry(folder, registry) {
  const temp = join(folder, `.conversation-${randomUUID()}.tmp`);
  try {
    await writeFile(temp, JSON.stringify(registry, null, 2) + "\n", {
      flag: "wx",
      mode: 0o600,
    });
    await rename(temp, join(folder, "conversation.json"));
  } finally {
    await rm(temp, { force: true });
  }
}
async function verifyCanvas(folder, row) {
  const path = join(folder, row.directory);
  const stat = await lstat(path);
  if (
    !stat.isDirectory() ||
    stat.isSymbolicLink() ||
    !(await realpath(path)).startsWith((await realpath(folder)) + "/")
  )
    throw new Error("Canvas folder must remain inside its conversation.");
  const head = await readJson(join(path, "head.json"));
  if (
    head.canvas_id !== row.canvas_id ||
    head.canvas?.framework !== row.framework
  )
    throw new Error(
      "Conversation canvas identity does not match its saved state.",
    );
  getCore(row.framework).validate(head.canvas);
  return path;
}
export async function createCanvas(
  outputs,
  canvas,
  {
    conversation = process.env.CODEX_THREAD_ID,
    title = "conversation",
    newAnalysis = false,
  } = {},
) {
  if (!id(conversation))
    throw new Error(
      "A valid explicit conversation ID or CODEX_THREAD_ID is required.",
    );
  getCore(canvas?.framework).validate(canvas);
  outputs = resolve(outputs);
  await mkdir(outputs, { recursive: true });
  const lock = join(outputs, ".conversation-writer-lock");
  let handle;
  try {
    handle = await open(lock, "wx", 0o600);
  } catch (e) {
    if (e.code === "EEXIST")
      throw new Error(
        "Conversation registry is locked; retry after its owner finishes. Inspect a crashed owner before recovery.",
      );
    throw e;
  }
  try {
    await handle.writeFile(
      JSON.stringify({
        pid: process.pid,
        started_at: new Date().toISOString(),
      }),
    );
    const matches = [];
    for (const entry of await readdir(outputs, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      let registry;
      try {
        registry = await readJson(
          join(outputs, entry.name, "conversation.json"),
        );
      } catch (e) {
        if (e.code === "ENOENT") continue;
        throw e;
      }
      validateRegistry(registry);
      if (registry.conversation_id === conversation)
        matches.push({ folder: join(outputs, entry.name), registry });
    }
    if (matches.length > 1)
      throw new Error(
        "Ambiguous conversation registries; inspect before continuing.",
      );
    let folder, registry;
    if (matches.length) {
      ({ folder, registry } = matches[0]);
    } else {
      folder = join(
        outputs,
        `${slug(title)}-${createHash("sha256").update(conversation).digest("hex").slice(0, 8)}`,
      );
      await mkdir(folder, { recursive: false });
      registry = {
        storage_version: "1.0",
        conversation_id: conversation,
        title: String(title),
        created_at: new Date().toISOString(),
        canvases: [],
      };
      await replaceRegistry(folder, registry);
    }
    const registered = new Set(registry.canvases.map((row) => row.directory));
    for (const entry of await readdir(folder, { withFileTypes: true })) {
      if (
        supportedFrameworks.some((framework) =>
          new RegExp(`^${framework}(?:-[0-9]+)?$`).test(entry.name),
        ) &&
        !registered.has(entry.name)
      )
        throw new Error(
          "Unregistered orphan canvas folder: inspect and explicitly recover registry before continuing.",
        );
    }
    for (const row of registry.canvases) await verifyCanvas(folder, row);
    const existing = registry.canvases.filter(
      (row) => row.framework === canvas.framework,
    );
    if (existing.length && !newAnalysis) {
      const row = existing.at(-1),
        path = await verifyCanvas(folder, row);
      return {
        conversation_folder: folder,
        folder: path,
        html: join(path, "canvas.html"),
        framework: row.framework,
        canvas_id: row.canvas_id,
        reused: true,
      };
    }
    const directory =
      canvas.framework + (existing.length ? `-${existing.length + 1}` : "");
    const destination = join(folder, directory);
    const first = await initialize(destination, canvas);
    const row = {
      framework: canvas.framework,
      directory,
      canvas_id: first.canvas_id,
      created_at: first.saved_at,
    };
    registry.canvases.push(row);
    await replaceRegistry(folder, registry);
    return {
      conversation_folder: folder,
      folder: destination,
      html: join(destination, "canvas.html"),
      framework: canvas.framework,
      canvas_id: row.canvas_id,
      reused: false,
    };
  } finally {
    await handle.close();
    await rm(lock, { force: true });
  }
}
async function main(args) {
  if (args[0] !== "create" || args.length < 3)
    throw new Error(
      "Usage: conversation.mjs create state.json outputs-root [--conversation id] [--title topic] [--new]",
    );
  const options = {};
  for (let i = 3; i < args.length; i++) {
    if (args[i] === "--new") options.newAnalysis = true;
    else if (["--conversation", "--title"].includes(args[i]) && args[i + 1]) {
      options[args[i].slice(2)] = args[++i];
    } else throw new Error("Unknown or incomplete conversation option.");
  }
  console.log(
    JSON.stringify(
      await createCanvas(args[2], await readJson(args[1]), options),
    ),
  );
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main(process.argv.slice(2)).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
