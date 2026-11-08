/* Host-executed Research: shared protocol, framework-owned targets and boundaries. */
const PensiveResearch = (() => {
  'use strict';
  const Review = typeof module !== 'undefined' && module.exports ? require('./proposal-review.js') : ProposalReview;
  const Markdown = typeof module !== 'undefined' && module.exports ? require('./markdown.js') : PensiveMarkdown;
  const nonblank = v => typeof v === 'string' && !!v.trim();
  function keys(v, required, optional = []) {
    if (!v || typeof v !== 'object' || Array.isArray(v) || required.some(k => !Object.hasOwn(v,k)) || Object.keys(v).some(k => !required.includes(k) && !optional.includes(k))) throw new Error('Invalid Research fields.');
  }
  function sources(value) {
    if (!Array.isArray(value)) throw new Error('Research sources must be an array.');
    for (const source of value) { keys(source,['title','url']); if (!nonblank(source.title) || !Markdown.safeUrl(source.url)) throw new Error('Research source needs a title and safe HTTP(S) URL.'); }
  }
  function validateThought(thought, ids) {
    keys(thought,['id','kind','text','sources']); sources(thought.sources);
    if (thought.kind !== 'research' || !nonblank(thought.text) || typeof thought.id !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(thought.id) || ids.has(thought.id)) throw new Error('Invalid Research thought or duplicate ID.');
    ids.add(thought.id);
  }
  function create({ sections, validateContent, boundary, equivalent = Review.same, replaceSection, listTargets }) {
    function targets(canvas) {
      if (listTargets) return listTargets(canvas);
      const result = [{type:'canvas',label:'Full canvas'}];
      for (const section of sections) { result.push({type:'section',id:section,label:section}); for (const item of canvas.content[section]) result.push({type:'item',id:item.id,label:item.text || '(Blank statement)',section}); }
      return result;
    }
    function resolve(canvas,target) {
      keys(target,target?.type === 'canvas' ? ['type'] : ['type','id']);
      const found=targets(canvas).find(t=>t.type===target.type && t.id===target.id);
      if (!found) throw new Error('Research target unavailable.'); return found;
    }
    function request(canvas,action) {
      keys(action,['id','target'],['comment','use_thoughts','include_annotations','method']);
      if (action.id !== 'research') throw new Error('Invalid Research action.');
      const selected=resolve(canvas,action.target);
      if (action.method !== undefined && !(canvas.framework==='vars' && selected.type==='item' && selected.section==='a' && action.method==='vri')) throw new Error('VRI Research requires a selected VARS A item.');
      if (action.comment !== undefined && typeof action.comment !== 'string' || ['use_thoughts','include_annotations'].some(k=>action[k]!==undefined && typeof action[k]!=='boolean')) throw new Error('Invalid Research context options.');
      return structuredClone({canvas,action:{...action,use_thoughts:action.use_thoughts??false,include_annotations:action.include_annotations??false}});
    }
    function candidate(before,after,target) {
      validateContent(before);validateContent(after);boundary(before,after);
      const selected=resolve({content:before},target), allowed=structuredClone(before);
      if (selected.type==='canvas') for(const section of sections) replaceSection(allowed,after,section);
      else if(selected.type==='section') replaceSection(allowed,after,selected.id);
      else {
        const old=before[selected.section].find(i=>i.id===selected.id), next=after[selected.section].find(i=>i.id===selected.id);
        if(!next) throw new Error('Item Research must preserve the selected item identity.');
        allowed[selected.section]=allowed[selected.section].map(i=>i.id===old.id?structuredClone(next):i);
      }
      // Optional empty Markdown representation does not authorize other semantic changes.
      if (!equivalent(allowed,after)) throw new Error('Research candidate changed content outside the target.');
    }
    function validateProposal(proposal) {
      keys(proposal,['action','target','base_content','report','sources'],['content','base_thoughts','base_annotations']);
      if (proposal.action!=='research' || !nonblank(proposal.report)) throw new Error('Invalid Research proposal.');
      validateContent(proposal.base_content);resolve({content:proposal.base_content},proposal.target);sources(proposal.sources);
      if (proposal.content!==undefined) candidate(proposal.base_content,proposal.content,proposal.target);
      for(const field of ['base_thoughts','base_annotations']) if(proposal[field]!==undefined && !Array.isArray(proposal[field])) throw new Error('Invalid Research context snapshot.');
    }
    function compose(canvas,action,response) {
      keys(response,['report','sources'],['content']);
      const result=structuredClone(canvas);
      result.proposals=[{action:'research',target:structuredClone(action.target),base_content:structuredClone(canvas.content),...structuredClone(response),...(action.use_thoughts?{base_thoughts:structuredClone(canvas.thoughts??[])}:{}),...(action.include_annotations?{base_annotations:structuredClone(canvas.annotations??[])}:{})}];
      validateProposal(result.proposals[0]);return result;
    }
    function resolveProposal(state,decision,validateState) {
      const proposal=state.proposals[0];validateProposal(proposal);
      if(decision!=='accept' && decision!=='reject') throw new Error('Unknown Research decision.');
      if(decision==='reject'){delete state.proposals;return;}
      if(!Review.same(state.content,proposal.base_content) || proposal.base_thoughts!==undefined && !Review.same(state.thoughts??[],proposal.base_thoughts) || proposal.base_annotations!==undefined && !Review.same(state.annotations??[],proposal.base_annotations)) throw new Error('Research proposal is stale. Reject it and request fresh research.');
      const next=structuredClone(state);if(proposal.content)next.content=structuredClone(proposal.content);
      const used=new Set([...validateContent(next.content),...(next.thoughts??[]).map(t=>t.id),...(next.annotations??[]).map(t=>t.id)]);let id;do{id='thought-'+globalThis.crypto.randomUUID();}while(used.has(id));
      next.thoughts=[...(next.thoughts??[]),{id,kind:'research',text:proposal.report,sources:structuredClone(proposal.sources)}];delete next.proposals;validateState(next);Object.assign(state,next);delete state.proposals;
    }
    return Object.freeze({targets,request,validateProposal,compose,resolveProposal});
  }
  return Object.freeze({create,validateThought,sources});
})();
if(typeof module!=='undefined' && module.exports)module.exports=PensiveResearch;
