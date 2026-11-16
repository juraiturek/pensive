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
async function open(t, state = W.initialState(), viewport = {width:1440,height:1000}, options = {}) {
  const context = await browser.newContext({offline:true,acceptDownloads:true,viewport,...options});
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

test('full-screen view fits every node on open and resize, preserves state, and restores focus', async t => {
  const s = treeState();
  for (let i = 0; i < 10; i++) W.addChild(s, 'root', 'Wide ' + i);
  let parent = s.content.tree.children[0].id;
  for (let i = 0; i < 10; i++) parent = W.addChild(s, parent, 'Deep ' + i);
  W.editNode(s, parent, {highImpact:true, highInfluence:true});
  const page = await open(t, s), before = await exported(page);
  const opener = page.getByRole('button', {name:'Full screen', exact:true});
  await opener.click({timeout:2000});
  const dialog = page.getByRole('dialog', {name:'Full Tree', exact:true});
  assert.equal(await dialog.isVisible(), true);
  assert.equal(await dialog.locator('.issue-node').count(), 21);
  assert.equal(await dialog.locator('.issue-node.selected').count(), 0);
  assert.equal(await page.locator('#tree-board .issue-node.selected').count(), 1);
  assert.equal(await dialog.locator('.issue-node-controls, textarea, input').count(), 0);
  assert.equal(await dialog.locator('.high-impact.high-influence').count(), 1);
  async function checkFit() {
    await page.waitForFunction(() => {
      const viewport = document.querySelector('#overview-viewport').getBoundingClientRect();
      const nodes = [...document.querySelectorAll('#overview-board .issue-node')];
      return nodes.length && nodes.every(n => { const r=n.getBoundingClientRect(); return r.left>=viewport.left && r.right<=viewport.right && r.top>=viewport.top && r.bottom<=viewport.bottom; });
    });
    const rect = await dialog.boundingBox(), size = page.viewportSize();
    assert.ok(rect.width >= size.width - 2); assert.ok(rect.height >= size.height - 2);
  }
  await checkFit();
  await page.keyboard.press('Tab');
  assert.equal(await page.locator('#overview-board .issue-node-collapse').first().evaluate(n => n === document.activeElement), true);
  await page.setViewportSize({width:390,height:844}); await checkFit();
  await page.screenshot({path:'test-results/issue-tree-fullscreen-narrow.png'});
  await page.keyboard.press('Escape');
  assert.equal(await dialog.isVisible(), false);
  assert.equal(await opener.evaluate(n => n === document.activeElement), true);
  assert.deepEqual(await exported(page), before);
  await page.setViewportSize({width:1440,height:1000});
  await opener.click(); await checkFit();
  await page.screenshot({path:'test-results/issue-tree-fullscreen-desktop.png'});
  await page.getByRole('button', {name:'Close full tree view'}).click();
  assert.equal(await dialog.isVisible(), false);
  assert.equal(await opener.evaluate(n => n === document.activeElement), true);
});

test('full-screen view centers small trees without shrinking them to the padded editor board', async t => {
  for (const depth of [0, 2]) {
    const state = treeState(); let parent = 'root';
    for (let i = 0; i < depth; i++) parent = W.addChild(state, parent, 'Factor ' + i);
    const page = await open(t, state, {width:390,height:844});
    await page.getByRole('button', {name:'Full screen',exact:true}).click();
    const bounds = await page.evaluate(() => {
      const viewport = document.querySelector('#overview-viewport').getBoundingClientRect();
      const nodes = [...document.querySelectorAll('#overview-board .issue-node')].map(n=>n.getBoundingClientRect());
      return {centerX:viewport.x+viewport.width/2, centerY:viewport.y+viewport.height/2,
        left:Math.min(...nodes.map(n=>n.left)), right:Math.max(...nodes.map(n=>n.right)),
        top:Math.min(...nodes.map(n=>n.top)), bottom:Math.max(...nodes.map(n=>n.bottom)), nodeWidth:nodes[0].width};
    });
    assert.ok(Math.abs((bounds.left+bounds.right)/2-bounds.centerX)<1, JSON.stringify(bounds));
    assert.ok(Math.abs((bounds.top+bounds.bottom)/2-bounds.centerY)<1, JSON.stringify(bounds));
    assert.ok(bounds.nodeWidth>=207, JSON.stringify(bounds));
  }
});
test('dedicated MECE button exports full state and guidance without scope radios',async t=>{
 const page=await open(t,treeState());await page.context().grantPermissions(['clipboard-read','clipboard-write']);
 for(const id of ['evaluate','mece_evaluate','alternative']){
  await page.locator(`[data-ai="${id}"]`).click();assert.equal(await page.getByRole('radio').count(),0);await page.locator('#ai-guidance').fill('Keep supplied context');await page.getByRole('button',{name:'Copy AI request',exact:true}).click();
  const req=JSON.parse(await page.evaluate(()=>navigator.clipboard.readText()));assert.equal(req.action.id,id);assert.equal(req.action.comment,'Keep supplied context');assert.equal(req.action.evaluation_scope,undefined);assert.equal(req.canvas.content.tree.title,'Governing question');W.validateRequest(req);
 }
 await page.locator('[data-ai="mece_evaluate"]').click();await page.getByRole('button',{name:'Cancel',exact:true}).click();assert.equal(await page.locator('#ai-dialog').isVisible(),false);
 await page.locator('[data-ai="mece_evaluate"]').click();await page.keyboard.press('Escape');assert.equal(await page.locator('#ai-dialog').isVisible(),false);
 const pending=await open(t,proposed().state);assert.equal(await pending.locator('[data-ai="mece_evaluate"]').isDisabled(),true);
 const fallback=await open(t,treeState());await fallback.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{throw Error('Denied')}}});});await fallback.locator('[data-ai="mece_evaluate"]').click();await fallback.getByRole('button',{name:'Copy AI request',exact:true}).click();assert.equal(await fallback.locator('#clipboard-fallback').isVisible(),true);assert.equal(JSON.parse(await fallback.locator('#clipboard-json').inputValue()).action.id,'mece_evaluate');
});
test('selected title edits inline; blur, Enter, Escape, IME and keyboard retain complete titles',async t=>{
 const s=treeState(),child=W.addChild(s,'root','Existing child');const page=await open(t,s);
 await choose(page,'root');assert.equal(await page.locator('.issue-node-title-editor').count(),0);
 await choose(page,'root');const editor=page.locator('.issue-node-title-editor');await editor.fill('Changed inline');assert.equal(await page.locator('#node-title').inputValue(),'Changed inline');await editor.press('Enter');assert.equal(await editor.count(),0);
 await choose(page,'root');await editor.fill('Discard');await editor.press('Escape');assert.equal((await exported(page)).content.tree.title,'Changed inline');
 await choose(page,'root');await editor.fill('First');await editor.press('Shift+Enter');await editor.press('End');await editor.press('x');await editor.press('Enter');assert.match((await exported(page)).content.tree.title,/\n/);
 await page.locator('[data-node-id="root"] .issue-node-select').focus();await page.keyboard.press('F2');await editor.fill('Composition');await editor.dispatchEvent('keydown',{key:'Enter',isComposing:true});assert.equal(await editor.count(),1);
 await choose(page,child);assert.equal(await page.locator('#node-title').inputValue(),'Existing child');assert.equal((await exported(page)).content.tree.title,'Composition');
 await choose(page,child);await editor.fill('Export this draft');await page.locator('#copy').click();assert.equal(W.find(await exported(page),child).node.title,'Export this draft');
 assert.equal(await page.getByRole('button',{name:'Add child to Export this draft',exact:true}).count(),1);
 assert.equal(await page.getByRole('button',{name:'Delete Export this draft',exact:true}).count(),1);
 await page.locator('[data-node-id="root"] .issue-node-select').focus();await page.keyboard.press('F2');await editor.fill('F2 selects the root');assert.equal(await page.locator('#node-title').inputValue(),'F2 selects the root');assert.deepEqual((await exported(page)).cursor,['root']);
});
test('new children are blank and immediately editable with visual-only naming hints',async t=>{
 const page=await open(t,treeState());await page.getByRole('button',{name:'Add child to Governing question',exact:true}).click();
 const editor=page.locator('.issue-node-title-editor');assert.equal(await editor.inputValue(),'');assert.equal(await editor.getAttribute('placeholder'),'Enter name');assert.equal(await editor.evaluate(n=>n===document.activeElement),true);
 const state=await exported(page);assert.equal(W.find(state,state.cursor.at(-1)).node.title,'');assert.equal(await page.locator('#node-title').inputValue(),'');assert.equal(await page.locator('#node-title').getAttribute('placeholder'),'Enter name');
 assert.equal(await page.getByRole('button',{name:'Enter name',exact:true}).count(),1);
});
test('investigation marker is independent, survives JSON and HTML, and fits read-only Full Tree',async t=>{
 const page=await open(t,treeState());await page.locator('#needs-investigation').check();
 for(const impact of [false,true])for(const influence of [false,true]){
  await page.locator('#high-impact').setChecked(impact);await page.locator('#high-influence').setChecked(influence);
  assert.equal(await page.locator('#tree-board .issue-investigation-marker').count(),1);
 }
 const before=await exported(page);assert.equal(before.content.tree.needsInvestigation,true);
 await page.getByRole('button',{name:'Full screen',exact:true}).click();const dialog=page.locator('#overview-dialog');assert.equal(await dialog.locator('.issue-investigation-marker').count(),1);assert.equal(await dialog.locator('input,textarea,.selected').count(),0);
 await page.setViewportSize({width:390,height:844});
 await page.waitForFunction(()=>{const a=document.querySelector('#overview-board .issue-investigation-marker').getBoundingClientRect(),v=document.querySelector('#overview-viewport').getBoundingClientRect();return a.left>=v.left&&a.top>=v.top&&a.right<=v.right&&a.bottom<=v.bottom;});
 await page.getByRole('button',{name:'Close full tree view'}).click();assert.deepEqual(await exported(page),before);
 const download=page.waitForEvent('download');await page.locator('#save').click();const file=join(temp,'investigation.html');await(await download).saveAs(file);await page.goto(pathToFileURL(file).href);assert.deepEqual(await exported(page),before);
 await page.locator('#needs-investigation').uncheck();assert.equal(await page.locator('.issue-investigation-marker').count(),0);
 await page.locator('#import').click();await page.locator('#import-json').fill(JSON.stringify(before));page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Replace canvas',exact:true}).click();assert.equal(await page.locator('#needs-investigation').isChecked(),true);
});
test('empty tree space deselects and hides details; same or different node restores selection',async t=>{
 const s=treeState(),child=W.addChild(s,'root','Child question'),page=await open(t,s);
 const before=await exported(page);const oldWidth=await page.locator('.issue-tree-scroll').evaluate(n=>n.clientWidth);
 await page.locator('#tree-board').click({position:{x:5,y:5}});
 assert.equal(await page.locator('#node-details').isVisible(),false);assert.equal(await page.locator('#tree-board .selected').count(),0);assert.equal(await page.locator('#tree-board [aria-pressed="true"]').count(),0);
 assert.ok(await page.locator('.issue-tree-scroll').evaluate(n=>n.clientWidth)>oldWidth);assert.deepEqual(await exported(page),before);
 await choose(page,child);assert.equal(await page.locator('#node-details').isVisible(),true);assert.equal(await page.locator('.issue-node-title-editor').count(),0);assert.equal(await page.locator('#node-title').inputValue(),'Child question');
 await choose(page,child);await page.locator('.issue-node-title-editor').fill('Keep inline draft');await page.locator('#tree-board').click({position:{x:5,y:5}});assert.equal(await page.locator('#node-details').isVisible(),false);assert.equal(W.find(await exported(page),child).node.title,'Keep inline draft');
 await choose(page,'root');assert.equal(await page.locator('#node-details').isVisible(),true);assert.equal(await page.locator('.issue-node-title-editor').count(),0);
 await page.locator('#node-notes').fill('Detail editing stays visible');await page.locator('#needs-investigation').check();assert.equal(await page.locator('#node-details').isVisible(),true);
 await page.getByRole('button',{name:'Add child to Governing question',exact:true}).click();assert.equal(await page.locator('#node-details').isVisible(),true);assert.equal(await page.locator('.issue-node-title-editor').count(),1);
 await page.locator('.issue-node-title-editor').press('Escape');await page.locator('#tree-board').click({position:{x:5,y:5}});await page.locator('[data-node-id="root"]').click({position:{x:195,y:70}});assert.equal(await page.locator('#node-details').isVisible(),true);assert.equal(await page.locator('.issue-node-title-editor').count(),0);
});

test('scoped reviews separate above and below tree with retained, safely rendered history',async t=>{
 const s=treeState();s.thoughts=[
  {id:'legacy',kind:'evaluation',text:'## Legacy MECE wording\nUnscoped stays general.'},
  {id:'m1',kind:'evaluation',scope:'mece',text:'## Prior structural review\n- Earlier gap'},
  {id:'full',kind:'evaluation',scope:'full',text:'## Broader review\nFull meaning and evidence.'},
  {id:'rationale',kind:'alternative',text:'## Alternative rationale\nAccepted lens.'},
  {id:'m2',kind:'evaluation',scope:'mece',text:'## Structural review\n- **Overlap:** Operations and Demand.\n- Gap to investigate.\n<script>window.pwned=true</script>\n[unsafe](javascript:alert(1))\n<img src=x onerror=alert(1)>'}
 ];
 const page=await open(t,s),general=page.locator('#thoughts'),mece=page.locator('#mece-reviews');
 assert.equal(await general.locator('.thought').count(),3);assert.equal(await mece.locator('.thought').count(),2);
 assert.match(await general.innerText(),/Alternative rationale/);assert.doesNotMatch(await general.textContent(),/Earlier gap|Operations and Demand/);
 assert.equal(await general.locator('.earlier-thoughts').getAttribute('open'),null);assert.equal(await mece.locator('.earlier-thoughts').getAttribute('open'),null);
 assert.equal(await mece.getByRole('heading',{name:'Structural review',exact:true}).isVisible(),true);assert.equal(await mece.getByRole('heading',{name:'Prior structural review',exact:true}).isVisible(),false);assert.equal(await mece.locator('li').count(),3);assert.equal(await mece.locator('strong').textContent(),'Overlap:');assert.equal(await mece.locator('script,img,a[href^="javascript:"]').count(),0);assert.equal(await page.evaluate(()=>window.pwned),undefined);
 assert.equal(await page.evaluate(()=>{const t=document.querySelector('.issue-workspace'),a=document.querySelector('#thoughts'),m=document.querySelector('#mece-reviews');return !!(a.compareDocumentPosition(t)&Node.DOCUMENT_POSITION_FOLLOWING)&&!!(t.compareDocumentPosition(m)&Node.DOCUMENT_POSITION_FOLLOWING)}),true);
 await general.locator('.earlier-thoughts > summary').click();assert.equal(await general.getByRole('heading',{name:'Legacy MECE wording',exact:true}).isVisible(),true);await mece.locator('.earlier-thoughts > summary').focus();await page.keyboard.press('Enter');assert.equal(await mece.getByRole('heading',{name:'Prior structural review',exact:true}).isVisible(),true);
 assert.deepEqual(await exported(page),s);const download=page.waitForEvent('download');await page.locator('#save').click();const file=join(temp,'scoped-reviews.html');await(await download).saveAs(file);await page.goto(pathToFileURL(file).href);assert.deepEqual(await exported(page),s);
 await page.setViewportSize({width:390,height:844});assert.ok((await mece.boundingBox()).width<=390);
 await page.locator('#import').click();await page.locator('#import-json').fill(JSON.stringify(s));page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Replace canvas',exact:true}).click();assert.deepEqual(await exported(page),s);
});
test('legacy-only and empty review groups do not create an empty MECE panel',async t=>{
 const blank=await open(t,treeState());assert.equal(await blank.locator('#thoughts').isVisible(),false);assert.equal(await blank.locator('#mece-reviews').isVisible(),false);
 const s=treeState();s.thoughts=[{id:'legacy',kind:'evaluation',text:'MECE in old text is not scope metadata'}];const page=await open(t,s);assert.equal(await page.locator('#thoughts').isVisible(),true);assert.equal(await page.locator('#mece-reviews').isVisible(),false);assert.deepEqual(await exported(page),s);
});
test('sibling arrows reveal in lower controls, move whole subtrees and persist with read-only overview',async t=>{
 const s=treeState(),a=W.addChild(s,'root','First'),b=W.addChild(s,'root','Second'),c=W.addChild(s,'root','Third');W.addChild(s,a,'Nested');W.navigate(s,b);const page=await open(t,s),box=id=>page.locator(`[data-node-id="${id}"]`),left=id=>box(id).getByRole('button',{name:/^Move .* left$/,includeHidden:true}),right=id=>box(id).getByRole('button',{name:/^Move .* right$/,includeHidden:true});
 assert.equal(await right(b).evaluate(n=>getComputedStyle(n).opacity),'0');await box(b).locator('.issue-node-select').hover();assert.equal(await right(b).evaluate(n=>getComputedStyle(n).opacity),'0');await box(b).locator('.issue-node-controls').hover();assert.equal(await right(b).isVisible(),false);assert.match(await right(b).evaluate(n=>getComputedStyle(n).transitionDelay),/0\.3s/);await right(b).waitFor({state:'visible'});assert.equal(await right(b).evaluate(n=>getComputedStyle(n).opacity),'1');assert.equal(await left(a).isDisabled(),true);assert.equal(await right(c).isDisabled(),true);assert.equal(await left('root').isDisabled(),true);assert.equal(await right('root').isDisabled(),true);
 const before=await exported(page);await box(a).locator('.issue-node-controls').hover();await right(a).click();let current=await exported(page);assert.deepEqual(current.content.tree.children.map(n=>n.id),[b,a,c]);assert.deepEqual(current.cursor,before.cursor);assert.deepEqual(current.content.tree.children[1],before.content.tree.children[0]);
 await box(a).getByRole('button',{name:'Add child to First',exact:true}).focus();await box(a).getByRole('button',{name:'Move First left',exact:true}).focus();await page.keyboard.press('Enter');current=await exported(page);assert.deepEqual(current.content.tree.children.map(n=>n.id),[a,b,c]);
 await box(b).locator('.issue-node-controls').dispatchEvent('pointerdown',{pointerType:'touch',bubbles:true});assert.equal(await right(b).evaluate(n=>getComputedStyle(n).opacity),'1');
 await right(b).click();assert.deepEqual((await exported(page)).content.tree.children.map(n=>n.id),[a,c,b]);
 const beforeSave=await exported(page),download=page.waitForEvent('download');await page.locator('#save').click();const file=join(temp,'reordered.html');await(await download).saveAs(file);await page.goto(pathToFileURL(file).href);assert.deepEqual(await exported(page),beforeSave);
 await page.getByRole('button',{name:'Full screen',exact:true}).click();assert.equal(await page.locator('#overview-dialog .issue-node-reorder').count(),0);await page.getByRole('button',{name:'Close full tree view'}).click();
 await box(b).locator('.issue-node-select').click();await page.locator('.issue-node-title-editor').fill('Renamed');await page.locator('.issue-node-title-editor').press('Enter');assert.equal(await box(b).getByRole('button',{name:'Move Renamed left',exact:true,includeHidden:true}).count(),1);assert.equal(await box(b).getByRole('button',{name:'Delete Renamed',exact:true}).count(),1);
});
test('touch lower-area reveal and disabled only-child arrows retain node selection',async t=>{
 const s=treeState(),a=W.addChild(s,'root','First'),b=W.addChild(s,'root','Second'),nested=W.addChild(s,a,'Only child');W.navigate(s,b);
 const page=await open(t,s,{width:578,height:723},{hasTouch:true});
 const box=id=>page.locator(`[data-node-id="${id}"]`);
 await box(a).locator('.issue-node-controls').tap({position:{x:10,y:12}});assert.equal(await page.locator('#node-title').inputValue(),'First');
 assert.equal(await box(a).getByRole('button',{name:'Move First right',exact:true}).evaluate(n=>getComputedStyle(n).opacity),'1');assert.equal(await box(a).getByRole('button',{name:'Move First left',exact:true}).evaluate(n=>getComputedStyle(n).opacity),'0.28');
 await box(a).getByRole('button',{name:'Move First right',exact:true}).tap();assert.deepEqual((await exported(page)).content.tree.children.map(n=>n.id),[b,a]);
 await box(nested).locator('.issue-node-controls').tap({position:{x:10,y:12}});const arrows=box(nested).locator('.issue-node-reorder');assert.equal(await arrows.count(),2);for(const arrow of await arrows.all())assert.equal(await arrow.isDisabled(),true);
});
test('Full Tree orientation toggle is display-only, fits both axes and permits keyboard access',async t=>{
 const s=treeState();for(let i=0;i<8;i++){const parent=W.addChild(s,'root','Branch '+i);for(let j=0;j<8;j++)W.addChild(s,parent,`Factor ${i}.${j}`);}const page=await open(t,s);const before=await exported(page),editorBefore=await page.locator('#tree-board').innerHTML();
 await page.getByRole('button',{name:'Full screen',exact:true}).click();const vertical=page.getByRole('button',{name:'Vertical',exact:true}),horizontal=page.getByRole('button',{name:'Horizontal',exact:true});assert.equal(await vertical.getAttribute('aria-pressed'),'true');await vertical.focus();await page.keyboard.press('Tab');assert.equal(await horizontal.evaluate(n=>n===document.activeElement),true);await page.keyboard.press('Enter');assert.equal(await horizontal.getAttribute('aria-pressed'),'true');
 async function fit(){await page.waitForFunction(()=>{const v=document.querySelector('#overview-viewport').getBoundingClientRect();return [...document.querySelectorAll('#overview-board .issue-node')].every(n=>{const r=n.getBoundingClientRect();return r.left>=v.left&&r.right<=v.right&&r.top>=v.top&&r.bottom<=v.bottom;});});}
 await fit();assert.equal(await page.locator('#overview-board .issue-node').count(),73);const coords=await page.locator('#overview-board .issue-node').evaluateAll(nodes=>nodes.map(n=>({left:parseFloat(n.style.left),top:parseFloat(n.style.top)})));assert.ok(coords[1].left>coords[0].left);assert.equal(await page.locator('#overview-board input,#overview-board textarea,#overview-board .issue-node-controls,#overview-board .issue-node-select').count(),0);
 await page.setViewportSize({width:390,height:844});await fit();await vertical.click();await fit();assert.equal(await vertical.getAttribute('aria-pressed'),'true');await horizontal.click();await fit();await page.keyboard.press('Escape');assert.equal(await page.locator('#overview-dialog').isVisible(),false);assert.deepEqual(await exported(page),before);assert.equal(await page.locator('#tree-board').innerHTML(),editorBefore);
 await page.getByRole('button',{name:'Full screen',exact:true}).click();assert.equal(await horizontal.getAttribute('aria-pressed'),'true');await page.getByRole('button',{name:'Close full tree view',exact:true}).click();
 const download=page.waitForEvent('download');await page.locator('#save').click();const file=join(temp,'orientation-display-only.html');await(await download).saveAs(file);await page.goto(pathToFileURL(file).href);assert.deepEqual(await exported(page),before);await page.getByRole('button',{name:'Full screen',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Vertical',exact:true}).getAttribute('aria-pressed'),'true');
});
test('depth presets and selective folds synchronize both views without losing hidden state',async t=>{
 const s=treeState(),a=W.addChild(s,'root','A'),b=W.addChild(s,'root','B'),aa=W.addChild(s,a,'AA'),aaa=W.addChild(s,aa,'AAA');W.addChild(s,b,'BB');W.navigate(s,aaa);const page=await open(t,s),before=await exported(page);const editor=page.locator('#tree-board');
 await page.locator('#editor-depth').getByRole('button',{name:'Level 1',exact:true}).click();assert.equal(await editor.locator('.issue-node').count(),3);assert.equal(await page.locator('#node-details').isVisible(),false);assert.deepEqual(await exported(page),before);
 await editor.getByRole('button',{name:/Expand subtree for A /}).click();assert.equal(await editor.locator('.issue-node').count(),4);assert.equal(await editor.getByRole('button',{name:/Expand subtree for AA /}).count(),1);assert.equal(await page.locator('#editor-depth .tree-depth-custom').isVisible(),true);
 await page.getByRole('button',{name:'Full screen',exact:true}).click();const overview=page.locator('#overview-board');assert.equal(await overview.locator('.issue-node').count(),4);assert.equal(await overview.locator('.issue-node-controls,textarea,input').count(),0);
 await page.locator('#overview-depth').getByRole('button',{name:'Level 2',exact:true}).click();assert.equal(await overview.locator('.issue-node').count(),5);await overview.getByRole('button',{name:/Expand subtree for AA /}).click();assert.equal(await overview.locator('.issue-node').count(),6);await page.getByRole('button',{name:'Horizontal',exact:true}).click();assert.equal(await overview.locator('.issue-node').count(),6);await page.locator('#overview-depth').getByRole('button',{name:'Level 3',exact:true}).click();assert.equal(await overview.locator('.issue-node').count(),6);assert.equal(await page.locator('#editor-depth').getByRole('button',{name:'Level 3',exact:true}).getAttribute('aria-pressed'),'true');
 await page.keyboard.press('Escape');assert.equal(await editor.locator('.issue-node').count(),6);await page.locator('#editor-depth').getByRole('button',{name:'All',exact:true}).click();assert.equal(await editor.locator('.issue-node').count(),6);assert.deepEqual(await exported(page),before);
 await editor.getByRole('button',{name:'Collapse subtree for A',exact:true}).click();assert.equal(await editor.locator('.issue-node').count(),4);assert.equal(await editor.getByRole('button',{name:/Expand subtree for A .*2 hidden/}).count(),1);
 await page.locator('[data-ai="mece_evaluate"]').click();await page.getByRole('button',{name:'Copy AI request',exact:true}).click();const req=JSON.parse(await page.evaluate(()=>navigator.clipboard.readText()));assert.deepEqual(req.canvas,before);
 const download=page.waitForEvent('download');await page.locator('#save').click();const file=join(temp,'folded-state.html');await(await download).saveAs(file);await page.goto(pathToFileURL(file).href);assert.deepEqual(await exported(page),before);assert.equal(await editor.locator('.issue-node').count(),6);
});
test('adding beneath a collapsed parent reveals the new node and preserves existing descendants',async t=>{
 const s=treeState(),a=W.addChild(s,'root','A');W.addChild(s,a,'Existing child');const page=await open(t,s);await page.locator('#editor-depth').getByRole('button',{name:'Level 1',exact:true}).click();await page.getByRole('button',{name:'Add child to A',exact:true}).click();assert.equal(await page.locator('.issue-node-title-editor').count(),1);assert.equal(await page.locator('.issue-node-title-editor').evaluate(n=>n===document.activeElement),true);await page.locator('.issue-node-title-editor').fill('New child');await page.locator('.issue-node-title-editor').press('Enter');const current=await exported(page);assert.deepEqual(W.find(current,a).node.children.map(n=>n.title),['Existing child','New child']);assert.equal(await page.locator('#tree-board .issue-node').count(),4);
});
test('adding the first child at a preset boundary changes the display to Custom',async t=>{
 for(const level of [1,2,3]){
  const s=treeState();let parent=W.addChild(s,'root','A');for(let depth=2;depth<=level;depth++)parent=W.addChild(s,parent,'A'.repeat(depth));const title=W.find(s,parent).node.title,page=await open(t,s);await page.locator('#editor-depth').getByRole('button',{name:'Level '+level,exact:true}).click();await page.getByRole('button',{name:'Add child to '+title,exact:true}).click();assert.equal(await page.locator('.issue-node-title-editor').count(),1);assert.equal(await page.locator('#editor-depth .tree-depth-custom').isVisible(),true);assert.equal(await page.locator('#editor-depth [aria-pressed="true"]').count(),0);
 }
});
test('fold controls sit on outgoing connectors with hanging stems when collapsed',async t=>{
 const s=treeState();W.addChild(s,'root','Child');const page=await open(t,s),before=await exported(page);const root=page.locator('#tree-board [data-node-id="root"]'),fold=root.locator('.issue-node-collapse');
 const a=await root.boundingBox(),b=await fold.boundingBox();assert.ok(b.y>a.y+a.height+10);assert.ok(Math.abs(b.x+b.width/2-(a.x+a.width/2))<1);
 await fold.click();assert.equal(await root.locator('.issue-collapse-stem').count(),1);assert.deepEqual(await exported(page),before);
 await page.getByRole('button',{name:'Full screen',exact:true}).click();await page.getByRole('button',{name:'Horizontal',exact:true}).click();await page.setViewportSize({width:390,height:844});
 await page.waitForFunction(()=>{const v=document.querySelector('#overview-viewport').getBoundingClientRect(),b=document.querySelector('#overview-board .issue-node-collapse').getBoundingClientRect();return b.left>=v.left&&b.top>=v.top&&b.right<=v.right&&b.bottom<=v.bottom});
 const node=await page.locator('#overview-board .issue-node').boundingBox(),control=await page.locator('#overview-board .issue-node-collapse').boundingBox();assert.ok(control.x>node.x+node.width);assert.ok(Math.abs(control.y+control.height/2-(node.y+node.height/2))<1);assert.equal(await page.locator('#overview-board .issue-collapse-stem').count(),1);
});
