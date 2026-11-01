# Canvas workflow

This contract describes future implementations; none exist yet.

## Initialize

Select an available framework explicitly. Use its schema-valid initial state and established canvas implementation. Produce standalone HTML containing complete JSON state, local editing, and JSON import/export. Editing and navigation require neither AI nor a server.

## Transform

Validate the complete request, schema version, action compatibility, and target before reasoning. Missing state or invalid targets must not be reconstructed from conversation history.

Read the selected method and relevant framework semantics and quality criteria. Generate reviewable proposals while preserving accepted content and existing pending proposals. Preserve existing identities and assign distinct stable IDs to new items.

Validate the resulting state and package it deterministically into the established framework HTML/CSS/JS. Each transformation writes a new standalone HTML artifact without modifying the input artifact. Do not regenerate the canvas implementation with the model.

## Review and acceptance

Users accept or reject proposals locally without AI. Acceptance validates current references, framework rules, and complete resulting state before applying changes atomically. Invalid or stale acceptance leaves state unchanged and reports the issue. Generating or opening an artifact never implies acceptance.

## Failure boundaries

Explain unavailable capabilities, validation errors, or packaging failures. Do not label partially valid artifacts complete. Preserve input state and existing artifacts on failure. No server session or automatic history is required.
