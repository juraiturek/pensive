/* Local VARS editing. No network or persistence service. */
(() => {
  'use strict';
  const labels = { v: ['Value Proposition','V'], a: ['Activities, Resources & Capabilities','A'], r: ['Realization of Value','R'], s: ['Scope of Enterprise','S'] };
  const questions = { v: 'What value is created, for whom, and how does the offering increase economic value?', a: 'What activities, resources and capabilities are required? Which are critical, scarce or hard to imitate?', r: 'How does the business capture part of the value it creates? Who pays, for what, and under which assumptions?', s: 'Which customers, offerings and activities are within the enterprise’s scope, and which are excluded or external?' };
  let focused = null, selectedItem = null, editingDetails = null, newStatement = null;
  const $ = selector => document.querySelector(selector);
  const source = '<!doctype html>\n' + document.documentElement.outerHTML;
  let state, requestedAction, annotations, renderTakeaways, researchUI;
  const ordering = CanvasEditing.collectionOrdering({ core: Vars, getState: () => state, renderSection, edited, status });
  function element(tag, className, text) { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; }
  function icon(kind) {
    const namespace = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(namespace, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS(namespace, 'path');
    path.setAttribute('d', kind === 'eye'
      ? 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z'
      : kind === 'overview' ? 'M3 3h7v7H3ZM14 3h7v7h-7ZM3 14h7v7H3ZM14 14h7v7h-7Z'
      : 'm16 3 5 5-12 12-6 1 1-6L16 3Zm-3 3 5 5M4 15l5 5');
    svg.append(path); return svg;
  }
  function status(message, error = false) { $('#status').textContent = message; $('#status').classList.toggle('error', error); }
  function resize(input) { input.style.height = 'auto'; input.style.height = `${Math.max(input.scrollHeight + input.offsetHeight - input.clientHeight, 30)}px`; }
  function edited() { annotations.refresh(); $('#clipboard-fallback').hidden = true; status('Unsaved edits in this tab. Save to File to keep an editable HTML copy.'); }
  function renderSection(section) {
    const container = $(`[data-section="${section}"]`), [label, symbol] = labels[section];
    const heading = element('div', 'vars-heading'); heading.append(element('span', 'cell-symbol', symbol), element('h3', '', label), annotations.badge(section, 'section'));
    const isActive = focused === section;
    const focus = element('button', 'focus-quadrant'); focus.append(element('span', 'focus-label', 'Focus')); focus.type = 'button';
    focus.setAttribute('aria-label', isActive ? 'Return to Overview' : `Focus ${label}`);
    focus.title = isActive ? 'Return to Overview' : `Focus ${label}`;
    focus.prepend(icon(isActive ? 'overview' : 'eye'));
    focus.addEventListener('click', () => setFocus(isActive ? null : section)); heading.append(focus);
    const list = element('ul', 'items');
    Vars.collection(state, section).forEach((item, index) => {
      const row = element('li', 'item'), input = element('textarea'); CanvasEditing.finishOnEnter(input); input.readOnly = annotations.isActive() || Vars.proposalSections(state).some(e => e.section === section && e.status === 'pending'); input.rows = 1; input.value = item.text; input.dataset.id = item.id;
      input.setAttribute('aria-label', `${label} ${index + 1}`); input.placeholder = 'Write one idea…';
      input.addEventListener('input', () => { if (annotations.isActive()) return; Vars.editItem(state, section, item.id, input.value); resize(input); edited(); });
      const remove = element('button', 'delete', '×'); remove.type = 'button'; remove.setAttribute('aria-label', `Delete ${label.toLowerCase()} ${index + 1}`);
      remove.addEventListener('click', () => { Vars.deleteItem(state, section, item.id); renderSection(section); container.querySelector('.add').focus(); if (focused === section) renderFocus(); edited(); });
      const handle = ordering.createHandle(row, list, section, item, index, label);
      if (input.readOnly) handle.disabled = remove.disabled = true;
      row.append(handle, input, annotations.badge(item.id), remove); list.append(row);
    });
    const add = element('button', 'add', 'Add'); add.type = 'button'; add.setAttribute('aria-label', 'Add');
    add.disabled = annotations.isActive() || Vars.proposalSections(state).some(e => e.section === section && e.status === 'pending');
    function beginItem() {
      if (add.disabled) return;
      const id = Vars.addItem(state, section); renderSection(section); edited();
      Array.from(container.querySelectorAll('textarea')).find(n => n.dataset.id === id).focus();
    }
    add.addEventListener('click', beginItem);
    // Replace on re-render so handlers do not accumulate; reuse unfinished drafts.
    container.onclick = event => {
      if (annotations.isActive()) return;
      if (event.target.closest('button, input, textarea, .item, .focus-composer')) return;
      if (focused) { setFocus(section); return; }
      if (event.target.closest('.vars-heading')) return;
      const last = Vars.collection(state, section).at(-1);
      if (last && !last.text.trim()) container.querySelector('li.item:last-child textarea').focus();
      else beginItem();
    };
    const summary = element('ul', 'compact-summary');
    for (const item of Vars.collection(state, section)) {
      if (!item.text.trim()) continue;
      const line = element('li', '', item.text.replace(/\s+/g, ' ').trim()); line.title = item.text; summary.append(line);
    }
    container.classList.toggle('selected', focused === section); container.replaceChildren(heading, summary, list, add);
    if (focused === section) container.append(focusComposer(section)); container.querySelectorAll('textarea').forEach(resize);
  }
  function focusComposer(section) {
    const panel = element('div', 'focus-composer');
    const locked = () => annotations.isActive() || Vars.proposalSections(state).some(entry => entry.section === section && entry.status === 'pending');
    function restoreAdd() {
      newStatement = null; renderSection(section);
      $(`[data-section="${section}"] .focus-add`)?.focus();
    }
    if (newStatement?.section !== section) {
      const add = element('button', 'focus-add', '+ Add'); add.type = 'button'; add.disabled = locked();
      add.addEventListener('click', () => {
        if (locked() || focused !== section) return;
        newStatement = { section, text: '' }; renderSection(section);
        $(`[data-section="${section}"] .new-statement`).focus();
      });
      panel.append(add); return panel;
    }
    const input = element('input', 'new-statement'); input.type = 'text'; input.value = newStatement.text;
    input.setAttribute('aria-label', 'New statement'); input.placeholder = 'Write a statement…';
    input.addEventListener('input', () => { if (newStatement?.section === section) newStatement.text = input.value; });
    function saveStatement() {
      if (focused !== section || locked() || newStatement?.section !== section) return;
      if (!input.value.trim()) { status('Write a statement before saving.', true); input.focus(); return; }
      const id = Vars.addItem(state, section); Vars.editItem(state, section, id, input.value);
      selectedItem = id; editingDetails = null; newStatement = null;
      refresh(); edited(); $(`[data-section="${section}"] .focus-add`).focus();
    }
    const save = element('button', 'save-statement', '✓'); save.type = 'button'; save.setAttribute('aria-label', 'Save new statement'); save.title = 'Save new statement'; save.addEventListener('click', saveStatement);
    const cancel = element('button', 'cancel-statement', '×'); cancel.type = 'button'; cancel.setAttribute('aria-label', 'Cancel new statement'); cancel.title = 'Cancel new statement'; cancel.addEventListener('click', restoreAdd);
    input.addEventListener('keydown', event => {
      if (event.isComposing || event.keyCode === 229) return;
      if (event.key === 'Enter') { event.preventDefault(); saveStatement(); }
      else if (event.key === 'Escape') { event.preventDefault(); restoreAdd(); }
    });
    panel.append(input, save, cancel); return panel;
  }
  function setFocus(section) {
    focused = section; selectedItem = null; editingDetails = null; newStatement = null; refresh();
    if (section) $('#focus-title').focus(); else $(`[data-section] .focus-quadrant`).focus();
  }
  function renderFocus() {
    $('#vars-workspace').classList.toggle('focused', !!focused); $('#focus-pane').hidden = !focused; $('#overview').hidden = !focused; $('#view-label').textContent = focused ? 'Focus' : 'Overview';
    if (!focused) return;
    $('#focus-title').textContent = labels[focused][0]; $('#focus-question').textContent = questions[focused];
    const items = state.content[focused];
    if (!items.some(i => i.id === selectedItem)) selectedItem = items[0]?.id ?? null;
    const select = $('#detail-item'); select.replaceChildren();
    for (const item of items) { const option = element('option','',item.text || '(Blank statement)'); option.value = item.id; select.append(option); } select.value = selectedItem || ''; select.disabled = !items.length;
    $('#quadrant-details').value = state.content.details?.[focused] || '';
    $('#quadrant-preview').replaceChildren(PensiveMarkdown.render(document,$('#quadrant-details').value));
    const selected = items.find(i => i.id === selectedItem); $('#item-details-group').hidden = !selected;
    $('#item-details').value = selected?.details || ''; $('#item-preview').replaceChildren(PensiveMarkdown.render(document,$('#item-details').value));
    const locked = annotations.isActive() || Vars.proposalSections(state).some(e => e.section === focused && e.status === 'pending');
    $('#quadrant-details').readOnly = $('#item-details').readOnly = locked;
    if (locked) editingDetails = null;
    renderDetailsMode();
  }
  function renderDetailsMode() {
    for (const kind of ['quadrant', 'item']) {
      const input = $(`#${kind}-details`), preview = $(`#${kind}-preview`);
      const editing = editingDetails === kind;
      input.hidden = !editing; preview.hidden = editing;
      $(`#edit-${kind}`).hidden = editing;
      $(`#edit-${kind}`).disabled = input.readOnly;
      $(`#done-${kind}`).hidden = !editing;
      if (!input.value.trim()) {
        preview.replaceChildren(element('p', 'detail-empty', 'No supporting analysis yet. Use the pencil to add it.'));
      }
      preview.title = input.readOnly ? 'Supporting analysis is read-only during annotation or pending quadrant review.' : 'Double-click to edit supporting analysis';
    }
  }
  function editDetails(kind) {
    const input = $(`#${kind}-details`);
    if (!focused || input.readOnly || (kind === 'item' && !selectedItem)) return;
    editingDetails = kind; renderDetailsMode(); input.focus(); input.setSelectionRange(0, 0); input.scrollTop = 0;
  }
  function finishDetails(kind) {
    editingDetails = null; renderDetailsMode(); $(`#edit-${kind}`).focus();
  }
  function renderThoughts() {
    const container = $('#thoughts'); container.replaceChildren(); container.hidden = !state.thoughts?.length;
    for (const thought of state.thoughts || []) {
      if (thought.kind === 'research') { container.append(ResearchUI.thoughtCard(thought)); continue; }
      if (thought.kind === 'six_hats') {
        container.append(SixHatsUI.card(state, thought));
        continue;
      }
      const card = element('article', 'thought'); card.append(element('h3', '', thought.kind === 'evaluation' ? 'Evaluation' : 'What improved and why'), element('p', '', thought.text)); container.append(card); }
  }
  function renderProposal() {
    document.querySelectorAll('[data-ai]').forEach(button => { button.disabled = annotations.isActive() || !!state.proposals?.length; });
    if (researchUI?.renderProposal($('#proposal-panel'))) { renderTakeaways(); return; }
    if (renderTakeaways()) { $('#proposal-panel').hidden = true; return; }
    ProposalReviewUI.render({ state, core: Vars, panel: $('#proposal-panel'), labels,
      title: state.proposals?.[0]?.action === 'ripple' ? 'Proposed change and ripple effects' : 'Proposed improvements',
      renderSupporting: (content, section, column) => { const detail = content.details?.[section] || ''; if (detail) column.append(PensiveMarkdown.render(document, detail)); for (const item of content[section]) if (item.details) { column.append(element('h5','',item.text || 'Blank statement'), PensiveMarkdown.render(document,item.details)); } },
      onDecision: (selected, decision) => {
        if (annotations.isActive()) return;
        Vars.resolveProposal(state, selected, decision); refresh(); edited();
        status('Review decision saved in this tab. Export or save to keep it.');
      }
    });
    if (annotations.isActive()) $('#proposal-panel').querySelectorAll('button, input').forEach(control => { control.disabled = true; });
  }
  function refresh() { for (const field of Vars.framing) { const input = $(`[data-framing="${field}"]`); input.readOnly = annotations.isActive(); input.value = state.content.framing[field]; resize(input); } Vars.sections.forEach(renderSection); renderThoughts(); renderProposal(); annotations.refresh(); renderFocus(); }
  async function copyJson(json, message = 'Copied complete canvas JSON to clipboard.') {
    try { await navigator.clipboard.writeText(json); $('#clipboard-fallback').hidden = true; status(message); }
    catch { $('#clipboard-fallback').hidden = false; $('#clipboard-json').value = json; $('#clipboard-json').focus(); $('#clipboard-json').select(); status('Clipboard access blocked. Copy the selected JSON below.', true); }
  }
  function save() {
    try { const url = URL.createObjectURL(new Blob([Vars.packageHtml(source, state)], { type: 'text/html;charset=utf-8' })); const link = element('a'); link.href = url; link.download = 'pensive-vars.html'; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); status('HTML download started. Keep the downloaded file to preserve your work.'); }
    catch (e) { status(`Could not save: ${e.message}`, true); }
  }
  try {
    state = Vars.parseState($('#canvas-state').textContent);
    annotations = AnnotationUI.install({
      getState: () => state, targetType: 'item', sections: Vars.sections,
      lookup: (id, type) => {
        if (type === 'section') return labels[id]?.[0];
        for (const section of Vars.sections) {
          const item = Vars.collection(state, section).find(entry => entry.id === id);
          if (item) return item.text.trim() || `Blank ${labels[section][0]} item`;
        }
      },
      setMode: active => {
        $('#thinking-tools').disabled = $('#import').disabled = active;
        if (active) newStatement = null;
        refresh();
      },
      onEdit: edited
    });
    renderTakeaways = TakeawaysUI.install({
      getState: () => state, core: Vars, isLocked: () => annotations.isActive(),
      refresh: refresh, edited, copy: copyJson,
    });
    researchUI = ResearchUI.install({getState:()=>state,core:Vars,labels,isLocked:()=>annotations.isActive(),copy:copyJson,refresh,edited,currentTarget:()=>focused?(selectedItem?{type:'item',id:selectedItem}:{type:'section',id:focused}):{type:'canvas'}});
    SixHatsUI.install(() => state, Vars, copyJson); refresh();
    $('#overview').addEventListener('click', () => setFocus(null));
    $('#detail-item').addEventListener('change', e => { selectedItem=e.target.value; editingDetails=null; renderFocus(); });
    for (const kind of ['quadrant', 'item']) {
      $(`#edit-${kind}`).append(icon('pencil'));
      $(`#edit-${kind}`).addEventListener('click', () => editDetails(kind));
      $(`#done-${kind}`).addEventListener('click', () => finishDetails(kind));
      $(`#${kind}-preview`).addEventListener('dblclick', event => {
        if (!event.target.closest('a')) editDetails(kind);
      });
      $(`#${kind}-details`).addEventListener('keydown', event => {
        if (event.key === 'Enter' && (event.ctrlKey || event.metaKey) && !event.isComposing && event.keyCode !== 229) {
          event.preventDefault(); finishDetails(kind);
        }
      });
    }
    for (const [id,item] of [['quadrant-details',false],['item-details',true]]) $('#'+id).addEventListener('input', e => { if (e.target.readOnly) return; Vars.editDetails(state,focused,e.target.value,item?selectedItem:undefined); $('#'+(item?'item-preview':'quadrant-preview')).replaceChildren(PensiveMarkdown.render(document,e.target.value)); edited(); });
    document.querySelectorAll('[data-framing]').forEach(input => CanvasEditing.finishOnEnter(input));
    for (const field of Vars.framing) $(`[data-framing="${field}"]`).addEventListener('input', e => { if (annotations.isActive()) return; state.content.framing[field] = e.target.value; resize(e.target); edited(); });
    document.querySelectorAll('[data-ai]').forEach(button => button.addEventListener('click', () => {
      try {
        if (state.proposals?.length) throw new Error('Resolve the pending proposal first.');
        requestedAction = button.dataset.ai; $('#ai-form').reset(); $('#ai-error').textContent = '';
        $('#ai-title').textContent = requestedAction === 'evaluate' ? 'Evaluate Consistency' : requestedAction === 'ripple' ? 'Explore Ripple Effects' : 'Improve VARS'; $('#ripple-options').hidden = requestedAction !== 'ripple'; const targetSelect = $('#ripple-target'); targetSelect.replaceChildren(); for (const choice of Vars.researchTargets(state).filter(c => c.type !== 'canvas')) { const option=element('option','',choice.type === 'section' ? labels[choice.id][0] : `${labels[choice.section][0]}: ${choice.label}`); option.value=`${choice.type}:${choice.id}`; targetSelect.append(option); } targetSelect.value = selectedItem && focused ? `item:${selectedItem}` : `section:${focused || 'v'}`;
        $('#ai-dialog').showModal(); $('#ai-guidance').focus();
      } catch (error) { status(error.message, true); }
    }));
    $('#cancel-ai').addEventListener('click', () => $('#ai-dialog').close());
    $('#ai-form').addEventListener('submit', async e => {
      e.preventDefault();
      try { const request = Vars.buildRequest(state, { id: requestedAction, comment: $('#ai-guidance').value, use_thoughts: $('#use-thoughts').checked, ...(requestedAction === 'ripple' ? { target: {type:$('#ripple-target').value.split(':')[0],id:$('#ripple-target').value.split(':')[1]}, change: $('#ripple-change').value } : {}) }); $('#ai-dialog').close(); await copyJson(JSON.stringify(request, null, 2), 'Copied AI request. Paste it into Codex or ChatGPT with the Pensive skill.'); }
      catch (error) { $('#ai-error').textContent = error.message; }
    });
    $('#copy').addEventListener('click', () => copyJson(JSON.stringify(Vars.validate(state), null, 2))); $('#save').addEventListener('click', save);
    $('#close-copy').addEventListener('click', () => { $('#clipboard-fallback').hidden = true; $('#copy').focus(); });
    $('#import').addEventListener('click', () => { $('#import-form').reset(); $('#import-error').textContent = ''; $('#import-dialog').showModal(); $('#import-json').focus(); });
    $('#cancel-import').addEventListener('click', () => $('#import-dialog').close());
    $('#import-form').addEventListener('submit', e => { e.preventDefault(); try { const next = Vars.parseState($('#import-json').value); if (!confirm('Replace the current canvas, including annotations? Save or export first if you want to keep it.')) return; state = next; editingDetails = null; newStatement = null; annotations.reset(); $('#import-dialog').close(); refresh(); edited(); status('VARS JSON imported. Save to keep this state.'); } catch (err) { $('#import-error').textContent = err.message; } });
    window.addEventListener('resize', () => document.querySelectorAll('[data-framing], .vpc-cell textarea').forEach(resize));
    $('details').addEventListener('toggle', () => { for (const input of document.querySelectorAll('details textarea')) resize(input); });
  } catch (err) { document.querySelectorAll('button, textarea, input').forEach(n => { n.disabled = true; }); status(`Invalid canvas: ${err.message} Embedded state has not been changed.`, true); }
})();
