import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import { chromium } from "playwright";
import {
  initialize,
  serve,
  prepareRequest,
  applyResult,
} from "../.agents/skills/pensive/scripts/workspace.mjs";
const Swot = createRequire(import.meta.url)(
  "../.agents/skills/pensive/frameworks/swot/state.js",
);
async function fixture(t) {
  const temp = await mkdtemp(join(tmpdir(), "pensive-live-"));
  const dir = join(temp, "analysis");
  const state = Swot.initialState();
  state.content.framing = {
    focal_entity: "Company",
    objective: "Choose direction",
    environment: "Local market",
  };
  state.content.strengths.push({ id: "s1", text: "Strength" });
  await initialize(dir, state);
  const service = await serve(dir);
  const browser = await chromium.launch();
  const context = await browser.newContext({
    acceptDownloads: true,
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const page = await context.newPage();
  await page.addInitScript(() => {
    Object.defineProperty(navigator.clipboard, "writeText", {
      value: async (value) => {
        window.copiedRequest = value;
      },
    });
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  t.after(async () => {
    await browser.close();
    await service.close();
    await rm(temp, { recursive: true, force: true });
    assert.deepEqual(errors, []);
  });
  await page.goto(service.url);
  return { page, context, dir, service };
}
async function saved(page, n) {
  await page.getByRole("status", { name: "Revision status" }).waitFor();
  await page.waitForFunction(
    (n) =>
      document.querySelector("#revision-status")?.textContent ===
      `Saved revision ${n}`,
    n,
  );
}
test("browser saves edits, reloads latest and exports an offline detached canvas", async (t) => {
  const { page, dir, service } = await fixture(t);
  await saved(page, 1);
  const html = await readFile(join(dir, "canvas.html"), "utf8");
  await page.getByLabel("Strengths 1", { exact: true }).fill("Edited strength");
  await page
    .getByRole("button", { name: "Save Revision", exact: true })
    .click();
  await saved(page, 2);
  assert.equal(
    (await service.store.current()).canvas.content.strengths[0].text,
    "Edited strength",
  );
  assert.equal(await readFile(join(dir, "canvas.html"), "utf8"), html);
  await page.reload();
  await saved(page, 2);
  assert.equal(
    await page.getByLabel("Strengths 1", { exact: true }).inputValue(),
    "Edited strength",
  );
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#save").click();
  const download = await downloadPromise;
  const exported = await readFile(await download.path(), "utf8");
  assert.ok(!exported.includes(service.token));
  const detached = await page.context().newPage();
  await detached.route("**/*", (r) => r.abort());
  await detached.setContent(exported);
  assert.equal(
    await detached.getByLabel("Strengths 1", { exact: true }).inputValue(),
    "Edited strength",
  );
  assert.equal(await detached.locator("#revision-controls").count(), 0);
  assert.equal(
    await detached.locator("script[data-working-folder]").count(),
    0,
  );
});
test("two tabs reject stale saves and cancelling reload retains local edits", async (t) => {
  const { page, context, service } = await fixture(t);
  await saved(page, 1);
  const second = await context.newPage();
  await second.goto(service.url);
  await saved(second, 1);
  await page.getByLabel("Strengths 1", { exact: true }).fill("First");
  await page
    .getByRole("button", { name: "Save Revision", exact: true })
    .click();
  await saved(page, 2);
  await second.getByLabel("Strengths 1", { exact: true }).fill("Second");
  await second
    .getByRole("button", { name: "Save Revision", exact: true })
    .click();
  await second.waitForFunction(() =>
    document.querySelector("#revision-status").textContent.includes("conflict"),
  );
  second.once("dialog", (d) => d.dismiss());
  await second
    .getByRole("button", { name: "Reload Latest", exact: true })
    .click();
  assert.equal(
    await second.getByLabel("Strengths 1", { exact: true }).inputValue(),
    "Second",
  );
  assert.equal(
    (await service.store.current()).canvas.content.strengths[0].text,
    "First",
  );
});
test("requests save exact current state and proposal decisions persist separately", async (t) => {
  const { page, service } = await fixture(t);
  await saved(page, 1);
  await page.getByLabel("Strengths 1", { exact: true }).fill("Before action");
  await page.locator('[data-ai="improve"]').click();
  await page.locator('#ai-form button[type="submit"]').click();
  await page.waitForFunction(() => window.copiedRequest);
  const handoff = JSON.parse(await page.evaluate(() => window.copiedRequest));
  assert.equal(
    handoff.request.canvas.content.strengths[0].text,
    "Before action",
  );
  assert.equal(
    handoff.revision_id,
    (await service.store.current()).revision_id,
  );
  const content = structuredClone(handoff.request.canvas.content);
  content.strengths[0].text = "Proposed";
  await applyResult(service.store, handoff, { content, thought: "Clarified." });
  await page
    .getByRole("button", { name: "Reload Latest", exact: true })
    .click();
  await saved(page, 3);
  await page.getByRole("button", { name: "Accept All", exact: true }).click();
  await saved(page, 4);
  const head = await service.store.current();
  assert.equal(head.event.kind, "proposal_accept");
  assert.equal(head.canvas.content.strengths[0].text, "Proposed");
});
test("reload serializes against saves and protects edits made during a delayed fetch", async (t) => {
  const { page } = await fixture(t);
  await saved(page, 1);
  let release, started;
  const gate = new Promise((r) => (release = r)),
    seen = new Promise((r) => (started = r));
  await page.route("**/api/current", async (route) => {
    const response = await route.fetch();
    started();
    await gate;
    await route.fulfill({ response });
  });
  await page
    .getByRole("button", { name: "Reload Latest", exact: true })
    .click();
  await seen;
  assert.equal(
    await page
      .getByRole("button", { name: "Save Revision", exact: true })
      .isDisabled(),
    true,
  );
  await page
    .getByLabel("Strengths 1", { exact: true })
    .fill("Keep edit during reload");
  release();
  await page.waitForFunction(
    () => !document.querySelector("#revision-controls button").disabled,
  );
  assert.equal(
    await page.getByLabel("Strengths 1", { exact: true }).inputValue(),
    "Keep edit during reload",
  );
});
test("failed save retains edits and retry publishes once; screenshots cover desktop and narrow controls", async (t) => {
  const { page, service } = await fixture(t);
  await saved(page, 1);
  await page
    .getByLabel("Strengths 1", { exact: true })
    .fill("Retain after failure");
  let failed = false;
  await page.route("**/api/revisions", async (route) => {
    if (!failed) {
      failed = true;
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "Temporary write failure" }),
      });
    } else await route.continue();
  });
  await page
    .getByRole("button", { name: "Save Revision", exact: true })
    .click();
  await page.waitForFunction(() =>
    document
      .querySelector("#revision-status")
      .textContent.includes("Temporary write failure"),
  );
  assert.equal(
    await page.getByLabel("Strengths 1", { exact: true }).inputValue(),
    "Retain after failure",
  );
  assert.equal((await service.store.current()).revision_number, 1);
  await page
    .getByRole("button", { name: "Save Revision", exact: true })
    .click();
  await saved(page, 2);
  assert.equal((await service.store.history()).length, 2);
  assert.equal(
    await page
      .locator("#status")
      .evaluate((node) => node.classList.contains("error")),
    false,
  );
  const { mkdir } = await import("node:fs/promises");
  await mkdir(new URL("../test-results/", import.meta.url), {
    recursive: true,
  });
  await page.screenshot({
    path: new URL("../test-results/kaizen-desktop.png", import.meta.url)
      .pathname,
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.screenshot({
    path: new URL("../test-results/kaizen-narrow.png", import.meta.url)
      .pathname,
    fullPage: true,
  });
});
test("partial proposal decisions, Takeaways review and annotations survive independent saves", async (t) => {
  const { page, service } = await fixture(t);
  await saved(page, 1);
  const head = await service.store.current();
  const handoff = await prepareRequest(service.store, {
    parent_revision_id: head.revision_id,
    action: { id: "improve" },
  });
  const content = structuredClone(head.canvas.content);
  content.strengths[0].text = "Clear strength";
  content.weaknesses.push({ id: "w1", text: "Weakness" });
  await applyResult(service.store, handoff, {
    content,
    thought: "Clarified two collections.",
  });
  await page
    .getByRole("button", { name: "Reload Latest", exact: true })
    .click();
  await saved(page, 2);
  await page.locator("#proposal-panel summary").click();
  await page
    .getByRole("button", { name: "Accept Strengths", exact: true })
    .click();
  await saved(page, 3);
  let current = await service.store.current();
  assert.ok(current.canvas.proposals?.length);
  assert.equal(current.event.selection[0], "strengths");
  await page
    .getByRole("button", { name: "Reject All Remaining", exact: true })
    .click();
  await saved(page, 4);
  current = await service.store.current();
  assert.equal(current.event.kind, "proposal_reject");
  assert.equal(current.canvas.content.strengths[0].text, "Clear strength");
  assert.equal(current.canvas.content.weaknesses.length, 0);
  const takeawayRequest = await prepareRequest(service.store, {
    parent_revision_id: current.revision_id,
    action: { id: "formulate_takeaways", include_annotations: false },
  });
  await applyResult(service.store, takeawayRequest, {
    takeaways: "Consider a focused next step.",
    rationale: "Based on the canvas.",
  });
  await page
    .getByRole("button", { name: "Reload Latest", exact: true })
    .click();
  await saved(page, 5);
  await page.locator("#takeaways-accept").click();
  await saved(page, 6);
  current = await service.store.current();
  assert.equal(current.event.kind, "proposal_accept");
  assert.equal(current.event.target, "takeaways");
  assert.equal(current.canvas.takeaways, "Consider a focused next step.");
  // A manually edited annotation round-trips through the same complete-state persistence.
  const canvas = structuredClone(current.canvas);
  canvas.annotations = [
    {
      id: "note_1",
      target: { type: "canvas" },
      target_label: "Whole canvas",
      text: "Question to preserve",
    },
  ];
  // Use established import validation instead of constructing a second browser editing implementation.
  Swot.validate(canvas);
  await page.locator("#import").click();
  await page.locator("#import-json").fill(JSON.stringify(canvas));
  page.once("dialog", (d) => d.accept());
  await page.locator('#import-form button[type="submit"]').click();
  await saved(page, 7);
  await page.reload();
  await saved(page, 7);
  assert.deepEqual(
    (await service.store.current()).canvas.annotations,
    canvas.annotations,
  );
});

test("failed save before an action produces no handoff and reports unsaved state", async (t) => {
  const { page, service } = await fixture(t);
  await saved(page, 1);
  await page
    .getByLabel("Strengths 1", { exact: true })
    .fill("Unsaved action context");
  await page.route("**/api/revisions", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "Cannot save action context" }),
    }),
  );
  await page.locator('[data-ai="evaluate"]').click();
  await page.locator('#ai-form button[type="submit"]').click();
  await page.waitForFunction(() =>
    document
      .querySelector("#status")
      .textContent.includes("Cannot save action context"),
  );
  assert.match(
    await page.locator("#revision-status").textContent(),
    /Unsaved changes/,
  );
  assert.equal(await page.evaluate(() => window.copiedRequest), undefined);
  assert.equal((await service.store.current()).revision_number, 1);
});
