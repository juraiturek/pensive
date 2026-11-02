/* UI for this SWOT/TOWS canvas only. No storage or network operations. */
(() => {
  'use strict';
  const labels = {
    strengths: ['Strengths', 'S', 'Internal advantages you can build on.'],
    weaknesses: ['Weaknesses', 'W', 'Internal limitations to address.'],
    opportunities: ['Opportunities', 'O', 'External conditions you could use.'],
    threats: ['Threats', 'T', 'External risks to prepare for.'],
    so: ['SO strategies', 'S × O', 'Use strengths to pursue opportunities.'],
    st: ['ST strategies', 'S × T', 'Use strengths to respond to threats.'],
    wo: ['WO strategies', 'W × O', 'Use opportunities to overcome weaknesses.'],
    wt: ['WT strategies', 'W × T', 'Reduce weaknesses and exposure to threats.']
  };
  const $ = selector => document.querySelector(selector);
  // Capture before rendering. Exports reuse this pristine implementation, never the edited DOM.
  const source = '<!doctype html>\n' + document.documentElement.outerHTML;
  let state;
  let mode = 'swot';
  let requestedAction = null;
  function status(message, error = false) {
    $('#status').textContent = message;
    $('#status').classList.toggle('error', error);
  }
  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function resize(input) {
    input.style.height = 'auto';
    input.style.height = `${Math.max(input.scrollHeight, 30)}px`;
  }
  function countStrategies() {
    const count = Swot.strategies.reduce((total, key) => total + state.content.strategies[key].length, 0);
    const indicator = $('#tows-count');
    indicator.textContent = String(count);
    indicator.classList.toggle('has-content', count > 0);
    indicator.title = count ? `${count} ${count === 1 ? 'strategy' : 'strategies'} in TOWS` : 'No strategies yet';
    indicator.setAttribute('aria-label', indicator.title);
  }
  function edited() {
    $('#clipboard-fallback').hidden = true;
    status('Unsaved edits in this tab. Save to File to keep an editable HTML copy.');
    countStrategies();
  }
  function renderSection(section) {
    const container = $(`[data-section="${section}"]`);
    const [label, symbol, description] = labels[section];
    container.replaceChildren();
    const heading = element('div', 'cell-heading');
    heading.append(element('h2', '', label), element('span', 'cell-symbol', symbol));
    container.append(heading);
    if (Swot.strategies.includes(section)) container.append(element('p', 'cell-description', description));
    const items = Swot.collection(state, section);
    const list = element('ul', 'items');
    items.forEach((item, index) => {
      const row = element('li', 'item');
      const input = element('textarea');
      input.rows = 1;
      input.value = item.text;
      input.dataset.id = item.id;
      input.setAttribute('aria-label', `${label} ${index + 1}`);
      input.placeholder = Swot.factors.includes(section) ? 'Write a factor…' : 'Write a strategy…';
      input.addEventListener('input', () => {
        Swot.editItem(state, section, item.id, input.value);
        resize(input);
        edited();
      });
      const remove = element('button', 'delete', '×');
      remove.type = 'button';
      remove.setAttribute('aria-label', `Delete ${label.toLowerCase()} ${index + 1}`);
      remove.addEventListener('click', () => {
        Swot.deleteItem(state, section, item.id);
        renderSection(section);
        container.querySelector('.add').focus();
        edited();
      });
      row.append(input, remove);
      list.append(row);
    });
    container.append(list);
    if (!items.length && Swot.strategies.includes(section)) container.append(element('p', 'empty', 'What could you do?'));
    const add = element('button', 'add', 'Add');
    add.setAttribute('aria-label', 'Add');
    add.type = 'button';
    function beginItem() {
      const id = Swot.addItem(state, section);
      renderSection(section);
      const input = Array.from(container.querySelectorAll('textarea')).find(node => node.dataset.id === id);
      input.focus();
      edited();
    }
    add.addEventListener('click', beginItem);
    const emptyFactor = Swot.factors.includes(section) && !items.length;
    container.classList.toggle('empty-factor', emptyFactor);
    // Replace on re-render so clicks never accumulate handlers.
    container.onclick = Swot.factors.includes(section) ? event => {
      if (event.target.closest('button, textarea, .item, .cell-heading')) return;
      const current = Swot.collection(state, section);
      const last = current.at(-1);
      if (last && last.text.trim() === '') {
        // Reuse an unfinished draft, including the second click of a double-click.
        container.querySelector('li.item:last-child textarea').focus();
      } else beginItem();
    } : null;
    container.append(add);
    container.querySelectorAll('textarea').forEach(resize);
  }
  function renderContext() {
    for (const section of Swot.factors) {
      const container = $(`[data-context="${section}"]`);
      container.replaceChildren(element('h2', '', labels[section][0]), element('p', 'readonly-label', 'Read-only context'));
      const list = element('ul');
      for (const item of state.content[section]) list.append(element('li', '', item.text || '(Blank factor)'));
      container.append(list);
      if (!state.content[section].length) container.append(element('p', 'empty', 'No factors yet. Add them in SWOT.'));
    }
  }
  function setMode(next) {
    mode = next;
    if (mode === 'tows') renderContext();
    $('#swot-view').hidden = mode !== 'swot';
    $('#tows-view').hidden = mode !== 'tows';
    $('#swot-toggle').setAttribute('aria-pressed', String(mode === 'swot'));
    $('#tows-toggle').setAttribute('aria-pressed', String(mode === 'tows'));
    document.querySelectorAll(`#${mode}-view textarea`).forEach(resize);
  }
  async function copyJson(json, message) {
    try {
      await navigator.clipboard.writeText(json);
      $('#clipboard-fallback').hidden = true;
      status(message);
    } catch {
      $('#clipboard-fallback').hidden = false;
      $('#clipboard-json').value = json;
      $('#clipboard-json').focus();
      $('#clipboard-json').select();
      status('Clipboard access blocked. Copy the selected JSON below.', true);
    }
  }
  function copyState() {
    return copyJson(JSON.stringify(Swot.validate(state), null, 2), 'Copied complete canvas JSON to clipboard.');
  }
  function openAction(id) {
    if (state.proposals?.length) { status('Accept or reject the pending proposal first.', true); return; }
    requestedAction = id;
    $('#ai-form').reset();
    $('#ai-title').textContent = { strategize: 'Strategize', evaluate: 'Evaluate', improve: 'Improve' }[id];
    $('#strategy-options').hidden = id !== 'strategize';
    $('#evaluation-options').hidden = id !== 'evaluate';
    $('#ai-dialog').showModal();
    $('#ai-guidance').focus();
  }
  function refreshCanvas() {
    for (const field of Swot.framing) $(`[data-framing="${field}"]`).value = state.content.framing[field];
    for (const section of [...Swot.factors, ...Swot.strategies]) renderSection(section);
    countStrategies();
    setMode(mode);
    renderAI();
  }
  function renderAI() {
    const thoughts = $('#thoughts');
    thoughts.replaceChildren();
    thoughts.hidden = !state.thoughts?.length;
    for (const thought of state.thoughts || []) {
      const card = element('article', 'thought');
      card.append(element('h3', '', { evaluation: 'Evaluation', improvement: 'What improved and why', strategize: 'Strategy rationale' }[thought.kind]), element('p', '', thought.text));
      thoughts.append(card);
    }
    const proposal = state.proposals?.[0];
    document.querySelectorAll('[data-ai]').forEach(button => { button.disabled = !!proposal; });
    const panel = $('#proposal-panel');
    panel.replaceChildren();
    panel.hidden = !proposal;
    if (!proposal) return;
    panel.append(element('h3', '', proposal.action === 'strategize' ? 'Proposed strategies' : 'Proposed improvements'), element('p', '', proposal.thought.text));
    const review = element('details');
    review.append(element('summary', '', 'Review proposed changes'));
    for (const section of [...Swot.factors, ...Swot.strategies]) {
      const before = Swot.collection(state, section);
      const after = Swot.collection({ content: proposal.content }, section);
      if (JSON.stringify(before) === JSON.stringify(after)) continue;
      const diff = element('div', 'proposal-diff');
      diff.append(element('h4', '', labels[section][0]));
      for (const [label, items] of [['Current', before], ['Proposed', after]]) {
        const column = element('div');
        column.append(element('strong', '', label));
        const list = element('ul');
        for (const item of items) list.append(element('li', '', item.text || '(Blank draft)'));
        if (!items.length) list.append(element('li', '', '(Empty)'));
        column.append(list); diff.append(column);
      }
      review.append(diff);
    }
    panel.append(review);
    const actions = element('div', 'proposal-actions');
    for (const [label, apply] of [['Accept transformation', Swot.acceptProposal], ['Reject transformation', Swot.rejectProposal]]) {
      const button = element('button', label.startsWith('Accept') ? 'primary' : '', label);
      button.type = 'button';
      button.addEventListener('click', () => {
        try {
          apply(state);
          refreshCanvas();
          $('#clipboard-fallback').hidden = true;
          status(label.startsWith('Accept') ? 'Transformation accepted. Export or save to keep this state.' : 'Transformation rejected. Your current content is unchanged.');
        } catch (error) { status(error.message, true); }
      });
      actions.append(button);
    }
    panel.append(actions);
  }
  function saveFile() {
    try {
      const html = Swot.packageHtml(source, state);
      const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
      const link = element('a');
      link.href = url;
      link.download = 'pensive-swot.html';
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      status('HTML download started. Keep the downloaded file to preserve your work.');
    } catch (error) { status(`Could not save: ${error.message}`, true); }
  }
  try {
    state = Swot.parseState($('#canvas-state').textContent);
    for (const field of Swot.framing) {
      const input = $(`[data-framing="${field}"]`);
      input.value = state.content.framing[field];
      input.addEventListener('input', () => { state.content.framing[field] = input.value; resize(input); edited(); });
    }
    for (const section of [...Swot.factors, ...Swot.strategies]) renderSection(section);
    countStrategies();
    setMode('swot');
    renderAI();
    document.querySelectorAll('[data-ai]').forEach(button => button.addEventListener('click', () => openAction(button.dataset.ai)));
    $('#cancel-ai').addEventListener('click', () => $('#ai-dialog').close());
    $('#ai-form').addEventListener('submit', async event => {
      event.preventDefault();
      try {
        const action = { id: requestedAction, comment: $('#ai-guidance').value, use_thoughts: $('#use-thoughts').checked };
        if (requestedAction === 'strategize') action.mode = $('#strategy-mode').value;
        if (requestedAction === 'evaluate') action.scope = $('#evaluation-scope').value;
        const request = Swot.buildRequest(state, action);
        $('#ai-dialog').close();
        await copyJson(JSON.stringify(request, null, 2), 'Copied AI request. Paste it into Codex or ChatGPT with the Pensive skill.');
      } catch (error) { status(error.message, true); }
    });
    $('#swot-toggle').addEventListener('click', () => setMode('swot'));
    $('#tows-toggle').addEventListener('click', () => setMode('tows'));
    $('#copy').addEventListener('click', copyState);
    $('#save').addEventListener('click', saveFile);
    $('#close-copy').addEventListener('click', () => { $('#clipboard-fallback').hidden = true; $('#copy').focus(); });
    $('details').addEventListener('toggle', () => $('#environment').hidden || resize($('#environment')));
    document.querySelectorAll('[data-framing]').forEach(resize);
  } catch (error) {
    document.querySelectorAll('button, textarea').forEach(node => { node.disabled = true; });
    status(`Invalid canvas: ${error.message} The embedded state has not been changed.`, true);
  }
})();
