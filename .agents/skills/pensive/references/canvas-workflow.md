# Canvas workflow

SWOT initialization, guided action export, thought display, and collection-level/bulk transformation review are available. Read [AI handoff](ai-workflow.md) for the implemented action protocol.

## Initialize

Select an available framework explicitly. Use its schema-valid initial state and established canvas implementation. Produce standalone HTML containing complete JSON state, local editing, clipboard JSON export, and saved HTML. Import JSON validates pasted complete state before confirmed replacement. Validated packaging can also initialize an artifact from JSON. Editing and navigation require neither AI nor a server.

AI-assisted SWOT initialization follows [create.md](../frameworks/swot/prompts/create.md). It produces a new reviewable AI-authored draft without prior accepted state, action envelope, proposals, or acceptance controls.

## Transform

Validate the complete request, schema version, action compatibility, and target before reasoning. Missing state or invalid targets must not be reconstructed from conversation history.

Read the selected method and relevant framework semantics and quality criteria. Evaluate appends a thought without changing analytical content. Strategize/Improve generate reviewable proposals while preserving accepted content. Resolve an existing pending proposal before requesting a new action; never silently replace it. Preserve existing identities and assign distinct stable IDs to new items.

Validate the resulting state and package it deterministically into the established framework HTML/CSS/JS. Each transformation writes a new standalone HTML artifact without modifying the input artifact. Do not regenerate the canvas implementation with the model.

## Transformation review and acceptance

Users accept or reject proposals locally without AI. Acceptance validates current references, framework rules, and complete resulting state before applying changes atomically. Invalid or stale acceptance leaves state unchanged and reports the issue. Generating or opening an artifact never implies acceptance. See [proposal review](proposal-review.md) for individual collection controls, batch decisions and persisted partial review.

## Failure boundaries

Explain unavailable capabilities, validation errors, or packaging failures. Do not label partially valid artifacts complete. Preserve input state and existing artifacts on failure. No server session or automatic history is required.
