/* Portable manual notes, shared by standalone canvases and packagers. */
const Annotations = (() => {
  'use strict';
  const id = value => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(value);
  const text = value => typeof value === 'string' && !!value.trim();
  const exact = (value, keys) => value && typeof value === 'object' && !Array.isArray(value) &&
    Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
  const sameTarget = (left, right) => left.type === right.type && left.id === right.id;

  function validate(notes, targetType, sections = []) {
    if (notes === undefined) return;
    if (!Array.isArray(notes)) throw new Error('Annotations must be an array.');
    const seen = new Set();
    for (const note of notes) {
      if (!exact(note, ['id', 'target', 'target_label', 'text']) ||
          !id(note.id) || seen.has(note.id) || !text(note.text) || !text(note.target_label)) {
        throw new Error('Invalid annotation or duplicate annotation ID.');
      }
      const target = note.target;
      if (!(exact(target, ['type']) && target.type === 'canvas') &&
          !(exact(target, ['type', 'id']) && (target.type === targetType && id(target.id) ||
            target.type === 'section' && sections.includes(target.id)))) {
        throw new Error('Invalid annotation target.');
      }
      seen.add(note.id);
    }
  }

  function save(state, targetType, note, sections) {
    const notes = [...(state.annotations || [])];
    const index = notes.findIndex(entry => entry.id === note.id);
    if (index < 0) notes.push(note);
    else notes[index] = note;
    validate(notes, targetType, sections);
    state.annotations = notes;
  }

  function remove(state, id) {
    state.annotations = (state.annotations || []).filter(note => note.id !== id);
  }

  return Object.freeze({ validate, sameTarget, save, remove });
})();
if (typeof module !== 'undefined' && module.exports) module.exports = Annotations;
