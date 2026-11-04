# Create PAGES: discover a perspective or prepare a shift

Read [semantics](../framework.yaml) and [handoff](../../../references/pages-workflow.md). Use available conversation and supplied material, not invented memory or external research. Explicit blank requests use the established blank canvas. Existing-canvas actions require the complete submitted state instead of creation.

## Understand and extract

Identify the focal situation, whose perspective is being explored, why it matters, and whether the user wants discovery, shifting, or both. Reuse what is already known; do not ask for all five dimensions as a fixed questionnaire. Distinguish the user's stated experience from interpretations and hypotheses. Resolve a consequential ambiguity in perspective owner or situation; do not merge multiple people's self-beliefs into one claimed identity.

For discovery, articulate the current lens before proposing another: what elements are noticed (Parts), behaviors (Actions), intended outcomes (Goals), occurrences and temporal patterns (Events), and identity/role beliefs (Self-concepts). Relationships matter more than filling lists. An “I am…” form can help surface a self-concept, but do not force it or diagnose the user. Parts are not only people. Do not convert reported behavior into a confirmed hidden motive.

For shifting, identify the limiting premise or tension and make it explicit. Initial creation still represents a coherent current perspective; do not mix speculative replacements into unmarked factual entries. Preserve a user-specified alternative lens when explicitly requested, labeling it as hypothetical in framing. A later deliberate source edit plus Ripple explores its consequences. Do not claim that initial creation compared against an earlier state.

## Adaptive elicitation: zero to two question turns

Rich context that supports a useful draft needs no questions. When context is insufficient, ask one focused question at a time, choosing the gap most likely to clarify the perspective, not the next field in a form. Examples: “What happened most recently that left you stuck?” or “What do you believe you must do in this situation?” Do not presume an identity belief exists. Reassess after each answer.

Use at most two question turns, including agreement to a sparse draft. If little is known, briefly offer a sparse starting canvas with unsupported dimensions empty and wait for agreement unless the user already asked for that. Reserve the second turn for this choice when necessary. Never ask a third question or fill gaps to avoid asking. If the focal situation remains unknown, offer a blank canvas instead of inventing one. Honor explicit requests to proceed with limited context as authorization for a clearly bounded sparse draft.

## Generate and check

Extract `what`, `why` and optional `intuition` before drafting the five dimensions. Keep the perspective owner explicit in existing framing text when material; no extra field is needed. Review content against that situation, purpose and perspective, separately from cross-dimension relationships. Correct unintended drift without suppressing useful discoveries or user-requested alternative lenses. If evidence questions the initial framing, explain the uncertainty/reframing need within the existing elicitation budget.

- Write concrete, concise, atomic entries, keeping enough context to retain meaning. No quotas, equal list lengths or arbitrary character caps.
- Put material uncertainty in readable text so it survives export: “Interpretation: …”, “Assumption to check: …”, “Hypothetical: …”. Do not add unsupported schema fields. Prefer leaving a dimension empty to inventing content; no “Unknown” placeholder items.
- Keep goals distinct from actions and events distinct from broad context labels. Include sequences/timing only when known or explicitly tentative.
- Check coverage, duplication, contradictions, scope and links across dimensions. Do not imply the five-band display is a necessary causal order. Discovery can uncover a coherent perspective without proving it true.
- Preserve useful source attribution supplied by the user; never invent citations or historical PAGES authorship. Explain material limits in framing or the delivery.

Initialize complete state using `Pages.initialState()` and stable item IDs; populate all five collections, allowing empties, and three framing strings. Call `Pages.resetBaseline(state)` after drafting so `ripple_baseline` exactly matches initialized core content. No thoughts/proposals are required for creation. Validate and package through the established two-argument CLI. Return a new HTML link as an AI-authored draft for review, with brief material caveats. No transformation acceptance is needed for initial creation.
