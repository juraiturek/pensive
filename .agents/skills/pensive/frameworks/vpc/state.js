/* VPC-local state and safe packaging; shared by Node and standalone HTML. */
const Vpc = (() => {
  'use strict';
  const sections = Object.freeze(['jobs', 'pains', 'gains', 'products_services', 'pain_relievers', 'gain_creators']);
  const framing = Object.freeze(['product_offering', 'customer_segment', 'scenario_job_context', 'current_alternative', 'success_metric']);
  const Review = typeof module !== 'undefined' && module.exports ? require('../../shared/proposal-review.js') : ProposalReview;
  const review = Review.create({ sections, collection: (content, section) => collection({ content }, section), validateContent });
  const idPattern = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
  function keys(value, required, path, optional = []) {
    if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(k => !required.includes(k) && !optional.includes(k)) || required.some(k => !Object.hasOwn(value, k))) throw new Error(`${path}: expected exactly ${required.join(', ')}.`);
  }
  function validateContent(content) {
    keys(content, ['framing', ...sections], 'Content');
    keys(content.framing, framing, 'Framing');
    if (framing.some(k => typeof content.framing[k] !== 'string')) throw new Error('Framing must contain text.');
    const ids = new Set();
    for (const section of sections) {
      if (!Array.isArray(content[section])) throw new Error(`${section}: expected array.`);
      for (const item of content[section]) {
        keys(item, ['id', 'text'], section);
        if (typeof item.id !== 'string' || !idPattern.test(item.id) || typeof item.text !== 'string') throw new Error(`${section}: invalid item ID or text.`);
        if (ids.has(item.id)) throw new Error(`Duplicate item ID: ${item.id}.`);
        ids.add(item.id);
      }
    }
    return ids;
  }
  function same(a, b) {
    if (a === b) return true;
    if (!a || !b || typeof a !== 'object' || typeof b !== 'object' || Array.isArray(a) !== Array.isArray(b)) return false;
    return Object.keys(a).length === Object.keys(b).length && Object.keys(a).every(k => Object.hasOwn(b, k) && same(a[k], b[k]));
  }
  function validateThought(thought, ids) {
    keys(thought, ['id', 'kind', 'text'], 'Thought');
    if (typeof thought.id !== 'string' || !idPattern.test(thought.id) || ids.has(thought.id)) throw new Error('Invalid or duplicate thought ID.');
    if (!['evaluation', 'improvement'].includes(thought.kind) || typeof thought.text !== 'string' || !thought.text.trim()) throw new Error('Invalid thought.');
    ids.add(thought.id);
  }
  function boundary(before, after) {
    if (!same(before.framing, after.framing)) throw new Error('Improve must preserve framing.');
    const previous = sections.flatMap(section => before[section]);
    for (const item of sections.flatMap(section => after[section])) {
      const matches = previous.filter(old => old.text === item.text);
      if (matches.length && !matches.some(old => old.id === item.id)) throw new Error('Retained text must preserve an existing matching ID.');
    }
  }
  function validate(state) {
    keys(state, ['framework', 'schema_version', 'content'], 'Canvas', ['thoughts', 'proposals']);
    if (state.framework !== 'vpc' || state.schema_version !== '1.0') throw new Error('Unsupported framework/version; expected vpc / 1.0.');
    const ids = validateContent(state.content);
    if (state.thoughts !== undefined) {
      if (!Array.isArray(state.thoughts)) throw new Error('Thoughts must be an array.');
      for (const thought of state.thoughts) validateThought(thought, ids);
    }
    if (state.proposals !== undefined) {
      if (!Array.isArray(state.proposals) || state.proposals.length > 1) throw new Error('At most one pending proposal is supported.');
      for (const proposal of state.proposals) {
        keys(proposal, ['id', 'action', 'base_content', 'content', 'thought'], 'Proposal', ['resolutions']);
        if (proposal.action !== 'improve') throw new Error('Unsupported proposal action.');
        const baseIds = validateContent(proposal.base_content), candidateIds = validateContent(proposal.content);
        boundary(proposal.base_content, proposal.content);
        const annotationIds = new Set((state.thoughts || []).map(t => t.id));
        if ([...annotationIds].some(id => baseIds.has(id) || candidateIds.has(id))) throw new Error('Proposed item collides with an annotation ID.');
        for (const id of baseIds) ids.add(id); for (const id of candidateIds) ids.add(id);
        if (typeof proposal.id !== 'string' || !idPattern.test(proposal.id) || ids.has(proposal.id)) throw new Error('Invalid or duplicate proposal ID.');
        ids.add(proposal.id); validateThought(proposal.thought, ids);
        if (proposal.thought.kind !== 'improvement') throw new Error('Improve proposal needs an improvement thought.');
        review.validate(proposal);
      }
    }
    return state;
  }
  function initialState() { return { framework: 'vpc', schema_version: '1.0', content: { framing: Object.fromEntries(framing.map(k => [k, ''])), ...Object.fromEntries(sections.map(k => [k, []])) } }; }
  function collection(state, section) { if (!sections.includes(section)) throw new Error('Unknown VPC collection.'); return state.content[section]; }
  function addItem(state, section) {
    validate(state); const list = collection(state, section), used = validateContent(state.content);
    for (const thought of state.thoughts || []) used.add(thought.id);
    for (const proposal of state.proposals || []) {
      used.add(proposal.id); used.add(proposal.thought.id);
      for (const content of [proposal.base_content, proposal.content]) for (const id of validateContent(content)) used.add(id);
    }
    let id;
    do { id = `item-${crypto.randomUUID()}`; } while (used.has(id));
    list.push({ id, text: '' }); return id;
  }
  function editItem(state, section, id, text) {
    validate(state); const item = collection(state, section).find(i => i.id === id);
    if (!item) throw new Error('Unknown item.'); if (typeof text !== 'string') throw new Error('Item text must be text.'); item.text = text;
  }
  function deleteItem(state, section, id) {
    validate(state); const list = collection(state, section), index = list.findIndex(i => i.id === id);
    if (index < 0) throw new Error('Unknown item.'); list.splice(index, 1);
  }
  function reorderItem(state, section, id, finalIndex) {
    validate(state);
    const items = collection(state, section), index = items.findIndex(item => item.id === id);
    if (index < 0) throw new Error('Unknown item.');
    if (!Number.isInteger(finalIndex) || finalIndex < 0 || finalIndex >= items.length) throw new Error('Reorder position must be within this collection.');
    if (proposalSections(state).some(entry => entry.section === section && entry.status === 'pending')) throw new Error('Resolve this collection’s pending review before reordering.');
    if (index === finalIndex) return;
    const [item] = items.splice(index, 1);
    items.splice(finalIndex, 0, item);
  }
  function validateRequest(request) {
    keys(request, ['canvas', 'action'], 'Request'); validate(request.canvas);
    if (request.canvas.proposals?.length) throw new Error('Resolve the pending proposal first.');
    keys(request.action, ['id'], 'Action', ['comment', 'use_thoughts']);
    const action = request.action;
    if (!['evaluate', 'improve'].includes(action.id)) throw new Error('Unsupported VPC action.');
    if (action.comment !== undefined && typeof action.comment !== 'string') throw new Error('Action comment must be text.');
    if (action.use_thoughts !== undefined && typeof action.use_thoughts !== 'boolean') throw new Error('use_thoughts must be boolean.');
    return request;
  }
  function buildRequest(state, action) {
    const request = { canvas: structuredClone(state), action: { ...structuredClone(action), use_thoughts: action.use_thoughts ?? true } };
    return validateRequest(request);
  }
  function composeResult(request, response) {
    validateRequest(request);
    keys(response, request.action.id === 'evaluate' ? ['thought'] : ['content', 'thought'], 'Response');
    if (typeof response.thought !== 'string' || !response.thought.trim()) throw new Error('Response thought must be nonempty text.');
    const result = structuredClone(request.canvas), ids = validateContent(result.content);
    for (const thought of result.thoughts || []) ids.add(thought.id);
    if (request.action.id === 'improve') {
      for (const id of validateContent(response.content)) {
        if ((result.thoughts || []).some(t => t.id === id)) throw new Error('Candidate item collides with an annotation ID.');
        ids.add(id);
      }
      boundary(result.content, response.content);
    }
    function fresh(prefix) { let id; do { id = `${prefix}-${crypto.randomUUID()}`; } while (ids.has(id)); ids.add(id); return id; }
    const thought = { id: fresh('thought'), kind: request.action.id === 'evaluate' ? 'evaluation' : 'improvement', text: response.thought };
    if (request.action.id === 'evaluate') result.thoughts = [...(result.thoughts || []), thought];
    else result.proposals = [{ id: fresh('proposal'), action: 'improve', base_content: structuredClone(result.content), content: structuredClone(response.content), thought }];
    return validate(result);
  }
  function proposalSections(state) { validate(state); return state.proposals?.length ? review.entries(state.proposals[0]) : []; }
  function resolveProposal(state, selected, decision) {
    validate(state); const proposal = state.proposals?.[0]; if (!proposal) throw new Error('No pending proposal.');
    if (decision === 'accept' && !same(state.content, review.expected(proposal))) throw new Error('Canvas content or framing changed; reject remaining changes and request again.');
    const next = review.apply(state, selected, decision);
    validate(next); Object.assign(state, next);
  }
  function acceptProposal(state) { resolveProposal(state, undefined, 'accept'); }
  function rejectProposal(state) { resolveProposal(state, undefined, 'reject'); }
  function parseState(json) { return validate(JSON.parse(json)); }
  function safeJson(state) { validate(state); return JSON.stringify(state, null, 2).replace(/[<>&\u2028\u2029]/g, c => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`); }
  function packageHtml(html, state) {
    const start = ['<!--', 'pensive-state-start', '-->'].join(''), end = ['<!--', 'pensive-state-end', '-->'].join('');
    const first = html.indexOf(start), last = html.indexOf(end);
    if (first < 0 || last < first || html.indexOf(start, first + start.length) !== -1 || html.indexOf(end, last + end.length) !== -1) throw new Error('Expected one complete state slot.');
    return html.slice(0, first) + `${start}\n<script id="canvas-state" type="application/json">${safeJson(state)}<${'/script>'}\n${end}` + html.slice(last + end.length);
  }
  return Object.freeze({ sections, framing, initialState, validate, validateContent, collection, addItem, editItem, deleteItem, reorderItem, validateRequest, buildRequest, composeResult, proposalSections, resolveProposal, acceptProposal, rejectProposal, parseState, safeJson, packageHtml });
})();
if (typeof module !== 'undefined' && module.exports) module.exports = Vpc;
