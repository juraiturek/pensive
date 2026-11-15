/* Standalone Issue Tree UI; full-tree geometry is supplied by the reused org-chart layout. */
(() => {
  'use strict';
  const W = IssueTree, $ = selector => document.querySelector(selector);
  const source = '<!doctype html>\n' + document.documentElement.outerHTML;
  let state, requestedAction;
  const el = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  function status(text, error = false) {
    $('#status').textContent = text;
    $('#status').classList.toggle('error', error);
  }
  function run(fn) { try { fn(); } catch (error) { status(error.message, true); } }
  function button(text, fn, label) {
    const node = el('button', '', text); node.type = 'button';
    if (label) node.setAttribute('aria-label', label);
    node.addEventListener('click', () => run(fn)); return node;
  }
  function selected() { return W.find(state, state.cursor.at(-1)).node; }
  function edited() { status('Unsaved edits in this tab. Save or export to preserve your tree.'); }
  function renderTree() {
    const view = W.overview(state), board = $('#tree-board');
    board.replaceChildren();
    board.style.width = view.board_width + 'px';
    board.style.height = view.board_height + 'px';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('issue-tree-edges');
    svg.setAttribute('width', view.board_width); svg.setAttribute('height', view.board_height);
    svg.setAttribute('aria-hidden', 'true');
    for (const edge of view.edges) {
      const path = document.createElementNS(svg.namespaceURI, 'path');
      path.setAttribute('d', edge.path); svg.append(path);
    }
    board.append(svg);
    for (const row of view.nodes) {
      const node = W.find(state, row.id).node;
      const box = el('div', 'issue-node' + (node.highImpact ? ' high-impact' : '') + (node.highInfluence ? ' high-influence' : '') + (node.id === state.cursor.at(-1) ? ' selected' : ''));
      box.dataset.nodeId = node.id;
      box.style.left = row.x + 'px'; box.style.top = row.y + 'px';
      const choose = button(row.text || 'Untitled', () => {
        state.cursor = W.find(state, node.id).path; renderTree(); renderDetails();
        document.querySelector(`[data-node-id="${node.id}"] .issue-node-select`).focus({preventScroll: true});
      });
      choose.className = 'issue-node-select'; choose.title = node.title || 'Untitled';
      choose.setAttribute('aria-pressed', String(node.id === state.cursor.at(-1)));
      const controls = el('div', 'issue-node-controls');
      controls.append(button('+', () => {
        const id = W.addChild(state, node.id, 'New factor');
        state.cursor = W.find(state, id).path;
        render(); edited(); $('#node-title').focus(); $('#node-title').select();
        document.querySelector(`[data-node-id="${id}"]`).scrollIntoView({block:'nearest', inline:'nearest'});
      }, 'Add child to ' + (node.title || 'Untitled')));
      if (node.id !== state.content.tree.id) controls.append(button('×', () => {
        if (node.children.length && !confirm('Delete this node and all its descendants?')) return;
        W.deleteNode(state, node.id); render(); edited();
      }, 'Delete ' + (node.title || 'Untitled')));
      box.append(choose, controls); board.append(box);
    }
  }
  function renderDetails() {
    const node = selected();
    $('#node-title').value = node.title; $('#node-notes').value = node.notes;
    $('#high-impact').checked = node.highImpact; $('#high-influence').checked = node.highInfluence;
  }
  function proposalTree(root) {
    const list = el('ul');
    const stack = [{node:root, list}];
    while (stack.length) {
      const {node, list:parent} = stack.pop(), item = el('li');
      item.append(el('strong', '', node.title || 'Untitled'));
      if (node.highImpact || node.highInfluence) item.append(el('span', '', ' [' + [node.highImpact ? 'high impact' : '', node.highInfluence ? 'high influence' : ''].filter(Boolean).join(', ') + ']'));
      if (node.notes) item.append(el('p', 'issue-proposal-notes', node.notes));
      parent.append(item);
      if (node.children.length) {
        const children = el('ul'); item.append(children);
        for (const child of [...node.children].reverse()) stack.push({node:child, list:children});
      }
    }
    return list;
  }
  function renderReview() {
    const panel = $('#proposal-panel'), proposal = state.proposals?.[0];
    panel.replaceChildren(); panel.hidden = !proposal;
    if (proposal) {
      panel.append(el('h2', '', 'Proposed alternative decomposition'), el('p', '', proposal.thought.text));
      const preview = el('div', 'issue-proposal-tree'); preview.append(proposalTree(proposal.tree)); panel.append(preview);
      const actions = el('div', 'dialog-actions');
      actions.append(button('Reject alternative', () => { W.resolveProposal(state, 'reject'); render(); edited(); }), button('Accept whole alternative', () => { W.resolveProposal(state, 'accept'); render(); edited(); }));
      panel.append(actions);
    }
    const thoughts = $('#thoughts'); thoughts.replaceChildren(); thoughts.hidden = !state.thoughts?.length;
    if (state.thoughts?.length) thoughts.append(el('h2', '', 'AI observations'));
    for (const thought of state.thoughts || []) thoughts.append(el('article', 'issue-thought', thought.text));
    document.querySelectorAll('[data-ai]').forEach(node => { node.disabled = !!proposal; });
  }
  function render() { $('#framing').value = state.content.framing; renderTree(); renderDetails(); renderReview(); }
  async function copyJson(json) {
    try { await navigator.clipboard.writeText(json); $('#clipboard-fallback').hidden = true; status('Copied complete JSON to clipboard.'); }
    catch { $('#clipboard-fallback').hidden = false; $('#clipboard-json').value = json; $('#clipboard-json').focus(); $('#clipboard-json').select(); status('Clipboard access was blocked. Copy the selected JSON manually.'); }
  }
  try { state = W.parseState($('#canvas-state').textContent); render(); }
  catch (error) {
    status('Invalid initial canvas: ' + error.message, true);
    document.querySelectorAll('button, textarea, input').forEach(node => { node.disabled = true; });
    return;
  }
  $('#framing').addEventListener('input', () => run(() => { W.editFraming(state, $('#framing').value); edited(); }));
  for (const [id, key, bool] of [['node-title','title',false], ['node-notes','notes',false], ['high-impact','highImpact',true], ['high-influence','highInfluence',true]]) {
    $('#' + id).addEventListener(bool ? 'change' : 'input', () => run(() => {
      W.editNode(state, selected().id, {[key]: bool ? $('#' + id).checked : $('#' + id).value}); renderTree(); edited();
    }));
  }
  $('#copy').addEventListener('click', () => run(() => { W.validate(state); void copyJson(JSON.stringify(state, null, 2)); }));
  $('#close-copy').addEventListener('click', () => { $('#clipboard-fallback').hidden = true; $('#copy').focus(); });
  $('#save').addEventListener('click', () => run(() => {
    const url = URL.createObjectURL(new Blob([W.packageHtml(source, state)], {type:'text/html;charset=utf-8'}));
    const link = el('a'); link.href = url; link.download = 'pensive-issue-tree.html';
    document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    status('HTML download started. Keep the downloaded file to preserve your work.');
  }));
  $('#import').addEventListener('click', () => { $('#import-form').reset(); $('#import-error').textContent = ''; $('#import-dialog').showModal(); });
  $('#cancel-import').addEventListener('click', () => $('#import-dialog').close());
  $('#import-form').addEventListener('submit', event => {
    event.preventDefault();
    try {
      const next = W.parseState($('#import-json').value);
      if (!confirm('Replace the current canvas? Save or export first to preserve it.')) return;
      state = next; render(); $('#import-dialog').close(); status('Imported complete Issue Tree canvas.');
    } catch (error) { $('#import-error').textContent = error.message; }
  });
  for (const action of document.querySelectorAll('[data-ai]')) action.addEventListener('click', () => {
    requestedAction = action.dataset.ai; $('#ai-title').textContent = action.textContent;
    $('#ai-form').reset(); $('#ai-error').textContent = ''; $('#ai-dialog').showModal();
  });
  $('#cancel-ai').addEventListener('click', () => $('#ai-dialog').close());
  $('#ai-form').addEventListener('submit', async event => {
    event.preventDefault();
    try {
      const request = W.buildRequest(state, {id:requestedAction, comment:$('#ai-guidance').value});
      $('#ai-dialog').close(); await copyJson(JSON.stringify(request, null, 2));
    } catch (error) { $('#ai-error').textContent = error.message; }
  });
  JsonFiles.install({getState: () => state, validate: W.validate, status});
})();
