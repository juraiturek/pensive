# Implementation roadmap

## Host integration and distribution spikes — 2026-11-07

User-approved architectural direction: Pensive owns core behavior; add a thin host-specific instruction/output layer only when demonstrated necessary. Keep one authoritative implementation across distributions.

Recorded [exploratory spikes and exit evidence](plans/2026-11-07-host-integration-spikes.md): H1 Claude native viewer clipboard/annotation failures and fixability; H2 equivalent Codex/ChatGPT surface tests; H3 persistent HTML interface with versioned JSON and host binding; H4 action-only requests referencing exact stored canvas revisions, with possible deterministic Python history/reconstruction tooling. These are investigations, not delivered features or implementation authorization. Full-state fallback, manual-edit preservation and explicit proposal review remain required.

Also retain Improve targeting, copy completion feedback/dialog behavior and installed resource-path reliability as separate follow-ups. Experimental distribution need not wait for persistent-state/history features; release readiness depends on a working documented handoff/recovery path and accurate limitations. No release/publication is authorized by this entry.

## Annotation Mode rollout

Manual Annotation Mode is implemented across SWOT/TOWS, PAGES, VPC and 5 Whys. The flat frameworks support collection and item thoughts, and 5 Whys supports problem and cause thoughts. All four support canvas thoughts. The shared overlay and portable state satisfy the manual-note portion of L3. Selective AI context and research workflows remain separate design work.

## SWOT JSON import — 2026-11-05

SWOT now follows the other canvases with validated pasted JSON and confirmation before replacing the current state. This supersedes the original Slice 1 import UI deferral. Complete exported state, including thoughts and pending review decisions, can be restored directly in the browser.

## Uniform editing follow-up — 2026-11-04

The user requested consistent editing across frameworks. Enter-to-finish/Shift+Enter-to-newline now applies to analytical text fields in all four canvases, with AI/JSON text boxes excluded. Within-collection pointer ordering is shared by SWOT, PAGES and VPC. Framework state/baseline/proposal semantics remain separate; 5 Whys tree movement is deferred. See [implementation plan](plans/2026-11-04-uniform-canvas-editing.md) and verification in `docs/testing.md`. This extends the previously SWOT-only E8 interaction without approving the larger L1–L6 backlog.

## Consumer-test follow-up — 2026-11-04

Approved E1–E8 from the [consumer report](2026-11-04-swot-consumer-test-report.md) are implemented in the [bounded follow-up slice](plans/2026-11-04-swot-consumer-improvements.md): proactive creation/reconciliation guidance, concise proofreading/rationales, optional strategy breadth, compact SWOT thoughts, clearer handoff wording and within-collection pointer reordering. E8 uses hover/touch-revealed bullet-marker handles; keyboard reordering was explicitly deferred. No new state schema or action was introduced.

The user requested inclusion of L1–L6 in the future feature plan below. They require detailed design and separately scoped implementation approval. Checks and limitations for delivered work are recorded in `docs/testing.md`.

## Future features — L1–L6

Included by user request on 2026-11-04, based on the [consumer-test findings](2026-11-04-swot-consumer-test-report.md). Priorities below are proposed; no delivery dates or implementation designs are committed. Prefer consistent shared interactions where useful, while preserving framework-specific semantics and action boundaries.

| ID | Priority | Feature | Design scope and completion conditions |
| --- | --- | --- | --- |
| L1 | High | Persisted Outcomes section | Capture takeaways, decisions, next steps, open questions and parked ideas with the analysis. Start by comparing a lightweight editable section with structured fields. Specify JSON/save/export, manual edit preservation and reviewed AI updates; outcomes need not be tasks. |
| L2 | High | Individual strategy selection and follow-through | Distinguish accepting analytical content from choosing pursue/test/park/decline. Support appropriate first actions or validation steps, with optional owner and review point. Define behavior when strategies change or are deleted; keep scope below a project-management system. |
| L3 | High | Bullet- and collection-level annotations | Attach comments, observations, research questions and thoughts to stable targets. Define authorship/provenance, compact display, editing, export, freshness and target move/deletion behavior. Distinguish local comments, AI thoughts and prior rationale without implying full revision history. This incorporates the existing notes/thoughts priority below. |
| L4 | Medium | Cross-collection moves | Extend current within-collection ordering through explicit, atomic moves that preserve identity and attached annotations. Define pending-review interactions and framework compatibility. Moving a TOWS strategy must not imply that its new pairing is analytically valid; causal-tree moves require separate scope. |
| L5 | Medium | Controlled framing proposals | Allow requested or explicitly approved framing changes with visible rationale and review. Distinguish factual cleanup from changes to entity, objective or environment; specify stale-state guards and implications for existing analysis. Coordinate with deferred Restate framing across applicable frameworks. Existing actions retain their current boundaries until a new contract is approved. |
| L6 | Medium | Broader collaborative state reconciliation | Extend the implemented conversational update offer into reviewable reconciliation of explicit chat discoveries and local canvas edits. Establish the current state, resolve conflicts and preserve unrelated edits. Do not introduce silent synchronization, hidden reconstruction or automatic history by implication. |

Suggested design sequence: L1 as a small persistence slice; L2 and L3 as separately scoped follow-ups; then L4–L6 with their identity, review and state implications. This is a planning recommendation, not a replacement for the previously expressed notes/thoughts priority: agree the next slice when work starts. L1 can ship without structured L2 decisions; L4 should account for L3 annotation behavior before enabling target moves. No new framework receives a generic feature automatically where its semantics differ.

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
3. Six Thinking Hats is available across SWOT/TOWS, PAGES, VPC and 5 Whys. It appends observations and optional suggestions as thoughts. SWOT and 5 Whys pilot framework-specific prompt guidance.

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

## SWOT next improvements — user sequencing, 2026-11-04

1. Delivered: [Markdown-only methodology refinement](plans/2026-11-04-swot-methodology-refinement.md), approved and implemented 2026-11-04; checks and limits in `docs/testing.md`.
2. Delivered: manual canvas-, collection- and item-level thoughts in SWOT/TOWS. Research prompts, findings and workflow integration remain separate design work.

The methodology refinement has no dependency on the second feature. It uses existing canvas-level thoughts for concise rationale, uncertainty and follow-up questions, existing request steering for explicit additional context, and existing content/proposal contracts. No node-linked storage, research action or new UI is needed to meet its acceptance criteria. Detailed persistent per-factor rationale and research workflow remain outside that slice.


### Future Six Hats experiments

- **Selectable personas within a hat.** Try a small set of distinct lenses while preserving the hat's stance. A Vonnegut-inspired Black Hat might notice institutional absurdity. A Philip K. Dick-inspired Black Hat might question which signals can be trusted.
- **Sage lens.** Explore long horizons and competing values. Define its distinct contribution alongside Blue Hat's focus on managing the thinking process before deciding whether to offer it as a seventh hat.
