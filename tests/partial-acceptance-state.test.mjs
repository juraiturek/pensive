import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import Ajv from 'ajv';
const require=createRequire(import.meta.url);
for(const name of ['pages','swot']){
 const p=require(`../.agents/skills/pensive/frameworks/${name}/state.js`);
 const sections=name==='pages'?['parts','actions','goals']:['strengths','weaknesses','opportunities'];
 const [a,b,c]=sections;
 const list=(s,k)=>p.collection(s,k);
 const schema=new Ajv().compile(JSON.parse(readFileSync(new URL(`../.agents/skills/pensive/frameworks/${name}/canvas.schema.json`,import.meta.url))));
 function fixture(){
  const s=p.initialState();for(const [i,k] of sections.entries())list(s,k).push({id:`item${i}`,text:`Original ${k}`});
  if(name==='pages')p.resetBaseline(s);
  const content=structuredClone(s.content);for(const k of sections)list({content},k)[0].text=`Updated ${k}`;
  return p.composeResult(p.buildRequest(s,{id:'improve'}),{content,thought:'Original proposal rationale.'});
 }
 test(`${name}: one accepted node leaves unchecked nodes pending; decisions round-trip with immutable proposal`,()=>{
  assert.equal(typeof p.resolveProposal,'function','Partial review API is missing');
  const s=fixture(),original=structuredClone(s.proposals[0]),baseline=structuredClone(s.ripple_baseline);
  p.resolveProposal(s,[a],'accept');assert.equal(list(s,a)[0].text,`Updated ${a}`);assert.equal(list(s,b)[0].text,`Original ${b}`);
  assert.deepEqual(s.proposals[0].base_content,original.base_content);assert.deepEqual(s.proposals[0].content,original.content);
  assert.equal(s.proposals[0].resolutions[a],'accepted');assert.deepEqual(s.thoughts||[],[]);
  assert.deepEqual(p.parseState(JSON.stringify(s)),s);assert.equal(schema(s),true);assert.deepEqual(s.ripple_baseline,baseline);
  assert.throws(()=>p.buildRequest(s,{id:'evaluate'}),/proposal/i);
  p.resolveProposal(s,[b],'reject');assert.equal(list(s,b)[0].text,`Original ${b}`);assert.equal(s.proposals[0].resolutions[b],'rejected');
  p.acceptProposal(s);assert.equal(list(s,c)[0].text,`Updated ${c}`);assert.equal(s.proposals.length,0);
  assert.equal(s.thoughts.length,1);assert.match(s.thoughts[0].text,/Original proposal rationale/);assert.match(s.thoughts[0].text,/Rejected/);assert.match(s.thoughts[0].text,/Accepted/);
 });
 test(`${name}: batch selection is atomic and reject-all never rolls back earlier acceptance`,()=>{
  assert.equal(typeof p.resolveProposal,'function');const s=fixture();p.resolveProposal(s,[a,b],'accept');p.rejectProposal(s);
  assert.equal(list(s,a)[0].text,`Updated ${a}`);assert.equal(list(s,b)[0].text,`Updated ${b}`);assert.equal(list(s,c)[0].text,`Original ${c}`);
  assert.equal(s.proposals.length,0);assert.equal(s.thoughts.length,1);
  const rejected=fixture();p.rejectProposal(rejected);assert.equal(rejected.thoughts?.length||0,0);
 });
 test(`${name}: local edits after partial acceptance block remaining acceptance but allow rejection without lost edits`,()=>{
  assert.equal(typeof p.resolveProposal,'function');const s=fixture();p.resolveProposal(s,[a],'accept');p.editItem(s,b,'item1','Local edit');
  const before=structuredClone(s);assert.throws(()=>p.resolveProposal(s,[b],'accept'),/changed|stale/i);assert.deepEqual(s,before);
  p.rejectProposal(s);assert.equal(list(s,b)[0].text,'Local edit');assert.equal(list(s,a)[0].text,`Updated ${a}`);
 });
 test(`${name}: moved identities require related node decisions together; failed subsets leave everything intact`,()=>{
  assert.equal(typeof p.resolveProposal,'function');const initial=p.initialState();list(initial,a).push({id:'move',text:'Same concept'});
  const content=structuredClone(initial.content);list({content},b).push(list({content},a).pop());
  const s=p.composeResult(p.buildRequest(initial,{id:'improve'}),{content,thought:'Moved concept to its appropriate dimension.'});
  const before=structuredClone(s);assert.throws(()=>p.resolveProposal(s,[b],'accept'),/together|related|duplicate/i);assert.deepEqual(s,before);
  p.resolveProposal(s,[a,b],'accept');assert.equal(list(s,a).length,0);assert.equal(list(s,b)[0].id,'move');assert.equal(s.proposals.length,0);
 });
 test(`${name}: invalid resolution metadata/targets fail, including unchanged nodes and already resolved nodes`,()=>{
  assert.equal(typeof p.resolveProposal,'function');const s=fixture();
  for(const [targets,decision] of [[[],'accept'],[[a,a],'accept'],[['framing'],'accept'],[[a],'bad']])assert.throws(()=>p.resolveProposal(s,targets,decision));
  for(const resolutions of [null,[],{unknown:'accepted'},{[a]:'invalid'},Object.fromEntries(sections.map(k=>[k,'accepted']))]){
   const bad=structuredClone(s);bad.proposals[0].resolutions=resolutions;assert.throws(()=>p.validate(bad));
  }
  const bad=structuredClone(s);bad.proposals[0].resolutions={[a]:'bad'};assert.equal(schema(bad),false);
  p.resolveProposal(s,[a],'reject');const before=structuredClone(s);assert.throws(()=>p.resolveProposal(s,[a],'accept'));assert.deepEqual(s,before);
 });
 test(`${name}: legacy whole-canvas and no-change proposals still resolve without invented changed nodes`,()=>{
  assert.equal(typeof p.resolveProposal,'function');const s=fixture();assert.equal(s.proposals[0].resolutions,undefined);p.acceptProposal(s);assert.equal(s.proposals.length,0);
  const empty=p.initialState(),noop=p.composeResult(p.buildRequest(empty,{id:'improve'}),{content:empty.content,thought:'No supported improvements.'});
  assert.deepEqual(p.proposalSections(noop),[]);p.acceptProposal(noop);assert.equal(noop.proposals.length,0);assert.equal(noop.thoughts?.length||0,0);
 });
 if(name==='pages')test('pages: partial Ripple decisions preserve selected source and baseline guard',()=>{
  assert.equal(typeof p.resolveProposal,'function');const s=p.initialState();s.content.self_concepts=[{id:'self',text:'I approve everything'}];p.resetBaseline(s);
  p.editItem(s,'self_concepts','self','Hypothetical: I develop reviewers');const baseline=structuredClone(s.ripple_baseline),content=structuredClone(s.content);
  content.actions=[{id:'new-action',text:'Hypothetical supervised review pilot'}];content.goals=[{id:'new-goal',text:'Hypothetical reviewer development'}];
  const result=p.composeResult(p.buildRequest(s,{id:'ripple',sources:['self_concepts']}),{content,thought:'Possible implications, subject to agreement.'});
  p.resolveProposal(result,['actions'],'accept');assert.deepEqual(result.ripple_baseline,baseline);assert.deepEqual(result.content.self_concepts,s.content.self_concepts);
  const bad=structuredClone(result);bad.ripple_baseline.self_concepts[0].text='Tampered';assert.throws(()=>p.acceptProposal(bad),/baseline/i);
  const tampered=structuredClone(result);tampered.proposals[0].content.self_concepts[0].text='Not allowed';assert.throws(()=>p.validate(tampered),/preserve/i);
  p.rejectProposal(result);assert.equal(result.content.actions.length,1);assert.equal(result.content.goals.length,0);assert.deepEqual(result.ripple_baseline,baseline);
 });
 if(name==='swot')test('swot: TOWS strategy collections are individual reviewable nodes',()=>{
  assert.equal(typeof p.resolveProposal,'function');const s=p.initialState(),content=structuredClone(s.content);
  content.strategies.so=[{id:'so1',text:'SO proposal'}];content.strategies.wt=[{id:'wt1',text:'WT proposal'}];
  const result=p.composeResult(p.buildRequest(s,{id:'strategize'}),{content,thought:'Two options.'});p.resolveProposal(result,['so'],'accept');p.resolveProposal(result,['wt'],'reject');
  assert.equal(result.content.strategies.so.length,1);assert.equal(result.content.strategies.wt.length,0);assert.deepEqual(result.content.strengths,[]);
 });
}
