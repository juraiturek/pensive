/* Shared local text editing and flat-collection pointer ordering. No state or network service. */
const CanvasEditing = (() => {
  'use strict';
  function finishOnEnter(input, finish = () => input.blur()) {
    input.title ||= 'Enter to finish editing; Shift+Enter for a new line.';
    input.addEventListener('keydown', event => {
      if (event.key !== 'Enter' || event.shiftKey || event.isComposing || event.keyCode === 229) return;
      event.preventDefault();
      finish();
    });
  }
  function collectionOrdering({ core, getState, renderSection, edited, status }) {
    let drag = null;
    let suppressDragClick = false;
    // Keep ordering local until a valid drop. Pointer capture supports both mouse and touch.
    function updateDrop(x, y) {
      if (!drag || drag.cancelled) return;
      drag.x = x; drag.y = y;
      drag.list.querySelectorAll('.drop-before, .drop-after').forEach(row => row.classList.remove('drop-before', 'drop-after'));
      drag.finalIndex = null;
      if (!drag.active && Math.hypot(x - drag.startX, y - drag.startY) < 5) return;
      drag.active = true;
      drag.row.classList.add('is-dragging');
      const bounds = drag.list.getBoundingClientRect();
      if (x < bounds.left || x > bounds.right || y < bounds.top || y > bounds.bottom) return;
      const others = [...drag.list.children].filter(row => row !== drag.row);
      const before = others.find(row => { const box = row.getBoundingClientRect(); return y < box.top + box.height / 2; });
      drag.finalIndex = before ? others.indexOf(before) : others.length;
      const marker = before || others.at(-1);
      marker?.classList.add(before ? 'drop-before' : 'drop-after');
    }
    function scrollDrag() {
      if (!drag) return;
      if (drag.active) {
        const bounds = drag.list.getBoundingClientRect();
        const direction = drag.y < 48 ? -1 : drag.y > innerHeight - 48 ? 1 : 0;
        const remaining = direction < 0 ? Math.max(0, -bounds.top) : Math.max(0, bounds.bottom - innerHeight);
        if (direction && remaining && drag.x >= bounds.left && drag.x <= bounds.right) {
          window.scrollBy(0, direction * Math.min(10, remaining));
          updateDrop(drag.x, drag.y);
        }
      }
      drag.frame = requestAnimationFrame(scrollDrag);
    }
    function finishDrag(commit) {
      if (!drag) return;
      const current = drag;
      drag = null;
      if (current.active) {
        // A drop can replace its source DOM; never let the resulting click add a draft.
        suppressDragClick = true;
        setTimeout(() => { suppressDragClick = false; }, 0);
      }
      cancelAnimationFrame(current.frame);
      current.list.querySelectorAll('.drop-before, .drop-after, .is-dragging').forEach(row => row.classList.remove('drop-before', 'drop-after', 'is-dragging'));
      if (current.handle.hasPointerCapture(current.pointerId)) current.handle.releasePointerCapture(current.pointerId);
      if (!commit || !current.active || current.finalIndex === null) return;
      const previous = core.collection(getState(), current.section).findIndex(item => item.id === current.id);
      if (previous === current.finalIndex) return;
      try {
        core.reorderItem(getState(), current.section, current.id, current.finalIndex);
        renderSection(current.section);
        edited();
        if (getState().proposals?.length) status('Order changed. This manual edit makes remaining proposal acceptance stale; reject remaining changes and request a fresh proposal.');
      } catch (error) { status(error.message, true); }
    }
    function wireHandle(handle, row, list, section, id) {
      handle.addEventListener('pointerdown', event => {
        if (handle.disabled || !event.isPrimary || event.button !== 0) return;
        event.preventDefault();
        finishDrag(false);
        drag = { handle, row, list, section, id, pointerId: event.pointerId,
          startX: event.clientX, startY: event.clientY, x: event.clientX, y: event.clientY, active: false, finalIndex: null };
        handle.setPointerCapture(event.pointerId);
        drag.frame = requestAnimationFrame(scrollDrag);
      });
      handle.addEventListener('pointermove', event => {
        if (drag?.handle === handle && drag.pointerId === event.pointerId) updateDrop(event.clientX, event.clientY);
      });
      handle.addEventListener('pointerup', event => {
        if (drag?.handle !== handle || drag.pointerId !== event.pointerId) return;
        updateDrop(event.clientX, event.clientY);
        finishDrag(!drag.cancelled);
      });
      for (const type of ['pointercancel', 'lostpointercapture']) handle.addEventListener(type, () => { if (drag?.handle === handle) finishDrag(false); });
      handle.addEventListener('click', event => event.preventDefault());
    }

    function createHandle(row, list, section, item, index, label) {
      const pendingReview = core.proposalSections(getState()).some(entry => entry.section === section && entry.status === 'pending');
      const handle = document.createElement('button');
      handle.className = 'drag-handle'; handle.textContent = '⠿'; handle.type = 'button';
      handle.tabIndex = -1; // Keyboard ordering is deferred; text editing retains its tab order.
      handle.disabled = pendingReview || core.collection(getState(), section).length < 2;
      handle.title = pendingReview ? 'Resolve this collection’s pending review before reordering.' : handle.disabled ? 'Add another bullet to reorder.' : 'Drag to reorder within this collection';
      handle.setAttribute('aria-label', `Reorder ${label.toLowerCase()} ${index + 1}`);
      wireHandle(handle, row, list, section, item.id);
      return handle;
    }
    document.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'touch') return;
      const selected = event.target.closest('[data-section] .item');
      document.querySelectorAll('.touch-selected').forEach(row => { if (row !== selected) row.classList.remove('touch-selected'); });
      selected?.classList.add('touch-selected');
      if (selected) {
        const section = selected.closest('[data-section]').dataset.section;
        if (core.proposalSections(getState()).some(entry => entry.section === section && entry.status === 'pending')) status('Resolve this collection’s pending review before reordering. You can still edit its text.');
      }
    });
    document.addEventListener('click', event => {
      if (!suppressDragClick) return;
      event.preventDefault(); event.stopPropagation();
    }, true);
    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || !drag) return;
      event.preventDefault();
      drag.cancelled = true;
      cancelAnimationFrame(drag.frame);
      drag.list.querySelectorAll('.drop-before, .drop-after, .is-dragging').forEach(row => row.classList.remove('drop-before', 'drop-after', 'is-dragging'));
      // Retain capture until pointerup so release cannot turn into a background Add click.
    });
    window.addEventListener('blur', () => finishDrag(false));

    return Object.freeze({ createHandle });
  }
  return Object.freeze({ finishOnEnter, collectionOrdering });
})();
