import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile, mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import Ajv from 'ajv';
import {buildCanvas} from '../.agents/skills/pensive/scripts/package-issue-tree.mjs';
import {getCore} from '../.agents/skills/pensive/scripts/lib/framework-core.mjs';
import {initialize,withStore,prepareRequest,applyResult} from '../.agents/skills/pensive/scripts/workspace.mjs';
const require=createRequire(import.meta.url),W=require('../.agents/skills/pensive/frameworks/issue_tree/state.js');
const root=new URL('../.agents/skills/pensive/frameworks/issue_tree/',import.meta.url);
const schema=new Ajv().compile(JSON.parse(await readFile(new URL('canvas.schema.json',root),'utf8')));
function fixture(){const s=W.initialState();W.editNode(s,'root',{title:'How can we improve delivery?'});W.editFraming(s,'Current service is slow. Explore options and drivers.');const a=W.addChild(s,'root','Operations'),b=W.addChild(s,'root','Demand'),c=W.addChild(s,a,'Capacity');return {s,a,b,c};}
function alternative(s){const tree=structuredClone(s.content.tree);tree.children=[{id:'new_lens',title:'Customer journey',notes:'Alternative organizing lens; investigate, do not assume.',highImpact:false,highInfluence:false,children:[]}];return {thought:'Organize by journey stage instead of internal function. Reveals handoffs; may obscure resource drivers.',tree};}
test('Issue Tree schema and core validate blank and edited multilevel content with stable identity',()=>{const {s,a,c}=fixture();assert.ok(schema(s),JSON.stringify(schema.errors));W.editNode(s,'root',{title:'Updated governing question'});W.editNode(s,c,{notes:'Evidence and assumptions are substantive node content.'});assert.equal(W.find(s,c).node.notes,'Evidence and assumptions are substantive node content.');assert.deepEqual(W.find(s,c).path,['root',a,c]);assert.deepEqual(W.parseState(JSON.stringify(s)),s);assert.equal(getCore('issue_tree'),W);});
test('independent priorities retain all four Boolean combinations and reject non-Boolean values',()=>{const {s,a}=fixture();for(const highImpact of [false,true])for(const highInfluence of [false,true]){W.editNode(s,a,{highImpact,highInfluence});const row=W.overview(s).nodes.find(n=>n.id===a);assert.equal(row.highImpact,highImpact);assert.equal(row.highInfluence,highInfluence);assert.ok(schema(s));}const before=structuredClone(s);assert.throws(()=>W.editNode(s,a,{highImpact:null}),/Boolean/);assert.deepEqual(s,before);});
test('subtree deletion repairs selected path and preserves unrelated nodes; root is retained',()=>{const {s,a,b,c}=fixture();W.navigate(s,c);const other=structuredClone(W.find(s,b).node);W.deleteNode(s,a);assert.deepEqual(s.cursor,['root']);assert.deepEqual(W.find(s,b).node,other);assert.throws(()=>W.find(s,c),/not found/);assert.throws(()=>W.deleteNode(s,'root'),/root/);assert.ok(schema(s));});
test('wide and deep trees retain every node inside scrollable board geometry without fixed quotas',()=>{const {s}=fixture();for(let i=0;i<25;i++)W.addChild(s,'root','Wide '+i);let id='root';for(let i=0;i<25;i++)id=W.addChild(s,id,'Deep '+i);const v=W.overview(s);assert.equal(v.nodes.length,54);assert.equal(v.edges.length,53);assert.ok(v.board_width>5000);assert.ok(v.board_height>3500);for(const n of v.nodes){assert.ok(n.x>=104&&n.x+104<v.board_width);assert.ok(n.y>=43&&n.y+43<v.board_height);}assert.equal(new Set(v.nodes.map(n=>n.id)).size,54);});
test('reject malformed states including duplicate IDs, flags, cycles and invalid selection',()=>{const {s,a}=fixture();for(const mutate of [v=>v.content.tree.children[0].id='root',v=>v.content.tree.notes=null,v=>v.content.tree.highInfluence='true',v=>v.cursor=['missing'],v=>v.schema_version='2.0',v=>v.content.extra='unknown']){const copy=structuredClone(s);mutate(copy);assert.throws(()=>W.validate(copy));}const cyclic=structuredClone(s);W.find(cyclic,a).node.children.push(cyclic.content.tree);assert.throws(()=>W.validate(cyclic));});
test('Evaluate appends specific advisory text only and request is a complete detached clone',()=>{const {s}=fixture();const request=W.buildRequest(s,{id:'evaluate',comment:'Check sibling dimensions'});assert.deepEqual(request.canvas,s);request.canvas.content.framing='Changed copy';assert.notEqual(s.content.framing,request.canvas.content.framing);const r=W.composeResult(W.buildRequest(s,{id:'evaluate'}),{thought:'Operations and Demand may overlap where demand drives capacity needs.'});assert.deepEqual(r.content,s.content);assert.equal(r.thoughts.length,1);assert.deepEqual(s.thoughts,undefined);assert.ok(schema(r));assert.throws(()=>W.composeResult(W.buildRequest(s,{id:'evaluate'}),{thought:'ok',tree:s.content.tree}),/Unsupported/);assert.throws(()=>W.buildRequest(W.initialState(),{id:'evaluate'}),/governing/);});
test('Alternative remains a whole-tree proposal until explicit accept, preserving framing and root identity',()=>{const {s,a}=fixture(),request=W.buildRequest(s,{id:'alternative'}),response=alternative(s);const pending=W.composeResult(request,response);assert.deepEqual(pending.content,s.content);assert.ok(schema(pending),JSON.stringify(schema.errors));assert.deepEqual(W.parseState(JSON.stringify(pending)),pending);assert.throws(()=>W.buildRequest(pending,{id:'evaluate'}),/pending/);W.navigate(pending,a);W.resolveProposal(pending,'accept');assert.deepEqual(pending.content.tree,response.tree);assert.equal(pending.content.framing,s.content.framing);assert.deepEqual(pending.cursor,['root']);assert.equal(pending.thoughts[0].kind,'alternative');assert.ok(!pending.proposals);assert.ok(schema(pending));const rejected=W.composeResult(request,response);W.resolveProposal(rejected,'reject');assert.deepEqual(rejected,s);});
test('stale proposals never overwrite manual notes, titles, priorities or framing',()=>{const {s,a}=fixture();for(const mutate of [v=>W.editNode(v,a,{notes:'new evidence'}),v=>W.editNode(v,a,{title:'renamed'}),v=>W.editNode(v,a,{highImpact:true}),v=>W.editFraming(v,'new frame')]){const pending=W.composeResult(W.buildRequest(s,{id:'alternative'}),alternative(s));mutate(pending);const before=structuredClone(pending);assert.throws(()=>W.resolveProposal(pending,'accept'),/stale/);assert.deepEqual(pending,before);W.resolveProposal(pending,'reject');W.validate(pending);}const response=alternative(s);response.tree.id='different_root';assert.throws(()=>W.composeResult(W.buildRequest(s,{id:'alternative'}),response),/root/);});
test('standalone packaging preserves implementation bytes, pending review and hostile text safely',async()=>{const {s}=fixture();W.editNode(s,'root',{notes:'</script><script>alert(1)</script>&'});const pending=W.composeResult(W.buildRequest(s,{id:'alternative'}),alternative(s));const html=await buildCanvas(pending),built=await readFile(new URL('canvas.html',root),'utf8');assert.equal(await buildCanvas(),built);const json=html.match(/<script id="canvas-state" type="application\/json">([\s\S]*?)<\/script>/)[1];assert.deepEqual(W.parseState(json),pending);assert.ok(!json.includes('</script>'));assert.equal(html.slice(html.indexOf('<!--pensive-state-end-->')),built.slice(built.indexOf('<!--pensive-state-end-->')));});
test('paired-file workflow saves requests/results to the same HTML state slot for normal refresh',async()=>{const tmp=await mkdtemp(join(tmpdir(),'issue-tree-state-'));try{const {s}=fixture(),folder=join(tmp,'analysis');const head=await initialize(folder,s);const handoff=await withStore(folder,store=>prepareRequest(store,{parent_revision_id:head.revision_id,action:{id:'alternative'}}));await withStore(folder,store=>applyResult(store,handoff,alternative(s)));const current=JSON.parse(await readFile(join(folder,'current.json'),'utf8')),html=await readFile(join(folder,'canvas.html'),'utf8');assert.ok(current.proposals.length);assert.deepEqual(JSON.parse(html.match(/<script id="canvas-state" type="application\/json">([\s\S]*?)<\/script>/)[1]),current);assert.deepEqual(current.content,s.content);}finally{await rm(tmp,{recursive:true,force:true});}});
test('AI alternative cannot assign priority to new nodes or alter retained user judgments',()=>{const {s,a}=fixture();W.editNode(s,a,{highImpact:true});const r=alternative(s);r.tree.children[0].highInfluence=true;assert.throws(()=>W.composeResult(W.buildRequest(s,{id:'alternative'}),r),/priority/);const retained={thought:'Different lens',tree:structuredClone(s.content.tree)};retained.tree.children[0].highImpact=false;assert.throws(()=>W.composeResult(W.buildRequest(s,{id:'alternative'}),retained),/priority/);});
test('evaluation scopes validate, preserve action in saved requests, and remain append-only',async()=>{
 const {s}=fixture();
 for(const scope of ['full','mece']){
  const action={id:'evaluate',evaluation_scope:scope,comment:'Keep supplied evidence boundaries'};
  const request=W.buildRequest(s,action); assert.deepEqual(request.action,action);
  const result=W.composeResult(request,{thought:'Scope-specific feedback'});assert.deepEqual(result.content,s.content);
  const tmp=await mkdtemp(join(tmpdir(),'issue-scope-'));
  try{const folder=join(tmp,'canvas');const head=await initialize(folder,s);const handoff=await withStore(folder,store=>prepareRequest(store,{parent_revision_id:head.revision_id,action}));assert.equal(handoff.request.action.evaluation_scope,scope);await withStore(folder,store=>applyResult(store,handoff,{thought:'Scoped result'}));}finally{await rm(tmp,{recursive:true,force:true});}
 }
 assert.doesNotThrow(()=>W.buildRequest(s,{id:'evaluate'}));
 assert.throws(()=>W.buildRequest(s,{id:'evaluate',evaluation_scope:'research'}));
 assert.throws(()=>W.buildRequest(s,{id:'alternative',evaluation_scope:'mece'}));
});
test('empty child titles and optional investigation flags preserve legacy schema compatibility',()=>{
 const s=fixture().s;const id=W.addChild(s,'root');const child=W.find(s,id).node;
 assert.equal(child.title,'');assert.equal(child.needsInvestigation,false);
 W.editNode(s,id,{needsInvestigation:true});assert.equal(W.find(s,id).node.needsInvestigation,true);assert.ok(schema(s),JSON.stringify(schema.errors));
 assert.throws(()=>W.editNode(s,id,{needsInvestigation:'yes'}));
 const legacy=structuredClone(s);delete W.find(legacy,id).node.needsInvestigation;assert.doesNotThrow(()=>W.validate(legacy));assert.ok(schema(legacy));
 const bad=structuredClone(s);W.find(bad,id).node.needsInvestigation=1;assert.equal(schema(bad),false);assert.throws(()=>W.validate(bad));
 assert.deepEqual(W.parseState(JSON.stringify(s)),s);
});
test('investigation flags remain user-owned through AI actions and stale alternative review',()=>{
 const {s,a}=fixture();W.editNode(s,a,{needsInvestigation:true});
 const evaluated=W.composeResult(W.buildRequest(s,{id:'evaluate'}),{thought:'Keep uncertainty visible'});assert.deepEqual(evaluated.content,s.content);
 const response={thought:'Retained concepts',tree:structuredClone(s.content.tree)};
 const pending=W.composeResult(W.buildRequest(s,{id:'alternative'}),response);W.resolveProposal(pending,'accept');assert.equal(W.find(pending,a).node.needsInvestigation,true);
 const changed=structuredClone(response);delete changed.tree.children[0].needsInvestigation;assert.throws(()=>W.composeResult(W.buildRequest(s,{id:'alternative'}),changed));
 const added=alternative(s);added.tree.children[0].needsInvestigation=true;assert.throws(()=>W.composeResult(W.buildRequest(s,{id:'alternative'}),added));
 const stale=W.composeResult(W.buildRequest(s,{id:'alternative'}),response);W.editNode(stale,a,{needsInvestigation:false});assert.throws(()=>W.resolveProposal(stale,'accept'),/stale/);
});
test('dedicated MECE action and legacy evaluation requests derive persisted scope without content edits',async()=>{
 const {s,a}=fixture();W.editNode(s,a,{highImpact:true,needsInvestigation:true});s.thoughts=[{id:'legacy_note',kind:'evaluation',text:'Legacy general note'}];
 for(const [action,scope] of [[{id:'evaluate'},'full'],[{id:'evaluate',evaluation_scope:'full'},'full'],[{id:'evaluate',evaluation_scope:'mece'},'mece'],[{id:'mece_evaluate',comment:'Review coverage'},'mece']]){
  const request=W.buildRequest(s,action),result=W.composeResult(request,{thought:'## Review\n- Branch boundary requires clarification.'});assert.deepEqual(result.content,s.content);assert.deepEqual(result.cursor,s.cursor);assert.deepEqual(result.thoughts.slice(0,-1),s.thoughts);assert.equal(result.thoughts.at(-1).scope,scope);assert.ok(schema(result),JSON.stringify(schema.errors));assert.deepEqual(request.action,action);
  for(const extra of [{scope:'full'},{tree:s.content.tree},{content:s.content}])assert.throws(()=>W.composeResult(request,{thought:'Review',...extra}),/Unsupported/);
  const temp=await mkdtemp(join(tmpdir(),'issue-mece-contract-'));
  try{const folder=join(temp,'canvas'),head=await initialize(folder,s),handoff=await withStore(folder,store=>prepareRequest(store,{parent_revision_id:head.revision_id,action}));assert.deepEqual(handoff.request.action,action);const response={thought:'Scoped review'};const first=await withStore(folder,store=>applyResult(store,handoff,response));const retry=await withStore(folder,store=>applyResult(store,handoff,response));assert.equal(retry.revision_id,first.revision_id);assert.deepEqual(first.canvas.content,s.content);assert.equal(first.canvas.thoughts.at(-1).scope,scope);}finally{await rm(temp,{recursive:true,force:true});}
 }
 const pending=W.composeResult(W.buildRequest(s,{id:'alternative'}),alternative(s));assert.throws(()=>W.buildRequest(pending,{id:'mece_evaluate'}),/pending/);
 for(const action of [{id:'mece_evaluate',evaluation_scope:'full'},{id:'mece_evaluate',evaluation_scope:'mece'},{id:'alternative',evaluation_scope:'mece'}])assert.throws(()=>W.buildRequest(s,action));
});
test('note scope schema and runtime agree while keeping old unscoped history untouched',()=>{
 const {s}=fixture();s.thoughts=[{id:'old_eval',kind:'evaluation',text:'MECE appears in this legacy note but is not a classification'},{id:'old_rationale',kind:'alternative',text:'Accepted alternative rationale'}];const before=structuredClone(s);assert.doesNotThrow(()=>W.validate(s));assert.ok(schema(s));assert.deepEqual(s,before);
 for(const scope of ['full','mece']){const next=structuredClone(s);next.thoughts[0].scope=scope;assert.doesNotThrow(()=>W.validate(next));assert.ok(schema(next));}
 for(const [kind,scope] of [['evaluation','invalid'],['evaluation',null],['alternative','mece'],['alternative','full']]){const next=structuredClone(s);Object.assign(next.thoughts[0],{kind,scope});assert.throws(()=>W.validate(next));assert.equal(schema(next),false);}
 const pending=W.composeResult(W.buildRequest(s,{id:'alternative'}),alternative(s));assert.ok(schema(pending));pending.proposals[0].thought.scope='mece';assert.throws(()=>W.validate(pending));assert.equal(schema(pending),false);
});
test('sibling moves swap adjacent subtrees only and preserve selection, identities, notes and flags',()=>{
 const {s,a,b,c}=fixture();W.editNode(s,a,{notes:'Keep subtree notes',highImpact:true,needsInvestigation:true});W.navigate(s,c);const before=structuredClone(s);assert.equal(W.moveSibling(s,a,'right'),true);assert.deepEqual(s.content.tree.children.map(n=>n.id),[b,a]);assert.deepEqual(s.content.tree.children[1],before.content.tree.children[0]);assert.deepEqual(s.cursor,before.cursor);assert.equal(W.moveSibling(s,a,'left'),true);assert.deepEqual(s,before);
 for(const [id,dir] of [[a,'left'],[b,'right'],[c,'left'],[c,'right'],['root','left'],['root','right']]){assert.equal(W.moveSibling(s,id,dir),false);assert.deepEqual(s,before);}
 assert.throws(()=>W.moveSibling(s,a,'up'));assert.deepEqual(s,before);assert.throws(()=>W.moveSibling(s,'missing','left'));assert.deepEqual(s,before);assert.ok(schema(s));
 const pending=W.composeResult(W.buildRequest(s,{id:'alternative'}),alternative(s));W.moveSibling(pending,a,'right');assert.throws(()=>W.resolveProposal(pending,'accept'),/stale/);W.resolveProposal(pending,'reject');assert.deepEqual(pending.content.tree.children.map(n=>n.id),[b,a]);
});
test('overview horizontal geometry keeps upright non-overlapping cards, order and state',()=>{
 const {s,a,b,c}=fixture(),before=structuredClone(s);const vertical=W.overview(s),horizontal=W.overview(s,'horizontal');assert.deepEqual(W.overview(s,'vertical'),vertical);assert.deepEqual(s,before);
 const byId=new Map(horizontal.nodes.map(n=>[n.id,n]));assert.ok(byId.get(a).x>byId.get('root').x);assert.ok(byId.get(c).x>byId.get(a).x);assert.ok(byId.get(a).y<byId.get(b).y);assert.ok(byId.get(b).y-byId.get(a).y>=86);
 for(const n of horizontal.nodes){assert.ok(n.x-104>=0&&n.x+104<=horizontal.board_width);assert.ok(n.y-43>=0&&n.y+43<=horizontal.board_height);}
 for(const edge of horizontal.edges){const p=byId.get(edge.parent_id),n=byId.get(edge.child_id);assert.ok(edge.path.startsWith(`M ${(p.x+104).toFixed(2)} ${p.y.toFixed(2)}`));assert.ok(edge.path.endsWith(`L ${(n.x-104).toFixed(2)} ${n.y.toFixed(2)}`));}
 assert.throws(()=>W.overview(s,'diagonal'));assert.deepEqual(s,before);
});
test('folded overview compacts visible geometry in both orientations without changing analytical state',()=>{
 const {s,a,b,c}=fixture();const d=W.addChild(s,a,'Another child');const before=structuredClone(s);
 for(const orientation of ['vertical','horizontal']){
  const full=W.overview(s,orientation),folded=W.overview(s,orientation,[a]);assert.equal(folded.nodes.length,3);assert.equal(folded.edges.length,2);assert.deepEqual(folded.nodes.map(n=>n.id),['root',a,b]);const row=folded.nodes.find(n=>n.id===a);assert.equal(row.is_collapsed,true);assert.equal(row.hidden_descendants,2);assert.equal(row.has_children,true);assert.equal(folded.nodes.find(n=>n.id===b).has_children,false);
  assert.equal(W.overview(s,orientation,['root']).nodes.length,1);assert.equal(W.overview(s,orientation,['root']).nodes[0].hidden_descendants,4);assert.ok(folded.nodes.every(n=>!folded.edges.some(e=>e.child_id===c||e.child_id===d)));assert.deepEqual(W.overview(s,orientation,[]),full);
 }
 assert.deepEqual(s,before);assert.throws(()=>W.overview(s,'vertical','not-an-array'));
});
