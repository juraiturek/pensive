/* Issue Tree: deterministic framework-local state and atomic proposal operations. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.IssueTree=api;})(globalThis,function(){
'use strict';
const clone=v=>JSON.parse(JSON.stringify(v));
const fail=m=>{throw Error(m);};
function keys(v,required,optional=[]){if(!v||typeof v!=='object'||Array.isArray(v))fail('Expected object.');for(const k of required)if(!Object.hasOwn(v,k))fail('Missing '+k);for(const k of Object.keys(v))if(!required.includes(k)&&!optional.includes(k))fail('Unsupported key '+k);}
function text(v){if(typeof v!=='string')fail('Expected text.');}
function identity(v,ids){if(typeof v!=='string'||!/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(v)||ids.has(v))fail('Invalid or duplicate ID.');ids.add(v);}
const node=(id,title='')=>({id,title,notes:'',highImpact:false,highInfluence:false,needsInvestigation:false,children:[]});
function initialState(){return {framework:'issue_tree',schema_version:'1.0',content:{framing:'',tree:node('root')},cursor:['root']};}
function validateTree(tree){const ids=new Set(),objects=new Set(),stack=[tree];while(stack.length){const n=stack.pop();keys(n,['id','title','notes','highImpact','highInfluence','children'],['needsInvestigation']);if(objects.has(n))fail('Cyclic/shared tree node.');objects.add(n);identity(n.id,ids);text(n.title);text(n.notes);if(typeof n.highImpact!=='boolean'||typeof n.highInfluence!=='boolean')fail('Priority flags must be Boolean.');if(n.needsInvestigation!==undefined&&typeof n.needsInvestigation!=='boolean')fail('Investigation flag must be Boolean.');if(!Array.isArray(n.children))fail('Children must be an array.');stack.push(...n.children);}return ids;}
function validateContent(c){keys(c,['framing','tree']);text(c.framing);return validateTree(c.tree);}
function find(s,id){const stack=[{node:s.content.tree,parent:null,path:[s.content.tree.id]}];while(stack.length){const r=stack.pop();if(r.node.id===id)return r;for(const n of r.node.children)stack.push({node:n,parent:r.node,path:[...r.path,n.id]});}fail('Node not found: '+id);}
function thought(t,ids,kind){keys(t,['id','kind','text'],['scope']);identity(t.id,ids);if(!['evaluation','alternative'].includes(t.kind)||(kind&&t.kind!==kind))fail('Invalid thought kind.');if(Object.hasOwn(t,'scope')&&(t.kind!=='evaluation'||!['full','mece'].includes(t.scope)))fail('Invalid evaluation note scope.');text(t.text);if(!t.text.trim())fail('Empty thought.');}
function validateAlternative(tree,base){
validateTree(tree);if(tree.id!==base.tree.id)fail('Alternative must preserve root identity.');
const existing=new Map(),old=[base.tree];while(old.length){const n=old.pop();existing.set(n.id,n);old.push(...n.children);}
const stack=[tree];while(stack.length){const n=stack.pop(),prior=existing.get(n.id);if(n.highImpact!==(prior?.highImpact??false)||n.highInfluence!==(prior?.highInfluence??false)||(n.needsInvestigation??false)!==(prior?.needsInvestigation??false))fail('Alternative cannot infer or change user priority or investigation judgments.');stack.push(...n.children);}
}
function validate(s){keys(s,['framework','schema_version','content','cursor'],['thoughts','proposals']);if(s.framework!=='issue_tree'||s.schema_version!=='1.0')fail('Unsupported framework/version.');const ids=validateContent(s.content);if(!Array.isArray(s.cursor)||!s.cursor.length||s.cursor[0]!==s.content.tree.id)fail('Invalid cursor.');let n=s.content.tree;for(const id of s.cursor.slice(1)){n=n.children.find(c=>c.id===id);if(!n)fail('Invalid cursor path.');}
if(s.thoughts!==undefined){if(!Array.isArray(s.thoughts))fail('Thoughts must be an array.');for(const t of s.thoughts)thought(t,ids);}
if(s.proposals!==undefined){if(!Array.isArray(s.proposals)||s.proposals.length>1)fail('At most one pending proposal.');for(const p of s.proposals){keys(p,['id','action','base_content','tree','thought']);identity(p.id,ids);if(p.action!=='alternative')fail('Invalid proposal action.');validateContent(p.base_content);validateAlternative(p.tree,p.base_content);const proposedIds=validateTree(p.tree);if(proposedIds.has(p.id))fail('Proposal identity collides with proposed tree.');for(const t of s.thoughts||[])if(proposedIds.has(t.id))fail('Thought identity collides with proposed tree.');thought(p.thought,ids,'alternative');if(proposedIds.has(p.thought.id))fail('Thought identity collides with proposed tree.');}}
return s;}
function newId(s,prefix='issue'){const ids=validateContent(s.content);for(const t of s.thoughts||[])ids.add(t.id);for(const p of s.proposals||[]){ids.add(p.id);ids.add(p.thought.id);}let id;do{id=prefix+'_'+globalThis.crypto.randomUUID();}while(ids.has(id));return id;}
function navigate(s,id){validate(s);s.cursor=find(s,id).path;}
function editNode(s,id,patch){validate(s);keys(patch,[],['title','notes','highImpact','highInfluence','needsInvestigation']);const candidate=clone(find(s,id).node);Object.assign(candidate,patch);validateTree(candidate);Object.assign(find(s,id).node,patch);}
function editFraming(s,value){validate(s);text(value);s.content.framing=value;}
function addChild(s,id,title=''){validate(s);text(title);const r=find(s,id),child=node(newId(s),title);r.node.children.push(child);s.cursor=[...r.path,child.id];return child.id;}
function deleteNode(s,id){validate(s);const r=find(s,id);if(!r.parent)fail('Cannot delete the root.');r.parent.children.splice(r.parent.children.indexOf(r.node),1);if(s.cursor.includes(id))s.cursor=r.path.slice(0,-1);}
function validateRequest(r){keys(r,['canvas','action']);validate(r.canvas);if(r.canvas.proposals?.length)fail('Resolve pending proposal first.');keys(r.action,['id'],['comment','evaluation_scope']);if(!['evaluate','mece_evaluate','alternative'].includes(r.action.id))fail('Unsupported action.');if(r.action.comment!==undefined)text(r.action.comment);if(r.action.evaluation_scope!==undefined&&(r.action.id!=='evaluate'||!['full','mece'].includes(r.action.evaluation_scope)))fail('Invalid evaluation scope.');if(!r.canvas.content.tree.title.trim())fail('State the governing problem before AI review.');return r;}
function buildRequest(s,action){return clone(validateRequest({canvas:s,action}));}
function composeResult(request,response){validateRequest(request);const alternative=request.action.id==='alternative';keys(response,['thought',...(alternative?['tree']:[])]);text(response.thought);if(!response.thought.trim())fail('Empty thought.');const s=clone(request.canvas),t={id:newId(s,'thought'),kind:alternative?'alternative':'evaluation',text:response.thought};if(!alternative){t.scope=request.action.id==='mece_evaluate'||request.action.evaluation_scope==='mece'?'mece':'full';s.thoughts=[...(s.thoughts||[]),t];}else {validateAlternative(response.tree,s.content);s.proposals=[{id:newId(s,'proposal'),action:'alternative',base_content:clone(s.content),tree:clone(response.tree),thought:t}];}return validate(s);}
// Canonical comparison ignores JSON object-key order, preserving the existing stale-content guard.
function canonical(v){if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';if(v&&typeof v==='object')return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';return JSON.stringify(v);}
function resolveProposal(s,decision){validate(s);if(!['accept','reject'].includes(decision))fail('Unknown review decision.');const p=s.proposals?.[0];if(!p)fail('No pending proposal.');if(decision==='reject'){delete s.proposals;return;}if(canonical(s.content)!==canonical(p.base_content))fail('Proposal is stale after content or framing edits. Reject and request a fresh alternative.');const candidate=clone(s);candidate.content.tree=clone(p.tree);candidate.cursor=[p.tree.id];candidate.thoughts=[...(candidate.thoughts||[]),clone(p.thought)];delete candidate.proposals;validate(candidate);Object.assign(s,candidate);delete s.proposals;}
function parseState(json){return validate(JSON.parse(json));}
  function overview(s) {
    validate(s);
    const tree = s.content.tree,
      widths = new Map(),
      stack = [[tree, false]];
    while (stack.length) {
      const [n, visited] = stack.pop();
      if (visited)
        widths.set(
          n.id,
          Math.max(
            1,
            n.children.reduce((sum, c) => sum + widths.get(c.id), 0),
          ),
        );
      else {
        stack.push([n, true]);
        for (const c of n.children) stack.push([c, false]);
      }
    }
    const nodes = [],
      edges = [],
      todo = [{ n: tree, parent: null, depth: 0, start: 0 }],
      byId = new Map();
    let maxDepth = 0;
    while (todo.length) {
      const { n, parent, depth, start } = todo.pop(),
        x = 122 + (start + widths.get(n.id) / 2 - 0.5) * 228,
        y = 52 + depth * 148;
      maxDepth = Math.max(maxDepth, depth);
      const row = {
        id: n.id,
        text: n.title.trim().slice(0,72) || 'Untitled',
        full_text: n.title,
        highImpact: n.highImpact, highInfluence: n.highInfluence,
        x,
        y,
        depth,
        is_root: !parent,

        is_active_strand: s.cursor.includes(n.id),
        is_cursor_tip: n.id === s.cursor.at(-1),

        role_label: !parent ? 'Problem' : 'Factor',
      };
      nodes.push(row);
      byId.set(n.id, row);
      if (parent) {
        const p = byId.get(parent),
          y1 = p.y + 43,
          y2 = y - 43,
          mid = (y1 + y2) / 2;
        edges.push({
          parent_id: parent,
          child_id: n.id,
          path: `M ${p.x.toFixed(2)} ${y1.toFixed(2)} L ${p.x.toFixed(2)} ${mid.toFixed(2)} L ${x.toFixed(2)} ${mid.toFixed(2)} L ${x.toFixed(2)} ${y2.toFixed(2)}`,
        });
      }
      let next = start;
      const children = [];
      for (const c of n.children) {
        children.push({ n: c, parent: n.id, depth: depth + 1, start: next });
        next += widths.get(c.id);
      }
      todo.push(...children.reverse());
    }
    return {
      nodes,
      edges,
      board_width: Math.max(960, widths.get(tree.id) * 228 + 244),
      board_height: Math.max(320, (maxDepth + 1) * 148 + 104),
    };
  }
  function packageHtml(html, s) {
    validate(s);
    const start = '<!--pensive-' + 'state-start-->',
      end = '<!--pensive-' + 'state-end-->';
    if (html.split(start).length !== 2 || html.split(end).length !== 2)
      fail('Expected one state slot.');
    const a = html.indexOf(start),
      b = html.indexOf(end);
    if (b < a) fail('Invalid state slot.');
    const json = JSON.stringify(s, null, 2)
      .replace(/</g, '\\u003c')
      .replace(/>/g, '\\u003e')
      .replace(/&/g, '\\u0026')
      .replace(/\u2028/g, '\\u2028')
      .replace(/\u2029/g, '\\u2029');
    return (
      html.slice(0, a + start.length) +
      '\n<script id="canvas-state" type="application/json">' +
      json +
      '<' +
      '/script>\n' +
      html.slice(b)
    );
  }

return {initialState,validate,validateContent,validateTree,find,newId,navigate,editNode,editFraming,addChild,deleteNode,overview,validateRequest,buildRequest,composeResult,resolveProposal,parseState,packageHtml};
});
