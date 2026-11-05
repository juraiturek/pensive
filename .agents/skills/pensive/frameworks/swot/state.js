/* SWOT-specific state operations, shared by the local page and Node packager. */
const Swot = (() => {
  'use strict';
  const Notes = typeof module !== 'undefined' && module.exports ? require('../../shared/annotations.js') : Annotations;
  const Hats = typeof module !== 'undefined' && module.exports ? require('../../shared/six-hats.js') : SixHats;
  const factors = Object.freeze(['strengths', 'weaknesses', 'opportunities', 'threats']);
  const strategies = Object.freeze(['so', 'st', 'wo', 'wt']);
  const framing = Object.freeze(['focal_entity', 'objective', 'environment']);
  const Review = typeof module !== 'undefined' && module.exports ? require('../../shared/proposal-review.js') : ProposalReview;
  const review = Review.create({ sections: [...factors, ...strategies], collection: (content, section) => collection({ content }, section), validateContent });
  const start = ['<!--', 'pensive-state-start', '-->'].join('');
  const end = ['<!--', 'pensive-state-end', '-->'].join('');

  function initialState() {
    return {
      framework: 'swot', schema_version: '1.0',
      content: {
        framing: { focal_entity: '', objective: '', environment: '' },
        strengths: [], weaknesses: [], opportunities: [], threats: [],
        strategies: { so: [], st: [], wo: [], wt: [] }
      }
    };
  }
  function objectWithKeys(value, keys, path, optional = []) {
    if (!value || typeof value !== 'object' || Array.isArray(value) ||
        Object.keys(value).some(key => !keys.includes(key) && !optional.includes(key)) ||
        !keys.every(key => Object.hasOwn(value, key))) {
      throw new Error(`${path}: expected exactly ${keys.join(', ')}.`);
    }
  }
  function validateContent(content) {
    objectWithKeys(content, ['framing', ...factors, 'strategies'], 'Content');
    objectWithKeys(content.framing, framing, 'Framing');
    for (const field of framing) {
      if (typeof content.framing[field] !== 'string') throw new Error(`${field}: expected text.`);
    }
    objectWithKeys(content.strategies, strategies, 'Strategies');
    const ids = new Set();
    for (const section of [...factors, ...strategies]) {
      const items = collection({ content }, section);
      if (!Array.isArray(items)) throw new Error(`${section}: expected an array.`);
      for (const item of items) {
        objectWithKeys(item, ['id', 'text'], section);
        if (typeof item.id !== 'string' || item.id.length > 128 || !/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(item.id)) {
          throw new Error(`${section}: invalid item ID.`);
        }
        if (typeof item.text !== 'string') throw new Error(`${section}: item text must be a string.`);
        if (ids.has(item.id)) throw new Error(`Duplicate item ID: ${item.id}.`);
        ids.add(item.id);
      }
    }
    return ids;
  }
  function validateThought(thought, ids) {
    objectWithKeys(thought, ['id', 'kind', 'text'], 'Thought');
    if (typeof thought.id !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(thought.id) || ids.has(thought.id)) throw new Error('Invalid or duplicate thought ID.');
    if (!['evaluation', 'improvement', 'strategize'].includes(thought.kind) || typeof thought.text !== 'string' || !thought.text.trim()) throw new Error('Thought requires a supported kind and nonempty text.');
    ids.add(thought.id);
  }
  function validate(state) {
    objectWithKeys(state, ['framework', 'schema_version', 'content'], 'Canvas', ['thoughts', 'proposals', 'annotations']);
    if (state.framework !== 'swot' || state.schema_version !== '1.0') throw new Error('Unsupported framework or schema version. Expected swot / 1.0.');
    const ids = validateContent(state.content);
    Notes.validate(state.annotations, ['factor', 'strategy'], [...factors, ...strategies]);
    if (state.thoughts !== undefined) {
      if (!Array.isArray(state.thoughts)) throw new Error('Thoughts must be an array.');
      for (const entry of state.thoughts) {
        if (entry?.kind === 'six_hats') Hats.validateThought(entry, ids, state.framework);
        else validateThought(entry, ids);
      }
    }
    if (state.proposals !== undefined) {
      if (!Array.isArray(state.proposals) || state.proposals.length > 1) throw new Error('At most one whole-canvas proposal is supported.');
      for (const proposal of state.proposals) {
        objectWithKeys(proposal, ['id', 'action', 'base_content', 'content', 'thought'], 'Proposal', ['resolutions']);
        if (typeof proposal.id !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(proposal.id) || ids.has(proposal.id)) throw new Error('Invalid or duplicate proposal ID.');
        ids.add(proposal.id);
        if (!['strategize', 'improve'].includes(proposal.action)) throw new Error('Unsupported proposal action.');
        validateContent(proposal.base_content);
        const nextIds = validateContent(proposal.content);
        for (const thought of state.thoughts || []) if (nextIds.has(thought.id)) throw new Error('Proposed item collides with a thought ID.');
        if (nextIds.has(proposal.id)) throw new Error('Proposed item collides with proposal ID.');
        validateThought(proposal.thought, ids);
        if (nextIds.has(proposal.thought.id)) throw new Error('Proposed item collides with proposal thought ID.');
        if (proposal.thought.kind !== (proposal.action === 'improve' ? 'improvement' : 'strategize')) throw new Error('Proposal thought kind must match its action.');
        checkBoundary(proposal.base_content, proposal.content, proposal.action);
        review.validate(proposal);
      }
    }
    return state;
  }
  function collection(state, section) {
    if (factors.includes(section)) return state.content[section];
    if (strategies.includes(section)) return state.content.strategies[section];
    throw new Error(`Unknown SWOT section: ${section}.`);
  }
  function parseState(json) { return validate(JSON.parse(json)); }
  function addItem(state, section) {
    validate(state);
    const items = collection(state, section);
    const used = new Set([...factors, ...strategies].flatMap(key => collection(state, key).map(item => item.id)));
    let id;
    do { id = `${factors.includes(section) ? 'factor' : 'strategy'}-${globalThis.crypto.randomUUID()}`; } while (used.has(id));
    items.push({ id, text: '' });
    return id;
  }
  function locate(state, section, id) {
    validate(state);
    const items = collection(state, section);
    const index = items.findIndex(item => item.id === id);
    if (index < 0) throw new Error(`Item ${id} does not exist in ${section}.`);
    return { items, index };
  }
  function editItem(state, section, id, text) {
    if (typeof text !== 'string') throw new Error('Item text must be a string.');
    const { items, index } = locate(state, section, id);
    items[index].text = text;
  }
  function deleteItem(state, section, id) {
    const { items, index } = locate(state, section, id);
    items.splice(index, 1);
  }
  function reorderItem(state, section, id, finalIndex) {
    const { items, index } = locate(state, section, id);
    if (!Number.isInteger(finalIndex) || finalIndex < 0 || finalIndex >= items.length) throw new Error('Reorder position must be within this collection.');
    if (proposalSections(state).some(entry => entry.section === section && entry.status === 'pending')) throw new Error('Resolve this collection’s pending review before reordering.');
    if (index === finalIndex) return;
    const [item] = items.splice(index, 1);
    items.splice(finalIndex, 0, item);
  }
  function same(a, b) {
    if (a === b) return true;
    if (!a || !b || typeof a !== 'object' || typeof b !== 'object' || Array.isArray(a) !== Array.isArray(b)) return false;
    const keys = Object.keys(a);
    return keys.length === Object.keys(b).length && keys.every(key => Object.hasOwn(b, key) && same(a[key], b[key]));
  }
  function checkBoundary(before, after, action) {
    const previous = [...factors, ...strategies].flatMap(key => collection({ content: before }, key));
    const next = [...factors, ...strategies].flatMap(key => collection({ content: after }, key));
    for (const item of next) {
      const matching = previous.filter(old => old.text === item.text);
      if (matching.length && !matching.some(old => old.id === item.id)) throw new Error('Retained item text must preserve an existing matching ID.');
    }
    if (!same(before.framing, after.framing)) throw new Error('AI actions must preserve framing.');
    if (action === 'strategize' && factors.some(key => !same(before[key], after[key]))) throw new Error('Strategize must preserve all SWOT factors.');
  }
  function buildRequest(state, action) {
    validate(state);
    if (state.proposals?.length) throw new Error('Accept or reject the pending proposal before requesting another AI action.');
    if (action?.id === 'six_hats') {
      Hats.validateAction(state, action);
      return structuredClone({ canvas: state, action });
    }
    const id = action?.id;
    if (!['strategize', 'evaluate', 'improve'].includes(id)) throw new Error('Unsupported AI action.');
    const optional = ['comment', 'use_thoughts', ...(id === 'strategize' ? ['mode'] : id === 'evaluate' ? ['scope'] : [])];
    objectWithKeys(action, ['id'], 'Action', optional);
    const normalized = { id, comment: action.comment === undefined ? '' : action.comment, use_thoughts: action.use_thoughts === undefined ? true : action.use_thoughts };
    if (typeof normalized.comment !== 'string' || typeof normalized.use_thoughts !== 'boolean') throw new Error('Invalid action guidance.');
    if (id === 'strategize') {
      normalized.mode = action.mode === undefined ? 'extend' : action.mode;
      if (!['extend', 'replace'].includes(normalized.mode)) throw new Error('Unsupported strategy mode.');
    }
    if (id === 'evaluate') {
      normalized.scope = action.scope === undefined ? 'both' : action.scope;
      if (!['swot', 'tows', 'both'].includes(normalized.scope)) throw new Error('Unsupported evaluation scope.');
    }
    return { canvas: structuredClone(state), action: normalized };
  }
  function validateRequest(request) {
    objectWithKeys(request, ['canvas', 'action'], 'Request');
    return buildRequest(request.canvas, request.action);
  }
  function composeResult(input, response) {
    const request = validateRequest(input);
    const { canvas, action } = request;
    if (action.id === 'six_hats') return validate(Hats.append(canvas, action, response));
    objectWithKeys(response, action.id === 'evaluate' ? ['thought'] : ['content', 'thought'], 'AI response');
    if (typeof response.thought !== 'string' || !response.thought.trim()) throw new Error('A nonempty explanatory thought is required.');
    const thought = { id: `thought-${globalThis.crypto.randomUUID()}`, kind: action.id === 'evaluate' ? 'evaluation' : action.id === 'improve' ? 'improvement' : 'strategize', text: response.thought };
    if (action.id === 'evaluate') {
      canvas.thoughts = [...(canvas.thoughts || []), thought];
    } else {
      validateContent(response.content);
      checkBoundary(canvas.content, response.content, action.id);
      if (action.id === 'strategize' && action.mode === 'extend') {
        for (const key of strategies) {
          for (const item of canvas.content.strategies[key]) {
            if (!response.content.strategies[key].some(next => same(next, item))) throw new Error('Extend mode must preserve every existing strategy unchanged.');
          }
        }
      }
      canvas.proposals = [{ id: `proposal-${globalThis.crypto.randomUUID()}`, action: action.id, base_content: structuredClone(canvas.content), content: structuredClone(response.content), thought }];
    }
    return validate(canvas);
  }
  function proposalSections(state) {
    validate(state);
    return state.proposals?.length ? review.entries(state.proposals[0]) : [];
  }
  function resolveProposal(state, selected, decision) {
    validate(state);
    const proposal = state.proposals?.[0];
    if (!proposal) throw new Error('No pending proposal.');
    if (decision === 'accept' && !same(state.content, review.expected(proposal))) throw new Error('Canvas content changed after this proposal; reject remaining changes and request a fresh transformation.');
    const next = review.apply(state, selected, decision);
    validate(next);
    Object.assign(state, next);
  }
  function acceptProposal(state) { resolveProposal(state, undefined, 'accept'); }
  function rejectProposal(state) { resolveProposal(state, undefined, 'reject'); }
  function safeJson(state) {
    validate(state);
    return JSON.stringify(state, null, 2).replace(/[<>&\u2028\u2029]/g,
      character => `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`);
  }
  function packageHtml(html, state) {
    const json = safeJson(state);
    const first = html.indexOf(start);
    const last = html.indexOf(end);
    if (first < 0 || last < first || html.indexOf(start, first + start.length) !== -1 ||
        html.indexOf(end, last + end.length) !== -1) {
      throw new Error('Expected one complete HTML state slot.');
    }
    const slot = `${start}\n<script id="canvas-state" type="application/json">${json}<${'/script>'}\n${end}`;
    return html.slice(0, first) + slot + html.slice(last + end.length);
  }
  return Object.freeze({ factors, strategies, framing, initialState, validate, collection, parseState, addItem, editItem, deleteItem, reorderItem, buildRequest, validateRequest, composeResult, proposalSections, resolveProposal, acceptProposal, rejectProposal, safeJson, packageHtml });
})();
if (typeof module !== 'undefined' && module.exports) module.exports = Swot;
