/* Shared collection review controls. Frameworks own state and action validation. */
const ProposalReviewUI = (() => {
  'use strict';
  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function render({ state, core, panel, labels, title, onDecision, renderSupporting, renderRecord }) {
    const expanded = !!panel.querySelector('details')?.open;
    const selected = new Set(Array.from(panel.querySelectorAll('input:checked')).map(n => n.value));
    panel.replaceChildren();
    const proposal = state.proposals?.[0]; panel.hidden = !proposal;
    if (!proposal) return;
    const entries = core.proposalSections(state);
    const hasDecisions = entries.some(e => e.status !== 'pending');
    panel.append(element('h3', '', title), element('p', '', proposal.thought.text), element('p', 'review-hint', 'Accept or reject each node, or select nodes to accept together. Unchecked nodes remain pending.'));
    const review = element('details'); review.open = expanded;
    review.append(element('summary', '', 'Review proposed changes'));
    const error = element('p', 'review-error'); error.setAttribute('role', 'alert');
    function decide(targets, decision) {
      try {
        onDecision(targets, decision);
        panel.querySelector('input:not(:disabled), button:not(:disabled)')?.focus();
      } catch (e) { error.textContent = e.message; }
    }
    function button(label, run, primary = false) {
      const node = element('button', primary ? 'primary' : '', label); node.type = 'button'; node.addEventListener('click', run); return node;
    }
    const acceptSelected = button('Accept Selected', () => decide(Array.from(review.querySelectorAll('input:checked')).map(n => n.value), 'accept'));
    const updateSelection = () => { acceptSelected.disabled = !review.querySelector('input:checked'); };
    for (const { section, status } of entries) {
      const label = labels[section][0], diff = element('div', 'proposal-diff'); diff.dataset.reviewSection = section;
      const header = element('div', 'review-node-heading'); header.append(element('h4', '', label));
      if (status === 'pending') {
        const controls = element('div', 'review-node-controls'), select = element('label', 'review-select');
        const input = element('input'); input.type = 'checkbox'; input.value = section; input.checked = selected.has(section);
        input.setAttribute('aria-label', `Select ${label}`); input.addEventListener('change', updateSelection);
        select.append(input, document.createTextNode('Select'));
        const accept = button('Accept', () => decide([section], 'accept')); accept.setAttribute('aria-label', `Accept ${label}`);
        const reject = button('Reject', () => decide([section], 'reject')); reject.setAttribute('aria-label', `Reject ${label}`);
        controls.append(select, accept, reject); header.append(controls);
      } else header.append(element('span', `node-status ${status}`, status === 'accepted' ? 'Accepted' : 'Rejected'));
      diff.append(header);
      if (renderRecord) {
        for (const [columnLabel, content] of [[status === 'accepted' ? 'Original' : 'Current', status === 'accepted' ? proposal.base_content : state.content], ['Proposed', proposal.content]]) {
          const column = element('div'); column.append(element('strong', '', columnLabel));
          renderRecord(content, section, column); diff.append(column);
        }
        review.append(diff); continue;
      }
      const original = core.collection({ content: proposal.base_content }, section);
      const before = status === 'accepted' ? original : core.collection(state, section);
      const after = core.collection({ content: proposal.content }, section);
      for (const [columnLabel, items] of [[status === 'accepted' ? 'Original' : 'Current', before], ['Proposed', after]]) {
        const column = element('div'), list = element('ul'); column.append(element('strong', '', columnLabel));
        for (const item of items) {
          const bullet = element('li', '', item.text || '(Blank draft)');
          if (columnLabel === 'Proposed') {
            const previous = original.find(old => old.id === item.id);
            if (!previous || previous.text !== item.text) bullet.append(element('span', 'proposal-tag', previous ? 'Updated' : 'New'));
          }
          list.append(bullet);
        }
        if (!items.length) list.append(element('li', '', '(Empty)'));
        column.append(list);
        if (renderSupporting) renderSupporting(columnLabel === 'Proposed' ? proposal.content : status === 'accepted' ? proposal.base_content : state.content, section, column);
        diff.append(column);
      }
      review.append(diff);
    }
    if (!entries.length) review.append(element('p', 'review-hint', 'No node content changes were proposed. Accept All or Reject All closes this review.'));
    const actions = element('div', 'proposal-actions');
    actions.append(button(hasDecisions ? 'Accept All Remaining' : 'Accept All', () => decide(undefined, 'accept'), true), acceptSelected,
      button(hasDecisions ? 'Reject All Remaining' : 'Reject All', () => decide(undefined, 'reject')));
    updateSelection(); panel.append(review, error, actions);
  }
  return Object.freeze({ render });
})();
