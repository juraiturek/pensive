/* Five Forces-local state and safe packaging; shared by Node and standalone HTML. */
const FiveForces = (() => {
  'use strict';
  const Notes =
    typeof module !== 'undefined' && module.exports
      ? require('../../shared/annotations.js')
      : Annotations;
  const Results =
    typeof module !== 'undefined' && module.exports
      ? require('../../shared/takeaways.js')
      : Takeaways;
  const Research =
    typeof module !== 'undefined' && module.exports
      ? require('../../shared/research.js')
      : PensiveResearch;
  const Hats =
    typeof module !== 'undefined' && module.exports
      ? require('../../shared/six-hats.js')
      : SixHats;
  const sections = Object.freeze([
    'new_entrants',
    'substitutes',
    'buyers',
    'suppliers',
    'rivalry',
  ]);
  const participants = Object.freeze([
    'rivals',
    'buyers',
    'suppliers',
    'substitutes',
    'entrants',
  ]);
  const framing = Object.freeze([
    'industry',
    'geography',
    'objective',
    ...participants,
  ]);
  const strengths = Object.freeze([
    'very_weak',
    'weak',
    'moderate',
    'strong',
    'very_strong',
  ]);
  const directions = Object.freeze([
    'increasing',
    'decreasing',
    'stable',
    'uncertain',
  ]);
  const blank = () => ({
    strength: null,
    confidence: null,
    analysis: [],
    research_notes: '',
  });
  const blankTrajectory = () => ({
    direction: null,
    horizon: '',
    confidence: null,
    analysis: [],
    research_notes: '',
  });
  const snippets = (content) =>
    sections.flatMap((k) => [
      ...content[k].analysis,
      ...(content[k].trajectory?.analysis ?? []),
    ]);
  function framingReady(content) {
    return (
      ['industry', 'geography', 'objective'].every((k) =>
        content.framing[k].trim(),
      ) && participants.some((k) => content.framing[k].trim())
    );
  }
  function requireFraming(content) {
    if (!framingReady(content))
      throw new Error(
        'Complete framing: industry/product boundary, geography, objective and an initial participant map (explicit unknowns are valid).',
      );
  }
  function validateTarget(target) {
    if (target === undefined) return;
    keys(
      target,
      target?.type === 'canvas' ? ['type'] : ['type', 'id'],
      'Target',
    );
    if (
      target.type !== 'canvas' &&
      !(target.type === 'section' && sections.includes(target.id))
    )
      throw new Error('Invalid force target.');
  }
  function checkIds(ids, id) {
    if (typeof id !== 'string' || !idPattern.test(id) || ids.has(id))
      throw new Error('Invalid or duplicate identity / ID collision.');
    ids.add(id);
  }

  const Review =
    typeof module !== 'undefined' && module.exports
      ? require('../../shared/proposal-review.js')
      : ProposalReview;
  const research = Research.create({
    sections,
    validateContent,
    boundary,
    equivalent: (a, b) =>
      same(a.framing, b.framing) &&
      sections.every((k) => same(sectionSnapshot(a, k), sectionSnapshot(b, k))),
    replaceSection,
    listTargets: () => [
      { type: 'canvas', label: 'Full canvas' },
      ...sections.map((id) => ({
        type: 'section',
        id,
        label: id.replaceAll('_', ' '),
      })),
    ],
  });
  const review = Review.create({
    sections,
    validateContent,
    snapshot: sectionSnapshot,
    replaceSection,
  });
  const idPattern = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
  function keys(value, required, path, optional = []) {
    if (
      !value ||
      typeof value !== 'object' ||
      Array.isArray(value) ||
      Object.keys(value).some(
        (k) => !required.includes(k) && !optional.includes(k),
      ) ||
      required.some((k) => !Object.hasOwn(value, k))
    )
      throw new Error(`${path}: expected exactly ${required.join(', ')}.`);
  }
  function validateContent(content) {
    keys(content, ['framing', ...sections], 'Content');
    keys(content.framing, framing, 'Framing');
    if (framing.some((k) => typeof content.framing[k] !== 'string'))
      throw new Error('Framing must contain text.');
    const ids = new Set();
    function record(r, temporal = false) {
      keys(
        r,
        temporal
          ? ['direction', 'horizon', 'confidence', 'analysis', 'research_notes']
          : ['strength', 'confidence', 'analysis', 'research_notes'],
        'Force record',
        temporal ? [] : ['trajectory'],
      );
      const value = temporal ? r.direction : r.strength;
      if (
        value !== null &&
        !(temporal ? directions : strengths).includes(value)
      )
        throw new Error('Invalid assessment.');
      if (
        r.confidence !== null &&
        (typeof r.confidence !== 'number' ||
          !Number.isFinite(r.confidence) ||
          r.confidence < 0 ||
          r.confidence > 1)
      )
        throw new Error('Confidence must be null or from 0 to 1.');
      if (
        !Array.isArray(r.analysis) ||
        typeof r.research_notes !== 'string' ||
        (temporal && typeof r.horizon !== 'string')
      )
        throw new Error('Invalid analysis, notes or horizon.');
      for (const item of r.analysis) {
        keys(item, ['id', 'text'], 'Snippet');
        checkIds(ids, item.id);
        if (typeof item.text !== 'string')
          throw new Error('Snippet must be text.');
      }
      if (!temporal && r.trajectory !== undefined) record(r.trajectory, true);
    }
    sections.forEach((k) => record(content[k]));
    return ids;
  }
  function sectionSnapshot(content, section) {
    if (!sections.includes(section)) throw new Error('Unknown force.');
    const r = structuredClone(content[section]);
    r.trajectory ??= blankTrajectory();
    return r;
  }
  function replaceSection(content, candidate, section) {
    content[section] = structuredClone(candidate[section]);
  }
  function editForce(state, section, record, temporal = false) {
    validate(state);
    if (!sections.includes(section)) throw new Error('Unknown force.');
    if (
      proposalSections(state).some(
        (e) => e.section === section && e.status === 'pending',
      )
    )
      throw new Error('Resolve force review before editing.');
    const next = structuredClone(state);
    if (temporal) next.content[section].trajectory = structuredClone(record);
    else next.content[section] = structuredClone(record);
    validate(next);
    state.content = next.content;
  }
  function same(a, b) {
    if (a === b) return true;
    if (
      !a ||
      !b ||
      typeof a !== 'object' ||
      typeof b !== 'object' ||
      Array.isArray(a) !== Array.isArray(b)
    )
      return false;
    return (
      Object.keys(a).length === Object.keys(b).length &&
      Object.keys(a).every((k) => Object.hasOwn(b, k) && same(a[k], b[k]))
    );
  }
  function validateThought(thought, ids) {
    keys(thought, ['id', 'kind', 'text'], 'Thought');
    if (
      typeof thought.id !== 'string' ||
      !idPattern.test(thought.id) ||
      ids.has(thought.id)
    )
      throw new Error('Invalid or duplicate thought ID.');
    if (
      !['evaluation', 'improvement'].includes(thought.kind) ||
      typeof thought.text !== 'string' ||
      !thought.text.trim()
    )
      throw new Error('Invalid thought.');
    ids.add(thought.id);
  }
  function boundary(before, after, target) {
    if (!same(before.framing, after.framing))
      throw new Error('Actions must preserve framing.');
    if (
      target?.type === 'section' &&
      sections.some(
        (k) =>
          k !== target.id &&
          !same(sectionSnapshot(before, k), sectionSnapshot(after, k)),
      )
    )
      throw new Error('Candidate changed content outside the target.');
    const previous = snippets(before);
    for (const k of sections)
      for (const temporal of [false, true]) {
        const old = temporal
          ? (before[k].trajectory?.analysis ?? [])
          : before[k].analysis;
        const next = temporal
          ? (after[k].trajectory?.analysis ?? [])
          : after[k].analysis;
        for (const item of next) {
          const matches = old.filter((i) => i.text === item.text);
          if (matches.length && !matches.some((i) => i.id === item.id))
            throw new Error(
              'Retained text must preserve an existing matching ID / identity.',
            );
          if (
            previous.some((i) => i.id === item.id) &&
            !old.some((i) => i.id === item.id)
          )
            throw new Error(
              'Snippet identity must remain in its force and perspective.',
            );
        }
      }
  }
  function validate(state) {
    keys(state, ['framework', 'schema_version', 'content'], 'Canvas', [
      'thoughts',
      'proposals',
      'annotations',
      'takeaways',
    ]);
    if (state.framework !== 'five_forces' || state.schema_version !== '1.0')
      throw new Error(
        'Unsupported framework/version; expected five_forces / 1.0.',
      );
    const ids = validateContent(state.content);
    if (state.takeaways !== undefined && typeof state.takeaways !== 'string')
      throw new Error('Takeaways must be text.');
    Notes.validate(state.annotations, [], sections);
    for (const n of state.annotations ?? []) checkIds(ids, n.id);
    if (state.thoughts !== undefined) {
      if (!Array.isArray(state.thoughts))
        throw new Error('Thoughts must be an array.');
      for (const entry of state.thoughts) {
        if (entry?.kind === 'research') Research.validateThought(entry, ids);
        else if (entry?.kind === 'six_hats') {
          Hats.validateThought(entry, ids, state.framework);
          validateTarget(entry.target);
        } else validateThought(entry, ids);
      }
    }
    if (state.proposals !== undefined) {
      if (!Array.isArray(state.proposals) || state.proposals.length > 1)
        throw new Error('At most one pending proposal is supported.');
      for (const proposal of state.proposals) {
        if (proposal?.action === 'research') {
          research.validateProposal(proposal);
          const proposedIds = validateContent(
            proposal.content || proposal.base_content,
          );
          if (
            [...(state.thoughts || []), ...(state.annotations ?? [])].some(
              (t) => proposedIds.has(t.id),
            )
          )
            throw new Error(
              'Research snippet ID collides with a thought or manual annotation ID.',
            );
          continue;
        }
        if (Results.handles(proposal?.action)) {
          Results.validateProposal(proposal, validateContent, (notes) =>
            Notes.validate(notes, [], sections),
          );
          continue;
        }
        keys(
          proposal,
          ['id', 'action', 'base_content', 'content', 'thought'],
          'Proposal',
          ['resolutions', 'target'],
        );
        if (!['improve'].includes(proposal.action))
          throw new Error('Unsupported proposal action.');
        const baseIds = validateContent(proposal.base_content),
          candidateIds = validateContent(proposal.content);
        validateTarget(proposal.target);
        boundary(proposal.base_content, proposal.content, proposal.target);
        const annotationIds = new Set([
          ...(state.thoughts || []).map((t) => t.id),
          ...(state.annotations ?? []).map((n) => n.id),
        ]);
        if (
          [...annotationIds].some(
            (id) => baseIds.has(id) || candidateIds.has(id),
          )
        )
          throw new Error('Proposed item collides with an annotation ID.');
        for (const id of baseIds) ids.add(id);
        for (const id of candidateIds) ids.add(id);
        if (
          typeof proposal.id !== 'string' ||
          !idPattern.test(proposal.id) ||
          ids.has(proposal.id)
        )
          throw new Error('Invalid or duplicate proposal ID.');
        ids.add(proposal.id);
        validateThought(proposal.thought, ids);
        if (proposal.thought.kind !== 'improvement')
          throw new Error('Improve proposal needs an improvement thought.');
        review.validate(proposal);
      }
    }
    return state;
  }
  function initialState() {
    return {
      framework: 'five_forces',
      schema_version: '1.0',
      content: {
        framing: Object.fromEntries(framing.map((k) => [k, ''])),
        ...Object.fromEntries(sections.map((k) => [k, blank()])),
      },
    };
  }
  function validateRequest(request) {
    keys(request, ['canvas', 'action'], 'Request');
    validate(request.canvas);
    if (request.canvas.proposals?.length)
      throw new Error('Resolve the pending proposal first.');
    requireFraming(request.canvas.content);
    if (request.action?.id === 'research')
      return research.request(request.canvas, request.action);
    if (Results.handles(request.action?.id))
      return Results.request(request.canvas, request.action);
    if (request.action?.id === 'six_hats') {
      Hats.validateAction(request.canvas, request.action);
      return request;
    }
    keys(request.action, ['id'], 'Action', [
      'comment',
      'use_thoughts',
      'target',
    ]);
    const action = request.action;
    if (!['evaluate', 'improve'].includes(action.id))
      throw new Error('Unsupported Five Forces action.');
    validateTarget(action.target);
    if (
      (action.comment !== undefined && typeof action.comment !== 'string') ||
      (action.use_thoughts !== undefined &&
        typeof action.use_thoughts !== 'boolean')
    )
      throw new Error('Invalid action guidance.');
    return request;
  }
  function buildRequest(state, action) {
    if (
      action?.id === 'research' ||
      Results.handles(action?.id) ||
      action?.id === 'six_hats'
    )
      return validateRequest(structuredClone({ canvas: state, action }));
    const request = {
      canvas: structuredClone(state),
      action: {
        ...structuredClone(action),
        use_thoughts: action.use_thoughts ?? true,
      },
    };
    return validateRequest(request);
  }
  function composeResult(request, response) {
    validateRequest(request);
    if (request.action.id === 'research')
      return validate(
        research.compose(request.canvas, request.action, response),
      );
    if (Results.handles(request.action.id))
      return validate(
        Results.compose(request.canvas, request.action, response),
      );
    if (request.action.id === 'six_hats')
      return validate(Hats.append(request.canvas, request.action, response));
    keys(
      response,
      request.action.id === 'evaluate' ? ['thought'] : ['content', 'thought'],
      'Response',
    );
    if (typeof response.thought !== 'string' || !response.thought.trim())
      throw new Error('Response thought must be nonempty text.');
    const result = structuredClone(request.canvas),
      ids = validateContent(result.content);
    for (const thought of result.thoughts || []) ids.add(thought.id);
    for (const note of result.annotations ?? []) ids.add(note.id);
    if (['improve'].includes(request.action.id)) {
      for (const id of validateContent(response.content)) {
        if (
          [...(result.thoughts || []), ...(result.annotations ?? [])].some(
            (t) => t.id === id,
          )
        )
          throw new Error('Candidate item collides with an annotation ID.');
        ids.add(id);
      }
      boundary(result.content, response.content, request.action.target);
    }
    function fresh(prefix) {
      let id;
      do {
        id = `${prefix}-${crypto.randomUUID()}`;
      } while (ids.has(id));
      ids.add(id);
      return id;
    }
    const thought = {
      id: fresh('thought'),
      kind: request.action.id === 'evaluate' ? 'evaluation' : 'improvement',
      text: response.thought,
    };
    if (
      request.action.id === 'evaluate' ||
      sections.every((k) =>
        same(
          sectionSnapshot(result.content, k),
          sectionSnapshot(response.content, k),
        ),
      )
    )
      result.thoughts = [...(result.thoughts || []), thought];
    else
      result.proposals = [
        {
          id: fresh('proposal'),
          action: request.action.id,
          base_content: structuredClone(result.content),
          content: structuredClone(response.content),
          thought,
          ...(request.action.target
            ? { target: structuredClone(request.action.target) }
            : {}),
        },
      ];
    return validate(result);
  }
  function proposalSections(state) {
    validate(state);
    return state.proposals?.length &&
      !Results.handles(state.proposals[0].action) &&
      state.proposals[0].action !== 'research'
      ? review.entries(state.proposals[0])
      : [];
  }
  function resolveProposal(state, selected, decision) {
    validate(state);
    const proposal = state.proposals?.[0];
    if (!proposal) throw new Error('No pending proposal.');
    if (proposal.action === 'research') {
      if (selected !== undefined)
        throw new Error('Research review applies to the whole batch.');
      return research.resolveProposal(state, decision, validate);
    }
    if (Results.handles(proposal.action)) {
      if (selected !== undefined)
        throw new Error('Takeaways review applies to the whole text.');
      return Results.resolve(state, decision);
    }
    if (
      decision === 'accept' &&
      !same(state.content, review.expected(proposal))
    )
      throw new Error(
        'Canvas content or framing changed; reject remaining changes and request again.',
      );
    const next = review.apply(state, selected, decision);
    validate(next);
    Object.assign(state, next);
  }
  function acceptProposal(state) {
    resolveProposal(state, undefined, 'accept');
  }
  function rejectProposal(state) {
    resolveProposal(state, undefined, 'reject');
  }
  function parseState(json) {
    return validate(JSON.parse(json));
  }
  function safeJson(state) {
    validate(state);
    return JSON.stringify(state, null, 2).replace(
      /[<>&\u2028\u2029]/g,
      (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`,
    );
  }
  function packageHtml(html, state) {
    const start = ['<!--', 'pensive-state-start', '-->'].join(''),
      end = ['<!--', 'pensive-state-end', '-->'].join('');
    const first = html.indexOf(start),
      last = html.indexOf(end);
    if (
      first < 0 ||
      last < first ||
      html.indexOf(start, first + start.length) !== -1 ||
      html.indexOf(end, last + end.length) !== -1
    )
      throw new Error('Expected one complete state slot.');
    return (
      html.slice(0, first) +
      `${start}\n<script id="canvas-state" type="application/json">${safeJson(state)}<${'/script>'}\n${end}` +
      html.slice(last + end.length)
    );
  }
  return Object.freeze({
    sections,
    framing,
    participants,
    strengths,
    directions,
    blankTrajectory,
    framingReady,
    requireFraming,
    researchTargets: research.targets,
    sectionSnapshot,
    editForce,
    initialState,
    validate,
    validateContent,
    validateRequest,
    buildRequest,
    composeResult,
    proposalSections,
    resolveProposal,
    acceptProposal,
    rejectProposal,
    parseState,
    safeJson,
    packageHtml,
  });
})();
if (typeof module !== 'undefined' && module.exports)
  module.exports = FiveForces;
