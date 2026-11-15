import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
const root = new URL('../.agents/skills/pensive/frameworks/issue_tree/', import.meta.url);
const W = createRequire(import.meta.url)(fileURLToPath(new URL('state.js', root)));
let browser, temp;
before(async () => { temp = await mkdtemp(join(tmpdir(), 'issue-tree-browser-')); browser = await chromium.launch(); });
after(async () => { await browser?.close(); if (temp) await rm(temp, {recursive:true,force:true}); });
async function open(t, state = W.initialState(), viewport = {width:1440,height:1000}) {
  const context = await browser.newContext({offline:true,acceptDownloads:true,viewport});
  const page = await context.newPage(), errors = [], requests = [];
  page.on('pageerror', error => errors.push(error.message));
  context.on('request', r => { if (/^https?:/.test(r.url())) requests.push(r.url()); });
  t.after(async () => { await context.close(); assert.deepEqual(errors, []); assert.deepEqual(requests, []); });
  const path = join(temp, crypto.randomUUID()+'.html');
  await writeFile(path, W.packageHtml(await readFile(new URL('canvas.html', root), 'utf8'),state));
  await page.goto(pathToFileURL(path).href); return page;
}
async function exported(page) {
  await page.context().grantPermissions(['clipboard-read','clipboard-write']);
  await page.locator('#copy').click(); return JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
}
async function choose(page, id) { await page.locator(`[data-node-id="${id}"] .issue-node-select`).click(); }
function treeState() { const s = W.initialState(); W.editNode(s,'root',{title:'Governing question'}); return s; }
function proposed() {
  const s = treeState(), child = W.addChild(s,'root','Original factor');
  const tree = structuredClone(s.content.tree); tree.children = [{id:'alternative_factor',title:'Different lens',notes:'Rationale',highImpact:false,highInfluence:false,children:[]}];
  return {state:W.composeResult(W.buildRequest(s,{id:'alternative'}),{thought:'Alternative principle and tradeoffs',tree}), child};
}
test('manual multilevel editing, selected details, confirmed subtree deletion, and exact JSON/HTML roundtrip', async t => {
  const page = await open(t);
  await page.locator('#framing').fill('Situation and complication');
  await page.locator('#node-title').fill('Governing question');
  await page.getByRole('button',{name:'Add child to Governing question',exact:true}).click();
  await page.locator('#node-title').fill('Workload'); await page.locator('#node-notes').fill('Evidence and assumptions');
  const first = (await exported(page)).cursor.at(-1);
  await page.getByRole('button',{name:'Add child to Workload',exact:true}).click();
  await page.locator('#node-title').fill('Backlog'); await choose(page, first);
  assert.equal(await page.locator('#node-notes').inputValue(),'Evidence and assumptions');
  const before = await exported(page);
  const download = page.waitForEvent('download'); await page.locator('#save').click();
  const saved = join(temp,'saved.html'); await (await download).saveAs(saved); await page.goto(pathToFileURL(saved).href);
  assert.deepEqual(await exported(page), before);
  await page.locator('#import').click(); await page.locator('#import-json').fill(JSON.stringify(before));
  page.once('dialog', d => d.accept()); await page.getByRole('button',{name:'Replace canvas',exact:true}).click();
  assert.deepEqual(await exported(page),before);
  page.once('dialog', d => d.dismiss()); await page.getByRole('button',{name:'Delete Workload',exact:true}).click();
  assert.equal(await page.locator('.issue-node').count(),3);
  page.once('dialog', d => d.accept()); await page.getByRole('button',{name:'Delete Workload',exact:true}).click();
  assert.equal(await page.locator('.issue-node').count(),1);
  assert.deepEqual((await exported(page)).cursor,['root']);
});
test('priority marks have independent Boolean styles for all four combinations', async t => {
  const page = await open(t,treeState()); const styles = [];
  for (const [impact,influence] of [[false,false],[true,false],[false,true],[true,true]]) {
    await page.locator('#high-impact').setChecked(impact); await page.locator('#high-influence').setChecked(influence);
    const box = page.locator('[data-node-id="root"]');
    const style = await box.evaluate(n => ({impact:n.classList.contains('high-impact'),influence:n.classList.contains('high-influence'),width:getComputedStyle(n).borderTopWidth,background:getComputedStyle(n).backgroundColor}));
    assert.equal(style.impact,impact); assert.equal(style.influence,influence); styles.push(style);
  }
  assert.notEqual(styles[0].width,styles[1].width); assert.equal(styles[1].width,styles[3].width);
  assert.notEqual(styles[0].background,styles[2].background); assert.equal(styles[2].background,styles[3].background);
});
test('AI requests include full edited canvas and explicit actions', async t => {
  const page = await open(t,treeState()); await page.context().grantPermissions(['clipboard-read','clipboard-write']);
  for (const id of ['evaluate','alternative']) {
    await page.locator(`[data-ai="${id}"]`).click(); await page.locator('#ai-guidance').fill('Investigate overlaps');
    await page.getByRole('button',{name:'Copy AI request',exact:true}).click();
    const request = JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
    assert.equal(request.action.id,id); assert.equal(request.action.comment,'Investigate overlaps');
    assert.equal(request.canvas.content.tree.title,'Governing question'); W.validateRequest(request);
  }
});
test('alternative proposal supports whole-tree accept, reject, stale guard, and saved pending review', async t => {
  const fixture = proposed(), page = await open(t,fixture.state);
  assert.equal(await page.locator('[data-ai="evaluate"]').isDisabled(),true);
  assert.match(await page.locator('#proposal-panel').textContent(),/Different lens/);
  await page.getByRole('button',{name:'Accept whole alternative',exact:true}).click();
  let s = await exported(page); assert.equal(s.content.tree.children[0].id,'alternative_factor'); assert.equal(s.proposals,undefined);
  const rejected = await open(t,fixture.state);
  await rejected.getByRole('button',{name:'Reject alternative',exact:true}).click();
  s = await exported(rejected); assert.equal(s.content.tree.children[0].id,fixture.child); assert.equal(s.proposals,undefined);
  const stale = await open(t,fixture.state); await stale.locator('#framing').fill('Changed framing');
  await stale.getByRole('button',{name:'Accept whole alternative',exact:true}).click();
  assert.match(await stale.locator('#status').textContent(),/stale/);
  assert.equal((await exported(stale)).content.tree.children[0].id,fixture.child);
  const download = stale.waitForEvent('download'); await stale.locator('#save').click();
  const saved=join(temp,'pending.html'); await (await download).saveAs(saved); await stale.goto(pathToFileURL(saved).href);
  assert.equal(await stale.locator('#proposal-panel').isVisible(),true);
});
test('wide and deep trees scroll to every node; desktop tree keeps 80 percent and narrow details remain usable', async t => {
  const s=treeState(); for(let i=0;i<10;i++)W.addChild(s,'root','Wide '+i);
  let parent=s.content.tree.children[0].id; for(let i=0;i<10;i++)parent=W.addChild(s,parent,'Deep '+i);
  W.editNode(s,parent,{title:'A very long title '.repeat(50)});
  const page=await open(t,s);
  const sizes=await page.evaluate(()=>{const tree=document.querySelector('.issue-tree-scroll'),panel=document.querySelector('#node-details');return {tree:tree.clientWidth,panel:panel.getBoundingClientRect().width,wide:tree.scrollWidth>tree.clientWidth,deep:tree.scrollHeight>tree.clientHeight};});
  assert.ok(sizes.tree/(sizes.tree+sizes.panel) >= .799); assert.ok(sizes.wide); assert.ok(sizes.deep);
  const last=page.locator(`[data-node-id="${parent}"]`);await last.scrollIntoViewIfNeeded();await last.locator('.issue-node-select').click();
  assert.equal(await page.locator('#node-title').inputValue(),'A very long title '.repeat(50));
  assert.ok((await last.boundingBox()).height<=90);
  await page.setViewportSize({width:390,height:844});
  await page.locator('#node-notes').fill('Narrow edit');assert.equal(W.find(await exported(page),parent).node.notes,'Narrow edit');
  const all=await page.locator('#node-details').boundingBox();assert.ok(all.width<=390);
});
