# Destination architecture

## Authority and scope

README.md remains the unchanged authoritative product vision and design reference. This document records the approved slice-0 architecture and refines its illustrative layout and sequencing. The user reports V1/V2 audits complete; source folders and audit artifacts are unavailable here. No extraction findings are invented.

Slice 0 delivers an instruction-only skill and contracts. No framework can yet be initialized or transformed.

## Responsibilities

| Responsibility | Location within `.agents/skills/pensive/` | Boundary |
| --- | --- | --- |
| Skill orchestration | `SKILL.md`, `references/` | Framework recognition, interpretation, action selection, relevant instruction loading, artifact coordination. |
| Reasoning library | Future `prompts/` | Shared Markdown actions, analytical methods, conditional reasoning, evidence requirements. |
| Framework packages | Future `frameworks/<id>/` | YAML semantics, state schema, distinctive canvas, specialized methods, quality criteria, acceptance rules. |
| Deterministic utilities | Future `scripts/` | Local state operations, validation, proposal acceptance, safe packaging, import/export. |

Root AGENTS.md contains developer instructions; docs/ contains development architecture and sequencing. Operational knowledge stays self-contained inside the skill. Load references and methods only when relevant.

Do not create empty directories or speculative helpers. Shared browser assets require demonstrated reuse. Optional UI metadata is omitted; normal implicit skill discovery remains enabled.

## Data flow

User request → framework/action resolution → complete-state and target validation → selected Markdown reasoning → reviewable proposals → resulting-state validation → deterministic packaging → new standalone HTML → local user review and acceptance.

Initialization uses the framework's valid initial state and established canvas. Local editing/import/export work without AI. Every AI request carries full current state in `canvas` plus `action`; conversation context must not silently replace edits. Existing content, identities, and proposals survive transformations. Node actions explicitly identify targets. User-controlled acceptance validates before atomic mutation.

Framework-specific JSON is authoritative within a small envelope. Preserve tested canvas implementations during packaging. Do not introduce a generic canvas engine, runtime Jinja, backend, database, API client, or automatic history.

Contracts are maintained once in [framework-contract.md](../.agents/skills/pensive/references/framework-contract.md) and [state-action-contract.md](../.agents/skills/pensive/references/state-action-contract.md). Operational details are in [canvas-workflow.md](../.agents/skills/pensive/references/canvas-workflow.md).

## Legacy extraction policy

V1 and V2 remain read-only libraries. For every authorized slice:

1. Identify the exact capability required and its destination.
2. Obtain access if needed; inspect only relevant source files.
3. Compare relevant materials and choose the strongest source.
4. Extract or adapt the minimum code or methodology.
5. Integrate into the destination without obsolete application infrastructure.
6. Add focused behavior and invariant tests.
7. Run relevant existing regression tests.
8. Document source file/revision where available, capability, destination, adaptations, rationale, and verification in an extraction map introduced with the first extraction.

Never bulk-copy source directories or preserve dependencies for convenience. Use the README's RrEAC method for reasoning instructions; distinguish sourced principles, adaptations, and original decisions.

## Slice-0 execution plan

Preserve and checksum README.md; initialize local Git; create the approved developer guidance, skill, references, architecture, roadmap, and testing strategy; validate metadata and local references; verify README integrity and review the final diff. No legacy access is needed. Future slices, remotes, and pushes require separate authorization.

## Conventions

- [OpenAI: Build skills](https://learn.chatgpt.com/docs/build-skills): repository discovery, required metadata, progressive disclosure, optional resources.
- [OpenAI: AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md): developer guidance.
- Installed skill-creator guidance informs concise orchestration and conditional references.

Use `references/` instead of the README's illustrative `guidance/`. Defer example frameworks, assets, examples, extraction map, and license until needed. Do not rewrite the README's status or roadmap wording to reflect these implementation details.
