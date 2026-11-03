/* Local VPC editing. No network or persistence service. */
(() => {
  'use strict';
  const labels = { jobs: ['Customer Jobs', 'J'], pains: ['Pains', 'P'], gains: ['Gains', 'G'], products_services: ['Products & Services', 'PS'], pain_relievers: ['Pain Relievers', 'PR'], gain_creators: ['Gain Creators', 'GC'] };
  const $ = selector => document.querySelector(selector);
  const source = '<!doctype html>\n' + document.documentElement.outerHTML;
  let state, requestedAction;
  function element(tag, className, text) { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; }
  function status(message, error = false) { $('#status').textContent = message; $('#status').classList.toggle('error', error); }
  function resize(input) { input.style.height = 'auto'; input.style.height = `${Math.max(input.scrollHeight + input.offsetHeight - input.clientHeight, 30)}px`; }
  function edited() { $('#clipboard-fallback').hidden = true; status('Unsaved edits in this tab. Save to File to keep an editable HTML copy.'); }
  function renderSection(section) {
    const container = $(`[data-section="${section}"]`), [label, symbol] = labels[section];
    const heading = element('div', 'vpc-heading'); heading.append(element('span', 'cell-symbol', symbol), element('h3', '', label));
    const list = element('ul', 'items');
    Vpc.collection(state, section).forEach((item, index) => {
      const row = element('li', 'item'), input = element('textarea'); input.rows = 1; input.value = item.text; input.dataset.id = item.id;
      input.setAttribute('aria-label', `${label} ${index + 1}`); input.placeholder = 'Write one idea…';
      input.addEventListener('input', () => { Vpc.editItem(state, section, item.id, input.value); resize(input); edited(); });
      const remove = element('button', 'delete', '×'); remove.type = 'button'; remove.setAttribute('aria-label', `Delete ${label.toLowerCase()} ${index + 1}`);
      remove.addEventListener('click', () => { Vpc.deleteItem(state, section, item.id); renderSection(section); container.querySelector('.add').focus(); edited(); });
      row.append(input, remove); list.append(row);
    });
    const add = element('button', 'add', 'Add'); add.type = 'button'; add.setAttribute('aria-label', 'Add');
    add.addEventListener('click', () => { const id = Vpc.addItem(state, section); renderSection(section); edited(); Array.from(container.querySelectorAll('textarea')).find(n => n.dataset.id === id).focus(); });
    container.replaceChildren(heading, list, add); container.querySelectorAll('textarea').forEach(resize);
  }
  function renderThoughts() {
    const container = $('#thoughts'); container.replaceChildren(); container.hidden = !state.thoughts?.length;
    for (const thought of state.thoughts || []) { const card = element('article', 'thought'); card.append(element('h3', '', thought.kind === 'evaluation' ? 'Evaluation' : 'What improved and why'), element('p', '', thought.text)); container.append(card); }
  }
  function renderProposal() {
    const panel = $('#proposal-panel'), proposal = state.proposals?.[0]; panel.replaceChildren(); panel.hidden = !proposal;
    document.querySelectorAll('[data-ai]').forEach(button => { button.disabled = !!proposal; });
    if (!proposal) return;
    panel.append(element('h3', '', 'Proposed improvements'), element('p', '', proposal.thought.text));
    const details = element('details'), summary = element('summary', '', 'Review proposed changes'); details.append(summary);
    for (const section of Vpc.sections) {
      if (JSON.stringify(proposal.base_content[section]) === JSON.stringify(proposal.content[section])) continue;
      const diff = element('div', 'proposal-diff'); diff.append(element('h4', '', labels[section][0]));
      for (const [heading, items] of [['Current', proposal.base_content[section]], ['Proposed', proposal.content[section]]]) {
        const column = element('div'), list = element('ul'); column.append(element('strong', '', heading));
        for (const item of items) list.append(element('li', '', item.text || '(Blank draft)'));
        if (!items.length) list.append(element('li', '', '(Empty)')); column.append(list); diff.append(column);
      }
      details.append(diff);
    }
    const controls = element('div', 'proposal-actions');
    for (const [label, action] of [['Accept transformation', Vpc.acceptProposal], ['Reject', Vpc.rejectProposal]]) {
      const button = element('button', label === 'Accept transformation' ? 'primary' : '', label); button.type = 'button';
      button.addEventListener('click', () => {
        try { action(state); refresh(); edited(); status(label === 'Reject' ? 'Proposal rejected. Your current content is preserved.' : 'Transformation accepted. Save or export to keep it.'); }
        catch (error) { status(error.message, true); }
      }); controls.append(button);
    }
    panel.append(details, controls);
  }
  function refresh() { for (const field of Vpc.framing) { const input = $(`[data-framing="${field}"]`); input.value = state.content.framing[field]; resize(input); } Vpc.sections.forEach(renderSection); renderThoughts(); renderProposal(); }
  async function copyJson(json, message = 'Copied complete canvas JSON to clipboard.') {
    try { await navigator.clipboard.writeText(json); $('#clipboard-fallback').hidden = true; status(message); }
    catch { $('#clipboard-fallback').hidden = false; $('#clipboard-json').value = json; $('#clipboard-json').focus(); $('#clipboard-json').select(); status('Clipboard access blocked. Copy the selected JSON below.', true); }
  }
  function save() {
    try { const url = URL.createObjectURL(new Blob([Vpc.packageHtml(source, state)], { type: 'text/html;charset=utf-8' })); const link = element('a'); link.href = url; link.download = 'pensive-vpc.html'; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); status('HTML download started. Keep the downloaded file to preserve your work.'); }
    catch (e) { status(`Could not save: ${e.message}`, true); }
  }
  try {
    state = Vpc.parseState($('#canvas-state').textContent); refresh();
    for (const field of Vpc.framing) $(`[data-framing="${field}"]`).addEventListener('input', e => { state.content.framing[field] = e.target.value; resize(e.target); edited(); });
    document.querySelectorAll('[data-ai]').forEach(button => button.addEventListener('click', () => {
      try {
        if (state.proposals?.length) throw new Error('Resolve the pending proposal first.');
        requestedAction = button.dataset.ai; $('#ai-form').reset(); $('#ai-error').textContent = '';
        $('#ai-title').textContent = requestedAction === 'evaluate' ? 'Evaluate VPC' : 'Improve VPC';
        $('#ai-dialog').showModal(); $('#ai-guidance').focus();
      } catch (error) { status(error.message, true); }
    }));
    $('#cancel-ai').addEventListener('click', () => $('#ai-dialog').close());
    $('#ai-form').addEventListener('submit', async e => {
      e.preventDefault();
      try { const request = Vpc.buildRequest(state, { id: requestedAction, comment: $('#ai-guidance').value, use_thoughts: $('#use-thoughts').checked }); $('#ai-dialog').close(); await copyJson(JSON.stringify(request, null, 2), 'Copied AI request. Paste it into Codex or ChatGPT with the Pensive skill.'); }
      catch (error) { $('#ai-error').textContent = error.message; }
    });
    $('#copy').addEventListener('click', () => copyJson(JSON.stringify(Vpc.validate(state), null, 2))); $('#save').addEventListener('click', save);
    $('#close-copy').addEventListener('click', () => { $('#clipboard-fallback').hidden = true; $('#copy').focus(); });
    $('#import').addEventListener('click', () => { $('#import-form').reset(); $('#import-error').textContent = ''; $('#import-dialog').showModal(); $('#import-json').focus(); });
    $('#cancel-import').addEventListener('click', () => $('#import-dialog').close());
    $('#import-form').addEventListener('submit', e => { e.preventDefault(); try { const next = Vpc.parseState($('#import-json').value); if (!confirm('Replace the current canvas? Save or export first if you want to keep it.')) return; state = next; $('#import-dialog').close(); refresh(); edited(); status('VPC JSON imported. Save to keep this state.'); } catch (err) { $('#import-error').textContent = err.message; } });
    window.addEventListener('resize', () => document.querySelectorAll('[data-framing], .vpc-cell textarea').forEach(resize));
    $('details').addEventListener('toggle', () => { for (const input of document.querySelectorAll('details textarea')) resize(input); });
  } catch (err) { document.querySelectorAll('button, textarea, input').forEach(n => { n.disabled = true; }); status(`Invalid canvas: ${err.message} Embedded state has not been changed.`, true); }
})();
