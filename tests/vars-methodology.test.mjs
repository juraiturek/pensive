import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
const root=new URL('../.agents/skills/pensive/',import.meta.url);
const read=path=>{assert.ok(existsSync(new URL(path,root)),`Missing methodology: ${path}`);return readFileSync(new URL(path,root),'utf8');};
test('VARS operation guidance resolves its methodological and handoff dependencies',()=>{
 for(const path of ['frameworks/vars/framework.yaml','references/vars-workflow.md','frameworks/vars/prompts/create.md','frameworks/vars/prompts/evaluate.md','frameworks/vars/prompts/improve.md','frameworks/vars/prompts/ripple.md','frameworks/vars/prompts/research.md','frameworks/vars/prompts/takeaways.md','frameworks/vars/methods/v.md','frameworks/vars/methods/a.md','frameworks/vars/methods/r.md','frameworks/vars/methods/s.md','frameworks/vars/methods/vri.md']) {
  const text=read(path); for(const [,href] of text.matchAll(/\]\(([^)#]+)(?:#[^)]*)?\)/g)){if(/^[a-z]+:/i.test(href))continue;assert.ok(existsSync(new URL(href,new URL(path,root))),`${path}: missing ${href}`);}
 }
});
test('VARS methods distinguish coherence, evidence and optional resource advantage',()=>{
 const evaluate=read('frameworks/vars/prompts/evaluate.md'),vri=read('frameworks/vars/methods/vri.md'),ripple=read('frameworks/vars/prompts/ripple.md');
 assert.match(evaluate,/viability/i);assert.match(evaluate,/contradiction/i);assert.match(vri,/substitut/i);assert.match(vri,/durability/i);assert.match(vri,/relevance/i);assert.match(ripple,/current canvas/i);assert.match(ripple,/baseline/i);
});
