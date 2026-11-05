/* Plain-text proposals share the canvas's single pending review slot. */
const Takeaways = (() => {
  'use strict';
  const actions = ['formulate_takeaways', 'review_takeaways'];
  const handles = id => actions.includes(id);
  const value = state => state.takeaways ?? '';
  const text = input => typeof input === 'string';
  const nonblank = input => text(input) && !!input.trim();
  const object = input => input && typeof input === 'object' && !Array.isArray(input);
  const only = (input, keys) => object(input) && Object.keys(input).every(key => keys.includes(key));
  const review = typeof module !== 'undefined' && module.exports ? require('./proposal-review.js') : ProposalReview;

  function request(canvas, action) {
    if (!only(action, ['id', 'comment', 'include_annotations']) ||
        (action.comment !== undefined && !text(action.comment)) ||
        (action.include_annotations !== undefined && typeof action.include_annotations !== 'boolean')) {
      throw new Error('Invalid Takeaways action guidance.');
    }
    if (action.id === 'review_takeaways' && !value(canvas).trim()) {
      throw new Error('Review requires existing Takeaways.');
    }
    return structuredClone({ canvas, action });
  }

  function validateProposal(proposal, validateContent, validateAnnotations) {
    if (!only(proposal, ['action', 'base_content', 'base_takeaways', 'base_annotations', 'takeaways', 'rationale']) ||
        !text(proposal.base_takeaways) || !nonblank(proposal.takeaways) || !nonblank(proposal.rationale)) {
      throw new Error('Invalid Takeaways proposal.');
    }
    validateContent(proposal.base_content);
    if (Object.hasOwn(proposal, 'base_annotations')) {
      if (!Array.isArray(proposal.base_annotations)) throw new Error('Invalid Takeaways annotation snapshot.');
      validateAnnotations(proposal.base_annotations);
    }
  }

  function compose(canvas, action, response) {
    if (!only(response, ['takeaways', 'rationale']) || !nonblank(response.takeaways) || !nonblank(response.rationale)) {
      throw new Error('Takeaways response requires proposed text and a rationale.');
    }
    const result = structuredClone(canvas);
    result.proposals = [{
      action: action.id,
      base_content: structuredClone(canvas.content),
      base_takeaways: value(canvas),
      ...(action.include_annotations === true ? { base_annotations: structuredClone(canvas.annotations ?? []) } : {}),
      takeaways: response.takeaways,
      rationale: response.rationale,
    }];
    return result;
  }

  function resolve(state, decision) {
    const proposal = state.proposals[0];
    if (decision === 'accept') {
      if (!review.same(state.content, proposal.base_content) || value(state) !== proposal.base_takeaways ||
          (proposal.base_annotations && !review.same(state.annotations ?? [], proposal.base_annotations))) {
        throw new Error('Takeaways proposal is stale. Reject it and request a fresh proposal.');
      }
      state.takeaways = proposal.takeaways;
    } else if (decision !== 'reject') {
      throw new Error('Unknown review decision.');
    }
    delete state.proposals;
  }

  return Object.freeze({ handles, value, request, validateProposal, compose, resolve });
})();
if (typeof module !== 'undefined' && module.exports) module.exports = Takeaways;
