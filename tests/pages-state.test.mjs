import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
const require = createRequire(import.meta.url);
const root = new URL('../.agents/skills/pensive/frameworks/pages/', import.meta.url);
function core() {
  assert.ok(existsSync(new URL('state.js', root)), 'PAGES state operations are missing');
  return require(fileURLToPath(new URL('state.js', root)));
}
function populated() {
  const p = core(); const s = p.initialState();
  s.content.parts.push({ id: 'p1', text: 'Team' });
  s.content.actions.push({ id: 'a1', text: 'Lead approves each task' });
  s.content.goals.push({ id: 'g1', text: 'Ship by Friday' });
  s.content.events.push({ id: 'e1', text: 'Friday deadline' });
  s.content.self_concepts.push({ id: 's1', text: 'I must make every decision' });
  p.resetBaseline(s); return s;
}
test('blank and initialized PAGES states are schema-valid with independent baseline', () => {
  const p = core(); const s = p.initialState();
  const schema = new Ajv({ allErrors: true }).compile(JSON.parse(readFileSync(new URL('canvas.schema.json', root))));
  assert.equal(schema(s), true); assert.deepEqual(p.changes(s), []);
  const id = p.addItem(s, 'parts'); p.editItem(s, 'parts', id, 'Me');
  assert.equal(s.ripple_baseline.parts.length, 0);
  assert.equal(p.initialState().content.parts.length, 0);
  p.resetBaseline(s); assert.deepEqual(p.changes(s), []);
  assert.notEqual(s.ripple_baseline.parts, s.content.parts);
  assert.equal(schema(populated()), true);
});
test('change detection retains before/after, deletions, moves and reverts by stable ID', () => {
  const p = core(); const s = populated();
  p.editItem(s, 'self_concepts', 's1', 'I can delegate decisions');
  p.deleteItem(s, 'events', 'e1');
  s.content.actions.push(s.content.parts.pop());
  const added = p.addItem(s, 'goals');
  const changes = p.changes(s);
  assert.ok(changes.some(c => c.section === 'self_concepts' && c.kind === 'edited' && c.before.text === 'I must make every decision' && c.after.id === 's1'));
  assert.ok(changes.some(c => c.section === 'events' && c.kind === 'removed' && c.before.id === 'e1'));
  assert.ok(changes.some(c => c.section === 'parts' && c.kind === 'removed' && c.before.id === 'p1'));
  assert.ok(changes.some(c => c.section === 'actions' && c.kind === 'added' && c.after.id === 'p1'));
  assert.ok(changes.some(c => c.kind === 'added' && c.after.id === added));
  p.editItem(s, 'self_concepts', 's1', 'I must make every decision');
  assert.equal(p.changes(s).some(c => c.section === 'self_concepts'), false);
});
test('invalid shapes and duplicate IDs fail schema/runtime where structural; invalid operations are atomic', () => {
  const p = core(); const check = new Ajv({ allErrors: true }).compile(JSON.parse(readFileSync(new URL('canvas.schema.json', root))));
  for (const mutate of [s => s.framework = 'swot', s => s.content.parts = null, s => s.ripple_baseline = {}, s => s.content.parts.push({id:'bad id',text:''}), s => s.extra = 1, s => s.content.framing.what = 2, s => s.thoughts = [{id:'t', kind:'ripple',text:' '}], s => s.proposals = [{}]]) {
    const s = populated(); mutate(s); assert.equal(check(s), false); assert.throws(() => p.validate(s));
  }
  const s = populated(); s.content.goals[0].id = 'p1'; assert.throws(() => p.validate(s), /duplicate/i);
  const ok = populated(); const before = structuredClone(ok);
  assert.throws(() => p.editItem(ok,'parts','missing','x')); assert.throws(() => p.addItem(ok,'__proto__'));
  assert.throws(() => p.editItem(ok,'parts','p1',2)); assert.deepEqual(ok,before);
});
test('missing imported baseline is preserved; Ripple requires explicit establishment and changed sources', () => {
  const p = core(); const s = populated(); delete s.ripple_baseline;
  assert.doesNotThrow(() => p.validate(s)); assert.equal(p.parseState(JSON.stringify(s)).ripple_baseline, undefined);
  assert.throws(() => p.buildRequest(s,{id:'ripple',sources:['parts']}), /baseline/i);
  p.resetBaseline(s);
  assert.throws(() => p.buildRequest(s,{id:'ripple',sources:['parts']}), /changed/i);
  p.editItem(s,'parts','p1','Other team');
  for (const sources of [[], ['parts','parts'], ['unknown'], p.sections]) assert.throws(() => p.buildRequest(s,{id:'ripple',sources}));
  const request = p.buildRequest(s,{id:'ripple',sources:['parts'],comment:'Propagate',use_thoughts:false});
  assert.deepEqual(request.canvas,s); s.content.parts[0].text='Later'; assert.equal(request.canvas.content.parts[0].text,'Other team');
});
test('Evaluate adds a thought only; Improve is a reviewable whole-canvas proposal preserving baseline', () => {
  const p = core(); const s = populated();
  const evaluated = p.composeResult(p.buildRequest(s,{id:'evaluate'}),{thought:'Goals repeat the deadline; identity and action imply a bottleneck.'});
  assert.deepEqual(evaluated.content,s.content); assert.deepEqual(evaluated.ripple_baseline,s.ripple_baseline);
  const content = structuredClone(s.content); content.actions[0].text='Lead reviews only blocked tasks';
  const result = p.composeResult(p.buildRequest(evaluated,{id:'improve'}),{content,thought:'Clarified the review action.'});
  assert.deepEqual(result.content,s.content); assert.equal(result.proposals.length,1);
  assert.throws(() => p.buildRequest(result,{id:'evaluate'}), /pending/i);
  p.acceptProposal(result); assert.deepEqual(result.content,content); assert.equal(result.thoughts.length,2);
  assert.deepEqual(result.ripple_baseline,s.ripple_baseline); assert.equal(p.changes(result)[0].section,'actions');
});
test('Ripple preserves framing and multiple source dimensions, including deleted sources', () => {
  const p = core(); const s = populated(); p.editItem(s,'self_concepts','s1','I can delegate'); p.deleteItem(s,'events','e1');
  const request = p.buildRequest(s,{id:'ripple',sources:['self_concepts','events']});
  const content = structuredClone(s.content); content.actions[0].text='Team decides routine tasks';
  const result = p.composeResult(request,{content,thought:'Delegation may remove the approval bottleneck; test decision boundaries.'});
  for (const mutate of [c => c.self_concepts[0].text='Wrong premise', c => c.events.push({id:'e2',text:'Invented'}), c => c.framing.what='New framing']) {
    const bad = structuredClone(content); mutate(bad); assert.throws(() => p.composeResult(request,{content:bad,thought:'x'}), /preserve/i);
  }
  p.acceptProposal(result); assert.deepEqual(result.content,content); assert.deepEqual(result.ripple_baseline,s.ripple_baseline);
});
test('proposals cannot bypass action boundaries through imported metadata; stale acceptance preserves edits', () => {
  const p = core(); const s = populated(); p.editItem(s,'parts','p1','Team and partner');
  const content=structuredClone(s.content); content.goals[0].text='Agree delivery scope';
  const result=p.composeResult(p.buildRequest(s,{id:'ripple',sources:['parts']}),{content,thought:'The partner changes coordination needs.'});
  const tampered=structuredClone(result); tampered.proposals[0].content.parts[0].text='Bypass'; assert.throws(()=>p.validate(tampered));
  const changedBaseline=structuredClone(result); changedBaseline.ripple_baseline.parts[0].text='Different baseline'; assert.throws(()=>p.acceptProposal(changedBaseline), /baseline/i);
  p.editItem(result,'actions','a1','User edit'); const before=structuredClone(result);
  assert.throws(()=>p.acceptProposal(result), /changed/i); assert.deepEqual(result,before);
  assert.throws(()=>p.resetBaseline(result), /pending/i); p.rejectProposal(result); assert.equal(result.content.actions[0].text,'User edit');
});
test('AI cannot re-identify exact retained text, collide with annotations or smuggle unsupported response keys', () => {
  const p=core(); const s=populated(); const request=p.buildRequest(s,{id:'improve'});
  const content=structuredClone(s.content); content.parts[0].id='new-id';
  assert.throws(()=>p.composeResult(request,{content,thought:'x'}), /ID/i);
  assert.throws(()=>p.composeResult(request,{content:s.content,thought:'x',baseline:{}}));
  const evaluated=p.composeResult(p.buildRequest(s,{id:'evaluate'}),{thought:'x'});
  const bad=structuredClone(s.content); bad.parts[0].id=evaluated.thoughts[0].id; bad.parts[0].text='New';
  assert.throws(()=>p.composeResult(p.buildRequest(evaluated,{id:'improve'}),{content:bad,thought:'x'}));
});
test('safe HTML state slot preserves implementation and adversarial baseline/current/proposal strings', () => {
  const p=core(); const s=populated(); const attack='</script><img src=x onerror=alert(1)><!-- & 🧠\u2028';
  s.content.parts[0].text=attack; p.resetBaseline(s);
  const html='prefix<!--pensive-state-start--><script id="canvas-state" type="application/json">{}</script><!--pensive-state-end-->suffix';
  const output=p.packageHtml(html,s); assert.ok(!output.includes(attack));
  assert.deepEqual(p.parseState(output.match(/application\/json">([\s\S]*?)<\/script>/)[1]),s);
  assert.ok(output.startsWith('prefix')); assert.ok(output.endsWith('suffix'));
  assert.throws(()=>p.packageHtml('no slot',s),/slot/i);
});

test('PAGES build is deterministic and user CLI preserves implementation, refuses invalid/existing outputs', async () => {
  const { buildCanvas } = await import('../.agents/skills/pensive/scripts/package-pages.mjs');
  const { mkdtemp, writeFile, readFile, rm } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os'); const { join } = await import('node:path');
  const { spawnSync } = await import('node:child_process');
  const p=core(); const template=readFileSync(new URL('canvas.html',root),'utf8');
  assert.equal(await buildCanvas(),template); assert.equal(await buildCanvas(),await buildCanvas());
  const tmp=await mkdtemp(join(tmpdir(),'pages-cli-'));
  try {
    const input=join(tmp,'state.json'), output=join(tmp,'canvas.html');
    const run=(...args)=>spawnSync(process.execPath,[fileURLToPath(new URL('../.agents/skills/pensive/scripts/package-pages.mjs',import.meta.url)),...args],{encoding:'utf8'});
    const s=populated(); await writeFile(input,JSON.stringify(s)); assert.equal(run(input,output).status,0);
    const outputHtml=await readFile(output,'utf8');
    const strip=h=>h.replace(/<!--pensive-state-start-->[\s\S]*?<!--pensive-state-end-->/,'<STATE>');
    assert.equal(strip(outputHtml),strip(template)); assert.deepEqual(p.parseState(outputHtml.match(/application\/json">([\s\S]*?)<\/script>/)[1]),s);
    assert.notEqual(run(input,output).status,0); assert.equal(await readFile(output,'utf8'),outputHtml);
    await writeFile(input,'{}'); const bad=join(tmp,'bad.html'); assert.notEqual(run(input,bad).status,0); assert.equal(existsSync(bad),false);
    const req=join(tmp,'request.json'), res=join(tmp,'response.json'), result=join(tmp,'result.html');
    await writeFile(req,JSON.stringify(p.buildRequest(s,{id:'evaluate'}))); await writeFile(res,JSON.stringify({thought:'Grounded evaluation'}));
    assert.equal(run('--result',req,res,result).status,0);
    const packaged=p.parseState((await readFile(result,'utf8')).match(/application\/json">([\s\S]*?)<\/script>/)[1]);
    assert.equal(packaged.thoughts[0].text,'Grounded evaluation'); assert.deepEqual(packaged.ripple_baseline,s.ripple_baseline);
    await writeFile(res,JSON.stringify({thought:'x',content:s.content})); const invalid=join(tmp,'invalid-result.html');
    assert.notEqual(run('--result',req,res,invalid).status,0); assert.equal(existsSync(invalid),false);
  } finally { await rm(tmp,{recursive:true,force:true}); }
});

test('imported Ripple proposals cannot treat source reordering as a semantic change', () => {
  const p=core(), s=populated(); s.content.parts.push({id:'p2',text:'Partner'}); p.resetBaseline(s);
  p.editItem(s,'parts','p1','Changed team'); const content=structuredClone(s.content); content.goals[0].text='Coordinate';
  const result=p.composeResult(p.buildRequest(s,{id:'ripple',sources:['parts']}),{content,thought:'Coordinate the changed team.'});
  // Forge the same proposal around only a reordered source, without any ID/text delta.
  const ordered=structuredClone(result.ripple_baseline.parts).reverse();
  result.content.parts=structuredClone(ordered); result.proposals[0].base_content.parts=structuredClone(ordered); result.proposals[0].content.parts=structuredClone(ordered);
  assert.throws(()=>p.validate(result),/changed/i);
});

test('observed discovery/elicitation and every action satisfy schema and standalone packaging contracts', async () => {
  const p=core(), observed=JSON.parse(readFileSync(new URL('methodology/pages-observed.json',import.meta.url)));
  const check=new Ajv({allErrors:true}).compile(JSON.parse(readFileSync(new URL('canvas.schema.json',root))));
  const html=readFileSync(new URL('canvas.html',root),'utf8');
  for(const s of [observed.rich_discovery.state,observed.conversational_impasse.state]) {
    assert.equal(check(s),true); p.validate(s); assert.deepEqual(p.changes(s),[]);
    assert.deepEqual(p.parseState(p.packageHtml(html,s).match(/application\/json">([\s\S]*?)<\/script>/)[1]),s);
  }
  for(const [id,entry] of Object.entries(observed.actions)) {
    assert.equal(entry.request.action.id,id);
    const result=p.composeResult(entry.request,entry.response); assert.equal(check(result),true);
    assert.deepEqual(result.ripple_baseline,entry.request.canvas.ripple_baseline);
    if(id==='evaluate') assert.deepEqual(result.content,entry.request.canvas.content);
    else { assert.deepEqual(result.content,entry.request.canvas.content); p.acceptProposal(result); assert.deepEqual(result.content,entry.response.content); }
    assert.deepEqual(p.parseState(p.packageHtml(html,result).match(/application\/json">([\s\S]*?)<\/script>/)[1]),result);
  }
});
