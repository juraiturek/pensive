/* Local tree UI. Strand, side doors, connector forms and overview preserve V2 geometry. */
(() => {
  'use strict';
  const W = FiveWhys,
    $ = (selector) => document.querySelector(selector),
    source = '<!doctype html>\n' + document.documentElement.outerHTML;
  let state, requestedAction, annotations, renderTakeaways;
  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function button(text, cls, fn, label) {
    const b = el('button', cls, text);
    b.type = 'button';
    if (label) b.setAttribute('aria-label', label);
    b.addEventListener('click', fn);
    return b;
  }
  function status(text, error = false) {
    $('#status').textContent = text;
    $('#status').classList.toggle('error', error);
  }
  function edited() {
    $('#clipboard-fallback').hidden = true;
    status('Unsaved edits in this tab. Export or save to keep this investigation.');
  }
  function run(fn) {
    try {
      fn();
      edited();
    } catch (e) {
      status(e.message, true);
    }
  }
  function focusNode(id) {
    const nodes = [...document.querySelectorAll('[data-tree-node-id]')],
      card = nodes.find((n) => n.dataset.treeNodeId === id);
    if (card) {
      const first = 'button:not([hidden]):not(:disabled)';
      const control = card.querySelector(first + ':not(.annotation-trigger)') || card.querySelector('.annotation-controls:not([hidden]) ' + first);
      control?.focus();
      card.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }
  function textEditor(card, row) {
    const wrap = el(
        'section',
        'canvas-tree-node-text-editor' + (row.can_edit_text ? ' is-editable' : ''),
      ),
      heading = el('h3', '', row.text || 'No text yet.');
    wrap.append(heading);
    if (annotations.isActive()) return wrap;
    if (!row.can_edit_text) {
      heading.title = 'Problem statement is locked once the investigation has begun.';
      return wrap;
    }
    card.dataset.treeTextEditable = '1';
    if (row.is_root) card.dataset.treeRootEditable = '1';
    const trigger = button(
      '✎',
      'btn-icon canvas-tree-node-edit-trigger',
      begin,
      'Edit ' + row.role_label,
    );
    wrap.append(trigger);
    function begin() {
      if (wrap.querySelector('form')) return;
      heading.hidden = true;
      trigger.hidden = true;
      const form = el('form', 'canvas-tree-inline-text-form'),
        input = el('textarea'),
        actions = el('section', 'canvas-tree-inline-text-actions');
      input.rows = 3;
      input.value = row.text;
      input.setAttribute('aria-label', 'Node text');
      let done = false;
      function cancel() {
        if (done) return;
        done = true;
        form.remove();
        heading.hidden = false;
        trigger.hidden = false;
        trigger.focus();
      }
      function save() {
        if (done) return;
        const text = input.value.trim();
        if (!text || text === row.text.trim()) {
          cancel();
          return;
        }
        try {
          W.editText(state, row.id, text);
          done = true;
          renderTree();
          edited();
          focusNode(row.id);
        } catch (e) {
          status(e.message, true);
        }
      }
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        save();
      });
      CanvasEditing.finishOnEnter(input, save);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          cancel();
        }
      });
      input.addEventListener('blur', (e) => {
        if (form.contains(e.relatedTarget)) return;
        save();
      });
      actions.append(
        button('✓', 'btn-icon', save, 'Save text'),
        button('×', 'btn-icon', cancel, 'Cancel text edit'),
      );
      form.append(input, actions);
      wrap.append(form);
      input.focus();
      input.select();
    }
    heading.addEventListener('click', begin);
    return wrap;
  }
  function renderTree() {
    const board = $('#tree-board');
    board.replaceChildren();
    for (const row of W.strand(state)) {
      const line = el('section', 'canvas-tree-level-row');
      line.dataset.treeLevelRow = row.depth;
      const spine = el(
          'section',
          'canvas-tree-spine-cell' + (!row.is_terminal ? ' has-connector-down' : ''),
        ),
        card = el(
          'article',
          'canvas-tree-stratum' +
            (row.is_cursor_tip ? ' is-cursor-tip' : '') +
            (row.is_terminal ? ' is-terminal' : ''),
        );
      card.dataset.treeNodeId = row.id;
      card.dataset.treeDepth = row.depth;
      const header = el('header', 'canvas-tree-stratum-header'),
        group = el('section', 'canvas-tree-stratum-title-group');
      group.append(el('p', 'canvas-tree-role-label', row.role_label), textEditor(card, row));
      header.append(el('span', 'canvas-tree-depth-badge', row.depth), group);
      header.append(annotations.badge(row.id));
      card.append(header);
      if (row.is_terminal) {
        card.dataset.treeTerminalNode = '1';
        const out = el('section', 'canvas-tree-output');
        out.append(el('h4', '', 'Countermeasure'), el('p', '', row.output));
        card.append(out);
      }
      const tools = el('div', 'canvas-tree-node-tools');
      if (!annotations.isActive() && !state.proposals?.length)
        tools.append(
          button(
            'Expand',
            'btn-utility',
            () =>
              openAI({
                id: 'expand',
                target: { type: 'node', id: row.id },
                mode: row.is_terminal ? 'branch' : 'deepen',
              }),
            'Expand',
          ),
        );
      if (!annotations.isActive() && !row.is_root)
        tools.append(
          button(
            'Delete subtree',
            'btn-utility',
            () =>
              run(() => {
                const count = W.overview({ ...state, cursor: [...state.cursor] }).nodes.filter(
                  (n) => W.find(state, n.id).path.includes(row.id),
                ).length;
                const noteCount = (state.annotations || []).filter(note =>
                  note.target.type === 'node' && nodePath(note.target.id)?.includes(row.id)).length;
                const impact = noteCount ? ` ${noteCount} attached note(s) will be kept under Unavailable targets.` : '';
                if (!confirm(`Delete this cause and ${count - 1} descendant(s)? This cannot be undone.${impact}`))
                  return;
                W.deleteNode(state, row.id);
                renderTree();
                focusNode(state.cursor.at(-1));
              }),
            'Delete subtree',
          ),
        );
      card.append(tools);
      spine.append(card);
      if (!row.is_terminal) {
        const zone = el('section', 'canvas-tree-connector-zone');
        zone.dataset.treeConnectorParent = row.id;
        const first = el('span', 'canvas-tree-connector-half'),
          second = el('span', 'canvas-tree-connector-half');
        first.setAttribute('aria-hidden', 'true');
        second.setAttribute('aria-hidden', 'true');
        const add = button(
          '+',
          'canvas-tree-connector-add',
          () => {
            const existing = zone.querySelector('.canvas-tree-inline-form-connector');
            if (existing) {
              existing.remove();
              add.setAttribute('aria-expanded', 'false');
              return;
            }
            document.querySelectorAll('.canvas-tree-inline-form').forEach((f) => f.remove());
            document
              .querySelectorAll('.canvas-tree-connector-add')
              .forEach((b) => b.setAttribute('aria-expanded', 'false'));
            const form = el('form', 'canvas-tree-inline-form canvas-tree-inline-form-connector'),
              input = el('input'),
              label = el('label', '', 'Why does this occur?');
            input.type = 'text';
            input.required = true;
            input.setAttribute('aria-label', 'Direct cause');
            input.placeholder = 'A direct cause; qualify hypotheses';
            label.append(input);
            const cancel = () => {
              form.remove();
              add.setAttribute('aria-expanded', 'false');
              add.focus();
            };
            form.append(
              label,
              button('Save cause', 'btn-save', () => form.requestSubmit()),
              button('Cancel', 'btn-cancel', cancel),
            );
            form.addEventListener('submit', (e) => {
              e.preventDefault();
              run(() => {
                const id = W.addChild(state, row.id, input.value);
                renderTree();
                focusNode(id);
              });
            });
            form.addEventListener('keydown', (e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                cancel();
              }
            });
            zone.append(form);
            add.setAttribute('aria-expanded', 'true');
            input.focus();
          },
          'Add cause',
        );
        add.dataset.treeConnectorAddToggle = '1';
        add.dataset.connectorParentId = row.id;
        add.setAttribute('aria-expanded', 'false');
        if (!state.content.tree.text.trim() || annotations.isActive()) add.disabled = true;
        add.hidden = annotations.isActive();
        zone.append(first, add, second);
        if (row.show_trifurcation_hint)
          zone.append(
            el(
              'p',
              'canvas-tree-trifurcation-hint',
              'More than three causes may mean the problem is broad. Consider narrowing it; alternatives remain allowed.',
            ),
          );
        if (!annotations.isActive() && row.can_mark_terminal) {
          const terminal = el('section', 'canvas-tree-terminal-action-link');
          terminal.append(
            button('Close branch', 'btn-utility', () => {
              if (terminal.querySelector('form')) return;
              const form = el('form', 'canvas-tree-inline-form canvas-tree-inline-form-terminal'),
                label = el('label', '', 'Countermeasure'),
                input = el('textarea');
              input.required = true;
              input.rows = 3;
              input.setAttribute('aria-label', 'Countermeasure');
              CanvasEditing.finishOnEnter(input, () => form.requestSubmit());
              label.append(input);
              form.append(
                label,
                el(
                  'p',
                  'tree-guide',
                  'A closure decision does not establish this hypothesis as fact.',
                ),
                button('Save countermeasure', 'btn-save', () => form.requestSubmit()),
                button('Cancel', 'btn-cancel', () => form.remove()),
              );
              form.addEventListener('submit', (e) => {
                e.preventDefault();
                run(() => {
                  W.closeBranch(state, row.id, input.value);
                  renderTree();
                  focusNode(row.id);
                });
              });
              terminal.append(form);
              input.focus();
            }),
          );
          zone.append(terminal);
        }
        spine.append(zone);
      } else if (!annotations.isActive())
        spine.append(
          button('Unmark', 'btn-utility', () =>
            run(() => {
              W.reopen(state, row.id);
              renderTree();
              focusNode(row.id);
            }),
          ),
        );
      const lane = el(
        'section',
        'canvas-tree-side-door-lane' + (row.side_doors.length ? ' has-door-connector' : ''),
      );
      if (row.side_doors.length) {
        lane.append(el('p', 'canvas-tree-side-doors-label', 'Side doors'));
        const list = el('section', 'canvas-tree-side-doors-list');
        for (const door of row.side_doors) {
          const b = button('', 'canvas-tree-side-door-node', () =>
            run(() => {
              W.navigate(state, door.target_node_id);
              renderTree();
              focusNode(state.cursor.at(-1));
            }),
          );
          b.dataset.sideDoorNode = door.target_node_id;
          b.title = door.full_text;
          b.append(el('span', '', '↪'), el('span', '', door.label));
          list.append(b);
        }
        lane.append(list);
      }
      line.append(spine, lane);
      board.append(line);
    }
    annotations.refresh();
  }
  function nodePath(id) {
    try { return W.find(state, id).path; }
    catch { return undefined; }
  }
  function renderOverview() {
    const v = W.overview(state),
      board = $('#overview-board');
    board.replaceChildren();
    board.style.width = v.board_width + 'px';
    board.style.minWidth = v.board_width + 'px';
    board.style.height = v.board_height + 100 + 'px';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('canvas-tree-overview-edges');
    svg.setAttribute('width', v.board_width);
    svg.setAttribute('height', v.board_height);
    svg.setAttribute('aria-hidden', 'true');
    for (const edge of v.edges) {
      const path = document.createElementNS(svg.namespaceURI, 'path');
      path.setAttribute('d', edge.path);
      path.dataset.treeOverviewEdge = edge.parent_id + ':' + edge.child_id;
      svg.append(path);
    }
    board.append(svg);
    const depths = new Set();
    for (const n of v.nodes) {
      if (!depths.has(n.depth)) {
        const line = el('section', 'canvas-tree-overview-level-line');
        line.style.top = n.y + 'px';
        board.append(line);
        depths.add(n.depth);
      }
      const form = el('div', 'canvas-tree-overview-node-form');
      form.style.left = n.x + 'px';
      form.style.top = n.y + 'px';
      const card = button(
        '',
        'canvas-tree-overview-node' +
          (n.is_active_strand ? ' is-active' : '') +
          (n.is_cursor_tip ? ' is-tip' : '') +
          (n.is_terminal ? ' is-terminal' : '') +
          (n.is_unresolved_leaf ? ' is-unresolved-leaf' : ''),
        () => {
          if (!n.is_root)
            run(() => {
              W.navigate(state, n.id);
              renderTree();
            });
          $('#overview-dialog').close();
          focusNode(state.cursor.at(-1));
        },
      );
      card.dataset.treeOverviewNodeId = n.id;
      card.title = n.full_text;
      card.append(
        el('p', 'canvas-tree-overview-node-role', n.role_label),
        el('p', 'canvas-tree-overview-node-text', n.text),
      );
      if (n.is_terminal) card.append(el('span', 'canvas-tree-overview-terminal-flag', '✓'));
      form.append(card);
      board.append(form);
      if (n.is_terminal && n.output_text) {
        const group = el('section', 'canvas-tree-overview-output-group');
        group.style.left = n.x + 'px';
        group.style.top = n.y + 55 + 'px';
        const out = el('article', 'canvas-tree-overview-output-card');
        out.tabIndex = 0;
        out.setAttribute('aria-label', 'Countermeasure for ' + n.full_text);
        out.append(el('h4', '', 'Countermeasure'), el('p', '', n.output_text));
        group.append(el('span', 'canvas-tree-overview-output-connector'), out);
        board.append(group);
      }
    }
  }
  function renderThoughts() {
    const panel = $('#thoughts');
    panel.replaceChildren();
    panel.hidden = !state.thoughts?.length;
    for (const t of state.thoughts || []) {
      if (t.kind === 'six_hats') {
        panel.append(SixHatsUI.card(state, t));
        continue;
      }

      const card = el('article', 'thought');
      card.append(
        el('h3', '', t.kind === 'evaluation' ? 'Reflection' : 'Expansion rationale'),
        el('p', '', t.text),
      );
      panel.append(card);
    }
  }
  function renderProposal() {
    const panel = $('#proposal-panel');
    panel.replaceChildren();
    const p = state.proposals?.[0];
    panel.hidden = !p;
    document.querySelector('[data-ai="evaluate"]').disabled = annotations.isActive() || !!p;
    if (renderTakeaways()) { panel.hidden = true; return; }
    if (!p) return;
    panel.append(
      el('h2', '', 'Proposed causes'),
      el('p', '', `Append beneath: ${W.find({ content: p.base_content }, p.parent_id).node.text}`),
      el('p', '', p.thought.text),
    );
    for (const c of p.children) panel.append(el('div', 'proposed-child', c.text));
    const controls = el('div', 'dialog-actions');
    for (const [decision, label] of [
      ['reject', 'Reject proposed causes'],
      ['accept', 'Accept proposed causes'],
    ])
      controls.append(
        button(label, decision === 'accept' ? 'primary' : '', () =>
          run(() => {
            W.resolveProposal(state, decision);
            refresh();
          }),
        ),
      );
    if (annotations.isActive()) controls.querySelectorAll('button').forEach(control => { control.disabled = true; });
    panel.append(controls);
  }
  function updateScope() {
    if (requestedAction.id === 'evaluate') {
      $('#ai-scope').textContent =
        'Review the full tree. Only an assessment is added; causes and framing stay unchanged.';
      return;
    }
    requestedAction.mode = $('input[name="expand-mode"]:checked').value;
    const { node, parent } = W.find(state, requestedAction.target.id);
    $('#ai-scope').textContent =
      `Target: ${node.text}. Context: framing, ancestor chain and full tree. Propose new ${requestedAction.mode === 'deepen' ? 'children of this node' : 'siblings under: ' + (parent?.text || 'unavailable at root')}. Existing nodes and framing stay unchanged.`;
  }
  function openAI(action) {
    try {
      W.buildRequest(state, action);
      requestedAction = action;
      $('#ai-form').reset();
      $('#ai-error').textContent = '';
      $('#ai-title').textContent =
        action.id === 'evaluate' ? 'Reflect on 5 Whys' : 'Expand causal hypotheses';
      $('#mode-label').hidden = action.id !== 'expand';
      if (action.id === 'expand') {
        $('#deepen-option').checked = action.mode === 'deepen';
        $('#branch-option').checked = action.mode === 'branch';
        $('#branch-option').disabled = !W.find(state, action.target.id).parent;
        $('#deepen-option').disabled = W.find(state, action.target.id).node.is_terminal;
      }
      updateScope();
      $('#ai-dialog').showModal();
    } catch (e) {
      status(e.message, true);
    }
  }
  function refresh() {
    for (const field of W.framing) {
      const input = $(`[data-framing="${field}"]`);
      input.readOnly = annotations.isActive();
      input.value = state.content.framing[field];
    }
    renderTree();
    renderThoughts();
    renderProposal();
  }
  async function copyJson(json, message = 'Copied complete canvas JSON to clipboard.') {
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
  function view(framing) {
    $('#framing-view').hidden = !framing;
    $('#investigation-view').hidden = framing;
    $('#framing-tab').setAttribute('aria-pressed', String(framing));
    $('#investigation-tab').setAttribute('aria-pressed', String(!framing));
  }
  try {
    // Native dialogs can briefly focus the document body at the end of a Tab cycle.
    // Keep keyboard focus on visible controls within the current local dialog.
    document.querySelectorAll('dialog').forEach((dialog) => {
      dialog.addEventListener('keydown', (event) => {
        if (event.key !== 'Tab') return;
        const controls = [
          ...dialog.querySelectorAll('button, input, textarea, select, [tabindex="0"]'),
        ].filter((node) => !node.disabled && node.getClientRects().length);
        const first = controls[0],
          last = controls.at(-1);
        if (!first) {
          event.preventDefault();
          return;
        }
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      });
    });
    state = W.parseState($('#canvas-state').textContent);
    annotations = AnnotationUI.install({
      getState: () => state, targetType: 'node',
      lookup: id => {
        try {
          const { node, parent } = W.find(state, id);
          return node.text.trim() || (parent ? 'Blank cause' : 'Problem');
        } catch { return undefined; }
      },
      setMode: active => {
        $('#thinking-tools').disabled = $('#import').disabled = active;
        refresh();
      },
      canEnter: () => {
        if (!$('#tree-board form')) return true;
        status('Save or cancel the open tree edit before entering Annotation Mode.', true);
        return false;
      },
      onEdit: edited
    });
    renderTakeaways = TakeawaysUI.install({
      getState: () => state, core: W, isLocked: () => annotations.isActive(),
      refresh: refresh, edited, copy: copyJson,
    });
    SixHatsUI.install(() => state, W, copyJson);
    refresh();
    document.querySelectorAll('[data-framing]').forEach(input => CanvasEditing.finishOnEnter(input));
    for (const field of W.framing)
      $(`[data-framing="${field}"]`).addEventListener('input', (e) =>
        !annotations.isActive() && run(() => W.editFraming(state, field, e.target.value)),
      );
    document
      .querySelector('[data-ai="evaluate"]')
      .addEventListener('click', () => openAI({ id: 'evaluate' }));
    document.querySelectorAll('input[name="expand-mode"]').forEach(input => input.addEventListener('change', updateScope));
    $('#cancel-ai').addEventListener('click', () => $('#ai-dialog').close());
    $('#ai-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const request = W.buildRequest(state, {
          ...requestedAction,
          comment: $('#ai-guidance').value,
          use_thoughts: $('#use-thoughts').checked,
        });
        $('#ai-dialog').close();
        await copyJson(
          JSON.stringify(request, null, 2),
          'Copied AI request. Paste it into Codex or ChatGPT with the Pensive skill.',
        );
      } catch (err) {
        $('#ai-error').textContent = err.message;
      }
    });
    $('#framing-tab').addEventListener('click', () => view(true));
    $('#investigation-tab').addEventListener('click', () => view(false));
    $('#overview-open').addEventListener('click', () => {
      renderOverview();
      $('#overview-dialog').showModal();
    });
    $('#overview-close').addEventListener('click', () => $('#overview-dialog').close());
    $('#overview-backdrop').addEventListener('click', () => $('#overview-dialog').close());
    $('#copy').addEventListener('click', () =>
      run(() => {
        copyJson(JSON.stringify(W.validate(state), null, 2));
      }),
    );
    $('#close-copy').addEventListener('click', () => {
      $('#clipboard-fallback').hidden = true;
      $('#copy').focus();
    });
    $('#save').addEventListener('click', () => {
      try {
        const url = URL.createObjectURL(
            new Blob([W.packageHtml(source, state)], { type: 'text/html;charset=utf-8' }),
          ),
          link = el('a');
        link.href = url;
        link.download = 'pensive-five-whys.html';
        document.body.append(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        status('HTML download started. Keep the downloaded file to preserve your work.');
      } catch (e) {
        status(e.message, true);
      }
    });
    $('#import').addEventListener('click', () => {
      $('#import-form').reset();
      $('#import-error').textContent = '';
      $('#import-dialog').showModal();
    });
    $('#cancel-import').addEventListener('click', () => $('#import-dialog').close());
    $('#import-form').addEventListener('submit', (e) => {
      e.preventDefault();
      try {
        const next = W.parseState($('#import-json').value);
        if (!confirm('Replace the current canvas, including annotations? Save or export first if you want to keep it.'))
          return;
        state = next;
        annotations.reset();
        $('#import-dialog').close();
        refresh();
        edited();
      } catch (err) {
        $('#import-error').textContent = err.message;
      }
    });
  } catch (e) {
    document.querySelectorAll('button,textarea,input').forEach((n) => (n.disabled = true));
    status('Invalid canvas: ' + e.message + ' Embedded state has not been changed.', true);
  }
})();
