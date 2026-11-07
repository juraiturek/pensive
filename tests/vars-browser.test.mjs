import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdtemp, rm, readFile, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { chromium } from 'playwright';
const require=createRequire(import.meta.url),root=new URL('../.agents/skills/pensive/frameworks/vars/',import.meta.url);
let browser,temp;
before(async() => {
  assert.ok(existsSync(new URL('canvas.html',root)),'VARS canvas missing');
  temp=await mkdtemp(join(tmpdir(),'vpc-browser-'));
  browser=await chromium.launch();
});
after(async() => {
  await browser?.close();
  if(temp)await rm(temp,{
    recursive:true,force:true
  });
});
async function open(t,state){
  const ctx=await browser.newContext({
    offline:true,acceptDownloads:true,viewport:{
      width:1440,height:1000
    }
  });
  const errors=[],network=[];
  ctx.on('request',r=>{
    if(/^https?:|^wss?:/.test(r.url()))network.push(r.url());
  });
  const page=await ctx.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{
    if(m.type()==='error')errors.push(m.text());
  });
  t.after(async() => {
    assert.deepEqual(errors,[]);
    assert.deepEqual(network,[]);
    await ctx.close();
  });
  let url=new URL('canvas.html',root).href;
  if(state){
    const v=require(fileURLToPath(new URL('state.js',root))),path=join(temp,crypto.randomUUID()+'.html');
    await writeFile(path,v.packageHtml(await readFile(new URL('canvas.html',root),'utf8'),state));
    url=pathToFileURL(path).href;
  }
  await page.goto(url);
  return page;
}
async function add(page,section,text){
  const cell=page.locator(`[data-section="${section}"]`);
  await cell.getByRole('button',{
    name:'Add',exact:true
  }).click();
  await cell.locator('textarea').last().fill(text);
}
async function exported(page){
  await page.context().grantPermissions(['clipboard-read','clipboard-write']);
  await page.getByRole('button',{
    name:'Export to clipboard',exact:true
  }).click();
  await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Copied'));
  return JSON.parse(await page.evaluate(()=>navigator.clipboard.readText()));
}
test('VARS switches between Overview and Focus, edits quadrant/item Markdown and safely renders VRI tables',async t=>{
 const page=await open(t);await add(page,'a','Proprietary technology');await page.getByRole('button',{name:'Focus Activities, Resources & Capabilities',exact:true}).click();
 await page.getByRole('button',{name:'Edit quadrant supporting analysis',exact:true}).click();
 await page.getByLabel('Quadrant supporting analysis',{exact:true}).fill('## Evidence\n\n| Criterion | Finding |\n| --- | --- |\n| Valuable | Yes |\n| Rare | Uncertain |');
 await page.getByRole('button',{name:'Done editing quadrant supporting analysis',exact:true}).click();
 await page.getByRole('button',{name:'Edit item supporting analysis',exact:true}).click();
 await page.getByLabel('Item supporting analysis',{exact:true}).fill('<img src=x onerror=alert(1)> **Hypothesis**');
 await page.getByRole('button',{name:'Done editing item supporting analysis',exact:true}).click();
 assert.equal(await page.locator('#quadrant-preview table tbody tr').count(),2);assert.equal(await page.locator('#item-preview img').count(),0);
 const state=await exported(page);assert.match(state.content.details.a,/Uncertain/);assert.match(state.content.a[0].details,/Hypothesis/);
 await page.getByRole('button',{name:'Back to Overview',exact:true}).click();assert.equal(await page.locator('#focus-pane').isVisible(),false);
 const download=page.waitForEvent('download');await page.getByRole('button',{name:/Save to File/}).click();const file=join(temp,'saved.html');await(await download).saveAs(file);await page.goto(pathToFileURL(file).href);assert.deepEqual(await exported(page),state);
 await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Focus Activities, Resources & Capabilities',exact:true}).click();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
});
test('VARS Ripple handoff explicitly carries selected target and proposed change',async t=>{
 const page=await open(t);await page.context().grantPermissions(['clipboard-read','clipboard-write']);await page.getByRole('button',{name:'Ripple',exact:true}).click();await page.getByLabel('Proposed change').fill('Move to subscriptions');await page.getByRole('button',{name:'Copy AI request',exact:true}).click();
 const request=JSON.parse(await page.evaluate(()=>navigator.clipboard.readText()));assert.equal(request.action.id,'ripple');assert.equal(request.action.change,'Move to subscriptions');assert.equal(request.canvas.framework,'vars');assert.deepEqual(request.action.target,{type:'section',id:'v'});
});
test('VARS Ripple uses the visible target selection even after focusing an A item',async t=>{
 const page=await open(t);await page.context().grantPermissions(['clipboard-read','clipboard-write']);await add(page,'a','Technology');await page.getByRole('button',{name:'Focus Activities, Resources & Capabilities',exact:true}).click();await page.getByRole('button',{name:'Ripple',exact:true}).click();await page.getByLabel('Starting point').selectOption('section:r');await page.getByLabel('Proposed change').fill('Subscription');await page.getByRole('button',{name:'Copy AI request',exact:true}).click();const req=JSON.parse(await page.evaluate(()=>navigator.clipboard.readText()));assert.deepEqual(req.action.target,{type:'section',id:'r'});
});
test('VARS compact tile background switches focus without adding invisible drafts',async t=>{const page=await open(t);await page.getByRole('button',{name:'Focus Value Proposition',exact:true}).click();const tile=page.locator('[data-section="a"]'),box=await tile.boundingBox();await tile.click({position:{x:box.width-10,y:box.height-10}});assert.equal(await page.locator('#focus-title').textContent(),'Activities, Resources & Capabilities');assert.deepEqual((await exported(page)).content.a,[]);});
test('VARS pending quadrant review disables delete as well as summary editing',async t=>{const v=require(fileURLToPath(new URL('state.js',root))),s=v.initialState();s.content.a=[{id:'a1',text:'Technology'}];const c=structuredClone(s.content);c.a[0].details='Evidence';const page=await open(t,v.composeResult(v.buildRequest(s,{id:'improve'}),{content:c,thought:'x'}));assert.equal(await page.locator('[data-section="a"] .delete').isDisabled(),true);});

test('VARS Focus starts with rendered Markdown only and opens one editor through pencil or double click',async t=>{
 const v=require(fileURLToPath(new URL('state.js',root))),s=v.initialState();s.content.details.v='**Quadrant content**';s.content.v=[{id:'v1',text:'First',details:'**Item content**'},{id:'v2',text:'Second',details:'Second details'}];const page=await open(t,s);
 await page.getByRole('button',{name:'Focus Value Proposition',exact:true}).click();
 assert.equal(await page.locator('#quadrant-details').isVisible(),false);assert.equal(await page.locator('#item-details').isVisible(),false);assert.equal(await page.locator('#quadrant-preview strong').textContent(),'Quadrant content');assert.equal(await page.locator('.focus-quadrant svg').count(),4);
 await page.getByRole('button',{name:'Edit quadrant supporting analysis',exact:true}).click();assert.equal(await page.locator('#quadrant-details').isVisible(),true);assert.equal(await page.locator('#quadrant-preview').isVisible(),false);assert.equal(await page.locator('#quadrant-details').evaluate(el=>el===document.activeElement),true);
 await page.getByLabel('Quadrant supporting analysis',{exact:true}).fill('Updated **quadrant**');await page.getByRole('button',{name:'Done editing quadrant supporting analysis',exact:true}).click();assert.equal(await page.locator('#quadrant-details').isVisible(),false);assert.equal(await page.locator('#quadrant-preview strong').textContent(),'quadrant');
 await page.locator('#item-preview').dblclick();await page.getByLabel('Item supporting analysis',{exact:true}).fill('Updated **item**');assert.equal(await page.locator('#item-preview').isVisible(),false);await page.locator('#item-details').press('Control+Enter');assert.equal(await page.locator('#item-details').isVisible(),false);assert.equal(await page.locator('#item-preview strong').textContent(),'item');
 const exportedState=await exported(page);assert.equal(exportedState.content.details.v,'Updated **quadrant**');assert.equal(exportedState.content.v[0].details,'Updated **item**');
 await page.getByRole('button',{name:'Edit item supporting analysis',exact:true}).click();await page.getByLabel('Selected statement',{exact:true}).selectOption('v2');assert.equal(await page.locator('#item-details').isVisible(),false);assert.equal(await page.locator('#item-preview').innerText(),'Second details');
 await page.getByRole('button',{name:'Edit quadrant supporting analysis',exact:true}).click();await page.getByRole('button',{name:'Focus Activities, Resources & Capabilities',exact:true}).click();assert.equal(await page.locator('#quadrant-details').isVisible(),false);
});
test('VARS supporting analysis editors respect pending review and Annotation Mode locks',async t=>{
 const v=require(fileURLToPath(new URL('state.js',root))),s=v.initialState();s.content.details.v='**Current**';const c=structuredClone(s.content);c.details.v='Proposed';const page=await open(t,v.composeResult(v.buildRequest(s,{id:'improve'}),{content:c,thought:'x'}));await page.getByRole('button',{name:'Focus Value Proposition',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Edit quadrant supporting analysis',exact:true}).isDisabled(),true);await page.locator('#quadrant-preview').dblclick();assert.equal(await page.locator('#quadrant-details').isVisible(),false);
 await page.getByRole('button',{name:'Focus Activities, Resources & Capabilities',exact:true}).click();await page.getByRole('button',{name:'Edit quadrant supporting analysis',exact:true}).click();await page.getByRole('button',{name:'Annotation Mode',exact:true}).click();assert.equal(await page.locator('#quadrant-details').isVisible(),false);assert.equal(await page.getByRole('button',{name:'Edit quadrant supporting analysis',exact:true}).isDisabled(),true);
});
test('VARS Focus tiles show one-line read-only summaries, icon-only controls and whole-tile navigation',async t=>{
 const v=require(fileURLToPath(new URL('state.js',root))),s=v.initialState();s.content.v=[{id:'v1',text:'A very long customer value proposition '.repeat(12)},{id:'v2',text:'Second line\ncontinues here'},{id:'blank',text:''}];s.content.a=[{id:'a1',text:'Maintain shared inventory'}];const page=await open(t,s);await page.getByRole('button',{name:'Focus Value Proposition',exact:true}).click();
 const tile=page.locator('[data-section="v"]');assert.equal(await tile.locator('.compact-summary li').count(),2);assert.equal(await tile.locator('.compact-summary').isVisible(),true);assert.equal(await tile.locator('textarea').first().isVisible(),false);assert.equal(await tile.locator('.focus-quadrant').innerText(),'');
 const line=tile.locator('.compact-summary li').first();assert.equal(await line.evaluate(el=>getComputedStyle(el).whiteSpace),'nowrap');assert.equal(await line.evaluate(el=>el.scrollWidth>el.clientWidth),true);assert.equal(await line.getAttribute('title'),s.content.v[0].text);assert.equal(await tile.locator('.compact-summary li').nth(1).innerText(),'Second line continues here');
 const eye=await tile.locator('.focus-quadrant').boundingBox(),box=await tile.boundingBox();assert.ok(eye.x+eye.width>box.x+box.width-25);assert.ok(eye.y<box.y+25);
 await page.locator('[data-section="a"] .compact-summary li').click();assert.equal(await page.locator('#focus-title').textContent(),'Activities, Resources & Capabilities');assert.deepEqual((await exported(page)),s);
 await page.getByRole('button',{name:'Back to Overview',exact:true}).click();assert.equal(await tile.locator('.compact-summary').isVisible(),false);assert.equal(await tile.locator('textarea').first().isVisible(),true);assert.equal(await tile.locator('.focus-quadrant').innerText(),'Focus');
});
test('VARS Focus adds statements only through the active tile and selects saved statements',async t=>{
 const page=await open(t);await page.getByRole('button',{name:'Focus Value Proposition',exact:true}).click();assert.equal(await page.getByRole('button',{name:'+ Add',exact:true}).count(),1);assert.equal(await page.locator('[data-section="v"]').getByRole('button',{name:'+ Add',exact:true}).isVisible(),true);
 const before=await exported(page);await page.getByRole('button',{name:'+ Add',exact:true}).click();const input=page.getByRole('textbox',{name:'New statement',exact:true});assert.equal(await input.evaluate(el=>el===document.activeElement),true);await input.fill('Reliable local access');assert.deepEqual(await exported(page),before);await input.press('Enter');
 const state=await exported(page),item=state.content.v.at(-1);assert.equal(item.text,'Reliable local access');assert.equal(await page.locator('#detail-item').inputValue(),item.id);assert.equal(await page.locator('[data-section="v"] .compact-summary li').last().innerText(),'Reliable local access');assert.equal(await page.locator('#item-details').isVisible(),false);
 await page.getByRole('button',{name:'+ Add',exact:true}).click();await page.getByRole('textbox',{name:'New statement',exact:true}).fill('Second statement');await page.getByRole('button',{name:'Save new statement',exact:true}).click();assert.equal((await exported(page)).content.v.length,2);
 const download=page.waitForEvent('download');await page.locator('#save').click();const file=join(temp,'focus-add-saved.html');await(await download).saveAs(file);await page.goto(pathToFileURL(file).href);assert.equal((await exported(page)).content.v[1].text,'Second statement');
});
test('VARS Focus new-statement drafts cancel cleanly and respect review/annotation locks',async t=>{
 const v=require(fileURLToPath(new URL('state.js',root))),s=v.initialState(),c=structuredClone(s.content);c.details.v='Proposed';const page=await open(t,v.composeResult(v.buildRequest(s,{id:'improve'}),{content:c,thought:'x'}));await page.getByRole('button',{name:'Focus Value Proposition',exact:true}).click();assert.equal(await page.getByRole('button',{name:'+ Add',exact:true}).isDisabled(),true);
 await page.getByRole('button',{name:'Focus Activities, Resources & Capabilities',exact:true}).click();const before=await exported(page);await page.getByRole('button',{name:'+ Add',exact:true}).click();await page.getByRole('textbox',{name:'New statement',exact:true}).fill('Cancel me');await page.getByRole('textbox',{name:'New statement',exact:true}).press('Escape');assert.deepEqual(await exported(page),before);
 await page.getByRole('button',{name:'+ Add',exact:true}).click();await page.getByRole('textbox',{name:'New statement',exact:true}).fill('   ');await page.getByRole('button',{name:'Save new statement',exact:true}).click();assert.deepEqual(await exported(page),before);await page.getByRole('button',{name:'Cancel new statement',exact:true}).click();
 await page.getByRole('button',{name:'+ Add',exact:true}).click();await page.getByRole('textbox',{name:'New statement',exact:true}).fill('Discard on navigation');await page.getByRole('button',{name:'Focus Realization of Value',exact:true}).click();assert.equal(await page.getByRole('textbox',{name:'New statement',exact:true}).count(),0);assert.deepEqual(await exported(page),before);
 await page.getByRole('button',{name:'Annotation Mode',exact:true}).click();assert.equal(await page.getByRole('button',{name:'+ Add',exact:true}).isDisabled(),true);
});
test('VARS active tile returns to Overview while other tiles switch the Focus pane',async t=>{
 const page=await open(t);const before=await exported(page);await page.getByRole('button',{name:'Focus Value Proposition',exact:true}).click();const active=page.locator('[data-section="v"]');assert.equal(await active.getByRole('button',{name:'Return to Overview',exact:true}).count(),1);
 await page.locator('[data-section="a"] h3').click();assert.equal(await page.locator('#focus-title').textContent(),'Activities, Resources & Capabilities');assert.equal(await page.locator('#focus-pane').isVisible(),true);assert.equal(await active.getByRole('button',{name:'Focus Value Proposition',exact:true}).count(),1);
 const back=page.locator('[data-section="a"]').getByRole('button',{name:'Return to Overview',exact:true});await back.focus();await back.press('Enter');assert.equal(await page.locator('#focus-pane').isVisible(),false);assert.equal(await page.getByRole('button',{name:'Return to Overview',exact:true}).count(),0);assert.deepEqual(await exported(page),before);
});
