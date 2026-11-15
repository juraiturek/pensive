import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const require=createRequire(import.meta.url);let browser,temp;
before(async()=>{temp=await mkdtemp(join(tmpdir(),'pensive-json-browser-'));browser=await chromium.launch();});
after(async()=>{await browser?.close();if(temp)await rm(temp,{recursive:true,force:true});});
for(const id of ['swot','pages','vpc','vars','five_whys','five_forces']) test(`${id}: offline JSON file import/export, cancellation and pending review`,async t=>{
 const ctx=await browser.newContext({offline:true,acceptDownloads:true});t.after(()=>ctx.close());const page=await ctx.newPage();page.setDefaultTimeout(1500);const requests=[],errors=[];page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(join(process.cwd(),'.agents/skills/pensive/frameworks',id,'canvas.html')).href);
 const core=require(`../.agents/skills/pensive/frameworks/${id}/state.js`);let state=core.initialState();state.takeaways='File-loaded state';
 const importFile=async value=>{await page.locator('#import').click();await page.locator('#import-file').setInputFiles({name:'current.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(value))});await page.waitForFunction(()=>document.querySelector('#import-json').value.length>0);};
 const downloadState=async()=>{const event=page.waitForEvent('download');await page.locator('#download-json').click();const download=await event;const dest=join(temp,crypto.randomUUID()+'.json');await download.saveAs(dest);return JSON.parse(await readFile(dest,'utf8'));};
 await importFile(state);page.once('dialog',d=>d.dismiss());await page.locator('#import-form button[type=submit]').click();await page.locator('#cancel-import').click();assert.notEqual((await downloadState()).takeaways,state.takeaways);
 await importFile({framework:'invalid'});await page.locator('#import-form button[type=submit]').click();assert.ok(await page.locator('#import-error').textContent());await page.locator('#cancel-import').click();
 for(let turn=0;turn<2;turn++){
  state.takeaways=`Turn ${turn}`;
  await importFile(state);page.once('dialog',d=>d.accept());await page.locator('#import-form button[type=submit]').click();assert.deepEqual(await downloadState(),state);
 }
 if(id==='pages'){
  state.content.parts=[{id:'part',text:'A'}];core.resetBaseline(state);
  const candidate=structuredClone(state.content);candidate.actions=[{id:'action',text:'Test'}];state=core.composeResult({canvas:state,action:{id:'improve'}},{content:candidate,thought:'Pending proposal'});
  await importFile(state);page.once('dialog',d=>d.accept());await page.locator('#import-form button[type=submit]').click();assert.deepEqual(await downloadState(),state);
 }
 assert.deepEqual(requests,[]);assert.deepEqual(errors,[]);assert.equal(await page.locator('#revision-controls').count(),0);
});
for(const id of ['vars','five_whys']) test(`${id}: transient drafts block all export paths`,async t=>{
 const ctx=await browser.newContext({offline:true,acceptDownloads:true});t.after(()=>ctx.close());const page=await ctx.newPage();page.setDefaultTimeout(2000);
 await page.goto(pathToFileURL(join(process.cwd(),'.agents/skills/pensive/frameworks',id,'canvas.html')).href);
 if(id==='vars'){await page.getByRole('button',{name:'Focus Value Proposition',exact:true}).click();await page.getByRole('button',{name:'+ Add',exact:true}).click();await page.getByRole('textbox',{name:'New statement',exact:true}).fill('Keep this draft');}
 else {await page.locator('[data-tree-node-id="root"]').getByRole('button',{name:/^Edit /}).click();await page.getByRole('textbox',{name:'Node text'}).fill('Observed problem');await page.getByRole('textbox',{name:'Node text'}).press('Enter');await page.locator('[data-tree-connector-parent="root"]').getByRole('button',{name:'Add cause',exact:true}).click();await page.getByRole('textbox',{name:'Direct cause'}).fill('Keep this draft');}
 const downloads=[];page.on('download',d=>downloads.push(d));
 for(const selector of ['#copy','#save','#download-json']){await page.locator(selector).click();assert.match(await page.locator('#status').textContent(),/Finish or cancel/);}
 assert.equal(downloads.length,0);
});
test('refreshing the same offline VPC loads the latest saved proposal without importing JSON',async t=>{
 const {initialize,withStore,prepareRequest,applyResult}=await import('../.agents/skills/pensive/scripts/workspace.mjs');
 const dir=join(temp,'refresh-vpc');const core=require('../.agents/skills/pensive/frameworks/vpc/state.js');const state=core.initialState();await initialize(dir,state);
 const ctx=await browser.newContext({offline:true});t.after(()=>ctx.close());const page=await ctx.newPage();page.setDefaultTimeout(1500);const url=pathToFileURL(join(dir,'canvas.html')).href;await page.goto(url);
 assert.equal(await page.getByText('New maintenance pricing option',{exact:true}).count(),0);
 await withStore(dir,async store=>{const head=await store.current();const handoff=await prepareRequest(store,{parent_revision_id:head.revision_id,action:{id:'improve'}});const content=structuredClone(state.content);content.gains=[{id:'gain-price',text:'New maintenance pricing option'}];await applyResult(store,handoff,{content,thought:'New proposal appears after refresh'});});
 await page.reload();assert.equal(page.url(),url);assert.match(await page.locator('#proposal-panel').textContent(),/New proposal appears after refresh/);await page.getByText('Review proposed changes',{exact:true}).click();await page.getByText('New maintenance pricing option',{exact:false}).waitFor();
});
