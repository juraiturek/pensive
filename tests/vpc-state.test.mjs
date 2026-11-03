import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import Ajv from 'ajv';
const require=createRequire(import.meta.url), root=new URL('../.agents/skills/pensive/frameworks/vpc/',import.meta.url);
function core(){
  assert.ok(existsSync(new URL('state.js',root)),'VPC state implementation missing');
  return require(fileURLToPath(new URL('state.js',root)));
}
test('VPC blank state and editing preserve independent six-list state and stable identity',() => {
  const v=core(),s=v.initialState();
  assert.equal(new Ajv().compile(JSON.parse(readFileSync(new URL('canvas.schema.json',root))))(s),true);
  assert.deepEqual(Object.keys(s.content.framing),v.framing);
  assert.equal(v.sections.length,6);
  for(const section of v.sections){
    const id=v.addItem(s,section);
    v.editItem(s,section,id,section);
    assert.equal(s.content[section][0].id,id);
    v.deleteItem(s,section,id);
  }
  assert.deepEqual(s,v.initialState());
  assert.equal(s.ripple_baseline,undefined);
});

test('VPC rejects malformed state and invalid edits atomically',() => {
  const v=core();
  for(const mutate of [s=>s.framework='pages',s=>s.schema_version='2',s=>s.extra=1,s=>s.content.framing.product_offering=3,s=>s.content.jobs=[{
    id:'bad id',text:''
  }],s=>s.content.jobs=[{
    id:'x',text:'',other:1
  }],s=>s.content.jobs=null]){
    const s=v.initialState();
    mutate(s);
    assert.throws(()=>v.validate(s));
  }
  const s=v.initialState();
  s.content.jobs=[{
    id:'x',text:''
  }];
  s.content.pains=[{
    id:'x',text:''
  }];
  assert.throws(()=>v.validate(s),/Duplicate/);
  const good=v.initialState(),before=structuredClone(good);
  assert.throws(()=>v.addItem(good,'__proto__'));
  assert.throws(()=>v.editItem(good,'jobs','missing','x'));
  assert.deepEqual(good,before);
});

test('VPC package is reproducible, exclusive and safely embeds data without altering implementation',async() => {
  const v=core();
  assert.ok(existsSync(new URL('../../scripts/package-vpc.mjs',root)),'VPC packager missing');
  const { buildCanvas } =await import(new URL('../../scripts/package-vpc.mjs',root));
  const html=await readFile(new URL('canvas.html',root),'utf8');
  assert.equal(await buildCanvas(),html);
  const s=v.initialState();
  s.content.framing.product_offering='</script><img src=x onerror=alert(1)>&\u2028';
  const packaged=v.packageHtml(html,s);
  assert.deepEqual(v.parseState(packaged.match(/<script id="canvas-state" type="application\/json">([\s\S]*?)<\/script>/)[1]),s);
  const slot=/<!--pensive-state-start-->[\s\S]*?<!--pensive-state-end-->/;
  assert.equal(packaged.replace(slot,''),html.replace(slot,''));
  const temp=await mkdtemp(join(tmpdir(),'vpc-state-'));
  try{
    await writeFile(join(temp,'state.json'),JSON.stringify(s));
    const script=fileURLToPath(new URL('../../scripts/package-vpc.mjs',root));
    execFileSync(process.execPath,[script,join(temp,'state.json'),join(temp,'out.html')]);
    assert.throws(()=>execFileSync(process.execPath,[script,join(temp,'state.json'),join(temp,'out.html')],{
      stdio:'pipe'
    }));
    await writeFile(join(temp,'bad.json'),'{}');
    assert.throws(()=>execFileSync(process.execPath,[script,join(temp,'bad.json'),join(temp,'bad.html')],{
      stdio:'pipe'
    }));
    assert.equal(existsSync(join(temp,'bad.html')),false);
  }
  finally{
    await rm(temp,{
      recursive:true,force:true
    });
  }
});

test('VPC Evaluate requests clone state and reject unsupported envelopes, actions and response fields',() => {
  const v=core(),s=v.initialState();
  const request=v.buildRequest(s,{
    id:'evaluate',comment:'Fit',use_thoughts:false
  });
  assert.deepEqual(request,{
    canvas:s,action:{
      id:'evaluate',comment:'Fit',use_thoughts:false
    }
  });
  request.canvas.content.jobs.push({
    id:'j',text:'Changed clone'
  });
  assert.deepEqual(s.content.jobs,[]);
  for(const bad of [{
    id:'ripple'
  },{
    id:'evaluate',scope:'all'
  },{
    id:'evaluate',comment:1
  },{
    id:'evaluate',use_thoughts:'yes'
  }])assert.throws(()=>v.buildRequest(s,bad));
  assert.throws(()=>v.validateRequest({
    canvas:s,action:{
      id:'evaluate'
    },extra:1
  }));
  for(const response of [{
    thought:''
  },{
    thought:' '
  },{
    thought:'Good',content:s.content
  },{
    thought:4
  }])assert.throws(()=>v.composeResult(v.buildRequest(s,{
    id:'evaluate'
  }),response));
});

test('VPC Evaluate preserves content and annotations with collision-free IDs and inert text',() => {
  const v=core(),s=v.initialState();
  s.content.jobs=[{
    id:'j1',text:'Decide'
  }];
  s.thoughts=[{
    id:'t1',kind:'evaluation',text:'Existing'
  }];
  const output=v.composeResult(v.buildRequest(s,{
    id:'evaluate'
  }),{
    thought:'</script><img src=x onerror=alert(1)>'
  });
  assert.deepEqual(output.content,s.content);
  assert.deepEqual(output.thoughts[0],s.thoughts[0]);
  assert.equal(output.thoughts.length,2);
  assert.notEqual(output.thoughts[1].id,'t1');
  assert.notEqual(output.thoughts[1].id,'j1');
  assert.equal(output.thoughts[1].kind,'evaluation');
  const bad=structuredClone(output);
  bad.thoughts[1].id='j1';
  assert.throws(()=>v.validate(bad));
  assert.deepEqual(s.thoughts,[{
    id:'t1',kind:'evaluation',text:'Existing'
  }]);
  assert.throws(()=>v.validate({
    ...s,proposals:[{
    }]
  }));
});

test('VPC result CLI packages Evaluate and leaves no output for invalid response',async() => {
  const v=core(),temp=await mkdtemp(join(tmpdir(),'vpc-result-'));
  try{
    const r=v.buildRequest(v.initialState(),{
      id:'evaluate'
    });
    await writeFile(join(temp,'request.json'),JSON.stringify(r));
    await writeFile(join(temp,'response.json'),JSON.stringify({
      thought:'A fit hypothesis needs evidence.'
    }));
    const script=fileURLToPath(new URL('../../scripts/package-vpc.mjs',root));
    execFileSync(process.execPath,[script,'--result',join(temp,'request.json'),join(temp,'response.json'),join(temp,'result.html')]);
    const html=await readFile(join(temp,'result.html'),'utf8');
    assert.ok(html.includes('A fit hypothesis needs evidence.'));
    await writeFile(join(temp,'bad.json'),JSON.stringify({
      thought:'',content:r.canvas.content
    }));
    assert.throws(()=>execFileSync(process.execPath,[script,'--result',join(temp,'request.json'),join(temp,'bad.json'),join(temp,'bad.html')],{
      stdio:'pipe'
    }));
    assert.equal(existsSync(join(temp,'bad.html')),false);
  }
  finally{
    await rm(temp,{
      recursive:true,force:true
    });
  }
});

test('VPC schema/runtime agree on malformed metadata and unsupported extensions',() => {
  const v=core(),check=new Ajv().compile(JSON.parse(readFileSync(new URL('canvas.schema.json',root))));
  for(const mutate of [s=>s.ripple_baseline={
  },s=>s.resolutions={
  },s=>s.thoughts=[{
    id:'x',kind:'ripple',text:'No'
  }],s=>s.thoughts=[{
    id:'x',kind:'evaluation',text:' '
  }],s=>s.thoughts=[{
    id:'x',kind:'evaluation',text:'Fine',extra:1
  }],s=>s.content.jobs=[{
    id:'j',text:4
  }],s=>s.proposals=[{
  }]]){
    const s=v.initialState();
    mutate(s);
    assert.equal(check(s),false);
    assert.throws(()=>v.validate(s));
  }
  const s=v.composeResult(v.buildRequest(v.initialState(),{
    id:'evaluate'
  }),{
    thought:'Need evidence'
  });
  assert.equal(check(s),true);
});

test('VPC new item generation avoids existing thought identities',() => {
  const v=core(),s=v.initialState();
  s.thoughts=[{
    id:'item-reserved',kind:'evaluation',text:'Current thought'
  }];
  const original=crypto.randomUUID;
  let call=0;
  crypto.randomUUID=()=>++call===1?'reserved':'fresh';
  try{
    assert.equal(v.addItem(s,'jobs'),'item-fresh');
    assert.doesNotThrow(()=>v.validate(s));
  }
  finally{
    crypto.randomUUID=original;
  }
});
function improved(v,s){
  const content=structuredClone(s.content);
  content.pains.push({
    id:'new-pain',text:'Provider hypothesis: switching is costly'
  });
  return v.composeResult(v.buildRequest(s,{
    id:'improve'
  }),{
    content,thought:'Qualified a possible pain.'
  });
}
test('VPC Improve keeps accepted content untouched until whole acceptance and supports another cycle',() => {
  const v=core(),s=v.initialState();
  s.content.jobs=[{
    id:'j',text:'Decide'
  }];
  s.thoughts=[{
    id:'old',kind:'evaluation',text:'Prior'
  }];
  const p=improved(v,s);
  assert.deepEqual(p.content,s.content);
  assert.deepEqual(p.thoughts,s.thoughts);
  assert.equal(p.proposals.length,1);
  assert.throws(()=>v.buildRequest(p,{
    id:'evaluate'
  }),/pending/i);
  v.acceptProposal(p);
  assert.equal(p.content.pains[0].id,'new-pain');
  assert.equal(p.thoughts.length,2);
  assert.deepEqual(p.proposals,[]);
  const second=v.composeResult(v.buildRequest(p,{
    id:'evaluate'
  }),{
    thought:'Still a hypothesis'
  });
  assert.equal(second.thoughts.length,3);
  assert.deepEqual(second.content,p.content);
});

test('VPC Improve guards framing and exact-text identities; full response is required',() => {
  const v=core(),s=v.initialState();
  s.content.jobs=[{
    id:'j',text:'Decide'
  }];
  const request=v.buildRequest(s,{
    id:'improve'
  });
  for(const change of [c=>c.framing.customer_segment='Other',c=>c.jobs[0].id='renamed',c=>delete c.pains]){
    const content=structuredClone(s.content);
    change(content);
    assert.throws(()=>v.composeResult(request,{
      content,thought:'Revision'
    }));
  }
  assert.throws(()=>v.composeResult(request,{
    content:s.content,thought:'Revision',extra:1
  }));
});

test('VPC stale content or framing acceptance is atomic; rejection preserves local edits',() => {
  const v=core();
  for(const mutate of [s=>s.content.framing.product_offering='Local offering',s=>s.content.jobs.push({
    id:'local',text:'Local job'
  })]){
    const p=improved(v,v.initialState());
    mutate(p);
    const before=structuredClone(p);
    assert.throws(()=>v.acceptProposal(p),/changed|stale/i);
    assert.deepEqual(p,before);
    v.rejectProposal(p);
    assert.deepEqual(p.content,before.content);
    assert.deepEqual(p.proposals,[]);
  }
});

test('VPC imported proposals reject tampering, invalid partial metadata and reserved identity collisions',() => {
  const v=core(),s=v.initialState();
  s.thoughts=[{
    id:'current-thought',kind:'evaluation',text:'Prior'
  }];
  const valid=improved(v,s),check=new Ajv().compile(JSON.parse(readFileSync(new URL('canvas.schema.json',root))));
  assert.equal(check(valid),true);
  for(const mutate of [s=>s.proposals[0].resolutions={unknown:'accepted'},s=>s.proposals[0].base_baseline={
  },s=>s.proposals[0].action='ripple',s=>s.proposals.push(structuredClone(s.proposals[0])),s=>s.proposals[0].thought.kind='evaluation',s=>s.proposals[0].content.framing.product_offering='Other',s=>s.proposals[0].content.pains[0].id='current-thought',s=>s.proposals[0].thought.id=s.proposals[0].id]){
    const bad=structuredClone(valid);
    mutate(bad);
    assert.throws(()=>v.validate(bad));
  }
  const withResolution=structuredClone(valid);
  withResolution.proposals[0].resolutions={unknown:'accepted'};
  assert.equal(check(withResolution),false);
  const original=crypto.randomUUID;
  let n=0;
  crypto.randomUUID=()=>++n===1?'reserved':'fresh';
  try{
    valid.proposals[0].content.pains[0].id='item-reserved';
    assert.equal(v.addItem(valid,'jobs'),'item-fresh');
    assert.doesNotThrow(()=>v.validate(valid));
  }
  finally{
    crypto.randomUUID=original;
  }
});
