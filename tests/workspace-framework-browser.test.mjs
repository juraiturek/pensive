import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, readFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { chromium } from "playwright";
import {
  initialize,
  serve,
  applyResult,
} from "../.agents/skills/pensive/scripts/workspace.mjs";
const require = createRequire(import.meta.url);
const frameworks = ["swot", "pages", "vpc", "vars", "five_whys", "five_forces"];
async function fixture(t, framework) {
  const temp = await mkdtemp(join(tmpdir(), "pensive-all-frameworks-"));
  let service, browser;
  const errors = [];
  t.after(async () => {
    await browser?.close();
    await service?.close();
    await rm(temp, { recursive: true, force: true });
    assert.deepEqual(errors, []);
  });
  const core = require(
    `../.agents/skills/pensive/frameworks/${framework}/state.js`,
  );
  const state = core.initialState();
  for (const name of core.framing)
    state.content.framing[name] = `Supplied ${name} context`;
  if (framework === "five_whys")
    state.content.tree.text = "Repeated equipment downtime";
  if (framework === "pages") {
    state.content.parts.push({ id: "p1", text: "Equipment supplier" });
    state.content.goals.push({ id: "g1", text: "Grow revenue" });
    state.content.actions.push({ id: "a1", text: "Build equipment" });
    core.resetBaseline(state);
  }
  const dir = join(temp, "analysis");
  await initialize(dir, state);
  service = await serve(dir);
  browser = await chromium.launch();
  const context = await browser.newContext({ acceptDownloads: true });
  await context.addInitScript(() => {
    Object.defineProperty(navigator.clipboard, "writeText", {
      value: async (text) => {
        window.copiedRequest = text;
      },
    });
  });
  const page = await context.newPage();
  page.setDefaultTimeout(7000);
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(service.url);
  return { page, context, service, dir, core };
}
async function saved(page, n) {
  await page.waitForFunction(
    (n) =>
      document.querySelector("#revision-status")?.textContent ===
      `Saved revision ${n}`,
    n,
  );
}
for (const framework of frameworks)
  test(`${framework}: live current JSON saves, reloads, exports detached and binds a shared action`, async (t) => {
    const { page, context, service, dir } = await fixture(t, framework);
    await saved(page, 1);
    const html = await readFile(join(dir, "canvas.html"), "utf8");
    await page
      .locator("#takeaways-text")
      .fill(`Manual ${framework} observation`);
    await page
      .getByRole("button", { name: "Save Revision", exact: true })
      .click();
    await saved(page, 2);
    assert.equal(
      (await service.store.current()).canvas.takeaways,
      `Manual ${framework} observation`,
    );
    await page.reload();
    await saved(page, 2);
    assert.equal(
      await page.locator("#takeaways-text").inputValue(),
      `Manual ${framework} observation`,
    );
    await page.locator("#takeaways-formulate").click();
    await page.locator('#takeaways-dialog button[type="submit"]').click();
    await page.waitForFunction(() => !!window.copiedRequest);
    const handoff = JSON.parse(await page.evaluate(() => window.copiedRequest));
    assert.equal(handoff.request.canvas.framework, framework);
    assert.equal(
      handoff.revision_id,
      (await service.store.current()).revision_id,
    );
    assert.equal(handoff.request.action.id, "formulate_takeaways");
    const downloadPromise = page.waitForEvent("download");
    await page.locator("#save").click();
    const download = await downloadPromise;
    const detached = await readFile(await download.path(), "utf8");
    const offline = await context.newPage();
    await offline.route("**/*", (route) => route.abort());
    await offline.setContent(detached);
    assert.equal(
      await offline.locator("script[data-working-folder]").count(),
      0,
    );
    assert.equal(await offline.locator("#revision-controls").count(), 0);
    assert.equal(
      await offline.locator("#takeaways-text").inputValue(),
      `Manual ${framework} observation`,
    );
    assert.equal(await readFile(join(dir, "canvas.html"), "utf8"), html);
  });
test("pages: Ripple creates JSON revisions in one HTML, preserves baseline and records partial review/reset", async (t) => {
  const { page, service, dir } = await fixture(t, "pages");
  await saved(page, 1);
  const html = await readFile(join(dir, "canvas.html"), "utf8");
  const baseline = structuredClone(
    (await service.store.current()).canvas.ripple_baseline,
  );
  await page
    .getByLabel("Parts 1", { exact: true })
    .fill("Lifecycle reliability partner");
  await page.locator('[data-ai="ripple"]').click();
  await page.locator('#ripple-sources input[value="parts"]').check();
  await page.locator('#ai-form button[type="submit"]').click();
  await page.waitForFunction(() => !!window.copiedRequest);
  const handoff = JSON.parse(await page.evaluate(() => window.copiedRequest));
  assert.equal(
    handoff.request.canvas.content.parts[0].text,
    "Lifecycle reliability partner",
  );
  assert.deepEqual(handoff.request.canvas.ripple_baseline, baseline);
  assert.equal(handoff.request.action.id, "ripple");
  const content = structuredClone(handoff.request.canvas.content);
  content.goals[0].text = "Grow lifecycle reliability value";
  content.actions[0].text = "Maintain customer equipment";
  await applyResult(service.store, handoff, {
    content,
    thought: "The changed perspective can inform goals and actions.",
  });
  await page
    .getByRole("button", { name: "Reload Latest", exact: true })
    .click();
  await saved(page, 3);
  await page.locator("#proposal-panel summary").click();
  await page.getByRole("button", { name: "Accept Goals", exact: true }).click();
  await saved(page, 4);
  assert.equal((await service.store.current()).event.kind, "proposal_accept");
  assert.deepEqual((await service.store.current()).event.selection, ["goals"]);
  await page
    .getByRole("button", { name: "Reject All Remaining", exact: true })
    .click();
  await saved(page, 5);
  let current = await service.store.current();
  assert.equal(
    current.canvas.content.goals[0].text,
    "Grow lifecycle reliability value",
  );
  assert.equal(current.canvas.content.actions[0].text, "Build equipment");
  assert.deepEqual(current.canvas.ripple_baseline, baseline);
  assert.equal(current.event.kind, "proposal_reject");
  page.once("dialog", (d) => d.accept());
  await page.locator("#reset-baseline").click();
  await saved(page, 6);
  current = await service.store.current();
  assert.equal(current.event.kind, "baseline_reset");
  assert.equal(
    current.canvas.ripple_baseline.parts[0].text,
    "Lifecycle reliability partner",
  );
  assert.equal(await readFile(join(dir, "canvas.html"), "utf8"), html);
  await mkdir(new URL("../test-results/", import.meta.url), {
    recursive: true,
  });
  await page.screenshot({
    path: fileURLToPath(
      new URL(
        "../test-results/pages-working-folder-desktop.png",
        import.meta.url,
      ),
    ),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.screenshot({
    path: fileURLToPath(
      new URL(
        "../test-results/pages-working-folder-mobile.png",
        import.meta.url,
      ),
    ),
    fullPage: true,
  });
});

for (const framework of ["five_whys", "vars"])
  test(`${framework}: transient editor blocks revision/action save and reload preserves cancelled discard`, async (t) => {
    const { page, service } = await fixture(t, framework);
    await saved(page, 1);
    if (framework === "five_whys")
      await page
        .getByRole("button", { name: "Add cause", exact: true })
        .click();
    else {
      await page
        .getByRole("button", { name: "Focus Value Proposition", exact: true })
        .click();
      await page.getByRole("button", { name: "+ Add", exact: true }).click();
    }
    const input = page.getByRole("textbox", {
      name: framework === "five_whys" ? "Direct cause" : "New statement",
      exact: true,
    });
    await input.fill("Uncommitted investigation text");
    await page
      .getByRole("button", { name: "Save Revision", exact: true })
      .click();
    await page.waitForFunction(
      () =>
        !document.querySelector("#revision-controls button").disabled &&
        document
          .querySelector("#revision-status")
          ?.textContent.startsWith("Unsaved changes:"),
    );
    assert.equal((await service.store.current()).revision_number, 1);
    assert.equal(await input.inputValue(), "Uncommitted investigation text");
    await page.locator("#takeaways-formulate").click();
    await page.locator('#takeaways-dialog button[type="submit"]').click();
    await page.waitForFunction(
      () =>
        !document.querySelector("#revision-controls button").disabled &&
        document
          .querySelector("#revision-status")
          ?.textContent.startsWith("Unsaved changes:"),
    );
    assert.equal(await page.evaluate(() => window.copiedRequest), undefined);
    assert.equal((await service.store.current()).revision_number, 1);
    page.once("dialog", (d) => d.dismiss());
    await page
      .getByRole("button", { name: "Reload Latest", exact: true })
      .click();
    assert.equal(await input.inputValue(), "Uncommitted investigation text");
  });
