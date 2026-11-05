/* Shared local editor and whole-text review controls. */
const TakeawaysUI = (() => {
  'use strict';

  function install({ getState, core, isLocked, refresh, edited, copy }) {
    const find = id => document.getElementById(id);
    const input = find('takeaways-text');
    const formulate = find('takeaways-formulate');
    const improve = find('takeaways-improve');
    const panel = find('takeaways-review');
    const dialog = find('takeaways-dialog');
    const form = dialog.querySelector('form');
    const error = find('takeaways-error');
    let actionId;

    function render() {
      const state = getState();
      const proposal = state.proposals?.[0];
      const locked = isLocked();
      const reviewing = Takeaways.handles(proposal?.action);
      input.value = Takeaways.value(state);
      input.readOnly = locked;
      formulate.disabled = locked || !!proposal;
      improve.disabled = formulate.disabled || !input.value.trim();
      panel.hidden = !reviewing;
      error.textContent = '';
      if (reviewing) {
        find('takeaways-current').textContent = input.value || '(Empty)';
        find('takeaways-proposed').textContent = proposal.takeaways;
        find('takeaways-rationale').textContent = proposal.rationale;
        panel.querySelectorAll('button').forEach(button => { button.disabled = locked; });
      }
      return reviewing;
    }

    input.addEventListener('input', () => {
      if (isLocked()) return;
      getState().takeaways = input.value;
      improve.disabled = formulate.disabled || !input.value.trim();
      if (!panel.hidden) find('takeaways-current').textContent = input.value || '(Empty)';
      edited();
    });

    function open(id, label) {
      actionId = id;
      form.reset();
      find('takeaways-action-title').textContent = label;
      find('takeaways-request-error').textContent = '';
      dialog.showModal();
    }
    formulate.addEventListener('click', () => open('formulate_takeaways', formulate.textContent));
    improve.addEventListener('click', () => open('review_takeaways', improve.textContent));
    find('takeaways-cancel').addEventListener('click', () => dialog.close());
    form.addEventListener('submit', async event => {
      event.preventDefault();
      try {
        const request = core.buildRequest(getState(), {
          id: actionId,
          comment: find('takeaways-guidance').value,
          include_annotations: find('takeaways-include-annotations').checked,
        });
        dialog.close();
        await copy(JSON.stringify(request, null, 2), 'Copied AI request. Paste it into Codex with the Pensive skill.', true);
      } catch (failure) {
        find('takeaways-request-error').textContent = failure.message;
      }
    });

    function decide(decision) {
      if (isLocked()) return;
      try {
        const state = getState();
        if (state.framework === 'five_whys') core.resolveProposal(state, decision);
        else core.resolveProposal(state, undefined, decision);
        refresh();
        edited();
        input.focus();
      } catch (failure) {
        error.textContent = failure.message;
      }
    }
    find('takeaways-accept').addEventListener('click', () => decide('accept'));
    find('takeaways-reject').addEventListener('click', () => decide('reject'));
    return render;
  }

  return Object.freeze({ install });
})();
