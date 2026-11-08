# Shared state and action contract

Status: SWOT implements the complete-state request protocol, thoughts, and one whole-canvas proposal with deterministic validation and packaging. The README example remains illustrative, not the final SWOT schema.

## Request

New SWOT creation initializes complete state directly without a request envelope or proposal acceptance. The following request/proposal rules apply to transformations of existing state.

Retain exactly two top-level fields: `canvas` and `action`.

- `canvas` contains the complete current state: `framework`, `schema_version`, framework-specific `content`, and `proposals` when supported. Complete state includes pending proposals. Framework and version must be recognized by the selected package.
- `action` contains a supported `id`, optional user `comment`, and an explicit `target` for node-level actions. The target contains both `type` and stable `id`, resolved against submitted state. Canvas-level actions may omit the target when declared by the package.

Keep the envelope small. Concepts, relationships, and proposal payloads stay framework-specific. Do not normalize all frameworks into generic nodes/edges or introduce history, revisions, or server sessions.

## Identity and compatibility

Every independently targetable item and proposal has a stable, unique ID within its declared scope. Local editing, import/export, transformations, and acceptance preserve existing IDs. Missing, duplicate, ambiguous, or incompatible targets fail validation before reasoning or mutation. Unsupported versions fail explicitly; automatic migration is outside the MVP.

## Proposals

AI transformations produce reviewable proposals without silently modifying accepted content. Each identifies its intended targets and effect with enough context to validate acceptance against current state. Preserve pending proposals unless an explicit supported request changes them. Ordinary local edits remain direct user operations.

Users explicitly accept or reject locally. Acceptance validates the proposal, references, framework rules, and complete resulting state before applying changes atomically. If local edits invalidate a proposal's assumptions, acceptance fails without mutation. Accepted/rejected proposals may be removed from the pending set; no historical ledger is required. Collection-level and bulk decisions are implemented; see [proposal review](proposal-review.md). Bullet-level acceptance is not supported.

## Packaging and import/export

Authoritative JSON must round-trip without losing supported state. Parse imports as data and validate before replacing local state. Render textual content safely rather than interpreting it as executable content.

A deterministic packager embeds serialized state in a designated slot in the tested canvas. JSON serialization alone does not make HTML embedding safe: neutralize HTML parser termination sequences including `</script>` and verify adversarial strings round-trip without execution. Preserve established HTML/CSS/JS outside the state slot. Artifacts work through `file://` without network dependencies or a server.

Each AI transformation writes a new standalone HTML artifact without overwriting the submitted artifact or depending on hidden conversation state.

## Implemented SWOT action extension

Version-1.0 state accepts optional top-level `thoughts` and `proposals`. Existing plain canvases and blank initialization remain valid without these fields. Older runtimes do not understand the extension; use the current tested canvas for action results. This is additive support, not a migration of submitted content.

- `action.id` is `strategize`, `evaluate`, or `improve`. `comment` is optional text; `use_thoughts` defaults true. Strategize accepts `mode: extend|replace` (default extend), Evaluate `scope: swot|tows|both` (default both). No node targets are used by these canvas-level actions.
- A current thought is `{id, kind, text}`, with kind `evaluation`, `improvement`, or `strategize`. IDs are unique across current items, annotations, and proposal metadata. Thoughts are user-visible current annotations, not revision snapshots.
- At most one pending proposal is supported: `{id, action, base_content, content, thought}`, optionally with local `resolutions` metadata. `base_content` is a temporary concurrency guard, `content` the complete candidate. It is not an accepted revision. Pending proposals survive export/save; new action requests are blocked until resolved.
- Evaluate accepts only a thought response; analytical content is unchanged. Strategize preserves framing and all SWOT arrays; extend mode preserves every existing strategy unchanged. Improve preserves framing and retains identities for retained concepts. Exact-text item re-identification is rejected deterministically; semantic identity across rewrites also requires methodological judgment.
- Collection-level acceptance checks current content against the original `base_content` plus previously accepted collections and validates the entire mixed resulting state atomically. Unrelated local edits make further acceptance stale; rejection preserves those edits and earlier acceptances. Decisions persist until all changed collections are resolved. Completion clears the proposal and, if any content was accepted, appends the original rationale with explicit accepted/rejected node names. Bullet-level controls and history remain absent.

The shared Node/browser `state.js` enforces structural and cross-field rules beyond JSON Schema. The result packager composes the outcome from the original request and model response; the model does not supply arbitrary proposal metadata. See [AI handoff](ai-workflow.md) for commands and exact response shapes.

## Implemented 5 Whys specialization

5 Whys retains the two-key `{canvas,action}` request and framework-owned nested causal tree. Its complete state includes a top-level navigation cursor. Reflect (`evaluate`) appends only a thought. Expand requires `{target:{type:"node",id},mode:"deepen"|"branch"}` and returns new direct-child text plus a rationale, never replacement content. The composer resolves permitted parent, assigns IDs and creates an atomic append-batch proposal with a complete analytical-content guard. Navigation does not invalidate it; analytical edits do. See [5 Whys handoff](five-whys-workflow.md) for target/context/modification scopes and exact shapes. Existing collection review is unchanged.

The shared [Six Thinking Hats action](six-hats-workflow.md) uses this envelope across all four canvases. Its response appends a typed reflection to `thoughts` while preserving the rest of the submitted state.

## VARS and shared Research extension

[VARS](vars-workflow.md) owns a fixed four-quadrant summary plus optional quadrant/item Markdown. Improve and explicit-change Ripple resolve quadrants atomically, including detail text; Ripple uses no saved baseline. Shared annotations, Six Hats and Takeaways retain their established boundaries.

[Research](research-workflow.md) is host-executed and supported initially by VARS and SWOT. Full-state requests carry explicit targets and separate opt-in AI-thought/manual-annotation flags. A report, sources and optional target-scoped candidate form one pending batch. Acceptance checks submitted content and opted-in context, applies edits and records findings atomically. Research does not infer organizational facts from competitors or introduce an HTML search backend, history or rollback.

## Five Forces specialization

[Five Forces](five-forces-workflow.md) uses complete-state requests, fixed force-section targets, sufficient framing for every substantive AI route, thought-only Evaluate and framing-preserving scoped Improve. Force records, including trajectory, are reviewed atomically per section. Shared Research, Takeaways and Six Hats retain their respective mutation and approval boundaries. Null and numeric confidence preserve their exact values through JSON/HTML.
