import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { initialize } from '../.agents/skills/pensive/scripts/workspace.mjs';
const require = createRequire(import.meta.url);
const script = new URL('../.agents/skills/pensive/scripts/workspace.mjs', import.meta.url);
const frameworks = ['swot','pages','vpc','vars','five_whys','five_forces'];
for (const id of frameworks) test(`${id}: file turns replace importable JSON and refresh the same HTML with current state`, async t => {
  const root = await mkdtemp(join(tmpdir(), 'pensive files with spaces-'));
  t.after(() => rm(root, {recursive:true,force:true}));
  const core = require(`../.agents/skills/pensive/frameworks/${id}/state.js`);
  const canvas = core.initialState(); canvas.takeaways = 'Preserve user text';
  if(id==='five_forces') Object.assign(canvas.content.framing,{industry:'Conveyors',geography:'US',objective:'Compare',rivals:'Manufacturers',buyers:'Mines',suppliers:'Parts',substitutes:'Alternative systems',entrants:'Uncertain'});
  const dir=join(root,'analysis'); await initialize(dir,canvas);
  const json=async file=>JSON.parse(await readFile(join(dir,file),'utf8'));
  assert.deepEqual(await json('current.json'),canvas);
  const html=await readFile(join(dir,'canvas.html'),'utf8');
  assert.doesNotMatch(html,/data-working-folder|WorkingFolder\.connect/);
  assert.deepEqual(JSON.parse(html.match(/<script id="canvas-state" type="application\/json">([\s\S]*?)<\/script>/)[1]),canvas);
  const {writeFile}=await import('node:fs/promises');
  const run=(...args)=>execFileSync(process.execPath,[fileURLToPath(script),...args],{encoding:'utf8'});
  for(let i=0;i<2;i++){
    const input=join(root,`action-${i}.json`),handoff=join(root,`request-${i}.json`),response=join(root,`response-${i}.json`);
    await writeFile(input,JSON.stringify({id:'evaluate'}));run('request',dir,input,handoff);
    await writeFile(response,JSON.stringify({thought:`Assessment ${i}`}));run('result',dir,handoff,response);
    const state=await json('current.json');core.validate(state);
    assert.equal(state.thoughts.at(-1).text,`Assessment ${i}`);assert.equal(state.takeaways,canvas.takeaways);
    const updatedHtml = await readFile(join(dir,'canvas.html'),'utf8');
    const slot = /(<script id="canvas-state" type="application\/json">)[\s\S]*?(<\/script>)/;
    assert.equal(updatedHtml.replace(slot,'$1$2'),html.replace(slot,'$1$2'));
    assert.deepEqual(JSON.parse(updatedHtml.match(/<script id="canvas-state" type="application\/json">([\s\S]*?)<\/script>/)[1]),state);
    run('result',dir,handoff,response); // exact retry
    assert.equal((await json('head.json')).revision_number,i+2);
  }
  assert.deepEqual((await readdir(dir)).filter(f=>f.endsWith('.html')),['canvas.html']);
  assert.ok(!(await readdir(dir)).includes('.writer-lock'));
});
test('request captures submitted edits before composing and rejects stale capture',async t=>{
  const {openStore}=await import('../.agents/skills/pensive/scripts/lib/revision-store.mjs');
  const {prepareRequest,applyResult}=await import('../.agents/skills/pensive/scripts/workspace.mjs');
  const core=require('../.agents/skills/pensive/frameworks/pages/state.js');
  const dir=await mkdtemp(join(tmpdir(),'pensive-capture-'));
  const store=await openStore(dir,core.validate);t.after(async()=>{await store.close();await rm(dir,{recursive:true,force:true});});
  const first=await store.initialize(core.initialState());const canvas=structuredClone(first.canvas);canvas.takeaways='Unsaved browser edit';
  const handoff=await prepareRequest(store,{parent_revision_id:first.revision_id,canvas,action:{id:'evaluate'}});
  assert.deepEqual(handoff.request.canvas,canvas);assert.notEqual(handoff.revision_id,first.revision_id);
  const result=await applyResult(store,handoff,{thought:'Preserves edited state'});assert.equal(result.canvas.takeaways,canvas.takeaways);
  await assert.rejects(prepareRequest(store,{parent_revision_id:first.revision_id,canvas,action:{id:'evaluate'}}),/conflict/i);
});
