import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import Ajv from 'ajv';
const require=createRequire(import.meta.url);
function core(){const path='../.agents/skills/pensive/frameworks/vars/state.js';assert.ok(existsSync(new URL(path,import.meta.url)),'VARS state missing');return require(path);}
test('VARS supports partial summaries, optional quadrant/item Markdown and stable identity',()=>{
 const v=core(),s=v.initialState(); const id=v.addItem(s,'a');v.editItem(s,'a',id,'Proprietary technology');v.editDetails(s,'a','## Evidence');v.editDetails(s,'a','| Valuable | Yes |',id);
 assert.equal(s.content.a[0].details,'| Valuable | Yes |');assert.equal(s.content.details.a,'## Evidence');
 assert.equal(new Ajv().compile(JSON.parse(readFileSync(new URL('../.agents/skills/pensive/frameworks/vars/canvas.schema.json',import.meta.url))))(s),true);
 assert.deepEqual(v.parseState(JSON.stringify(s)),s); delete s.content.details;v.validate(s);assert.equal(v.sectionSnapshot(s.content,'a').details,'');
 assert.throws(()=>v.editDetails(s,'a','x','missing'));assert.throws(()=>v.editDetails(s,'unknown','x'));
});
test('VARS quadrant approval includes its summaries and all supporting Markdown atomically',()=>{
 const v=core(),s=v.initialState();s.content.v=[{id:'v1',text:'Value'}];const c=structuredClone(s.content);c.v[0].details='Evidence';c.details.v='Rationale';c.r=[{id:'r1',text:'Subscription'}];
 const result=v.composeResult(v.buildRequest(s,{id:'improve'}),{content:c,thought:'Strengthen coherence'});
 assert.equal(s.proposals,undefined);assert.deepEqual(v.proposalSections(result).map(e=>e.section),['v','r']);v.resolveProposal(result,['v'],'accept');
 assert.equal(result.content.details.v,'Rationale');assert.equal(result.content.v[0].details,'Evidence');assert.deepEqual(result.content.r,[]);v.rejectProposal(result);assert.equal(result.content.details.v,'Rationale');
});
test('VARS explicit-change Ripple needs a valid target and change, preserves framing and has no baseline',()=>{
 const v=core(),s=v.initialState();assert.throws(()=>v.buildRequest(s,{id:'ripple',target:{type:'section',id:'r'}}));
 const req=v.buildRequest(s,{id:'ripple',target:{type:'section',id:'r'},change:'Move to subscriptions'});const c=structuredClone(s.content);c.r=[{id:'r1',text:'Monthly subscription'}];
 const result=v.composeResult(req,{content:c,thought:'Recurring billing is an enabling dependency.'});v.acceptProposal(result);assert.equal(result.content.r[0].text,'Monthly subscription');assert.equal(result.ripple_baseline,undefined);
 c.framing.business='Changed';assert.throws(()=>v.composeResult(req,{content:c,thought:'x'}),/framing/);
});
test('VARS stale detail approval is atomic and no-change proposals become assessments',()=>{
 const v=core(),s=v.initialState(),c=structuredClone(s.content);c.details.a='Proposed';const r=v.composeResult(v.buildRequest(s,{id:'improve'}),{content:c,thought:'x'});v.editDetails(r,'v','Local');const before=structuredClone(r);assert.throws(()=>v.acceptProposal(r),/changed|stale/);assert.deepEqual(r,before);v.rejectProposal(r);assert.equal(r.content.details.v,'Local');
 const n=v.composeResult(v.buildRequest(s,{id:'improve'}),{content:s.content,thought:'No changes needed'});assert.equal(n.proposals?.length??0,0);assert.equal(n.thoughts[0].text,'No changes needed');
});
test('VARS annotations, Takeaways and Six Hats preserve supporting details and remain schema-compatible',()=>{
 const v=core(),s=v.initialState();s.content.a=[{id:'a1',text:'Capability',details:'Evidence'}];s.annotations=[{id:'note1',target:{type:'item',id:'a1'},target_label:'Capability',text:'Question'}];s.takeaways='Existing';
 const hats=v.composeResult(v.buildRequest(s,{id:'six_hats',hat:'white',target:{type:'item',id:'a1'}}),{observations:['Evidence needed']});assert.deepEqual(hats.content,s.content);assert.deepEqual(hats.annotations,s.annotations);
 const t=v.composeResult(v.buildRequest(hats,{id:'formulate_takeaways',include_annotations:true}),{takeaways:'Provisional next steps',rationale:'x'});v.acceptProposal(t);assert.equal(t.takeaways,'Provisional next steps');assert.deepEqual(t.content,s.content);assert.equal(new Ajv().compile(JSON.parse(readFileSync(new URL('../.agents/skills/pensive/frameworks/vars/canvas.schema.json',import.meta.url))))(t),true);
});
test('VARS packaging is deterministic and safely round-trips hostile Markdown without replacing implementation',async()=>{
 const v=core(),{buildCanvas}=await import('../.agents/skills/pensive/scripts/package-vars.mjs');const html=readFileSync(new URL('../.agents/skills/pensive/frameworks/vars/canvas.html',import.meta.url),'utf8');assert.equal(await buildCanvas(),html);const s=v.initialState();s.content.details.v='</script><img src=x onerror=alert(1)>&\u2028';const result=v.packageHtml(html,s);assert.deepEqual(v.parseState(result.match(/<script id="canvas-state" type="application\/json">([\s\S]*?)<\/script>/)[1]),s);assert.equal(result.replace(/<script id="canvas-state" type="application\/json">[\s\S]*?<\/script>/,'STATE'),html.replace(/<script id="canvas-state" type="application\/json">[\s\S]*?<\/script>/,'STATE'));
});
