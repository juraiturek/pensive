/* Local PAGES editing and explicit AI handoff. No network or storage service. */
(() => {
  'use strict';
  const labels = {
    parts: ['Parts', 'P', 'People, objects, systems and other elements you notice.'],
    actions: ['Actions', 'A', 'What is being done, by whom, and how.'],
    goals: ['Goals', 'G', 'Outcomes and intentions shaping this perspective.'],
    events: ['Events', 'E', 'What happened, what triggers it, and what follows.'],
    self_concepts: ['Self-concepts', 'S', 'Identity, roles and beliefs about who you are here.']
  };
  const $ = selector => document.querySelector(selector);
  const source = '<!doctype html>\n' + document.documentElement.outerHTML;
  let state, requestedAction;
  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function status(message, error = false) { $('#status').textContent = message; $('#status').classList.toggle('error', error); }
  function resize(input) { input.style.height = 'auto'; input.style.height = `${Math.max(input.scrollHeight, 30)}px`; }
  function edited() {
    $('#clipboard-fallback').hidden = true;
    status('Unsaved edits in this tab. Save to File to keep an editable HTML copy.');
    renderChanges();
  }
  function renderChanges() {
    const changes = Pages.changes(state);
    $('#baseline-status').textContent = state.ripple_baseline
      ? `${changes.length} ${changes.length === 1 ? 'change' : 'changes'} from the Ripple baseline. New canvases start with their initialized state as baseline.`
      : 'No Ripple baseline. Prior changes cannot be recovered; establish the current state explicitly to start tracking.';
    for (const section of Pages.sections) {
      const container = $(`[data-section="${section}"]`);
      for (const row of container.querySelectorAll('.item')) {
        row.querySelector('.change-mark')?.remove();
        const change = changes.find(c => c.section === section && c.after?.id === row.querySelector('textarea').dataset.id);
        if (change) {
          const mark = element('span', 'change-mark', change.kind === 'added' ? 'Added' : 'Edited');
          mark.title = change.before ? `Previously: ${change.before.text}` : 'Added since baseline';
          row.insertBefore(mark, row.querySelector('.delete'));
        }
      }
      const removed = container.querySelector('.removed-items');
      removed.replaceChildren();
      for (const c of changes.filter(c => c.section === section && c.kind === 'removed')) removed.append(element('p', '', `Removed: ${c.before.text || '(Blank draft)'}`));
      removed.hidden = !removed.childNodes.length;
    }
  }
  function renderSection(section) {
    const container = $(`[data-section="${section}"]`), [label, symbol, description] = labels[section];
    const heading = element('div', 'band-heading');
    heading.append(element('span', 'cell-symbol', symbol), element('h2', '', label), element('p', 'band-description', description));
    const content = element('div', 'band-content'), list = element('ul', 'items');
    Pages.collection(state, section).forEach((item, index) => {
      const row = element('li', 'item'), input = element('textarea');
      input.rows = 1; input.value = item.text; input.dataset.id = item.id;
      input.setAttribute('aria-label', `${label} ${index + 1}`); input.placeholder = 'Write one idea…';
      input.addEventListener('input', () => { Pages.editItem(state, section, item.id, input.value); resize(input); edited(); });
      const remove = element('button', 'delete', '×'); remove.type = 'button'; remove.setAttribute('aria-label', `Delete ${label.toLowerCase()} ${index + 1}`);
      remove.addEventListener('click', () => { Pages.deleteItem(state, section, item.id); renderSection(section); container.querySelector('.add').focus(); edited(); });
      row.append(input, remove); list.append(row);
    });
    const removed = element('div', 'removed-items'); removed.hidden = true;
    const add = element('button', 'add', 'Add'); add.type = 'button'; add.setAttribute('aria-label', 'Add');
    add.addEventListener('click', () => {
      const id = Pages.addItem(state, section); renderSection(section); edited();
      Array.from(container.querySelectorAll('textarea')).find(n => n.dataset.id === id).focus();
    });
    content.append(list, removed, add); container.replaceChildren(heading, content); container.querySelectorAll('textarea').forEach(resize);
  }
  function renderAI() {
    const thoughts = $('#thoughts'); thoughts.replaceChildren(); thoughts.hidden = !state.thoughts?.length;
    for (const th of state.thoughts || []) {
      const card = element('article', 'thought');
      card.append(element('h3', '', { evaluation: 'Evaluation', improvement: 'What improved and why', ripple: 'Ripple implications' }[th.kind]), element('p', '', th.text)); thoughts.append(card);
    }
    const proposal = state.proposals?.[0];
    document.querySelectorAll('[data-ai]').forEach(button => { button.disabled = !!proposal; });
    $('#reset-baseline').disabled = !!proposal;
    ProposalReviewUI.render({ state, core: Pages, panel: $('#proposal-panel'), labels,
      title: proposal?.action === 'ripple' ? 'Proposed Ripple implications' : 'Proposed improvements',
      onDecision: (selected, decision) => {
        Pages.resolveProposal(state, selected, decision); refresh(); edited();
        status('Review decision saved in this tab. Export or save to keep it.');
      }
    });
  }
  function refresh() {
    for (const field of Pages.framing) { const input = $(`[data-framing="${field}"]`); input.value = state.content.framing[field]; resize(input); }
    Pages.sections.forEach(renderSection); renderChanges(); renderAI();
  }
  async function copyJson(json, message) {
    try { await navigator.clipboard.writeText(json); $('#clipboard-fallback').hidden = true; status(message); }
    catch { $('#clipboard-fallback').hidden = false; $('#clipboard-json').value = json; $('#clipboard-json').focus(); $('#clipboard-json').select(); status('Clipboard access blocked. Copy the selected JSON below.', true); }
  }
  function ripplePreview() {
    const selected = Array.from(document.querySelectorAll('#ripple-sources input:checked')).map(n => n.value);
    const preview = $('#ripple-preview'); preview.replaceChildren();
    for (const c of Pages.changes(state).filter(c => selected.includes(c.section))) {
      preview.append(element('p', '', `${labels[c.section][0]} — ${c.kind === 'removed' ? 'Removed' : c.kind === 'added' ? 'Added' : 'Edited'}\nBefore: ${c.before?.text ?? '(Absent)'}\nAfter: ${c.after?.text ?? '(Absent)'}`));
    }
  }
  function openAction(id) {
    try {
      if (state.proposals?.length) throw new Error('Resolve the pending proposal first.');
      if (id === 'ripple') {
        if (!state.ripple_baseline) throw new Error('Establish a Ripple baseline explicitly first; prior changes cannot be recovered.');
        if (!Pages.changes(state).length) throw new Error('No dimensions have changed since the Ripple baseline. Edit a premise first.');
      }
      requestedAction = id; $('#ai-form').reset(); $('#ai-error').textContent = '';
      $('#ai-title').textContent = { evaluate: 'Evaluate PAGES', improve: 'Improve PAGES', ripple: 'Ripple changes' }[id];
      $('#ripple-options').hidden = id !== 'ripple'; $('#ripple-sources').replaceChildren(); $('#ripple-preview').replaceChildren();
      if (id === 'ripple') for (const section of Pages.sections) {
        if (!Pages.changes(state).some(c => c.section === section)) continue;
        const label = element('label', 'checkbox-label'), input = element('input'); input.type = 'checkbox'; input.value = section;
        input.addEventListener('change', ripplePreview); label.append(input, document.createTextNode(labels[section][0])); $('#ripple-sources').append(label);
      }
      $('#ai-dialog').showModal(); $('#ai-guidance').focus();
    } catch (e) { status(e.message, true); }
  }
  function save() {
    try {
      const url = URL.createObjectURL(new Blob([Pages.packageHtml(source, state)], { type: 'text/html;charset=utf-8' }));
      const link = element('a'); link.href = url; link.download = 'pensive-pages.html'; document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000); status('HTML download started. Keep the downloaded file to preserve your work.');
    } catch (e) { status(`Could not save: ${e.message}`, true); }
  }
  try {
    state = Pages.parseState($('#canvas-state').textContent); refresh();
    for (const field of Pages.framing) $(`[data-framing="${field}"]`).addEventListener('input', e => { state.content.framing[field] = e.target.value; resize(e.target); edited(); });
    document.querySelectorAll('[data-ai]').forEach(b => b.addEventListener('click', () => openAction(b.dataset.ai)));
    $('#cancel-ai').addEventListener('click', () => $('#ai-dialog').close());
    $('#ai-form').addEventListener('submit', async e => {
      e.preventDefault();
      try {
        const action = { id: requestedAction, comment: $('#ai-guidance').value, use_thoughts: $('#use-thoughts').checked };
        if (requestedAction === 'ripple') action.sources = Array.from(document.querySelectorAll('#ripple-sources input:checked')).map(n => n.value);
        const request = Pages.buildRequest(state, action); $('#ai-dialog').close();
        await copyJson(JSON.stringify(request, null, 2), 'Copied AI request. Paste it into Codex or ChatGPT with the Pensive skill.');
      } catch (err) { $('#ai-error').textContent = err.message; }
    });
    $('#copy').addEventListener('click', () => copyJson(JSON.stringify(Pages.validate(state), null, 2), 'Copied complete canvas JSON to clipboard.'));
    $('#save').addEventListener('click', save);
    $('#close-copy').addEventListener('click', () => { $('#clipboard-fallback').hidden = true; $('#copy').focus(); });
    $('#reset-baseline').addEventListener('click', () => {
      if (confirm('Set the current core content as the Ripple baseline? This clears change markers. Previous changes will no longer be available to Ripple.')) {
        try { Pages.resetBaseline(state); edited(); status('Ripple baseline set to current content. Save or export to keep it.'); } catch (e) { status(e.message, true); }
      }
    });
    $('#import').addEventListener('click', () => { $('#import-form').reset(); $('#import-error').textContent = ''; $('#import-dialog').showModal(); $('#import-json').focus(); });
    $('#cancel-import').addEventListener('click', () => $('#import-dialog').close());
    $('#import-form').addEventListener('submit', e => {
      e.preventDefault();
      try {
        const next = Pages.parseState($('#import-json').value);
        if (!confirm('Replace the current canvas, including edits, thoughts, baseline and pending proposal? Save or export first if you want to keep it.')) return;
        state = next; $('#import-dialog').close(); refresh(); edited(); status(next.ripple_baseline ? 'PAGES JSON imported. Save to keep this state.' : 'PAGES JSON imported without a baseline. Prior changes cannot be recovered; establish the current state explicitly.');
      } catch (err) { $('#import-error').textContent = err.message; }
    });
    $('details').addEventListener('toggle', () => resize($('#intuition')));
  } catch (err) { document.querySelectorAll('button, textarea, input').forEach(n => { n.disabled = true; }); status(`Invalid canvas: ${err.message} Embedded state has not been changed.`, true); }
})();
