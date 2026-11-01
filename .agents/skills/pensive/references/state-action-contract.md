# Shared state and action contract

Status: minimal semantic contract. Concrete schemas and utilities arrive with their first working slices. The README example remains illustrative, not the final SWOT schema.

## Request

Retain exactly two top-level fields: `canvas` and `action`.

- `canvas` contains the complete current state: `framework`, `schema_version`, framework-specific `content`, and `proposals` when supported. Complete state includes pending proposals. Framework and version must be recognized by the selected package.
- `action` contains a supported `id`, optional user `comment`, and an explicit `target` for node-level actions. The target contains both `type` and stable `id`, resolved against submitted state. Canvas-level actions may omit the target when declared by the package.

Keep the envelope small. Concepts, relationships, and proposal payloads stay framework-specific. Do not normalize all frameworks into generic nodes/edges or introduce history, revisions, or server sessions.

## Identity and compatibility

Every independently targetable item and proposal has a stable, unique ID within its declared scope. Local editing, import/export, transformations, and acceptance preserve existing IDs. Missing, duplicate, ambiguous, or incompatible targets fail validation before reasoning or mutation. Unsupported versions fail explicitly; automatic migration is outside the MVP.

## Proposals

AI transformations produce reviewable proposals without silently modifying accepted content. Each identifies its intended targets and effect with enough context to validate acceptance against current state. Preserve pending proposals unless an explicit supported request changes them. Ordinary local edits remain direct user operations.

Users explicitly accept or reject locally. Acceptance validates the proposal, references, framework rules, and complete resulting state before applying changes atomically. If local edits invalidate a proposal's assumptions, acceptance fails without mutation. Accepted/rejected proposals may be removed from the pending set; no historical ledger is required. Detailed operations, conflict checks, and acceptance schemas arrive in slice 2.

## Packaging and import/export

Authoritative JSON must round-trip without losing supported state. Parse imports as data and validate before replacing local state. Render textual content safely rather than interpreting it as executable content.

A deterministic packager embeds serialized state in a designated slot in the tested canvas. JSON serialization alone does not make HTML embedding safe: neutralize HTML parser termination sequences including `</script>` and verify adversarial strings round-trip without execution. Preserve established HTML/CSS/JS outside the state slot. Artifacts work through `file://` without network dependencies or a server.

Each AI transformation writes a new standalone HTML artifact without overwriting the submitted artifact or depending on hidden conversation state.
