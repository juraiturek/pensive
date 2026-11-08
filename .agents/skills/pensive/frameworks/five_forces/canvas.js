/* Framework-local presentation; no inference or search runs in this page. */
(() => {
  'use strict';
  const Core = FiveForces;
  const labels = {
    new_entrants: ['Threat of new entrants'],
    substitutes: ['Threat of substitutes'],
    buyers: ['Bargaining power of buyers'],
    suppliers: ['Bargaining power of suppliers'],
    rivalry: ['Rivalry among existing competitors'],
  };
  const $ = (s) => document.querySelector(s),
    source = '<!doctype html>\n' + document.documentElement.outerHTML;
  const guidance = JSON.parse($('#force-guidance').textContent);
  let state,
    focused = null,
    temporal = false,
    notesEditing = false,
    annotations,
    renderTakeaways,
    researchUI,
    requestedAction;
  const el = (tag, text) => {
    const n = document.createElement(tag);
    if (text !== undefined) n.textContent = text;
    return n;
  };
  const label = (value) =>
    value
      ? value.replaceAll('_', ' ').replace(/^./, (c) => c.toUpperCase())
      : 'Not selected';
  function status(text, error = false) {
    $('#status').textContent = text;
    $('#status').classList.toggle('error', error);
  }
  function resize(n) {
    n.style.height = 'auto';
    n.style.height = Math.max(n.scrollHeight + 2, 35) + 'px';
  }
  function edited() {
    annotations.refresh();
    $('#clipboard-fallback').hidden = true;
    status(
      'Unsaved edits in this tab. Save to File to keep an editable HTML copy.',
    );
  }
  const perspectiveSteering = (comment) =>
    `Working perspective: ${temporal ? 'Structural trajectory' : 'Current structure'}. Focus analysis and any proposed changes on this perspective unless the user explicitly requests broader revision.\n${comment ?? ''}`;
  const activeTarget = () =>
    focused ? { type: 'section', id: focused } : { type: 'canvas' };
  const locked = () =>
    annotations.isActive() ||
    (focused &&
      Core.proposalSections(state).some(
        (e) => e.section === focused && e.status === 'pending',
      ));
  const record = () =>
    temporal
      ? (state.content[focused].trajectory ?? Core.blankTrajectory())
      : state.content[focused];
  function updateRecord(update) {
    if (locked()) return;
    const r = structuredClone(record());
    update(r);
    Core.editForce(state, focused, r, temporal);
    renderOverview();
    edited();
  }
  function button(text, fn) {
    const b = el('button', text);
    b.type = 'button';
    b.addEventListener('click', fn);
    return b;
  }
  const pct = (c) =>
    c === null ? 'Not selected' : `${Math.round(c * 10000) / 100}%`;
  function trajectoryIndicator(force) {
    const n = el('span');
    n.className = 'trajectory-indicator';
    const d = force.trajectory?.direction;
    const arrows = {
      increasing: '↑',
      decreasing: '↓',
      stable: '→',
      uncertain: 'Uncertain',
    };
    if (d) {
      n.textContent = arrows[d];
      n.setAttribute(
        'aria-label',
        d === 'uncertain'
          ? 'Uncertain competitive pressure'
          : `${label(d)} competitive pressure`,
      );
      n.title = `${label(d)} pressure${force.trajectory.horizon ? ' · ' + force.trajectory.horizon : ''}`;
    }
    return n;
  }
  function renderOverview() {
    const host = $('#force-overview');
    host.replaceChildren();
    host.classList.toggle('compact', !!focused);
    for (const k of Core.sections) {
      const r = state.content[k],
        tile = el('section');
      tile.dataset.section = k;
      tile.className = 'force-tile';
      tile.classList.toggle('selected', k === focused);
      const heading = el('h2', labels[k][0]);
      const focus = button(focused === k ? 'Overview' : 'Focus', () =>
        setFocus(focused === k ? null : k),
      );
      focus.setAttribute(
        'aria-label',
        focused === k
          ? `Return to Overview from ${labels[k][0]}`
          : `Focus ${labels[k][0]}`,
      );
      heading.append(trajectoryIndicator(r));
      const shown = temporal ? (r.trajectory ?? Core.blankTrajectory()) : r;
      tile.append(
        heading,
        el(
          'p',
          temporal
            ? shown.direction
              ? `${label(shown.direction)} pressure`
              : 'Not selected'
            : label(r.strength),
        ),
        el(
          'small',
          shown.confidence === null
            ? 'Confidence not selected'
            : `Confidence ${pct(shown.confidence)}`,
        ),
      );
      if (temporal) {
        if (shown.horizon) tile.append(el('small', shown.horizon));
        tile.append(el('small', `Current strength: ${label(r.strength)}`));
      }
      tile.append(focus, annotations.badge(k, 'section'));
      host.append(tile);
    }
  }
  function setFocus(k) {
    focused = k;
    notesEditing = false;
    refresh();
    if (k) $('#focus-title').focus();
    else $('#force-overview button').focus();
  }
  function setPerspective(value) {
    temporal = value;
    notesEditing = false;
    refresh();
  }
  function renderAnalysis() {
    const list = $('#analysis-points');
    list.replaceChildren();
    const items = record().analysis;
    items.forEach((item, index) => {
      const row = el('li'),
        input = el('textarea');
      input.rows = 2;
      input.value = item.text;
      input.setAttribute('aria-label', `Analysis point ${index + 1}`);
      input.readOnly = !!locked();
      input.addEventListener('input', () => {
        updateRecord((r) => {
          r.analysis.find((i) => i.id === item.id).text = input.value;
        });
        resize(input);
      });
      CanvasEditing.finishOnEnter(input);
      const remove = button('×', () => {
        updateRecord((r) => {
          r.analysis = r.analysis.filter((i) => i.id !== item.id);
        });
        renderAnalysis();
      });
      remove.setAttribute('aria-label', `Delete analysis point ${index + 1}`);
      remove.disabled = !!locked();
      row.append(input, remove);
      list.append(row);
      resize(input);
    });
    $('#add-point').disabled = !!locked();
  }
  function renderNotes() {
    const notes = $('#research-notes');
    notes.value = record().research_notes;
    notes.hidden = !notesEditing;
    notes.readOnly = !!locked();
    $('#notes-preview').hidden = notesEditing;
    $('#notes-preview').replaceChildren(
      PensiveMarkdown.render(
        document,
        notes.value || 'Supporting evidence and sources can be recorded here.',
      ),
    );
    $('#edit-notes').hidden = notesEditing;
    $('#edit-notes').disabled = !!locked();
    $('#done-notes').hidden = !notesEditing;
  }
  function renderFocus() {
    const pane = $('#focus-pane');
    pane.hidden = !focused;
    $('#forces-workspace').classList.toggle('focused', !!focused);
    $('#overview').hidden = !focused;
    $('#current-toggle').setAttribute('aria-pressed', String(!temporal));
    $('#trajectory-toggle').setAttribute('aria-pressed', String(temporal));
    if (!focused) return;
    const r = record();
    $('#focus-title').textContent = labels[focused][0];
    $('#perspective-label').textContent = temporal
      ? 'Structural trajectory'
      : 'Current structure';
    $('#diagnostic-body').replaceChildren(
      PensiveMarkdown.render(document, guidance[focused]),
    );
    $('#strength-field').hidden = temporal;
    $('#direction-field').hidden = !temporal;
    $('#horizon-field').hidden = !temporal;
    $('#force-strength').value = state.content[focused].strength ?? '';
    $('#pressure-direction').value = r.direction ?? '';
    $('#confidence').value =
      r.confidence === null
        ? ''
        : String(Math.round(r.confidence * 10000) / 100);
    $('#horizon').value = r.horizon ?? '';
    for (const n of pane.querySelectorAll('select,input'))
      n.disabled = !!locked();
    renderAnalysis();
    renderNotes();
  }
  function renderRecord(content, k, host) {
    const r = content[k];
    for (const [title, force] of [
      ['Current structure', r],
      ['Structural trajectory', r.trajectory],
    ]) {
      if (!force) continue;
      const group = el('div');
      group.className = 'record-preview';
      group.append(
        el('h5', title),
        el(
          'p',
          `${label(force.strength ?? force.direction)} · Confidence ${pct(force.confidence)}`,
        ),
      );
      if (force.horizon) group.append(el('p', `Horizon: ${force.horizon}`));
      const list = el('ul');
      for (const i of force.analysis) {
        const li = el('li');
        li.append(PensiveMarkdown.render(document, i.text));
        list.append(li);
      }
      group.append(list);
      if (force.research_notes) {
        group.append(
          el('h5', 'Supporting research notes'),
          PensiveMarkdown.render(document, force.research_notes),
        );
      }
      host.append(group);
    }
  }
  function renderThoughts() {
    const host = $('#thoughts');
    host.replaceChildren();
    host.hidden = !state.thoughts?.length;
    for (const t of state.thoughts ?? []) {
      if (t.kind === 'six_hats') {
        host.append(SixHatsUI.card(state, t));
        continue;
      }
      if (t.kind === 'research') {
        host.append(ResearchUI.thoughtCard(t));
        continue;
      }
      const card = el('article');
      card.className = 'thought';
      card.append(
        el('h3', label(t.kind)),
        PensiveMarkdown.render(document, t.text),
      );
      host.append(card);
    }
  }
  function renderProposal() {
    for (const n of document.querySelectorAll('[data-ai],#thinking-tools'))
      n.disabled = annotations.isActive() || !!state.proposals?.length;
    if (researchUI.renderProposal($('#proposal-panel'))) {
      renderTakeaways();
      return;
    }
    if (renderTakeaways()) {
      $('#proposal-panel').hidden = true;
      return;
    }
    ProposalReviewUI.render({
      state,
      core: Core,
      panel: $('#proposal-panel'),
      labels,
      title: 'Proposed force assessments',
      renderRecord,
      onDecision: (selected, decision) => {
        Core.resolveProposal(state, selected, decision);
        refresh();
        edited();
      },
    });
    if (annotations.isActive())
      $('#proposal-panel')
        .querySelectorAll('button,input')
        .forEach((n) => (n.disabled = true));
  }
  function refresh() {
    for (const k of Core.framing) {
      const input = $(`[data-framing="${k}"]`);
      input.value = state.content.framing[k];
      input.readOnly = annotations.isActive();
      resize(input);
    }
    renderOverview();
    renderFocus();
    renderThoughts();
    renderProposal();
    annotations.refresh();
  }
  async function copyJson(
    json,
    message = 'Copied complete canvas JSON to clipboard.',
  ) {
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
  function save() {
    try {
      const url = URL.createObjectURL(
          new Blob([Core.packageHtml(source, state)], {
            type: 'text/html;charset=utf-8',
          }),
        ),
        link = el('a');
      link.href = url;
      link.download = 'pensive-five-forces.html';
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      status(
        'HTML download started. Keep the downloaded file to preserve your work.',
      );
    } catch (e) {
      status(e.message, true);
    }
  }
  try {
    state = Core.parseState($('#canvas-state').textContent);
    annotations = AnnotationUI.install({
      getState: () => state,
      targetType: [],
      sections: Core.sections,
      lookup: (id, type) => (type === 'section' ? labels[id]?.[0] : undefined),
      setMode: (active) => {
        $('#import').disabled = active;
        notesEditing = false;
        refresh();
      },
      onEdit: edited,
    });
    renderTakeaways = TakeawaysUI.install({
      getState: () => state,
      core: Core,
      isLocked: () => annotations.isActive(),
      refresh,
      edited,
      copy: copyJson,
    });
    researchUI = ResearchUI.install({
      getState: () => state,
      core: {
        ...Core,
        buildRequest: (canvas, action) =>
          Core.buildRequest(canvas, {
            ...action,
            comment: perspectiveSteering(action.comment),
          }),
      },
      labels,
      isLocked: () => annotations.isActive(),
      copy: copyJson,
      refresh,
      edited,
      currentTarget: activeTarget,
      renderRecord,
    });
    SixHatsUI.install(() => state, Core, copyJson);
    function options(select, values) {
      select.replaceChildren(
        ...['', ...values].map((value) => {
          const n = el('option', label(value));
          n.value = value;
          return n;
        }),
      );
    }
    options($('#force-strength'), Core.strengths);
    options($('#pressure-direction'), Core.directions);
    $('#overview').addEventListener('click', () => setFocus(null));
    $('#current-toggle').addEventListener('click', () => setPerspective(false));
    $('#trajectory-toggle').addEventListener('click', () =>
      setPerspective(true),
    );
    $('#force-strength').addEventListener('change', (e) =>
      updateRecord((r) => (r.strength = e.target.value || null)),
    );
    $('#pressure-direction').addEventListener('change', (e) =>
      updateRecord((r) => (r.direction = e.target.value || null)),
    );
    $('#confidence').addEventListener('input', (e) => {
      if (!e.target.validity.valid) {
        status('Confidence must be between 0 and 100%.', true);
        return;
      }
      updateRecord(
        (r) =>
          (r.confidence =
            e.target.value === '' ? null : Number(e.target.value) / 100),
      );
    });
    $('#horizon').addEventListener('input', (e) =>
      updateRecord((r) => (r.horizon = e.target.value)),
    );
    $('#add-point').addEventListener('click', () => {
      updateRecord((r) =>
        r.analysis.push({ id: 'analysis-' + crypto.randomUUID(), text: '' }),
      );
      renderAnalysis();
      $('#analysis-points li:last-child textarea')?.focus();
    });
    function startNotes() {
      if (locked()) return;
      notesEditing = true;
      renderNotes();
      $('#research-notes').focus();
    }
    function doneNotes() {
      notesEditing = false;
      renderNotes();
      $('#edit-notes').focus();
    }
    $('#edit-notes').addEventListener('click', startNotes);
    $('#done-notes').addEventListener('click', doneNotes);
    $('#notes-preview').addEventListener('dblclick', (e) => {
      if (!e.target.closest('a')) startNotes();
    });
    $('#research-notes').addEventListener('input', (e) =>
      updateRecord((r) => (r.research_notes = e.target.value)),
    );
    $('#research-notes').addEventListener('keydown', (e) => {
      if (
        e.key === 'Enter' &&
        (e.ctrlKey || e.metaKey) &&
        !e.isComposing &&
        e.keyCode !== 229
      ) {
        e.preventDefault();
        doneNotes();
      }
    });
    for (const k of Core.framing) {
      const input = $(`[data-framing="${k}"]`);
      CanvasEditing.finishOnEnter(input);
      input.addEventListener('input', () => {
        if (annotations.isActive()) return;
        state.content.framing[k] = input.value;
        $('#framing-reassessment').hidden = false;
        resize(input);
        edited();
      });
    }
    for (const b of document.querySelectorAll('[data-ai]'))
      b.addEventListener('click', () => {
        if (state.proposals?.length || annotations.isActive()) return;
        requestedAction = b.dataset.ai;
        $('#ai-form').reset();
        $('#ai-error').textContent = '';
        $('#ai-title').textContent =
          requestedAction === 'evaluate'
            ? 'Evaluate Five Forces consistency'
            : 'Improve Five Forces';
        $('#action-target').textContent = focused
          ? `Target: ${labels[focused][0]}`
          : 'Target: full canvas';
        $('#ai-dialog').showModal();
        $('#ai-guidance').focus();
      });
    $('#cancel-ai').addEventListener('click', () => $('#ai-dialog').close());
    $('#ai-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const req = Core.buildRequest(state, {
          id: requestedAction,
          target: activeTarget(),
          comment: perspectiveSteering($('#ai-guidance').value),
          use_thoughts: $('#use-thoughts').checked,
        });
        $('#ai-dialog').close();
        await copyJson(
          JSON.stringify(req, null, 2),
          'Copied AI request. Paste it into your assistant with the Pensive skill.',
        );
      } catch (err) {
        $('#ai-error').textContent = err.message;
      }
    });
    $('#copy').addEventListener('click', () =>
      copyJson(JSON.stringify(Core.validate(state), null, 2)),
    );
    $('#save').addEventListener('click', save);
    $('#close-copy').addEventListener('click', () => {
      $('#clipboard-fallback').hidden = true;
      $('#copy').focus();
    });
    $('#import').addEventListener('click', () => {
      $('#import-form').reset();
      $('#import-error').textContent = '';
      $('#import-dialog').showModal();
      $('#import-json').focus();
    });
    $('#cancel-import').addEventListener('click', () =>
      $('#import-dialog').close(),
    );
    $('#import-form').addEventListener('submit', (e) => {
      e.preventDefault();
      try {
        const next = Core.parseState($('#import-json').value);
        if (
          !confirm(
            'Replace the current canvas, including annotations? Save or export first to keep it.',
          )
        )
          return;
        state = next;
        focused = null;
        temporal = false;
        notesEditing = false;
        annotations.reset();
        $('#framing-reassessment').hidden = true;
        $('#import-dialog').close();
        refresh();
        edited();
      } catch (err) {
        $('#import-error').textContent = err.message;
      }
    });
    const resizeVisible = () => {
      for (const input of document.querySelectorAll(
        '[data-framing], #analysis-points textarea',
      )) {
        if (input.getClientRects().length) resize(input);
      }
    };
    window.addEventListener('resize', resizeVisible);
    for (const details of document.querySelectorAll('.framing details'))
      details.addEventListener('toggle', resizeVisible);
    refresh();
  } catch (err) {
    document
      .querySelectorAll('button,textarea,input,select')
      .forEach((n) => (n.disabled = true));
    status(
      `Invalid canvas: ${err.message} Embedded state has not been changed.`,
      true,
    );
  }
})();
