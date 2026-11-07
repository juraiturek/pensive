import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdtemp, rm, readFile, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { chromium } from 'playwright';
const require=createRequire(import.meta.url),root=new URL('../.agents/skills/pensive/frameworks/swot/',import.meta.url);
let browser,temp;
before(async() => {
  assert.ok(existsSync(new URL('canvas.html',root)),'Research-enabled canvas missing');
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
test('shared Research dialog produces explicit scoped host requests with independent context options',async t=>{
 const page=await open(t);await page.context().grantPermissions(['clipboard-read','clipboard-write']);await page.getByRole('button',{name:'Research',exact:true}).click();await page.getByLabel('Research target',{exact:true}).selectOption('section:opportunities');await page.getByLabel('Research question',{exact:true}).fill('Market openings');await page.getByLabel('Include previous AI thoughts').check();await page.getByRole('button',{name:'Copy Research request',exact:true}).click();const req=JSON.parse(await page.evaluate(()=>navigator.clipboard.readText()));assert.deepEqual(req.action.target,{type:'section',id:'opportunities'});assert.equal(req.action.use_thoughts,true);assert.equal(req.action.include_annotations,false);assert.equal(req.canvas.framework,'swot');
});
test('Research review displays sources and candidate content before atomic accept; report-only rejection is lossless',async t=>{
 const core=require(fileURLToPath(new URL('state.js',root)));const s=core.initialState(),content=structuredClone(s.content);content.opportunities=[{id:'o1',text:'Potential new demand'}];const pending=core.composeResult(core.buildRequest(s,{id:'research',target:{type:'section',id:'opportunities'}}),{report:'## Findings\nA provisional interpretation.',sources:[{title:'Primary evidence',url:'https://example.org/evidence'}],content});
 const page=await open(t,pending);assert.equal(await page.getByRole('button',{name:'Research',exact:true}).isDisabled(),true);assert.equal(await page.getByRole('link',{name:'Primary evidence',exact:true}).count(),1);await page.getByText('Review proposed canvas changes',{exact:true}).click();assert.match(await page.locator('#proposal-panel').innerText(),/Potential new demand/);assert.deepEqual((await exported(page)).content,s.content);
 await page.getByRole('button',{name:'Accept Research',exact:true}).click();const accepted=await exported(page);assert.equal(accepted.thoughts[0].kind,'research');assert.equal(accepted.content.opportunities[0].id,'o1');assert.equal(await page.getByRole('link',{name:'Primary evidence',exact:true}).count(),1);
});
