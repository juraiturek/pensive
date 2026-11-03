# Destination architecture

## Authority and scope

README.md remains the unchanged authoritative product vision and design reference. This document records the approved slice-0 architecture and refines its illustrative layout and sequencing. The user reports V1/V2 audits complete; source folders and audit artifacts are unavailable here. No extraction findings are invented.

Slice 0 established the skill and contracts. Slice 1 adds a working, manually editable standalone SWOT/TOWS package. AI transformations of existing state remain unavailable. Slice 2A adds Markdown-driven SWOT initialization.

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

## Slice 1: standalone SWOT/TOWS

V1 supplies the default SWOT / expanded TOWS interaction model; V2 supplies selected visual and semantic cues. See [extraction-map.md](extraction-map.md) for provenance and adaptations. The README remains unchanged.

- Canonical state is `framework: swot`, `schema_version: 1.0`, and framework-owned `content`: framing, four factor collections, and four strategy collections. Items use stable `{id, text}` objects. JSON Schema defines structural validity; the shared Node/browser state utility additionally rejects duplicate IDs across collections.
- Empty framing, empty collections, and blank draft text are structurally valid. No legacy character/item caps or text-based identity/deduplication are inherited. IDs use an ASCII letter/digit prefix followed by letters, digits, underscores, or hyphens, at most 128 characters. New IDs use prefixed UUIDs.
- SWOT starts as a 2×2 editable factor matrix. An explicit toggle opens TOWS with read-only factor context around editable SO/WO/ST/WT intersections. The subtle count indicates strategy items, including drafts. View selection is transient; every HTML opens in SWOT.
- The only export controls are complete JSON to clipboard and standalone HTML to file. Clipboard denial exposes selected JSON for manual copying. File loading/import UI and local storage were explicitly deferred by the user after plan approval. JSON round-trip is verified through parsing and deterministic packaging instead of a page importer.
- Source markup (`canvas.template.html`), CSS (`canvas.css`), state/packaging operations (`state.js`), and UI (`canvas.js`) are separate. The small Node packager builds a committed, directly usable `canvas.html`. Development builds are deterministic; user-state packaging exclusively creates new files and changes only the state slot in established HTML.
- Browser saving takes a pristine DOM serialization before rendering or event wiring, then replaces only its designated state slot. This preserves script and stylesheet text across successive saves; browser-normalized markup can differ from original source formatting. It never serializes the edited canvas DOM as a replacement implementation.
- State serialization escapes HTML-sensitive characters, while content rendering uses text nodes and textarea values. Invalid initial state disables editing/export visibly. No backend, template runtime, generic rendering engine, AI integration, proposal machinery, or history is included.

Tests use Node's built-in runner, Ajv and Playwright as development-only dependencies, and a pnpm lockfile. Exported HTML has no external dependencies. See [testing.md](testing.md) for reproducible commands and current limitations.

## Slice 2A: SWOT creation

SKILL.md routes new analysis to framework-specific `prompts/create.md`; the manifest declares create without a dispatcher. One adaptive method uses available conversation and supplied materials, with zero to two question turns total. Sparse stubs require agreement unless already requested; unsupported quadrants may be empty. No objective defaults to a disclosed general assessment lens.

Creation initializes a reviewable AI-authored draft without an action envelope or proposals. The existing schema, state utility, canvas, and two-argument packager stay unchanged. Research recognition/execution remain future work. Existing-SWOT actions and AI TOWS are implemented in Slice 2B below.

## Slice 2B: guided AI actions

The approved implementation plan is [SWOT AI actions](plans/2026-11-02-swot-ai-actions.md). Three compact controls open a single local dialog: steering guidance, current-thought consideration, strategy extend/replace mode or evaluation scope. It prepares full `{canvas, action}` JSON to paste into a skill-enabled Codex/ChatGPT conversation; there is no API client, background inference, or persistence service.

Three progressively loaded methods derive grounded SO/ST/WO/WT choices, diagnose SWOT/TOWS quality, and improve coherence with an explanatory thought. V1 supplies the TOWS mapping and progressive/input-dialog pattern; V2 supplies canvas-grounded methodological criteria and explaining why/how. Hard item quotas and Jinja/server flows were rejected. Provenance is in [extraction-map.md](extraction-map.md).

The small envelope has optional current `thoughts` and at most one pending `proposals` entry. Existing version-1.0 states remain valid. Evaluate adds a message above the matrix without changing content. Strategize/Improve keep accepted content intact while displaying a candidate explanation and before/after review. The user accepts or rejects the entire transformation locally. A temporary base-content snapshot prevents stale acceptance after local edits and is discarded on resolution; it is not history. Existing annotations remain in the current state.

The deterministic `--result` packager validates the original request, model response shape, framework/action boundaries, exact-text identity preservation, and full result state before creating a new standalone HTML file. Models output data, not proposal internals or UI code. Framing stays unchanged; Strategize leaves all factors unchanged and defaults to preserving existing strategies. Improve relies on methodology for semantic identity across rewritten text, with deterministic checks for unchanged text. No generic action engine, research, section/item acceptance, or node-level actions were introduced.

## PAGES: second supported framework

The user brought PAGES forward from the original roadmap and approved the [revised design](plans/2026-11-02-pages-design.md). The package keeps framework-specific state and reasoning explicit and reuses the established SWOT stylesheet at build time, with a small five-band layout override. No generic canvas runtime or legacy backend was introduced. SWOT source/runtime remain unchanged.

PAGES content has `framing: {what, why, intuition}` plus Parts, Actions, Goals, Events and Self-concepts as stable item collections. V1 supplies the distinctive five-band presentation and Ripple implications concept. V2 supplies methodological guidance, framing vocabulary and core-only improvement. The isolated draft expansion Players/Aspirations/Goals/Enablers/Scope is rejected in favor of both implemented schemas. V1’s generation prompt attributes its principles to *The Craft of Creativity* by Matthew Cronin and Jeffrey Loewenstein; the book itself was not independently inspected.

PAGES implements creation, Evaluate (thought-only formulation/content quality), Improve (best-practice core revision) and Ripple (implications of one to four explicitly selected changed dimensions). Restate framing is deferred. Complete-state handoff, deterministic exclusive packaging, thoughts, whole-canvas proposals and stale acceptance follow the existing architecture, with PAGES-specific source/framing boundaries. JSON import is available for PAGES through validated pasted state and confirmed replacement; SWOT's capabilities are unchanged.

A single optional top-level `ripple_baseline` stores initialized core collections, excluding framing. New drafts initialize it after generation. Baseline absence is valid for imported state, but Ripple needs explicit establishment first. Stable-ID/text comparison marks additions, edits and deletions; moves appear as remove/add and ordering alone is ignored. Before/after changes remain available in exported JSON and saved HTML. No automatic reset occurs after edits, actions, saving or acceptance. Reset is an explicit user operation blocked during pending proposals. Proposal metadata includes a temporary baseline guard as well as the content guard; stale acceptance is atomic and leaves user edits intact. This is comparison state, not version history.

Six Thinking Hats remains a cross-framework future tool producing both reflections and suggested changes. Implement it after at least two frameworks stabilize and partial accept/reject is available. Neither partial acceptance nor Six Hats is a prerequisite for this PAGES slice.
