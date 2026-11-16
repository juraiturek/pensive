/* Standalone Issue Tree UI; full-tree geometry is supplied by the reused org-chart layout. */
(() => {
  'use strict';
  const W = IssueTree, $ = selector => document.querySelector(selector);
  const source = '<!doctype html>\n' + document.documentElement.outerHTML;
  let state, requestedAction, hasSelection = true, overviewOrientation = 'vertical', depthPreset = 'all';
  const collapsedIds = new Set();
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
  function updateDepthControls() {
    document.querySelectorAll('[data-depth-preset]').forEach(control => control.setAttribute('aria-pressed', String(control.dataset.depthPreset === depthPreset)));
    document.querySelectorAll('.tree-depth-custom').forEach(label => { label.hidden = depthPreset !== null; });
  }
  function renderVisibleTrees() {
    const visible = new Set(W.overview(state, 'vertical', [...collapsedIds]).nodes.map(node => node.id));
    if (hasSelection && !visible.has(state.cursor.at(-1))) hasSelection = false;
    renderTree(); renderDetails(); updateDepthControls();
    if ($('#overview-dialog').open) { renderTree($('#overview-board'), true); fitOverview(); }
  }
  function setDepthPreset(value) {
    collapsedIds.clear(); depthPreset = value;
    if (value !== 'all') {
      const stack = [{node:state.content.tree, depth:0}];
      while (stack.length) {
        const {node, depth} = stack.pop();
        if (node.children.length && depth >= Number(value)) collapsedIds.add(node.id);
        node.children.forEach(child => stack.push({node:child, depth:depth+1}));
      }
    }
    renderVisibleTrees();
  }
  for (const id of ['editor-depth','overview-depth']) {
    const group = $('#' + id); group.append(el('span', 'tree-depth-label', 'Show'));
    for (const [value,label] of [['1','Level 1'],['2','Level 2'],['3','Level 3'],['all','All']]) {
      const control = button(label, () => setDepthPreset(value));
      control.dataset.depthPreset = value; control.setAttribute('aria-pressed', String(value === 'all')); group.append(control);
    }
    const custom = el('span', 'tree-depth-custom', 'Custom'); custom.hidden = true; group.append(custom);
  }
  function selected() { return W.find(state, state.cursor.at(-1)).node; }
  function edited() { status('Unsaved edits in this tab. Save or export to preserve your tree.'); }
  function editTitle(id) {
    if (!hasSelection || state.cursor.at(-1) !== id) { hasSelection = true; state.cursor = W.find(state, id).path; renderTree(); renderDetails(); }
    const node = W.find(state, id).node;
    const choose = document.querySelector(`[data-node-id="${id}"] .issue-node-select`);
    if (!choose) return;
    const original = node.title, editor = el('textarea', 'issue-node-title-editor');
    editor.value = original; editor.placeholder = 'Enter name';
    editor.setAttribute('aria-label', 'Edit node title');
    editor.rows = 2;
    let finished = false;
    function finish(cancel = false, focus = false) {
      if (finished) return;
      finished = true;
      if (!editor.isConnected) return;
      if (cancel) { W.editNode(state, id, {title:original}); $('#node-title').value = original; }
      choose.textContent = node.title.trim().slice(0,72) || 'Enter name';
      choose.classList.toggle('unnamed', !node.title.trim());
      choose.title = node.title || 'Enter name';
      const controls = editor.parentElement.querySelector('.issue-node-controls');
      controls.querySelector('[data-node-action="add"]').setAttribute('aria-label', 'Add child to ' + (node.title || 'Untitled'));
      controls.querySelector('[data-node-action="delete"]')?.setAttribute('aria-label', 'Delete ' + (node.title || 'Untitled'));
      for (const arrow of controls.querySelectorAll('.issue-node-reorder')) arrow.setAttribute('aria-label', 'Move ' + (node.title || 'Untitled') + ' ' + arrow.dataset.direction);
      const collapse = editor.parentElement.querySelector('.issue-node-collapse');
      if (collapse) {
        const label = collapsedIds.has(id) ? `Expand subtree for ${node.title || 'Untitled'} (${collapse.dataset.hiddenCount} hidden nodes)` : `Collapse subtree for ${node.title || 'Untitled'}`;
        collapse.setAttribute('aria-label', label); collapse.title = label;
      }
      editor.replaceWith(choose);
      if (focus) choose.focus({preventScroll:true});
    }
    editor.addEventListener('input', () => run(() => {
      W.editNode(state, id, {title:editor.value});
      $('#node-title').value = editor.value; edited();
    }));
    editor.addEventListener('blur', () => finish());
    editor.addEventListener('keydown', event => {
      if (event.isComposing) return;
      if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); finish(false, true); }
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); finish(true, true); }
    });
    choose.replaceWith(editor); editor.focus({preventScroll:true}); editor.select();
  }
  function renderTree(board = $('#tree-board'), readOnly = false) {
    const view = W.overview(state, readOnly ? overviewOrientation : 'vertical', [...collapsedIds]);
    board.dataset.orientation = readOnly ? overviewOrientation : 'vertical';
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
      const box = el('div', 'issue-node' + (node.highImpact ? ' high-impact' : '') + (node.highInfluence ? ' high-influence' : '') + (!readOnly && hasSelection && node.id === state.cursor.at(-1) ? ' selected' : ''));
      if (node.needsInvestigation) {
        const marker = el('span', 'issue-investigation-marker', '?');
        marker.title = 'Needs investigation'; marker.setAttribute('role', 'img');
        marker.setAttribute('aria-label', 'Needs investigation'); box.append(marker);
      }
      if (row.has_children) {
        if (row.is_collapsed) box.append(el('span', 'issue-collapse-stem'));
        const collapse = button(row.is_collapsed ? '◉' : '◎', () => {
          if (collapsedIds.has(node.id)) collapsedIds.delete(node.id); else collapsedIds.add(node.id);
          depthPreset = null; renderVisibleTrees();
          board.querySelector(`[data-collapse-id="${node.id}"]`)?.focus({preventScroll:true});
        }, row.is_collapsed ? `Expand subtree for ${node.title || 'Untitled'} (${row.hidden_descendants} hidden nodes)` : `Collapse subtree for ${node.title || 'Untitled'}`);
        collapse.className = 'issue-node-collapse'; collapse.dataset.collapseId = node.id; collapse.dataset.hiddenCount = row.hidden_descendants;
        collapse.setAttribute('aria-expanded', String(!row.is_collapsed)); collapse.title = collapse.getAttribute('aria-label'); box.append(collapse);
      }
      if (readOnly) {
        box.title = node.title || 'Untitled';
        box.append(el('p', 'issue-node-view' + (!node.title.trim() ? ' unnamed' : ''), node.title || 'Enter name'));
        box.style.left = row.x + 'px'; box.style.top = row.y + 'px';
        board.append(box);
        continue;
      }
      box.dataset.nodeId = node.id;
      box.style.left = row.x + 'px'; box.style.top = row.y + 'px';
      const choose = button(node.title.trim().slice(0,72) || 'Enter name', () => {
        if (hasSelection && node.id === state.cursor.at(-1)) { editTitle(node.id); return; }
        hasSelection = true; state.cursor = W.find(state, node.id).path; renderTree(); renderDetails();
        document.querySelector(`[data-node-id="${node.id}"] .issue-node-select`).focus({preventScroll: true});
      });
      choose.className = 'issue-node-select' + (!node.title.trim() ? ' unnamed' : ''); choose.title = node.title || 'Enter name';
      choose.addEventListener('keydown', event => { if (event.key === 'F2') { event.preventDefault(); editTitle(node.id); } });
      choose.setAttribute('aria-pressed', String(hasSelection && node.id === state.cursor.at(-1)));
      const controls = el('div', 'issue-node-controls');
      controls.append(button('+', () => {
        const id = W.addChild(state, node.id);
        if (collapsedIds.delete(node.id) || (depthPreset !== null && depthPreset !== 'all' && W.find(state, node.id).path.length > Number(depthPreset))) depthPreset = null;
        state.cursor = W.find(state, id).path; hasSelection = true;
        render(); edited(); editTitle(id);
        document.querySelector(`[data-node-id="${id}"]`).scrollIntoView({block:'nearest', inline:'nearest'});
      }, 'Add child to ' + (node.title || 'Untitled')));
      if (node.id !== state.content.tree.id) controls.append(button('×', () => {
        if (node.children.length && !confirm('Delete this node and all its descendants?')) return;
        W.deleteNode(state, node.id); hasSelection = true; render(); edited();
      }, 'Delete ' + (node.title || 'Untitled')));
      controls.children[0].dataset.nodeAction = 'add';
      if (node.id !== state.content.tree.id) controls.children[1].dataset.nodeAction = 'delete';
      controls.addEventListener('pointerdown', event => {
        if (event.pointerType !== 'touch') return;
        document.querySelectorAll('.issue-node-controls.reorder-revealed').forEach(row => row.classList.remove('reorder-revealed'));
        controls.classList.add('reorder-revealed');
      });
      const parent = W.find(state, node.id).parent;
      const siblings = parent?.children || [], index = siblings.findIndex(sibling => sibling.id === node.id);
      for (const [direction, glyph] of [['left','‹'], ['right','›']]) {
        const arrow = button(glyph, () => {
          if (!W.moveSibling(state, node.id, direction)) return;
          renderTree(); renderDetails(); edited();
          const moved = document.querySelector(`[data-node-id="${node.id}"]`);
          const same = moved.querySelector(`[data-direction="${direction}"]`);
          const focus = !same.disabled ? same : moved.querySelector('.issue-node-reorder:not(:disabled)') || moved.querySelector('.issue-node-select');
          focus.focus({preventScroll:true});
          moved.scrollIntoView({block:'nearest', inline:'nearest'});
        }, 'Move ' + (node.title || 'Untitled') + ' ' + direction);
        arrow.className = 'issue-node-reorder'; arrow.dataset.direction = direction;
        arrow.disabled = !parent || (direction === 'left' ? index === 0 : index === siblings.length - 1);
        controls.append(arrow);
      }
      box.addEventListener('click', event => {
        if (event.target !== box && event.target !== controls) return;
        const touchRevealed = controls.classList.contains('reorder-revealed');
        hasSelection = true; state.cursor = W.find(state, node.id).path;
        renderTree(); renderDetails();
        const selectedBox = document.querySelector(`[data-node-id="${node.id}"]`);
        if (touchRevealed) selectedBox.querySelector('.issue-node-controls').classList.add('reorder-revealed');
        selectedBox.querySelector('.issue-node-select').focus({preventScroll:true});
      });
      box.append(choose, controls); board.append(box);
    }
  }
  function fitOverview() {
    if (!$('#overview-dialog').open) return;
    const board = $('#overview-board'), viewport = $('#overview-viewport');
    // Fit actual cards, not the editor board's minimum size and asymmetric padding.
    let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
    for (const node of board.querySelectorAll('.issue-node')) {
      left = Math.min(left, node.offsetLeft - node.offsetWidth / 2);
      right = Math.max(right, node.offsetLeft + node.offsetWidth / 2 + Math.max(node.querySelector('.issue-investigation-marker') ? 15 : 0, overviewOrientation === 'horizontal' && node.querySelector('.issue-node-collapse') ? 53 : 0));
      top = Math.min(top, node.offsetTop - node.offsetHeight / 2 - (node.querySelector('.issue-investigation-marker') ? 15 : 0));
      bottom = Math.max(bottom, node.offsetTop + node.offsetHeight / 2 + (overviewOrientation === 'vertical' && node.querySelector('.issue-node-collapse') ? 43 : 0));
    }
    const width = right - left, height = bottom - top;
    const scale = Math.max(0, Math.min(1, (viewport.clientWidth - 32) / width, (viewport.clientHeight - 32) / height));
    board.style.transform = `translate(${(viewport.clientWidth - width * scale) / 2 - left * scale}px, ${(viewport.clientHeight - height * scale) / 2 - top * scale}px) scale(${scale})`;
  }
  function renderDetails() {
    $('#node-details').hidden = !hasSelection;
    $('.issue-workspace').classList.toggle('no-selection', !hasSelection);
    if (!hasSelection) return;
    const node = selected();
    $('#node-title').value = node.title; $('#node-notes').value = node.notes;
    $('#high-impact').checked = node.highImpact; $('#high-influence').checked = node.highInfluence;
    $('#needs-investigation').checked = !!node.needsInvestigation;
  }
  function proposalTree(root) {
    const list = el('ul');
    const stack = [{node:root, list}];
    while (stack.length) {
      const {node, list:parent} = stack.pop(), item = el('li');
      item.append(el('strong', '', node.title || 'Untitled'));
      if (node.highImpact || node.highInfluence || node.needsInvestigation) item.append(el('span', '', ' [' + [node.highImpact ? 'high impact' : '', node.highInfluence ? 'high influence' : '', node.needsInvestigation ? 'needs investigation' : ''].filter(Boolean).join(', ') + ']'));
      if (node.notes) item.append(el('p', 'issue-proposal-notes', node.notes));
      parent.append(item);
      if (node.children.length) {
        const children = el('ul'); item.append(children);
        for (const child of [...node.children].reverse()) stack.push({node:child, list:children});
      }
    }
    return list;
  }
  function thoughtCard(thought, collapsible = false) {
    const card = el(collapsible ? 'details' : 'article', 'thought');
    const title = thought.scope === 'mece' ? 'MECE evaluation' : thought.kind === 'alternative' ? 'Alternative rationale' : 'Evaluation';
    if (collapsible) { card.open = true; card.append(el('summary', '', title)); }
    else card.append(el('h3', '', title));
    card.append(PensiveMarkdown.render(document, thought.text));
    return card;
  }
  function renderThoughtGroup(container, thoughts, title, earlierTitle, collapsibleLatest = false) {
    container.replaceChildren(); container.hidden = !thoughts.length;
    if (!thoughts.length) return;
    container.append(el('h2', '', title), thoughtCard(thoughts.at(-1), collapsibleLatest));
    if (thoughts.length > 1) {
      const earlier = el('details', 'earlier-thoughts');
      earlier.append(el('summary', '', `${earlierTitle} (${thoughts.length - 1})`));
      for (const thought of thoughts.slice(0, -1)) earlier.append(thoughtCard(thought));
      container.append(earlier);
    }
  }
  function renderReview() {
    const panel = $('#proposal-panel'), proposal = state.proposals?.[0];
    panel.replaceChildren(); panel.hidden = !proposal;
    if (proposal) {
      panel.append(el('h2', '', 'Proposed alternative decomposition'), el('p', '', proposal.thought.text));
      const preview = el('div', 'issue-proposal-tree'); preview.append(proposalTree(proposal.tree)); panel.append(preview);
      const actions = el('div', 'dialog-actions');
      actions.append(button('Reject alternative', () => { W.resolveProposal(state, 'reject'); render(); edited(); }), button('Accept whole alternative', () => { W.resolveProposal(state, 'accept'); collapsedIds.clear(); depthPreset = 'all'; render(); edited(); }));
      panel.append(actions);
    }
    const thoughts = state.thoughts || [];
    const isMece = thought => thought.kind === 'evaluation' && thought.scope === 'mece';
    renderThoughtGroup($('#thoughts'), thoughts.filter(thought => !isMece(thought)), 'Evaluation notes', 'Earlier notes', true);
    renderThoughtGroup($('#mece-reviews'), thoughts.filter(isMece), 'Latest MECE review', 'Earlier MECE reviews');
    document.querySelectorAll('[data-ai]').forEach(node => { node.disabled = !!proposal; });
  }
  function render() { $('#framing').value = state.content.framing; renderVisibleTrees(); renderReview(); }
  async function copyJson(json, message = 'Copied complete canvas JSON to clipboard.') {
    return ClipboardCopy.copy(json, {message, status});
  }
  try { state = W.parseState($('#canvas-state').textContent); render(); }
  catch (error) {
    status('Invalid initial canvas: ' + error.message, true);
    document.querySelectorAll('button, textarea, input').forEach(node => { node.disabled = true; });
    return;
  }
  $('.issue-tree-scroll').addEventListener('click', event => {
    if (event.composedPath().some(target => target instanceof Element && target.classList.contains('issue-node'))) return;
    document.activeElement?.blur();
    hasSelection = false; renderTree(); renderDetails();
  });
  $('#full-screen').addEventListener('click', () => {
    renderTree($('#overview-board'), true);
    $('#overview-dialog').showModal();
    fitOverview();
  });
  $('#overview-close').addEventListener('click', () => $('#overview-dialog').close());
  $('#overview-dialog').addEventListener('close', () => $('#full-screen').focus({preventScroll:true}));
  $('#overview-dialog').addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const controls = [...$('#overview-dialog').querySelectorAll('button:not(:disabled)')];
    const index = controls.indexOf(document.activeElement);
    if (event.shiftKey && index <= 0) { event.preventDefault(); controls.at(-1).focus(); }
    else if (!event.shiftKey && (index < 0 || index === controls.length - 1)) { event.preventDefault(); controls[0].focus(); }
  });
  for (const orientation of ['vertical','horizontal']) {
    $('#overview-' + orientation).addEventListener('click', () => {
      overviewOrientation = orientation;
      for (const option of ['vertical','horizontal']) $('#overview-' + option).setAttribute('aria-pressed', String(option === orientation));
      renderTree($('#overview-board'), true); fitOverview();
    });
  }
  new ResizeObserver(fitOverview).observe($('#overview-viewport'));
  $('#framing').addEventListener('input', () => run(() => { W.editFraming(state, $('#framing').value); edited(); }));
  for (const [id, key, bool] of [['node-title','title',false], ['node-notes','notes',false], ['high-impact','highImpact',true], ['high-influence','highInfluence',true], ['needs-investigation','needsInvestigation',true]]) {
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
      state = next; hasSelection = true; collapsedIds.clear(); depthPreset = 'all'; render(); $('#import-dialog').close(); status('Imported complete Issue Tree canvas.');
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
      const action = {id:requestedAction, comment:$('#ai-guidance').value};
      const request = W.buildRequest(state, action);
      $('#ai-dialog').close(); await copyJson(JSON.stringify(request, null, 2));
    } catch (error) { $('#ai-error').textContent = error.message; }
  });
  JsonFiles.install({getState: () => state, validate: W.validate, status});
})();
