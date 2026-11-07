/* Collection-level proposal decisions, shared by Node and standalone canvases. */
const ProposalReview = (() => {
  'use strict';
  function same(a, b) {
    if (a === b) return true;
    if (!a || !b || typeof a !== 'object' || typeof b !== 'object' || Array.isArray(a) !== Array.isArray(b)) return false;
    const keys = Object.keys(a);
    return keys.length === Object.keys(b).length && keys.every(k => Object.hasOwn(b, k) && same(a[k], b[k]));
  }
  function create({ sections, collection, validateContent, snapshot = collection, replaceSection }) {
    function entries(proposal) {
      return sections.filter(s => !same(snapshot(proposal.base_content, s), snapshot(proposal.content, s)))
        .map(section => ({ section, status: proposal.resolutions?.[section] || 'pending' }));
    }
    function replace(content, proposal, section) {
      if (replaceSection) { replaceSection(content, proposal.content, section); return; }
      const destination = collection(content, section);
      destination.splice(0, destination.length, ...structuredClone(collection(proposal.content, section)));
    }
    function expected(proposal) {
      const content = structuredClone(proposal.base_content);
      for (const entry of entries(proposal)) if (entry.status === 'accepted') replace(content, proposal, entry.section);
      return content;
    }
    function validate(proposal) {
      if (proposal.resolutions !== undefined) {
        const value = proposal.resolutions, changed = entries(proposal).map(e => e.section);
        if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(s => !changed.includes(s) || !['pending', 'accepted', 'rejected'].includes(value[s]))) throw new Error('Invalid proposal resolutions; only changed nodes can be resolved.');
        if (changed.length && entries(proposal).every(e => e.status !== 'pending')) throw new Error('Completed proposal must be cleared.');
        validateContent(expected(proposal));
      }
    }
    function apply(state, selected, decision) {
      const original = state.proposals?.[0];
      if (!original) throw new Error('No pending proposal.');
      if (!['accept', 'reject'].includes(decision)) throw new Error('Unsupported review decision.');
      const pending = entries(original).filter(e => e.status === 'pending').map(e => e.section);
      const targets = selected === undefined ? pending : selected;
      if (!Array.isArray(targets) || (selected !== undefined && !targets.length) || new Set(targets).size !== targets.length || targets.some(s => !pending.includes(s))) throw new Error('Select distinct pending changed nodes.');
      const next = structuredClone(state), proposal = next.proposals[0];
      proposal.resolutions = { ...(proposal.resolutions || {}) };
      for (const section of targets) {
        proposal.resolutions[section] = decision === 'accept' ? 'accepted' : 'rejected';
        if (decision === 'accept') replace(next.content, proposal, section);
      }
      try { validateContent(next.content); }
      catch (error) { throw new Error(`These node changes cannot be accepted independently. Select related nodes together. ${error.message}`); }
      if (entries(proposal).every(e => e.status !== 'pending')) {
        const accepted = entries(proposal).filter(e => e.status === 'accepted').map(e => e.section);
        const rejected = entries(proposal).filter(e => e.status === 'rejected').map(e => e.section);
        if (accepted.length) {
          const label = section => section.replaceAll('_', ' ');
          const text = `Accepted nodes: ${accepted.map(label).join(', ')}. Rejected nodes: ${rejected.length ? rejected.map(label).join(', ') : 'none'}.\nOriginal proposal rationale (not a reassessment of the mixed canvas):\n${proposal.thought.text}`;
          next.thoughts = [...(next.thoughts || []), { ...proposal.thought, text }];
        }
        next.proposals = [];
      }
      return next;
    }
    return Object.freeze({ entries, expected, validate, apply });
  }
  return Object.freeze({ create, same });
})();
if (typeof module !== 'undefined' && module.exports) module.exports = ProposalReview;
