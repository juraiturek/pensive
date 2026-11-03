import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { chromium } from 'playwright';

const require = createRequire(import.meta.url);
const root = new URL('../.agents/skills/pensive/frameworks/pages/', import.meta.url);
let browser, temp;
before(async () => {
  assert.ok((await import('node:fs')).existsSync(new URL('canvas.html', root)), 'PAGES canvas is missing');
  temp = await mkdtemp(join(tmpdir(), 'pensive-browser-'));
  browser = await chromium.launch({ ...(process.env.PENSIVE_BROWSER ? { executablePath: process.env.PENSIVE_BROWSER } : {}) });
});
after(async () => { await browser?.close(); if (temp) await rm(temp, { recursive: true, force: true }); });

async function openCanvas(t, state, viewport = { width: 1440, height: 1000 }) {
  const context = await browser.newContext({ offline: true, viewport, acceptDownloads: true });
  const errors = [], network = [];
  context.on('request', request => { if (/^(https?|wss?):/.test(request.url())) network.push(request.url()); });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  t.after(async () => {
    assert.deepEqual(errors, [], 'browser errors');
    assert.deepEqual(network, [], 'unexpected network requests');
    await context.close();
  });
  let url = new URL('canvas.html', root).href;
  if (state) {
    const core = require(fileURLToPath(new URL('state.js', root)));
    const html = core.packageHtml(await readFile(new URL('canvas.html', root), 'utf8'), state);
    const path = join(temp, `${crypto.randomUUID()}.html`);
    await writeFile(path, html);
    url = pathToFileURL(path).href;
  }
  await page.goto(url);
  await page.waitForSelector('#pages-view');
  return page;
}
async function add(page, section, text) {
  const group = page.locator(`[data-section="${section}"]`);
  await group.getByRole('button', { name: 'Add', exact: true }).click();
  const input = group.locator('textarea').last();
  await input.fill(text);
  return input.getAttribute('data-id');
}
async function copiedState(page) {
  // Grant only the test browser permission; the product still requires its copy button.
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByRole('button', { name: 'Export to clipboard', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('#status').textContent.includes('Copied'));
  return JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
}
async function save(page, name) {
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save to File', exact: true }).click();
  const download = await pending;
  assert.equal(await download.failure(), null);
  const path = join(temp, name);
  await download.saveAs(path);
  return path;
}

function sample() {
  const p=require(fileURLToPath(new URL('state.js',root))); const s=p.initialState();
  s.content.parts=[{id:'p1',text:'Team'}]; s.content.actions=[{id:'a1',text:'Lead approves every task'}];
  s.content.self_concepts=[{id:'s1',text:'I must decide everything'}]; s.content.events=[{id:'e1',text:'Friday deadline'}];
  p.resetBaseline(s); return s;
}
async function importJson(page,state,accept=true) {
  await page.getByRole('button',{name:'Import JSON',exact:true}).click();
  await page.getByLabel('Import canvas JSON').fill(typeof state==='string'?state:JSON.stringify(state));
  if (accept!==null) page.once('dialog',d=>accept?d.accept():d.dismiss());
  await page.getByRole('button',{name:'Replace canvas',exact:true}).click();
}
test('empty PAGES has five bands and editable framing/items with persistent change markers',async t=>{
  const page=await openCanvas(t); assert.equal(await page.locator('[data-section]').count(),5);
  await page.getByLabel('Situation / problem').fill('Team bottleneck');
  for (const section of ['parts','actions','goals','events','self_concepts']) {
    const id=await add(page,section,section+' entry');
    assert.equal((await copiedState(page)).content[section][0].id,id);
    assert.ok((await page.locator(`[data-section="${section}"] .change-mark`).textContent()).includes('Added'));
  }
  const before=await copiedState(page); assert.deepEqual(before.ripple_baseline.parts,[]);
  await mkdir('test-results',{recursive:true}); await page.screenshot({path:'test-results/pages-desktop.png',fullPage:true});
  page.once('dialog',d=>d.accept()); await page.getByRole('button',{name:'Set current state as Ripple baseline',exact:true}).click();
  assert.equal(await page.locator('.change-mark').count(),0);
  const group=page.locator('[data-section="parts"]'); await group.locator('textarea').fill('Edited part');
  assert.ok((await group.locator('.change-mark').textContent()).includes('Edited'));
  await group.getByRole('button',{name:/Delete/}).click(); assert.ok((await group.locator('.removed-items').textContent()).includes('parts entry'));
});
test('JSON import is validated and atomic, cancellation preserves work; missing baseline requires explicit establishment',async t=>{
  const page=await openCanvas(t); await add(page,'parts','Keep me'); const before=await copiedState(page);
  await importJson(page,'{"framework":"pages"}',null); assert.ok((await page.locator('#import-error').textContent()).length>0);
  await page.getByRole('button',{name:'Cancel import',exact:true}).click(); assert.deepEqual(await copiedState(page),before);
  await importJson(page,sample(),false); await page.getByRole('button',{name:'Cancel import',exact:true}).click(); assert.deepEqual(await copiedState(page),before);
  const imported=sample(); delete imported.ripple_baseline; await importJson(page,imported,true);
  assert.deepEqual(await copiedState(page),imported); assert.ok((await page.locator('#baseline-status').textContent()).includes('cannot be recovered'));
  await page.getByRole('button',{name:'Ripple',exact:true}).click(); assert.ok((await page.locator('#status').textContent()).includes('baseline'));
  page.once('dialog',d=>d.accept()); await page.getByRole('button',{name:'Set current state as Ripple baseline',exact:true}).click();
  assert.equal((await copiedState(page)).ripple_baseline.parts[0].id,'p1');
});
test('Evaluate Improve and multi-source Ripple export complete current state with before/after preview',async t=>{
  const page=await openCanvas(t,sample()); await page.context().grantPermissions(['clipboard-read','clipboard-write']);
  await page.locator('[data-section="self_concepts"] textarea').fill('I can delegate');
  await page.locator('[data-section="events"]').getByRole('button',{name:/Delete/}).click();
  const before=await copiedState(page);
  for (const id of ['evaluate','improve','ripple']) {
    await page.locator(`[data-ai="${id}"]`).click(); await page.getByLabel('Steering guidance').fill('Keep the Friday goal');
    if(id==='ripple') {
      await page.getByRole('checkbox', {name:'Self-concepts',exact:true}).check(); await page.getByRole('checkbox',{name:'Events',exact:true}).check();
      assert.ok((await page.locator('#ripple-preview').textContent()).includes('I must decide everything'));
      assert.ok((await page.locator('#ripple-preview').textContent()).includes('Removed'));
      await page.screenshot({path:'test-results/pages-ripple-dialog-desktop.png',fullPage:true});
      await page.setViewportSize({width:390,height:844});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
      await page.screenshot({path:'test-results/pages-ripple-dialog-mobile.png',fullPage:true});
      await page.setViewportSize({width:1440,height:1000});
    }
    await page.getByRole('button',{name:'Copy AI request',exact:true}).click();
    await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Copied AI request'));
    const req=JSON.parse(await page.evaluate(()=>navigator.clipboard.readText())); assert.deepEqual(req.canvas,before); assert.equal(req.action.id,id);
    if(id==='ripple') assert.deepEqual(new Set(req.action.sources),new Set(['self_concepts','events']));
  }
});
test('baseline survives consecutive HTML saves and JSON reimport; implementation bytes remain stable',async t=>{
  const page=await openCanvas(t,sample()); await page.locator('[data-section="parts"] textarea').fill('Partner team');
  const before=await copiedState(page); const impl=await page.locator('style, script[data-implementation]').allTextContents();
  for(const name of ['pages-first.html','pages-second.html']) {
    await page.goto(pathToFileURL(await save(page,name)).href); assert.deepEqual(await copiedState(page),before);
    assert.deepEqual(await page.locator('style, script[data-implementation]').allTextContents(),impl);
  }
  await importJson(page,before,true); assert.deepEqual(await copiedState(page),before);
});
test('whole-canvas proposal accept/reject protects local edits and baseline, including imported proposals',async t=>{
  const p=require(fileURLToPath(new URL('state.js',root))); const s=sample(); p.editItem(s,'self_concepts','s1','I can delegate');
  const content=structuredClone(s.content); content.actions[0].text='Team decides routine work';
  const proposed=p.composeResult(p.buildRequest(s,{id:'ripple',sources:['self_concepts']}),{content,thought:'Delegation may reduce approval delays.'});
  const page=await openCanvas(t,proposed); await page.getByText('Review proposed changes',{exact:true}).click();
  assert.ok((await page.locator('#proposal-panel').textContent()).includes('Team decides routine work'));
  await page.screenshot({path:'test-results/pages-proposal.png',fullPage:true});
  await page.getByRole('button',{name:'Accept All',exact:true}).click(); assert.deepEqual((await copiedState(page)).content,content);
  assert.deepEqual((await copiedState(page)).ripple_baseline,s.ripple_baseline);
  await importJson(page,proposed,true); await page.locator('[data-section="actions"] textarea').fill('New local choice');
  await page.getByRole('button',{name:'Accept All',exact:true}).click(); assert.ok((await page.locator('#proposal-panel [role="alert"]').textContent()).includes('changed'));
  await page.getByRole('button',{name:'Reject All',exact:true}).click(); assert.equal((await copiedState(page)).content.actions[0].text,'New local choice');
});
test('clipboard denial, dialog cancel and no-source Ripple are safe; mobile has no overflow',async t=>{
  const page=await openCanvas(t,sample(),{width:390,height:844});
  await page.locator('[data-ai="ripple"]').click(); assert.ok((await page.locator('#status').textContent()).includes('changed'));
  await page.locator('[data-ai="improve"]').click(); await page.keyboard.press('Escape'); assert.equal(await page.locator('#ai-dialog').isVisible(),false);
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{throw new Error('Denied');}}}));
  await page.locator('[data-ai="evaluate"]').click(); await page.getByRole('button',{name:'Copy AI request',exact:true}).click();
  await page.waitForSelector('#clipboard-fallback:not([hidden])'); assert.equal(JSON.parse(await page.getByLabel('Canvas JSON',{exact:true}).inputValue()).action.id,'evaluate');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.locator('#save').focus(); await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab');
  assert.notEqual(await page.locator('#save').evaluate(el=>getComputedStyle(el).outlineStyle),'none');
  await page.screenshot({path:'test-results/pages-mobile.png',fullPage:true});
});
test('adversarial current/baseline/proposal text is inert and invalid initial state fails visibly',async t=>{
  const p=require(fileURLToPath(new URL('state.js',root))); const s=sample(); const attack='</script><img src="https://invalid.example/x" onerror="globalThis.attacked=true">';
  s.content.parts[0].text=attack; p.resetBaseline(s); const content=structuredClone(s.content); content.goals=[{id:'g',text:attack+' goal'}];
  const state=p.composeResult(p.buildRequest(s,{id:'improve'}),{content,thought:attack});
  const page=await openCanvas(t,state); await page.getByText('Review proposed changes',{exact:true}).click(); assert.equal(await page.locator('img').count(),0);
  assert.equal(await page.evaluate(()=>globalThis.attacked),undefined); assert.deepEqual(await copiedState(page),state);
  const html=await readFile(new URL('canvas.html',root),'utf8'); const path=join(temp,'bad.html');
  await writeFile(path,html.replace(/(<script id="canvas-state" type="application\/json">)[\s\S]*?(<\/script>)/,'$1{}$2')); await page.goto(pathToFileURL(path).href);
  assert.ok((await page.locator('#status').textContent()).includes('Invalid canvas')); assert.equal(await page.locator('#save').isDisabled(),true);
});

test('proposal review labels only new and updated bullets, preserves wrapping and saved review',async t=>{
  const p=require(fileURLToPath(new URL('state.js',root))),s=sample();
  s.content.goals=[{id:'g1',text:'Keep this goal'},{id:'g2',text:'Clarify this goal'}];p.resetBaseline(s);
  const content=structuredClone(s.content);content.goals[1].text='Clarified outcome with a concrete criterion';
  content.goals.push({id:'g3',text:'A newly proposed goal with enough context to wrap on a narrow mobile screen.'});
  const proposed=p.composeResult(p.buildRequest(s,{id:'improve'}),{content,thought:'Clarified one goal and added another.'});
  const page=await openCanvas(t,proposed);await page.getByText('Review proposed changes',{exact:true}).click();
  const diff=page.locator('.proposal-diff').filter({has:page.getByRole('heading',{name:'Goals',exact:true})});
  assert.equal(await diff.locator('.proposal-tag').count(),2);
  assert.equal(await diff.locator('li').filter({hasText:'Keep this goal'}).locator('.proposal-tag').count(),0);
  assert.equal(await diff.locator('li').filter({hasText:'Clarified outcome'}).locator('.proposal-tag').textContent(),'Updated');
  assert.equal(await diff.locator('li').filter({hasText:'A newly proposed goal'}).locator('.proposal-tag').textContent(),'New');
  assert.equal(await diff.locator('div').filter({has:page.getByText('Current',{exact:true})}).first().locator('.proposal-tag').count(),0);
  await page.screenshot({path:'test-results/pages-proposal-tags-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:'test-results/pages-proposal-tags-mobile.png',fullPage:true});
  await page.goto(pathToFileURL(await save(page,'pages-tagged-review.html')).href);await page.getByText('Review proposed changes',{exact:true}).click();
  assert.equal(await page.locator('.proposal-tag').count(),2);
  await page.getByRole('button',{name:'Accept All',exact:true}).click();assert.equal(await page.locator('.proposal-tag').count(),0);
  assert.deepEqual((await copiedState(page)).content,content);
});
