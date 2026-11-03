import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {chromium} from 'playwright';
const require=createRequire(import.meta.url);let browser,temp;
before(async()=>{temp=await mkdtemp(join(tmpdir(),'partial-review-'));await mkdir('test-results',{recursive:true});browser=await chromium.launch({...process.env.PENSIVE_BROWSER?{executablePath:process.env.PENSIVE_BROWSER}:{}});});
after(async()=>{await browser?.close();if(temp)await rm(temp,{recursive:true,force:true});});
for(const name of ['pages','swot']){
 const root=new URL(`../.agents/skills/pensive/frameworks/${name}/`,import.meta.url),p=require(`../.agents/skills/pensive/frameworks/${name}/state.js`);
 const keys=name==='pages'?['actions','goals','events']:['strengths','weaknesses','opportunities'];
 const labels=name==='pages'?['Actions','Goals','Events']:['Strengths','Weaknesses','Opportunities'];
 function fixture(){const initial=p.initialState();keys.forEach((k,i)=>p.collection(initial,k).push({id:`i${i}`,text:`Original ${k}`}));if(name==='pages')p.resetBaseline(initial);
  const content=structuredClone(initial.content);keys.forEach(k=>p.collection({content},k).push({id:`new-${k}`,text:`New ${k}`}));
  return p.composeResult(p.buildRequest(initial,{id:'improve'}),{content,thought:'Grounded proposal rationale.'});}
 async function open(t,state=fixture()){
  const context=await browser.newContext({offline:true,acceptDownloads:true,viewport:{width:1440,height:1000}}),page=await context.newPage();page.setDefaultTimeout(7000);
  const errors=[],network=[];page.on('pageerror',e=>errors.push(e.message));context.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url());});
  t.after(async()=>{assert.deepEqual(errors,[]);assert.deepEqual(network,[]);await context.close();});
  const file=join(temp,`${crypto.randomUUID()}.html`);await writeFile(file,p.packageHtml(await readFile(new URL('canvas.html',root),'utf8'),state));await page.goto(pathToFileURL(file).href);
  await page.getByText('Review proposed changes',{exact:true}).click();return page;
 }
 async function exported(page){await page.context().grantPermissions(['clipboard-read','clipboard-write']);await page.getByRole('button',{name:'Export to clipboard',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Copied'));return JSON.parse(await page.evaluate(()=>navigator.clipboard.readText()));}
 async function saved(page){const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Save to File',exact:true}).click();const file=join(temp,`${crypto.randomUUID()}.html`);await(await pending).saveAs(file);return file;}
 test(`${name}: node decisions, selection and saved partial review retain statuses and unselected pending nodes`,async t=>{
  const page=await open(t);assert.equal(await page.getByRole('checkbox',{name:`Select ${labels[0]}`,exact:true}).isChecked(),false);
  assert.equal(await page.getByRole('button',{name:'Accept Selected',exact:true}).isDisabled(),true);
  await page.getByRole('button',{name:`Accept ${labels[0]}`,exact:true}).click();
  assert.equal(await page.locator(`[data-review-section="${keys[0]}"] .node-status`).textContent(),'Accepted');
  let s=await exported(page);assert.equal(p.collection(s,keys[0]).length,2);assert.equal(p.collection(s,keys[1]).length,1);assert.equal(s.proposals.length,1);
  assert.equal(await page.getByRole('button',{name:'Accept All Remaining',exact:true}).count(),1);
  await page.goto(pathToFileURL(await saved(page)).href);await page.getByText('Review proposed changes',{exact:true}).click();
  assert.equal(await page.locator(`[data-review-section="${keys[0]}"] .node-status`).textContent(),'Accepted');
  await page.getByRole('checkbox',{name:`Select ${labels[1]}`,exact:true}).check();await page.getByRole('button',{name:'Accept Selected',exact:true}).click();
  s=await exported(page);assert.equal(p.collection(s,keys[1]).length,2);assert.equal(p.collection(s,keys[2]).length,1);assert.equal(s.proposals.length,1);
  await page.screenshot({path:`test-results/${name}-partial-review-desktop.png`,fullPage:true});
  await page.getByRole('button',{name:'Reject All Remaining',exact:true}).click();s=await exported(page);
  assert.equal(s.proposals.length,0);assert.equal(p.collection(s,keys[0]).length,2);assert.equal(p.collection(s,keys[2]).length,1);
  assert.match(s.thoughts[0].text,/Accepted nodes/);assert.match(s.thoughts[0].text,/Rejected nodes/);assert.equal(await page.locator('#proposal-panel').isVisible(),false);
 });
 test(`${name}: per-node reject plus accept-all resolves only remaining nodes; mobile keyboard controls fit`,async t=>{
  const page=await open(t);await page.setViewportSize({width:390,height:844});
  await page.getByRole('button',{name:`Reject ${labels[0]}`,exact:true}).click();assert.equal(await page.locator(`[data-review-section="${keys[0]}"] .node-status`).textContent(),'Rejected');
  const checkbox=page.getByRole('checkbox',{name:`Select ${labels[1]}`,exact:true});await checkbox.focus();await page.keyboard.press('Space');assert.equal(await checkbox.isChecked(),true);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:`test-results/${name}-partial-review-mobile.png`,fullPage:true});
  await page.getByRole('button',{name:'Accept All Remaining',exact:true}).click();const s=await exported(page);assert.equal(p.collection(s,keys[0]).length,1);assert.equal(p.collection(s,keys[1]).length,2);assert.equal(p.collection(s,keys[2]).length,2);
 });
 test(`${name}: stale manual edits block acceptance but reject-all preserves them and prior decisions`,async t=>{
  const page=await open(t);await page.getByRole('button',{name:`Accept ${labels[0]}`,exact:true}).click();
  await page.locator(`[data-section="${keys[1]}"] textarea`).fill('Manual edit after partial decision');
  const before=await exported(page);await page.getByRole('button',{name:`Accept ${labels[1]}`,exact:true}).click();
  assert.ok((await page.locator('#proposal-panel [role="alert"]').textContent()).includes('changed'));assert.deepEqual(await exported(page),before);
  await page.getByRole('button',{name:'Reject All Remaining',exact:true}).click();const s=await exported(page);assert.equal(p.collection(s,keys[1])[0].text,'Manual edit after partial decision');assert.equal(p.collection(s,keys[0]).length,2);
 });
 test(`${name}: conflicting partial selection fails visibly and related selection succeeds atomically`,async t=>{
  const initial=p.initialState();p.collection(initial,keys[0]).push({id:'move',text:'Moved concept'});const content=structuredClone(initial.content);p.collection({content},keys[1]).push(p.collection({content},keys[0]).pop());
  const state=p.composeResult(p.buildRequest(initial,{id:'improve'}),{content,thought:'Move concept to the fitting node.'}),page=await open(t,state);
  await page.getByRole('checkbox',{name:`Select ${labels[1]}`,exact:true}).check();await page.getByRole('button',{name:'Accept Selected',exact:true}).click();
  assert.ok((await page.locator('#proposal-panel [role="alert"]').textContent()).includes('together'));assert.deepEqual(await exported(page),state);
  await page.getByRole('checkbox',{name:`Select ${labels[0]}`,exact:true}).check();await page.getByRole('button',{name:'Accept Selected',exact:true}).click();const s=await exported(page);assert.equal(s.proposals.length,0);assert.equal(p.collection(s,keys[1])[0].id,'move');
 });
}
