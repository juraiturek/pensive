/* SWOT-specific state operations, shared by the local page and Node packager. */
const Swot = (() => {
  'use strict';
  const factors = Object.freeze(['strengths', 'weaknesses', 'opportunities', 'threats']);
  const strategies = Object.freeze(['so', 'st', 'wo', 'wt']);
  const framing = Object.freeze(['focal_entity', 'objective', 'environment']);
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
  function objectWithKeys(value, keys, path) {
    if (!value || typeof value !== 'object' || Array.isArray(value) ||
        Object.keys(value).length !== keys.length ||
        !keys.every(key => Object.hasOwn(value, key))) {
      throw new Error(`${path}: expected exactly ${keys.join(', ')}.`);
    }
  }
  function validate(state) {
    objectWithKeys(state, ['framework', 'schema_version', 'content'], 'Canvas');
    if (state.framework !== 'swot' || state.schema_version !== '1.0') {
      throw new Error('Unsupported framework or schema version. Expected swot / 1.0.');
    }
    objectWithKeys(state.content, ['framing', ...factors, 'strategies'], 'Content');
    objectWithKeys(state.content.framing, framing, 'Framing');
    for (const field of framing) {
      if (typeof state.content.framing[field] !== 'string') throw new Error(`${field}: expected text.`);
    }
    objectWithKeys(state.content.strategies, strategies, 'Strategies');
    const ids = new Set();
    for (const section of [...factors, ...strategies]) {
      const items = collection(state, section);
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
  return Object.freeze({ factors, strategies, framing, initialState, validate, collection, parseState, addItem, editItem, deleteItem, safeJson, packageHtml });
})();
if (typeof module !== 'undefined' && module.exports) module.exports = Swot;
