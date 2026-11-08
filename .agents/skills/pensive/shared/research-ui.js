/* Shared Research handoff and atomic approval. All searching happens in the host. */
const ResearchUI = (() => {
  'use strict';
  function element(tag, text) { const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node; }
  function button(text,run) { const node=element('button',text);node.type='button';node.addEventListener('click',run);return node; }
  function report(document,text,sources) {
    const node=PensiveMarkdown.render(document,text), list=element('ul');
    for(const source of sources){const li=element('li'),a=element('a',source.title);a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';li.append(a);list.append(li);}
    if(sources.length)node.append(element('h4','Sources'),list);return node;
  }
  function thoughtCard(thought) { const card=element('article');card.className='thought';card.append(element('h3','Research findings'),report(document,thought.text,thought.sources));return card; }
  function install({getState,core,labels,isLocked,copy,refresh,edited,currentTarget,renderRecord}) {
    let trigger=document.getElementById('research');if(!trigger){trigger=element('button','Research');trigger.type='button';trigger.id='research';document.querySelector('.ai-actions').append(trigger);}
    const dialog=element('dialog');dialog.setAttribute('aria-labelledby','research-title');dialog.id='research-dialog';
    const form=element('form'),title=element('h2','Research'),note=element('p','Copy the request to your assistant with the Pensive skill. The host searches; findings return for review.');title.id='research-title';
    const field=(labelText,input)=>{const label=element('label',labelText);label.append(input);return label;};
    const target=element('select');target.setAttribute('aria-label','Research target');target.style.maxWidth='100%';
    const question=element('textarea');question.rows=3;question.setAttribute('aria-label','Research question');
    const thoughts=element('input');thoughts.type='checkbox';const annotations=element('input');annotations.type='checkbox';
    const method=element('select');method.setAttribute('aria-label','Research method');for(const [value,label] of [['','Element guidance'],['vri','VRI assessment']]){const option=element('option',label);option.value=value;method.append(option);}
    const methodLabel=field('Research method',method),error=element('p');error.className='error';error.setAttribute('role','alert');
    const actions=element('div');actions.className='dialog-actions';const submit=element('button','Copy Research request');submit.type='submit';submit.className='primary';actions.append(button('Cancel Research request',()=>dialog.close()),submit);
    form.append(title,note,field('Research target',target),field('Research question',question),methodLabel,field('Include previous AI thoughts',thoughts),field('Include user-authored annotations',annotations),error,actions);dialog.append(form);document.body.append(dialog);
    let choices=[];
    function choice(){return choices.find(c=>`${c.type}:${c.id||''}`===target.value);}
    function updateMethod(){const c=choice();methodLabel.hidden=!(getState().framework==='vars' && c?.type==='item' && c.section==='a');if(methodLabel.hidden)method.value='';}
    target.addEventListener('change',updateMethod);
    trigger.addEventListener('click',()=>{
      if(isLocked() || getState().proposals?.length)return;
      form.reset();error.textContent='';choices=core.researchTargets(getState());target.replaceChildren();
      for(const c of choices){const option=element('option',c.type==='section'?(labels[c.id]?.[0]||c.label):c.type==='item'?`${labels[c.section]?.[0]||c.section}: ${c.label}`:c.label);option.value=`${c.type}:${c.id||''}`;target.append(option);}
      const preferred=currentTarget?.();if(preferred && choices.some(c=>c.type===preferred.type && c.id===preferred.id))target.value=`${preferred.type}:${preferred.id||''}`;
      updateMethod();dialog.showModal();question.focus();
    });
    form.addEventListener('submit',async event=>{
      event.preventDefault();try{const c=choice(),action={id:'research',target:c.type==='canvas'?{type:'canvas'}:{type:c.type,id:c.id},comment:question.value,use_thoughts:thoughts.checked,include_annotations:annotations.checked,...(method.value?{method:method.value}:{})};const request=core.buildRequest(getState(),action);dialog.close();await copy(JSON.stringify(request,null,2),'Copied Research request. Paste it into your assistant with the Pensive skill.');}catch(e){error.textContent=e.message;}
    });
    function renderProposal(panel) {
      trigger.disabled=isLocked() || !!getState().proposals?.length;
      const state=getState(),proposal=state.proposals?.[0];if(proposal?.action!=='research')return false;
      panel.hidden=false;panel.replaceChildren(element('h3','Research findings for review'),report(document,proposal.report,proposal.sources));
      if(proposal.content){
        const diff=element('details');diff.append(element('summary','Review proposed canvas changes'));
        for(const section of core.sections||core.factors){
          const before=core.sectionSnapshot?core.sectionSnapshot(proposal.base_content,section):proposal.base_content[section],after=core.sectionSnapshot?core.sectionSnapshot(proposal.content,section):proposal.content[section];
          if(ProposalReview.same(before,after))continue;
          diff.append(element('h4',labels[section]?.[0]||section));
          for(const [title,content]of[['Current',proposal.base_content],['Proposed',proposal.content]]){
            diff.append(element('strong',title));if(renderRecord){const column=element('div');renderRecord(content,section,column);diff.append(column);continue;}const list=element('ul');for(const item of content[section]){const li=element('li',item.text||'(Blank statement)');if(item.details)li.append(PensiveMarkdown.render(document,item.details));list.append(li);}if(!content[section].length)list.append(element('li','(Empty)'));diff.append(list);if(content.details?.[section])diff.append(PensiveMarkdown.render(document,content.details[section]));
          }
        }
        panel.append(diff);
      }
      const error=element('p');error.className='error';error.setAttribute('role','alert');const actions=element('div');actions.className='proposal-actions';
      for(const [label,decision]of[['Reject Research','reject'],['Accept Research','accept']]){const b=button(label,()=>{try{core.resolveProposal(state,undefined,decision);refresh();edited();}catch(e){error.textContent=e.message;}});b.disabled=isLocked();actions.append(b);}
      panel.append(element('p','Accept applies this report and all proposed changes together.'),error,actions);return true;
    }
    return Object.freeze({renderProposal});
  }
  return Object.freeze({install,thoughtCard});
})();
