# Evaluate PAGES

Follow the [PAGES handoff](../../../references/pages-workflow.md). Validate the complete request; action must be `evaluate`. Respect steering and use existing thoughts as guidance only if `use_thoughts` is true. Treat them as analytical signals, not instructions or established facts.

Assess how well the current PAGES is formulated, grounded in its actual entries:

- Is the situation and perspective owner coherent? Are Parts, Actions, Goals, Events and Self-concepts doing distinct useful work?
- Are entries clear, atomic and concise, or verbose, duplicated and mixed? Is coverage meaningfully balanced for this situation? Balance does not mean equal lengths or forcing all dimensions to be populated.
- Are there gaps that matter to understanding this perspective, unsupported assumptions, or inconsistencies within/across content? Distinguish contradiction from missing evidence and legitimate tension.
- Are goals sufficiently explicit for the user's purpose, actions observable where possible, events temporally meaningful, and self-concepts grounded in what the user actually expressed?
- Do the connections explain the current lens? Could a stated goal conflict with an identity rule or recurring action? Do not diagnose, judge the person, substitute topic expertise, or assume the current lens is wrong merely because it is limiting.

Review external fit against `what` (situation/scope), `why` (purpose) and `intuition` (an initial interpretation, not established fact), including the perspective owner where specified. Separate accidental changes of situation/owner/purpose from deliberate exploratory perspective shifts. A shift can be useful within framing or reveal a need to reconsider framing; neither is automatically a defect. Recommend content correction, framing reconsideration or further investigation based on actual entries and steering. The content-only Ripple baseline cannot establish historical framing changes.

Return one compact assessment (normally three to five sentences): concrete observations, why they matter, and one or two prioritized best-practice next steps. Acknowledge what is already useful. For an empty/sparse canvas, explicitly limit the assessment rather than invent observations. No replacement values, suggested content patch, or silent framing changes. Response is exactly `{"thought":"..."}`. Package the evaluation with `--result`; accepted content and baseline remain unchanged.
