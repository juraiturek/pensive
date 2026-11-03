import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdtemp, rm, readFile, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { chromium } from 'playwright';
const require=createRequire(import.meta.url),root=new URL('../.agents/skills/pensive/frameworks/vpc/',import.meta.url);
let browser,temp;
before(async() => {
  assert.ok(existsSync(new URL('canvas.html',root)),'VPC canvas missing');
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
async function importing(page,state,answer){
  await page.getByRole('button',{
    name:'Import JSON',exact:true
  }).click();
  await page.getByLabel('Import canvas JSON').fill(typeof state==='string'?state:JSON.stringify(state));
  if(answer!==undefined)page.once('dialog',d=>answer?d.accept():d.dismiss());
  await page.getByRole('button',{
    name:'Replace canvas',exact:true
  }).click();
}
test('empty VPC opens offline with six editable lists, framing and stable exported IDs',async t => {
  const page=await open(t);
  assert.equal(await page.locator('[data-section]').count(),6);
  await page.getByLabel('Product / Offering', {
    exact:true
  }).fill('Pensive');
  for(const section of ['products_services','gain_creators','pain_relievers','gains','pains','jobs'])await add(page,section,'Draft '+section);
  const s=await exported(page);
  assert.equal(s.framework,'vpc');
  assert.equal(s.content.framing.product_offering,'Pensive');
  const first=s.content.jobs[0].id;
  await page.locator('[data-section="jobs"] textarea').fill('Revised job');
  assert.equal((await exported(page)).content.jobs[0].id,first);
  await page.locator('[data-section="jobs"]').getByRole('button',{
    name:'Delete customer jobs 1',exact:true
  }).click();
  assert.deepEqual((await exported(page)).content.jobs,[]);
  assert.deepEqual(await page.locator('[data-ai]').allTextContents(),['Evaluate','Improve']);
  await mkdir('test-results',{
    recursive:true
  });
  await page.screenshot({
    path:'test-results/vpc-desktop.png',fullPage:true
  });
});

test('VPC JSON import validates before confirmed replacement and preserves cancellation',async t => {
  const page=await open(t);
  await add(page,'jobs','Keep');
  const original=await exported(page);
  await importing(page,'{}');
  assert.ok((await page.locator('#import-error').textContent()).length);
  await page.getByRole('button',{
    name:'Cancel import',exact:true
  }).click();
  assert.deepEqual(await exported(page),original);
  const next=structuredClone(original);
  next.content.jobs[0].text='Replacement';
  await importing(page,next,false);
  await page.getByRole('button',{
    name:'Cancel import',exact:true
  }).click();
  assert.deepEqual(await exported(page),original);
  await importing(page,next,true);
  assert.deepEqual(await exported(page),next);
});

test('VPC save reopens twice, hostile content is inert and implementation is retained',async t => {
  const page=await open(t);
  const evil='</script><img src=x onerror="window.evil=1"> & α';
  await add(page,'pains',evil);
  let expected=await exported(page);
  for(let i=0;
  i<2;
  i++){
    const promise=page.waitForEvent('download');
    await page.getByRole('button',{
      name:'Save to File',exact:true
    }).click();
    const download=await promise,path=join(temp,`save-${i}.html`);
    await download.saveAs(path);
    await page.goto(pathToFileURL(path).href);
    assert.deepEqual(await exported(page),expected);
    assert.equal(await page.evaluate(()=>window.evil),undefined);
    assert.equal(await page.locator('.vpc-cell img').count(),0);
  }
  const html=await readFile(join(temp,'save-1.html'),'utf8');
  assert.ok(html.includes('data-implementation'));
});

test('VPC denied clipboard exposes full JSON; mobile preserves complete halves and keyboard focus',async t => {
  const page=await open(t);
  await page.context().clearPermissions();
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{
    value:{
      writeText:async() => {
        throw new Error('denied');
      }
    }
  }));
  await page.getByRole('button',{
    name:'Export to clipboard',exact:true
  }).click();
  assert.equal(JSON.parse(await page.getByLabel('Canvas JSON',{
    exact:true
  }).inputValue()).framework,'vpc');
  await page.getByRole('button',{
    name:'Close',exact:true
  }).click();
  await page.setViewportSize({
    width:390,height:844
  });
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.deepEqual(await page.locator('.customer-profile [data-section]').evaluateAll(nodes=>nodes.map(n=>n.dataset.section)),['jobs','gains','pains']);
  const halves=await page.locator('.vpc-half').allTextContents();
  assert.ok(halves[0].includes('Products & Services'));
  assert.ok(halves[1].includes('Customer Jobs'));
  await page.keyboard.press('Tab');
  assert.ok(await page.evaluate(()=>document.activeElement.matches('button, textarea, a, summary')));
  await page.screenshot({
    path:'test-results/vpc-mobile.png',fullPage:true
  });
});

test('VPC Evaluate dialog exports complete state, steering and thought preference; cancel and Escape preserve content',async t => {
  const page=await open(t);
  await add(page,'jobs','Decide together');
  const original=await exported(page);
  await page.getByRole('button',{
    name:'Evaluate',exact:true
  }).click();
  await page.getByLabel('Steering guidance').fill('Check fit');
  await page.getByLabel('Use existing thoughts as guidance').uncheck();
  await page.getByRole('button',{
    name:'Cancel',exact:true
  }).click();
  assert.deepEqual(await exported(page),original);
  await page.getByRole('button',{
    name:'Evaluate',exact:true
  }).click();
  await page.keyboard.press('Escape');
  assert.deepEqual(await exported(page),original);
  await page.getByRole('button',{
    name:'Evaluate',exact:true
  }).click();
  await page.getByLabel('Steering guidance').fill('Check fit');
  await page.getByLabel('Use existing thoughts as guidance').uncheck();
  await page.getByRole('button',{
    name:'Copy AI request',exact:true
  }).click();
  await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Copied AI request'));
  const request=JSON.parse(await page.evaluate(()=>navigator.clipboard.readText()));
  assert.deepEqual(request,{
    canvas:original,action:{
      id:'evaluate',comment:'Check fit',use_thoughts:false
    }
  });
});

test('VPC Evaluate thoughts render inertly above matrix and survive saved HTML',async t => {
  const v=require(fileURLToPath(new URL('state.js',root))),s=v.initialState();
  s.content.pains=[{
    id:'pain',text:'Unclear need'
  }];
  const result=v.composeResult(v.buildRequest(s,{
    id:'evaluate'
  }),{
    thought:'</script><img src=x onerror="window.evil=1"> Unsupported fit.'
  });
  const page=await open(t,result);
  assert.equal(await page.locator('#thoughts img').count(),0);
  assert.ok((await page.locator('#thoughts').textContent()).includes('Unsupported fit.'));
  assert.equal(await page.evaluate(()=>document.querySelector('#thoughts').compareDocumentPosition(document.querySelector('#vpc-view')) & Node.DOCUMENT_POSITION_FOLLOWING),4);
  assert.deepEqual((await exported(page)).content,s.content);
  const pending=page.waitForEvent('download');
  await page.getByRole('button',{
    name:'Save to File',exact:true
  }).click();
  const download=await pending,path=join(temp,'evaluated.html');
  await download.saveAs(path);
  await page.goto(pathToFileURL(path).href);
  assert.deepEqual(await exported(page),result);
});

test('VPC Evaluate denied clipboard preserves selectable full request',async t => {
  const page=await open(t);
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{
    value:{
      writeText:async() => {
        throw new Error('denied');
      }
    }
  }));
  await page.getByRole('button',{
    name:'Evaluate',exact:true
  }).click();
  await page.getByRole('button',{
    name:'Copy AI request',exact:true
  }).click();
  const request=JSON.parse(await page.getByLabel('Canvas JSON',{
    exact:true
  }).inputValue());
  assert.equal(request.action.id,'evaluate');
  assert.equal(request.canvas.framework,'vpc');
});

test('VPC invalid embedded state disables editing/export visibly without changing embedded data',async t => {
  const page=await open(t),v=require(fileURLToPath(new URL('state.js',root))),bad=v.initialState();
  bad.content.jobs=[{
    id:'duplicate',text:'One'
  }];
  bad.content.pains=[{
    id:'duplicate',text:'Two'
  }];
  const html=(await readFile(new URL('canvas.html',root),'utf8')).replace(/(<script id="canvas-state" type="application\/json">)[\s\S]*?(<\/script>)/,(_,start,end)=>start+JSON.stringify(bad)+end),path=join(temp,'invalid-initial.html');
  await writeFile(path,html);
  await page.goto(pathToFileURL(path).href);
  assert.ok((await page.locator('#status').textContent()).includes('Invalid canvas'));
  assert.equal(await page.locator('button:not(:disabled), textarea:not(:disabled)').count(),0);
  assert.deepEqual(JSON.parse(await page.locator('#canvas-state').textContent()),bad);
});
function proposalState(){
  const v=require(fileURLToPath(new URL('state.js',root))),s=v.initialState();
  s.content.jobs=[{
    id:'job-original',text:'Choose next step'
  }];
  const content=structuredClone(s.content);
  content.jobs[0].text='Choose next step using evidence';
  content.pains.push({
    id:'possible-pain',text:'Hypothesis: unclear evidence'
  });
  return v.composeResult(v.buildRequest(s,{
    id:'improve'
  }),{
    content,thought:'Clarified a job and proposed a hypothesis.'
  });
}
test('VPC Improve exports its action and supports shared collection review with saved pending state',async t => {
  const page=await open(t);
  page.setDefaultTimeout(3000);
  await page.context().grantPermissions(['clipboard-read','clipboard-write']);
  await page.getByRole('button',{
    name:'Improve',exact:true
  }).click();
  await page.getByRole('button',{
    name:'Copy AI request',exact:true
  }).click();
  await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Copied AI request'));
  assert.equal(JSON.parse(await page.evaluate(()=>navigator.clipboard.readText())).action.id,'improve');
  const pendingState=proposalState();
  await importing(page,pendingState,true);
  const panel=page.locator('#proposal-panel');
  assert.equal(await panel.locator('input[type="checkbox"]').count(),2);
  assert.equal(await page.getByRole('button',{
    name:'Evaluate',exact:true
  }).isDisabled(),true);
  await panel.getByText('Review proposed changes',{
    exact:true
  }).click();
  assert.ok((await panel.textContent()).includes('Choose next step using evidence'));
  const save=page.waitForEvent('download');
  await page.getByRole('button',{
    name:'Save to File',exact:true
  }).click();
  const download=await save,path=join(temp,'pending-improve.html');
  await download.saveAs(path);
  await page.goto(pathToFileURL(path).href);
  assert.deepEqual(await exported(page),pendingState);
  await page.getByRole('button',{
    name:'Accept All',exact:true
  }).click();
  const accepted=await exported(page);
  assert.equal(accepted.content.jobs[0].text,'Choose next step using evidence');
  assert.equal(accepted.thoughts.at(-1).kind,'improvement');
  assert.deepEqual(accepted.proposals,[]);
  assert.equal(await page.getByRole('button',{
    name:'Improve',exact:true
  }).isDisabled(),false);
});

test('VPC stale whole acceptance preserves manual edits and rejection leaves them intact',async t => {
  const page=await open(t,proposalState());
  await page.locator('[data-section="jobs"] textarea').fill('Local choice');
  const before=await exported(page);
  await page.getByRole('button',{
    name:'Accept All',exact:true
  }).click();
  assert.ok((await page.locator('#proposal-panel [role="alert"]').textContent()).includes('changed'));
  assert.deepEqual(await exported(page),before);
  await page.getByRole('button',{
    name:'Reject All',exact:true
  }).click();
  const rejected=await exported(page);
  assert.equal(rejected.content.jobs[0].text,'Local choice');
  assert.deepEqual(rejected.proposals,[]);
});

test('VPC framing remains fully visible after desktop-to-mobile resizing', async t => {
  const v = require(fileURLToPath(new URL('state.js', root)));
  const state = v.initialState();
  state.content.framing.product_offering = 'A scheduling tool that imports CSV appointment files but does not provide automatic booking or message integration.';
  const page = await open(t, state);
  await page.setViewportSize({ width: 390, height: 844 });
  const input = page.getByLabel('Product / Offering', { exact: true });
  const sizes = await input.evaluate(node => ({ visible: node.clientHeight, needed: node.scrollHeight }));
  assert.ok(sizes.visible >= sizes.needed, JSON.stringify(sizes));
});

test('VPC blank cell clicks add and focus one draft across all six collections', async t => {
  const page = await open(t);
  for (const section of ['products_services', 'gain_creators', 'pain_relievers', 'jobs', 'pains', 'gains']) {
    const cell = page.locator(`[data-section="${section}"]`);
    await cell.click({ position: { x: 12, y: 110 } });
    assert.equal(await cell.locator('textarea').count(), 1);
    assert.equal(await cell.locator('textarea').evaluate(node => node === document.activeElement), true);
    const id = await cell.locator('textarea').getAttribute('data-id');
    await cell.dblclick({ position: { x: 12, y: 150 } });
    assert.equal(await cell.locator('textarea').count(), 1);
    assert.equal(await cell.locator('textarea').getAttribute('data-id'), id);
    assert.equal(await cell.locator('textarea').evaluate(node => node === document.activeElement), true);
    await cell.locator('h3').click();
    assert.equal(await cell.locator('textarea').count(), 1);
    await cell.locator('textarea').fill('A concrete idea');
    await cell.click({ position: { x: 12, y: 150 } });
    assert.equal(await cell.locator('textarea').count(), 2);
    assert.equal(await cell.locator('textarea').last().evaluate(node => node === document.activeElement), true);
    assert.equal(await cell.locator('textarea').first().getAttribute('data-id'), id);
  }
  const state = await exported(page);
  for (const items of Object.values(state.content).filter(Array.isArray)) assert.equal(items.length, 2);
});

test('VPC pain rows stay aligned as either upper row grows', async t => {
  const page = await open(t);
  async function aligned() {
    const left = await page.locator('[data-section="pain_relievers"]').boundingBox();
    const right = await page.locator('[data-section="pains"]').boundingBox();
    assert.ok(Math.abs(left.y - right.y) <= 1, `Pain Relievers ${left.y}, Pains ${right.y}`);
  }
  await aligned();
  await add(page, 'gain_creators', 'A longer gain creation mechanism with meaningful detail. '.repeat(35));
  await aligned();
  await add(page, 'gains', 'A desired customer outcome and its context. '.repeat(70));
  await aligned();
  await page.locator('[data-section="gain_creators"] textarea').fill('Short mechanism');
  await aligned();
  await page.locator('[data-section="pains"]').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'test-results/vpc-aligned-rows.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
});
