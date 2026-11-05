/* Shared manual annotation workspace for standalone canvases. */
const AnnotationUI = (() => {
  'use strict';
  const canvas = { type: 'canvas' };
  const overview = { type: 'overview' };
  function element(tag, text) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function button(text, action) {
    const node = element('button', text);
    node.type = 'button';
    node.addEventListener('click', action);
    return node;
  }
  function iconButton(label, path, action) {
    const control = button('', action);
    control.className = 'annotation-icon';
    control.setAttribute('aria-label', label);
    control.title = label;
    const namespace = 'http://www.w3.org/2000/svg';
    const icon = document.createElementNS(namespace, 'svg');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('aria-hidden', 'true');
    const shape = document.createElementNS(namespace, 'path');
    shape.setAttribute('d', path);
    icon.append(shape);
    control.append(icon);
    return control;
  }
  function install({ getState, targetType, sections, lookup, setMode, canEnter, onEdit }) {
    let active = false, selected = canvas, draft, opener;
    const toolbar = element('div');
    toolbar.className = 'annotation-toolbar';
    const panel = element('dialog');
    panel.className = 'annotation-panel';
    panel.setAttribute('aria-label', 'Annotations');
    const mode = button('Annotation Mode', () => changeMode(true));
    const exit = button('Exit annotation mode', () => changeMode(false));
    exit.hidden = true;
    const unavailable = button('', () => open(null, unavailable));
    document.querySelector('.toolbar .export-actions').before(toolbar);
    document.body.append(panel);
    panel.addEventListener('cancel', event => {
      event.preventDefault();
      close();
    });

    const notes = () => getState().annotations || [];
    const label = target => target === overview ? 'All thoughts' :
      target.type === 'canvas' ? 'Whole canvas' : lookup(target.id, target.type);
    const matches = target => notes().filter(note => Annotations.sameTarget(note.target, target));
    const missing = () => notes().filter(note => label(note.target) === undefined);

    function updateBadge(group, target) {
      const count = matches(target).length;
      const [add, show] = group.children;
      if (target.type === 'canvas' && !active) {
        const specific = notes().length - count;
        group.hidden = show.hidden = !notes().length;
        add.hidden = true;
        show.textContent = `${count} | ${specific}`;
        const description = `${count} general thoughts, ${specific} specific thoughts`;
        show.setAttribute('aria-label', description);
        show.title = description;
        return;
      }
      group.hidden = !active && !count;
      add.hidden = !active;
      show.hidden = !count;
      if (group.hidden) return;
      const name = label(target);
      const addText = target.type === 'canvas' ? 'Add general thought' : 'Add thought';
      add.textContent = addText;
      add.setAttribute('aria-label', target.type === 'canvas' ? addText : `${addText} for ${name}`);
      show.textContent = active ? `Show thoughts (${count})` : String(count);
      const showLabel = active ? `Show thoughts (${count}) for ${name}` : `${count} ${count === 1 ? 'note' : 'notes'} for ${name}`;
      show.setAttribute('aria-label', showLabel);
      show.title = showLabel;
    }
    function refresh() {
      if (selected && label(selected) === undefined) selected = null;
      unavailable.hidden = !missing().length;
      unavailable.textContent = `Unavailable targets (${missing().length})`;
      for (const group of document.querySelectorAll('[data-annotation-type]')) {
        updateBadge(group, { type: group.dataset.annotationType, id: group.dataset.annotationTarget });
      }
      if (panel.open && !draft) render();
    }
    function discardDraft() {
      if (draft && draft.input.value !== draft.original && !confirm('Discard the unsaved note?')) return false;
      draft = undefined;
      return true;
    }
    function focusPanel() {
      panel.querySelector('.annotation-close').focus();
    }
    function open(target, control, compose = false) {
      selected = target;
      opener = control;
      render();
      panel.showModal();
      if (compose) edit();
      else focusPanel();
    }
    function close() {
      if (!discardDraft()) return;
      panel.close();
      const replacement = selected && [...document.querySelectorAll('[data-annotation-type]')]
        .find(group => group.dataset.annotationType === selected.type && group.dataset.annotationTarget === selected.id);
      const control = opener?.isConnected && opener.getClientRects().length
        ? opener : replacement?.querySelector('button:not([hidden])');
      (control && control.getClientRects().length ? control : active ? exit : mode).focus({ preventScroll: true });
    }
    function changeMode(next) {
      if (next && canEnter && !canEnter()) return;
      active = next;
      mode.hidden = active;
      exit.hidden = !active;
      setMode(active);
      refresh();
      if (panel.open) focusPanel();
      else (active ? exit : mode).focus({ preventScroll: true });
    }
    function edit(note) {
      const form = element('form');
      const field = element('label', 'Annotation text');
      const input = element('textarea');
      input.rows = 3;
      input.required = true;
      input.value = note?.text || '';
      field.append(input);
      const save = element('button', 'Save note');
      save.type = 'submit';
      const actions = element('div');
      actions.className = 'annotation-actions';
      actions.append(save, button('Cancel', () => {
        draft = undefined;
        render();
        focusPanel();
      }));
      form.append(field, actions);
      draft = { input, original: input.value };
      form.addEventListener('submit', event => {
        event.preventDefault();
        if (!active) return;
        const text = input.value.trim();
        if (!text) {
          input.setCustomValidity('Enter a note.');
          input.reportValidity();
          return;
        }
        Annotations.save(getState(), targetType, note ? { ...note, text } : {
          id: 'note-' + crypto.randomUUID(), target: selected, target_label: label(selected), text
        }, sections);
        draft = undefined;
        onEdit();
        refresh();
        focusPanel();
      });
      input.addEventListener('input', () => input.setCustomValidity(''));
      panel.querySelector('.annotation-actions').hidden = true;
      panel.querySelector('.annotation-list').hidden = true;
      panel.querySelector('.annotation-empty')?.setAttribute('hidden', '');
      panel.append(form);
      input.focus();
    }
    function render() {
      const heading = element('h2', selected ? label(selected) : 'Unavailable targets');
      const actions = element('div');
      actions.className = 'annotation-actions';
      const eyebrow = element('p', 'Thoughts');
      eyebrow.className = 'eyebrow';
      const dismiss = iconButton('Close notes', 'M6 6l12 12M18 6L6 18', close);
      dismiss.classList.add('annotation-close');
      panel.replaceChildren(dismiss, eyebrow, heading, actions);
      if (active) {
        if (selected) actions.append(button('Add thought', () => edit()));
      } else if (selected !== overview) {
        actions.append(button(selected ? 'Annotate this target' : 'Manage unavailable notes', () => changeMode(true)));
      }
      const entries = selected === overview ? notes() : selected ? matches(selected) : missing();
      if (!entries.length) {
        const empty = element('p', 'No thoughts yet.');
        empty.className = 'annotation-empty';
        panel.append(empty);
      }
      const list = element('ul');
      list.className = 'annotation-list';
      for (const note of entries) {
        const card = element('li');
        if (!selected || selected === overview) card.append(element('strong', label(note.target) ?? note.target_label));
        card.append(element('p', note.text));
        if (active) {
          const controls = element('div');
          controls.className = 'annotation-note-actions';
          controls.append(iconButton('Edit note', 'M4 20l4-.8L20 7l-3-3L5 16z M14.5 6.5l3 3', () => { if (!draft) edit(note); }),
            iconButton('Delete note', 'M4 7h16 M9 7V4h6v3 M6 7l1 13h10l1-13 M10 10v7 M14 10v7', () => {
              if (draft || !confirm('Delete this note?')) return;
              Annotations.remove(getState(), note.id);
              onEdit();
              refresh();
              focusPanel();
            }));
          card.append(controls);
        }
        list.append(card);
      }
      panel.append(list);
    }
    function badge(id, type = targetType) {
      const target = id === undefined ? { type } : { type, id };
      const group = element('span');
      group.className = 'annotation-controls';
      group.dataset.annotationType = type;
      if (id !== undefined) group.dataset.annotationTarget = id;
      const add = button('', () => open(target, add, true));
      const show = button('', () => open(type === 'canvas' && !active ? overview : target, show));
      add.className = 'annotation-trigger annotation-add';
      show.className = 'annotation-trigger annotation-show';
      group.append(add, show);
      updateBadge(group, target);
      return group;
    }
    function reset() {
      selected = canvas;
      draft = undefined;
      opener = undefined;
    }
    toolbar.append(mode, badge(undefined, 'canvas'), exit, unavailable);
    return { badge, refresh, reset, isActive: () => active };
  }
  return { install };
})();
