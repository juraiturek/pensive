# Canvas workflow

The selected framework owns its state, analytical methods, validation and review semantics. [Conversation working folders](working-folder-workflow.md) own default local delivery and persistence across all six frameworks. Read that route before creation or action processing.

## Initialize or reuse

Use the selected framework's schema-valid complete state and established renderer. Locate the originating conversation registry/current analysis before generating another draft. Reuse its current canvas unless the user requests a separate new analysis. A genuinely new analysis uses `conversation.mjs create`, with an explicit host outputs root, originating conversation identity and readable title. The host runs `launch` and returns its live browser URL. Framework blank creation initializes empty state through this same route.

AI-assisted SWOT initialization follows [create.md](../frameworks/swot/prompts/create.md); other frameworks follow their own Create method. Initial drafting creates reviewable content without pretending that a prior version or accepted proposal exists. PAGES initializes its Ripple baseline only after genuinely new content is generated.

## Transform

Validate the complete request, schema version, action compatibility and target before reasoning. Preserve outer saved-revision metadata and use the full inner `{canvas,action}`. Missing state or invalid targets must not be reconstructed from conversation history. Direct chat actions and legacy standalone requests use exact binding/adoption from the working-folder workflow, not content-similarity matching.

Read the selected method and relevant framework semantics and quality criteria. Evaluate appends a thought without changing analytical content. Improvement/strategy actions create reviewable proposals under their own boundaries. Resolve pending proposals before new actions, preserve stable identities and respect framework-specific source/baseline rules.

Write response data and commit through `workspace.mjs result` against its exact saved revision. Return the existing live canvas URL and saved revision, never a timestamped new HTML for an iteration. Do not regenerate renderer HTML/CSS/JS with the model.

## Review and acceptance

Users accept or reject proposals locally. Acceptance validates references, framework rules and complete resulting state atomically; stale acceptance leaves state unchanged. Saving a result or opening the canvas never implies acceptance. See [proposal review](proposal-review.md) for collection/bulk controls and partial review. Review decisions and PAGES baseline reset persist as separate saved events.

## Explicit export and limitations

For an explicit standalone HTML export, the deterministic framework packager embeds complete JSON into the established renderer and exclusively creates a new file. Such a detached file opens offline through `file://` without the working-folder service. JSON import validates complete state and confirms replacement. JSON export retains full state; neither export automatically includes the revision archive.

Explain concrete host/runtime/storage failures and preserve existing state. If default local persistence is unavailable, offer standalone HTML/JSON as a disclosed fallback and wait for the user's choice unless already authorized. Do not silently produce versioned HTML or claim a fallback export updated the live canvas. Never label a partially valid artifact or failed save complete.
