# Implementation roadmap

This approved sequence refines the README's broad phases without editing the authoritative vision. Each slice requires separately scoped implementation work. Slice 0 does not authorize extraction or future slices.

| Slice | Deliverable | Exit evidence |
| --- | --- | --- |
| 0 | Independent local repository, skill skeleton, minimal contracts, documented testing infrastructure strategy. | Skill validation, reference checks, unchanged README, scope review; no legacy code. |
| 1 — delivered | Standalone manually editable SWOT/TOWS canvas. | Offline editing, stable IDs, validation, clipboard JSON, saved HTML round-trip, safe embedding, extraction provenance. File-loading UI deferred by user. |
| 2A — delivered | New SWOT from context and at most two question turns; agreed sparse drafts. | Methodology scenarios, complete-state packaging, existing canvas regressions. |
| 2B — delivered | Guided Strategize, Evaluate, Improve; current thoughts and whole-canvas proposal acceptance. | Full requests, content/proposal preservation, explicit acceptance/rejection, invalid/stale acceptance safety, second transformation cycle. |
| 3 | First generic node-level reasoning action. | Explicit targets, compatibility enforcement, methodology evaluation, SWOT regressions. |
| 4 | Standalone VPC canvas. | Distinctive semantics and visuals, offline editing and round-trip, SWOT/VPC regressions. |
| 5 | Generic action reuse and VPC fit assessment. | Explicit concept/target mapping, fit evaluation, cross-framework proposal regressions. |
| 6 | Standalone PAGES canvas. | PAGES visual behavior, valid state and local workflow, implemented-framework regressions. |
| 7 | Action reuse and PAGES-specific methodology. | Compatibility and methodology evaluation, regressions across implemented frameworks. |
| 8, later | 5 Whys, additional tools, history, private frameworks. | Agree scope and contracts when pursued; no implementation now. |

For each vertical slice, inspect relevant read-only references, integrate minimal material, test, and record provenance. Avoid premature framework packages, generic runtimes, package discovery, distribution, or history. Choose licensing before public release. Remote creation and pushes require explicit authorization.

Slice 1 includes manual SO/ST/WO/WT strategies and read-only factor context in TOWS. Slice 2B adds the separately authorized AI actions and whole-canvas proposal acceptance; Slice 1 did not include them.

Future user story: recognize when external research would improve SWOT creation and execute appropriate web searches. Slice 2A uses available conversation and supplied materials only.

## PAGES priority and cross-framework tools — user review, 2026-11-02

The current authorized work brings PAGES creation, canvas and methodology forward from the original slice 6/7 sequence. See [PAGES design](plans/2026-11-02-pages-design.md). Initial actions are Evaluate, Improve and Ripple; Restate framing is deferred. Ripple is a generic tool implemented first with PAGES-specific interpretation, using a persistent comparison baseline to identify source changes. This does not authorize a generic action engine or revision history.

Subsequent ordering:

1. Stabilize at least two frameworks (initially SWOT and PAGES), including their creation, editing, action handoff and import/export behavior.
2. Implement partial accept/reject for suggested changes as a separately scoped slice. It is not a prerequisite for delivering PAGES.
3. Implement Six Thinking Hats across supported canvases, producing both reflections and suggested changes. Require explicit framework compatibility and partial acceptance; do not limit Six Hats to PAGES or thought-only output.

Other deferred tools and frameworks remain separately scoped. README remains unchanged.


## Approved VPC slice — 2026-11-03

Implement the five-field V2-derived framing model and six standard VPC collections, then Evaluate and Improve, in that order. See [approved audit/design](plans/2026-11-03-vpc-phase-a-review.md). Evaluate includes fit, evidence and framing–content coherence; Improve preserves framing. VPC uses whole-canvas proposal review only; its partial acceptance is not authorized. Existing SWOT/PAGES behavior remains unchanged.

## Cross-framework thinking-tool backlog

- **Analogy, Combination, Re-Categorization and Association:** future thinking tools relevant to most or all canvases, not VPC-specific features. User attributes their methodological basis to Jeffrey Loewenstein and his coauthor; the legacy PAGES prompt names Matthew Cronin and Jeffrey Loewenstein and *The Craft of Creativity*. Verify exact source terminology and principles before implementation rather than claiming that all four legacy labels are authenticated book categories. Design full-canvas/framing-aware inputs, explicit framework compatibility, stable identities and reviewed suggestions; do not port isolated node rewrites blindly.
- **Six Thinking Hats:** already present in the 2026-11-02 ordering above; retained as a generic cross-framework thinking tool, not a VPC feature. Future scope includes reflections and suggested changes, with explicit compatibility and separately approved acceptance behavior. Current VPC approval does not authorize it.

## VPC-specific backlog

- **Ripple for VPC:** adapt the general implications tool to explicit changes in customer profile/value map, including pains → relievers/offering. Requires an artifact-persisted comparison baseline, selected-source preservation, deletion/reorder handling and review. Never invent customer evidence or product capabilities to repair fit. No automatic cascade or implementation in the current slice.
- **Restate framing:** a separate reviewed framing-only proposal informed by core evidence; do not silently infer a new customer, alternative or success metric. Requires explicit framing-change permissions and stale-state guards; user chooses whether the insight warrants reframing or content revision. Deferred from the approved initial actions.
- **Structured fit links:** revisit only if readable mappings prove inadequate; no relationship graph or automatic fit score in the current slice.


## VPC review harmonization — user authorization, 2026-11-03

The user explicitly extended VPC review to match SWOT/PAGES. This supersedes the initial whole-canvas-only restriction: reuse the shared collection resolver and UI for per-collection Accept/Reject, selection and bulk decisions, persisted resolutions, stale-edit checks and labeled mixed-result rationale. Existing proposals without resolutions remain valid. Framing stays fixed; bullet acceptance, Ripple, Restate and generic thinking tools remain deferred. No existing framework implementation changes are required.

## 5 Whys — delivered approved scope

Core/creation, Reflect (whole-canvas thought-only), Expand Deepen then Branch (explicit node target; append-batch local review) implement the approved Phase A gate. Preserve V2's strand/side doors/overview. Deferred: standalone Generate Problem Statement, broad Improve, applied reframing, per-suggestion acceptance, explicit collapse, drag/reparent/reorder and dedicated research UI/actions. Conversational research is user-controlled; no infrastructure is planned. History and numerical causal confidence remain excluded.
