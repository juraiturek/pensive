/* PAGES state and action boundaries. Used by the standalone page and Node. */
const Pages = (() => {
  'use strict';
  const sections = Object.freeze(['parts', 'actions', 'goals', 'events', 'self_concepts']);
  const framing = Object.freeze(['what', 'why', 'intuition']);
  const Review = typeof module !== 'undefined' && module.exports ? require('../../shared/proposal-review.js') : ProposalReview;
  const review = Review.create({ sections, collection: (content, section) => collection({ content }, section), validateContent });
  const clone = value => structuredClone(value);
  const idPattern = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
  function keys(value, required, path, optional = []) {
    if (!value || typeof value !== 'object' || Array.isArray(value) ||
        Object.keys(value).some(k => !required.includes(k) && !optional.includes(k)) ||
        required.some(k => !Object.hasOwn(value, k))) throw new Error(`${path}: expected ${required.join(', ')}.`);
  }
  function same(a, b) {
    if (a === b) return true;
    if (!a || !b || typeof a !== 'object' || typeof b !== 'object' || Array.isArray(a) !== Array.isArray(b)) return false;
    return Object.keys(a).length === Object.keys(b).length && Object.keys(a).every(k => Object.hasOwn(b, k) && same(a[k], b[k]));
  }
  function validateCollections(value) {
    keys(value, sections, 'PAGES collections');
    const ids = new Set();
    for (const section of sections) {
      if (!Array.isArray(value[section])) throw new Error(`${section}: expected array.`);
      for (const item of value[section]) {
        keys(item, ['id', 'text'], section);
        if (typeof item.id !== 'string' || !idPattern.test(item.id) || typeof item.text !== 'string') throw new Error(`${section}: invalid item ID or text.`);
        if (ids.has(item.id)) throw new Error(`Duplicate item ID: ${item.id}.`);
        ids.add(item.id);
      }
    }
    return ids;
  }
  function coreContent(content) { return Object.fromEntries(sections.map(s => [s, content[s]])); }
  function validateContent(content) {
    keys(content, ['framing', ...sections], 'Content');
    keys(content.framing, framing, 'Framing');
    if (framing.some(k => typeof content.framing[k] !== 'string')) throw new Error('Framing must be text.');
    return validateCollections(coreContent(content));
  }
  function thought(th, ids) {
    keys(th, ['id', 'kind', 'text'], 'Thought');
    if (typeof th.id !== 'string' || !idPattern.test(th.id) || ids.has(th.id)) throw new Error('Invalid or duplicate thought ID.');
    if (!['evaluation', 'improvement', 'ripple'].includes(th.kind) || typeof th.text !== 'string' || !th.text.trim()) throw new Error('Invalid thought kind or text.');
    ids.add(th.id);
  }
  function boundary(before, after, action, sources = []) {
    if (!same(before.framing, after.framing)) throw new Error('AI actions must preserve framing.');
    const previous = sections.flatMap(s => before[s]);
    for (const item of sections.flatMap(s => after[s])) {
      const matches = previous.filter(old => old.text === item.text);
      if (matches.length && !matches.some(old => old.id === item.id)) throw new Error('Retained text must preserve an existing matching ID.');
    }
    if (action === 'ripple' && sources.some(s => !same(before[s], after[s]))) throw new Error('Ripple must preserve selected source collections.');
  }
  function validateSources(sources) {
    if (!Array.isArray(sources) || !sources.length || sources.length >= sections.length || new Set(sources).size !== sources.length || sources.some(s => !sections.includes(s))) throw new Error('Select distinct source dimensions, leaving another dimension for implications.');
  }
  function collectionChanged(before, after) {
    return before.length !== after.length || before.some(old => !after.some(item => item.id === old.id && item.text === old.text));
  }
  function validate(state) {
    keys(state, ['framework', 'schema_version', 'content'], 'Canvas', ['ripple_baseline', 'thoughts', 'proposals']);
    if (state.framework !== 'pages' || state.schema_version !== '1.0') throw new Error('Unsupported framework/version; expected pages / 1.0.');
    const ids = validateContent(state.content);
    if (state.ripple_baseline !== undefined) validateCollections(state.ripple_baseline);
    if (state.thoughts !== undefined) {
      if (!Array.isArray(state.thoughts)) throw new Error('Thoughts must be an array.');
      state.thoughts.forEach(t => thought(t, ids));
    }
    if (state.proposals !== undefined) {
      if (!Array.isArray(state.proposals) || state.proposals.length > 1) throw new Error('At most one pending proposal is supported.');
      for (const p of state.proposals) {
        keys(p, ['id', 'action', 'sources', 'base_content', 'base_baseline', 'content', 'thought'], 'Proposal', ['resolutions']);
        if (typeof p.id !== 'string' || !idPattern.test(p.id) || ids.has(p.id)) throw new Error('Invalid or duplicate proposal ID.');
        ids.add(p.id);
        if (!['improve', 'ripple'].includes(p.action)) throw new Error('Unsupported proposal action.');
        validateContent(p.base_content);
        if (p.base_baseline !== null) validateCollections(p.base_baseline);
        if (p.action === 'ripple') {
          validateSources(p.sources);
          if (!p.base_baseline) throw new Error('Ripple proposal needs its baseline.');
          if (p.sources.some(s => !collectionChanged(p.base_baseline[s], p.base_content[s]))) throw new Error('Ripple sources must have changed.');
        } else if (!Array.isArray(p.sources) || p.sources.length) throw new Error('Improve has no Ripple sources.');
        const nextIds = validateContent(p.content);
        thought(p.thought, ids);
        if (p.thought.kind !== (p.action === 'improve' ? 'improvement' : 'ripple')) throw new Error('Thought must match action.');
        const annotations = [...(state.thoughts || []).map(t => t.id), p.id, p.thought.id];
        if (annotations.some(id => nextIds.has(id))) throw new Error('Proposed item collides with annotation ID.');
        boundary(p.base_content, p.content, p.action, p.sources);
        review.validate(p);
      }
    }
    return state;
  }
  function initialState() {
    const content = { framing: { what: '', why: '', intuition: '' }, ...Object.fromEntries(sections.map(s => [s, []])) };
    return { framework: 'pages', schema_version: '1.0', content, ripple_baseline: clone(coreContent(content)) };
  }
  function collection(state, section) {
    if (!sections.includes(section)) throw new Error(`Unknown PAGES section: ${section}.`);
    return state.content[section];
  }
  function locate(state, section, id) {
    validate(state); const items = collection(state, section); const index = items.findIndex(i => i.id === id);
    if (index < 0) throw new Error(`Missing item: ${id}.`);
    return { items, index };
  }
  function addItem(state, section) {
    validate(state); const items = collection(state, section);
    const used = new Set([...sections.flatMap(s => state.content[s]), ...sections.flatMap(s => state.ripple_baseline?.[s] || []), ...(state.thoughts || [])].map(i => i.id));
    let id; do { id = `item-${globalThis.crypto.randomUUID()}`; } while (used.has(id));
    items.push({ id, text: '' }); return id;
  }
  function editItem(state, section, id, text) {
    if (typeof text !== 'string') throw new Error('Item text must be text.');
    const { items, index } = locate(state, section, id); items[index].text = text;
  }
  function deleteItem(state, section, id) { const { items, index } = locate(state, section, id); items.splice(index, 1); }
  function reorderItem(state, section, id, finalIndex) {
    const { items, index } = locate(state, section, id);
    if (!Number.isInteger(finalIndex) || finalIndex < 0 || finalIndex >= items.length) throw new Error('Reorder position must be within this collection.');
    if (proposalSections(state).some(entry => entry.section === section && entry.status === 'pending')) throw new Error('Resolve this collection’s pending review before reordering.');
    if (index === finalIndex) return;
    const [item] = items.splice(index, 1);
    items.splice(finalIndex, 0, item);
  }
  function resetBaseline(state) {
    validate(state);
    if (state.proposals?.length) throw new Error('Resolve the pending proposal before resetting the baseline.');
    state.ripple_baseline = clone(coreContent(state.content));
  }
  function changes(state) {
    validate(state);
    if (!state.ripple_baseline) return [];
    const result = [];
    for (const section of sections) {
      const before = state.ripple_baseline[section], after = state.content[section];
      for (const old of before) {
        const next = after.find(i => i.id === old.id);
        if (!next) result.push({ section, kind: 'removed', before: clone(old), after: null });
        else if (old.text !== next.text) result.push({ section, kind: 'edited', before: clone(old), after: clone(next) });
      }
      for (const next of after) if (!before.some(i => i.id === next.id)) result.push({ section, kind: 'added', before: null, after: clone(next) });
    }
    return result;
  }
  function buildRequest(state, action) {
    validate(state);
    if (state.proposals?.length) throw new Error('Resolve the pending proposal first.');
    const id = action?.id;
    if (!['evaluate', 'improve', 'ripple'].includes(id)) throw new Error('Unsupported PAGES action.');
    keys(action, ['id'], 'Action', ['comment', 'use_thoughts', ...(id === 'ripple' ? ['sources'] : [])]);
    const normalized = { id, comment: action.comment === undefined ? '' : action.comment, use_thoughts: action.use_thoughts === undefined ? true : action.use_thoughts };
    if (typeof normalized.comment !== 'string' || typeof normalized.use_thoughts !== 'boolean') throw new Error('Invalid action guidance.');
    if (id === 'ripple') {
      if (!state.ripple_baseline) throw new Error('Establish a Ripple baseline explicitly first; prior changes cannot be recovered.');
      validateSources(action.sources);
      const changed = changes(state);
      if (action.sources.some(s => !changed.some(c => c.section === s))) throw new Error('Every selected Ripple source must have changed since baseline.');
      normalized.sources = clone(action.sources);
    }
    return { canvas: clone(state), action: normalized };
  }
  function validateRequest(request) { keys(request, ['canvas', 'action'], 'Request'); return buildRequest(request.canvas, request.action); }
  function composeResult(input, response) {
    const { canvas, action } = validateRequest(input);
    keys(response, action.id === 'evaluate' ? ['thought'] : ['content', 'thought'], 'Response');
    if (typeof response.thought !== 'string' || !response.thought.trim()) throw new Error('A nonempty explanatory thought is required.');
    const th = { id: `thought-${globalThis.crypto.randomUUID()}`, kind: action.id === 'evaluate' ? 'evaluation' : action.id === 'improve' ? 'improvement' : 'ripple', text: response.thought };
    if (action.id === 'evaluate') canvas.thoughts = [...(canvas.thoughts || []), th];
    else {
      validateContent(response.content); boundary(canvas.content, response.content, action.id, action.sources);
      canvas.proposals = [{ id: `proposal-${globalThis.crypto.randomUUID()}`, action: action.id, sources: action.sources || [], base_content: clone(canvas.content), base_baseline: canvas.ripple_baseline ? clone(canvas.ripple_baseline) : null, content: clone(response.content), thought: th }];
    }
    return validate(canvas);
  }
  function proposalSections(state) { validate(state); return state.proposals?.length ? review.entries(state.proposals[0]) : []; }
  function resolveProposal(state, selected, decision) {
    validate(state); const p = state.proposals?.[0]; if (!p) throw new Error('No pending proposal.');
    if (decision === 'accept') {
      if (!same(state.ripple_baseline ?? null, p.base_baseline)) throw new Error('Ripple baseline changed; reject and request again.');
      if (!same(state.content, review.expected(p))) throw new Error('Canvas content changed; reject remaining changes and request again.');
    }
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
  return Object.freeze({ sections, framing, initialState, validate, collection, parseState, addItem, editItem, deleteItem, reorderItem, resetBaseline, changes, buildRequest, validateRequest, composeResult, proposalSections, resolveProposal, acceptProposal, rejectProposal, safeJson, packageHtml });
})();
if (typeof module !== 'undefined' && module.exports) module.exports = Pages;
