import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
const root=new URL('../.agents/skills/pensive/',import.meta.url);
const read=path=>{assert.ok(existsSync(new URL(path,root)),`Missing methodology: ${path}`);return readFileSync(new URL(path,root),'utf8');};
test('Research shared and framework guidance resolves local references',()=>{
 for(const path of ['prompts/research.md','references/research-workflow.md','frameworks/vars/prompts/research.md','frameworks/swot/prompts/research.md']) {
  const text=read(path);for(const [,href] of text.matchAll(/\]\(([^)#]+)(?:#[^)]*)?\)/g)){if(/^[a-z]+:/i.test(href))continue;assert.ok(existsSync(new URL(href,new URL(path,root))),`${path}: missing ${href}`);}
 }
});
test('Research guidance distinguishes tool capability, target scope and competitor applicability',()=>{
 const shared=read('prompts/research.md'),swot=read('frameworks/swot/prompts/research.md');
 assert.match(shared,/unavailable/i);assert.match(shared,/primary/i);assert.match(shared,/outside the selected target/i);assert.match(swot,/confirm/i);assert.match(swot,/report-only/i);
});
