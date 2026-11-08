# Five Forces Implementation Plan

> Status: approved by the user on 2026-11-08, with numeric confidence, stable analysis snippets and separate supporting research notes. Implementation authorized by “go”.
> Execution after approval: use the executing-plans skill and deliver the slices below in order.

**Goal:** Deliver a methodologically rigorous, interactive Five Forces canvas within Pensive’s iterative Framing → Canvas → Takeaways lifecycle.

**Architecture:** Add a framework-owned Five Forces package to the existing standalone HTML/full-state JSON architecture. Reuse established presentation and proposal protocols, with narrowly justified adapters for fixed force records; do not introduce a generic graph engine.

**Tech stack:** Markdown methodological instructions, YAML manifest, JSON Schema, shared Node/browser JavaScript, deterministic HTML packaging, Node test runner, Ajv and offline Playwright Chromium. No new runtime dependencies proposed.

## 1. Review findings and source authority

Repository reviewed at `e479d03`, with a clean working tree before this planning document. README remains authoritative and unchanged. Implementation decisions follow `docs/architecture.md`; sequencing follows `docs/roadmap.md`; verification follows `docs/testing.md`.

**There is no Five Forces implementation in this repository.** The framework packages and build scripts cover SWOT/TOWS, PAGES, VPC, 5 Whys and VARS. The roadmap explicitly marks Five Forces as planned. Accordingly, this plan adds a new package rather than refining an assumed existing one. V1/V2 were not accessed: repository policy requires separate access authorization. Any comparison with a legacy Five Forces implementation remains outside this review and is not a prerequisite for the proposed new package.

Methodological inputs:

- The supplied “Pensive — Five Forces Methodological Reference,” read in full, is the detailed design input, including its primary/secondary distinctions.
- Porter’s original 2008 article was consulted directly, including “Typical Steps in Industry Analysis” and “Common Pitfalls,” in the [HBR reprint hosted by IBM](https://public.dhe.ibm.com/software/data/sw-library/cognos/pdfs/articles/art_the_five_competitive_forces_that_shape_strategy.pdf). It supports industry definition, participant segmentation, structural analysis, consistency, change and strategic choice.
- Assen, van den Berg and Pietersma’s chapter is represented by the supplied reference, not independently inspected book pages. Confirm edition/year before publishing a formal bibliography. Its diagnostic additions remain subordinate to Porter.

**Source-grounded requirements:** industry-level structural reasoning; causal explanations; unequal analytical importance of forces; consistency with industry economics; structural change; strategic alternatives and possible unintended effects.

**Pensive design choices:** five strength labels, confidence controls, null semantics, focus navigation, trajectory arrows, T1–T4 guidance, proposal granularity and JSON representation. Neither source prescribes these controls or a scoring formula.

## 2. Existing coverage, reuse and limits

Paths in this document are repository-relative; operational paths beginning `frameworks/`, `references/`, `shared/` or `scripts/` are under `.agents/skills/pensive/`.

| Area | Existing capability and evidence | Five Forces gap / adaptation |
| --- | --- | --- |
| Lifecycle and framing | README; `references/framing-content.md`; framework-local framing fields and manual editors | Define industry/product boundary, geography, objective and initial participant groups; enforce AI readiness without preventing empty manual work. Existing fit guidance already permits recommending reconsideration. |
| Force detail | `frameworks/vars/canvas.js`, `.css`, `.template.html`: Overview/Focus, compact navigation, rendered Markdown, pencil/double-click editing, Done/Ctrl/Cmd+Enter | Adapt interaction to five fixed force records; do not inherit VARS item lists or its 2×2 layout. |
| Related perspectives | `frameworks/swot/canvas.js`: transient SWOT/TOWS mode and pressed-state controls | Reuse toggle behavior for Current structure/Structural trajectory; retain selected force when switching. |
| Consistency | VARS Evaluate appends a thought and preserves content; shared internal/external fit guidance | Add force-specific internal, framing and economic checks, including controlling forces and contradictory evidence. |
| Approval | `shared/proposal-review.js` already accepts snapshot/replacement callbacks | Fixed-record force snapshots can reuse resolver. `proposal-review-ui.js` still assumes bullet arrays; use a small optional record-preview callback with unchanged defaults. |
| Research | `shared/research.js`, `research-ui.js`: host search, explicit targets, report/sources/optional candidate, atomic review and stale guards | Target enumeration and item candidates assume arrays. Add narrowly scoped optional target/resolve hooks for canvas and force-section targets; no fabricated dummy bullets. |
| Takeaways | `shared/takeaways.js`, `takeaways-ui.js`: editable string, Formulate/Review, whole-text acceptance, stale guards | T1–T4 can be guidance/headings in the existing body; four independently persisted fields are unnecessary. |
| Evidence context | Research reports persist as AI thoughts; Takeaways deliberately excludes AI thoughts | Accepted force narratives must carry the evidence and relevant citations supporting synthesis. Report-only research does not silently become Takeaways evidence. |
| Portability | `scripts/package-vars.mjs`, runtime/schema validation, import/export/save, safe Markdown | Follow the same package structure, exclusive output and implementation-preserving state embedding. |
| Shared tools | Annotations and Six Hats have framework-owned targets and validation | Register canvas and force-section targets; preserve notes and reflections through all actions. No independent driver/item model is needed. |

“Analytical graph” remains conceptual: the force records and their narratives describe relationships. Persisted edges, driver nodes and a graph renderer are not required.

## 3. Approach and principal decisions

Three approaches were considered:

1. **Recommended: framework-owned force records plus existing shared contracts.** Clear analytical state; modest adapters for demonstrated incompatibilities; consistent user review and offline operation.
2. **Bullet-only adaptation of VARS.** Less initial state work, but strength/confidence become fragile conventions inside text and force updates risk splitting an assessment from its justification.
3. **General driver/evidence/causal graph.** Could support advanced traceability, but adds identity, edge, editing and approval infrastructure without a demonstrated MVP need.

### Proposed analytical representation

Use `framework: five_forces` and an initial schema version. Within `content`, own framing and five fixed force keys: `new_entrants`, `substitutes`, `buyers`, `suppliers`, `rivalry`. Fixed keys are stable section identities, not user-created items.

Framing has industry/product-service boundary, geography, objective and participant descriptions for rivals, buyers, suppliers, substitutes and plausible entrants. Use editable text per group, rather than a participant entity registry. Empty groups remain valid state. Before substantive AI analysis, require meaningful core framing and an initial participant map; unknown groups must be explicitly acknowledged as unknown rather than populated with inventions. There is no requirement to identify every participant or supply a name in every group. Deterministic validation detects missing fields; the host assesses whether their meaning is sufficiently specific.

A current force record contains:

- `strength`: null or `very_weak`, `weak`, `moderate`, `strong`, `very_strong`.
- `confidence`: null or a finite number from 0 to 1, displayed as a percentage (user-approved Pensive convention, not a calibrated probability).
- `analysis`: an array of stable `{id,text}` free-text snippets shown as bullets, explaining observations, mechanisms and implications. Separate Markdown `research_notes` retains supporting evidence, sources and qualifications.

Do not persist checklist completion, coverage ratings, weighted scores or aggregate attractiveness scores. Confidence is reasoned judgment: limited relevant coverage generally constrains it; weak evidence can undermine even comprehensive analysis. Explain confidence in the narrative, without requiring another justification object.

In Phase C, add an optional trajectory object with nullable direction (`increasing`, `decreasing`, `stable`, `uncertain`), text horizon, nullable numeric confidence, analysis snippets and separate Markdown research notes. Put assumptions in the trajectory analysis, visibly prompted in the detail view. Missing trajectory and explicit null direction display as unassigned. `uncertain` expresses an assessed but indeterminate outlook; it is not “not assessed.” Only increasing/decreasing/stable receive arrows; uncertain receives a labeled neutral indicator. Existing Phase B state must remain loadable without fabricated forecasts.

### Framing and revision policy

Empty manual creation, editing, import, export and saving remain available. Gate substantive Create-from-context, Evaluate, Improve, Research, Six Hats analysis and AI Takeaways in both host instructions and framework request validation. Missing framing results in targeted clarification, not guessed analysis. Editing an empty canvas and receiving framing help remain allowed.

Evaluate identifies a proposed framing revision, its reasons and affected conclusions in readable text. MVP acceptance uses an explicit user edit of framing; ordinary Improve and Research cannot change framing. Immediately after a framing edit, show a session-level prompt to reassess forces and Takeaways; preserve all existing judgments. Evaluation then reviews them against the new framing. Do not imply saved conclusions were recomputed or remain validated. No persisted freshness badge is promised. A dedicated AI framing acceptance dialog is optional later.

### Action and approval boundaries

Create initializes a disclosed draft; existing-state actions use complete `{canvas,action}`. Evaluate is thought-only. Improve may target the canvas or one force, with full context but bounded mutation. Acceptance is atomic per force record (strength, confidence, snippets and research notes together); bulk acceptance remains available. In Phase C the force snapshot includes trajectory too. Partial acceptance can yield a semantically mixed analysis: label the retained rationale accordingly and invite another Evaluate, as established review does.

Research initially supports full canvas or one force section, with immutable framing. One report/source/candidate batch requires one decision. Changes to accepted content, framing or opted-in context make acceptance stale. Pending proposals block new AI actions; rejection preserves user edits. No automatic research or HTML-to-host connection.

## 4. Phase A — Methodological foundation

**Boundary adjustment:** A is an authoring/review foundation, not a prematurely advertised standalone Five Forces feature. Since no package exists, its executable framing gate and evaluation entry points land with the minimal runnable B slice. A defines their exact behavior and test cases first.

**A1 — Method and provenance.** Create `frameworks/five_forces/methodology.md`, five `methods/<force>.md` files, and a concise provenance record in `docs/plans/`. Follow RrEAC: review sources, extract principles, adjust explicitly for Pensive, compile operational guidance. Each force guide is the single question catalogue for UI guidance, Create/Improve, Research and Evaluate. Browser guidance is embedded deterministically from these same authored files, not maintained as a second checklist.

Coverage must include entry barriers and retaliation; substitutes satisfying the underlying need and relative price/performance; buyer leverage versus price sensitivity; supplier concentration, switching, dependency and integration; rivalry’s basis, growth, capacity and exit barriers. Add cautions against equating recent entry with entry threat, direct rivals with substitutes, input inflation with supplier power, or company performance with industry structure. Government, technology, growth and complements affect the five forces through mechanisms rather than becoming extra forces.

**A2 — Lifecycle methods.** Draft `prompts/create.md`, `evaluate.md`, `improve.md`, `research.md`, and `references/five-forces-workflow.md`. Define framing readiness, sparse supported analysis, observations → mechanism → implication → assessment, confidence and revision boundaries. Evaluate checks internal reasoning, cross-force contradictions, controlling forces, framing fit and available industry economics. Missing economic evidence is a limitation and investigation need, not automatic disproof or permission to fabricate research.

**A3 — Acceptance examples.** Create `tests/methodology/five-forces.md` and retained cases for adequate/sparse framing, broad/narrow boundaries, automotive/robotics boundary tension, incompatible buyer segments, unsupported strong ratings, high coverage/poor evidence, controlling forces, and profitability contradicting a superficial assessment.

**Exit:** every requirement has a source or explicit Pensive-design label; all four uses reference the same force questions; qualitative review finds no checklist scoring, automatic reframing or unsupported certainty. Skill Markdown links and validator pass for any changed operational guidance. Methodology examples are authored cases, not measured model-quality evidence. Do not advertise runtime support yet.

## 5. Phase B — Structured current-force assessment

**B1 — State and packaging.** Create `frameworks/five_forces/{framework.yaml,canvas.schema.json,state.js,canvas.template.html,canvas.css,canvas.js,canvas.html}` and `scripts/package-five-forces.mjs`. Add an explicit build command to `package.json`; register routing only when the canvas works. Use fixed records, no summary-bullet layer, and the existing optional notes/thoughts/Takeaways envelope. Build blank HTML deterministically; package supplied state and action results without rewriting implementation assets.

**B2 — Vertical manual slice.** Build a five-force overview, preferably rivalry central with the other forces surrounding it on wide screens and a readable stacked narrow layout. Show label and nullable strength. Selecting a force opens a VARS-like working pane with compact navigation, optional diagnostic disclosure, assessment/confidence controls and safely rendered Markdown. User input is the editable analysis snippets and supporting research notes; AI steering uses the existing action dialog. Do not add a persistent duplicate “user input” field. Provide keyboard selection, return to overview and visible focus. Analysis snippets follow shared Enter-to-finish/Shift+Enter behavior. Markdown research notes remain multiline; Done/Ctrl/Cmd+Enter closes editing. Annotation Mode pauses analytical edits.

**B3 — AI reasoning and review.** Implement readiness gates, thought-only Evaluate, bounded Improve and force-level review. Snapshot/replace callbacks reuse `proposal-review.js`; add only the preview hook needed by record-shaped sections in `proposal-review-ui.js`. Preserve stale guards and all existing default behavior.

**B4 — Research and lifecycle integration.** Add optional fixed-section target hooks to `shared/research.js` and only necessary UI label adaptations to `research-ui.js`. Expose canvas/force targets, not nonexistent items. Integrate Annotations, Six Hats and existing plain Takeaways. Research may propose force narrative/assessment edits; accepted narratives retain cited support so subsequent Takeaways can use evidence without changing shared context rules. Report-only results remain valid; incorporating them into analysis is a separate explicit action.

**B5 — Focused and regression verification.** Add `tests/five-forces-state.test.mjs`, `five-forces-browser.test.mjs`, and `five-forces-methodology.test.mjs`; extend shared review/research tests for the new adapters. Implement each behavioral slice test-first, then build and inspect desktop/narrow HTML.

**Exit / acceptance:**

- Empty framing permits manual work; substantive AI requests fail helpfully until ready, including direct JSON requests that bypass UI controls.
- All five strengths and null round-trip; no additional assessment-state categories. Confidence can remain unselected; it is never calculated from checklist completion.
- Guidance and Markdown are usable in Focus; navigation changes no analytical content.
- Evaluate changes only thoughts. Scoped Improve/Research cannot change other forces or framing. A rating and its rationale cannot be independently accepted.
- Accept/reject, mixed decisions, stale local edits and pending-review locks work across saved/reopened HTML and imported/exported JSON.
- Malformed fields/targets, hostile Markdown/HTML strings, unsafe links and invalid initial state fail safely. CLI output is exclusive and a failed result creates no file.
- Existing VARS/SWOT shared review and Research tests retain their behavior; full regression passes before the phase is considered complete.

## 6. Phase C — Temporal and strategic synthesis

**C1 — Trajectory state and detail.** Extend the force schema/runtime and guides with the optional trajectory record. Add Current structure/Structural trajectory controls following SWOT pressed-state semantics; preserve selected force and retain both analyses. Default opening view remains Current. Validate nullable directions and confidence; incomplete horizon/narrative is valid draft state, but AI must flag unsupported projections.

**C2 — Overview and temporal reasoning.** Add ↑ increasing, ↓ decreasing, → stable and a labeled uncertain state, with visible legend and accessible text. Never display a placeholder arrow for null. Arrow direction describes pressure, so increasing pressure must not be colored or labeled as improving attractiveness. Show horizon via accessible detail/tooltip and in the working view. Extend Evaluate/Improve/Research to distinguish current evidence, structural drivers, temporary cycles, assumptions and horizon. Target a force record, with the chosen perspective carried as steering; deterministic boundaries still restrict edits to that force.

**C3 — Guided Takeaways.** Add `frameworks/five_forces/prompts/takeaways.md` and visible framework-local T1–T4 prompts beside the existing body:

- T1: present structure, controlling forces, mechanisms, economic implications and qualified attractiveness.
- T2: changing forces, drivers, horizon, confidence and implications.
- T3: positioning, exploiting change and influencing structure, including feasibility questions and unintended consequences.
- T4: open questions, evidence gaps, assumptions, contradictions and next investigations.

Use these as suggested headings, not mandatory parsing or completeness gates. Formulate/Review return the unchanged shared response shape and preserve whole-text acceptance. A sparse analysis may have provisional T1/T2 and substantial T4. Pending force proposals are not accepted evidence. Takeaways never silently update forces or framing.

Contextual follow-ons: SWOT for strategic conditions/options; VARS for business-model/capability feasibility; PAGES for consequential assumptions or perspectives. Mention Blue Ocean only as a future methodology, never an available canvas/action. Suggestions require an analytical reason and user choice; do not automatically create another framework.

**C4 — Close the iteration loop.** Methods and UI help explain that Takeaways can expose a missing force investigation or boundary mismatch. The user returns to that force or edits framing, requests reassessment, then reviews new Takeaways. Test this full sequence without automatic overwrites.

**Exit / acceptance:** B-state imports without trajectories; null and uncertain remain distinguishable; arrows have correct pressure semantics; forecasts retain horizon/assumptions/confidence; toggle/navigation/save preserve both perspectives. T1–T4 guidance supports incomplete conclusions and no aggregate score. A changed force or framing makes a pending Takeaways proposal stale. Accepted force/Takeaways text stays editable and is never automatically reconciled. Shared regressions and final desktop/narrow visual review pass.

## 7. Verification procedure and limits

After approval, for each executable slice: write focused behavior/invariant tests, observe the expected failure, implement minimally, rerun focused tests, and review the diff. Use existing test fixtures and shared contracts rather than implementation-mirroring tests.

From repository root, proposed focused command once tests exist:

```sh
PLAYWRIGHT_BROWSERS_PATH=/tmp/pensive-playwright /Users/juraj/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test --test-concurrency=2 tests/five-forces-state.test.mjs tests/five-forces-browser.test.mjs tests/five-forces-methodology.test.mjs
```

Run affected shared review, Research, Takeaways and annotation suites when adapters change. Final regression:

```sh
PLAYWRIGHT_BROWSERS_PATH=/tmp/pensive-playwright /Users/juraj/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test --test-concurrency=2 tests/*.test.mjs
```

Run the installed skill validator (`python3 /Users/juraj/.codex/skills/.system/skill-creator/scripts/quick_validate.py .agents/skills/pensive` with an isolated temporary dependency path if needed), manifest parsing/resource checks, local Markdown link checks, deterministic framework rebuild, README comparison and `git diff --check`. Scratch JSON/dependencies belong in a unique OS temporary directory removed afterward. User review artifacts belong in `outputs/`, passed explicitly to the packager. No distribution or Claude ZIP build is part of validation.

Retain methodology inputs/outputs and rubric covering industry versus firm, substitutes versus rivals, unequal force importance, causal justification, weak evidence/high apparent coverage, missing profitability evidence, temporal uncertainty, explicit reframing and strategic unintended effects. Protocol validity and authored examples do not prove model reasoning quality. Report actual checks and limits: offline Chromium is not Safari/Firefox, physical-device, live-search, cross-host or statistical model evaluation.

## 8. Dependencies, risks and decisions for review

| Issue | Proposed resolution / remaining uncertainty |
| --- | --- |
| Legacy Five Forces may contain useful work | No access assumed. Optional authorized narrow audit can revise this plan before implementation; no bulk migration. |
| Framing is semantically inadequate despite nonblank fields | Deterministic missing-field gate plus host methodological check; never claim schema validation proves a good industry definition. |
| Confidence vocabulary unspecified | User approved nullable 0–1 confidence shown as percentage; no implied statistical calibration. |
| Reference includes uncertain trajectory; request emphasizes arrows | Retain uncertain as a valid assessed outlook with no directional arrow; null stays unassigned. |
| Shared helpers assume collections | Add the two small demonstrated hooks rather than distorting force records or broadening all frameworks. Preserve defaults with regression tests. |
| Reframing makes old analysis questionable | Preserve content, prompt explicit reassessment and diagnose in Evaluate; no hidden invalidation/automatic rewrite. Persistent cross-session freshness is deferred. |
| Research thoughts excluded from Takeaways | Put supporting evidence in accepted narratives. Do not broaden shared thought inclusion or treat accepted reports as automatically proven facts. |
| A has no executable canvas | Treat A as foundation; ship the first usable framework at B. C completes the requested temporal/strategic MVP. |
| Source bibliography | Porter primary text checked; Assen edition/year and exact chapter provenance remain to confirm for formal citation. |

## 9. Required MVP and optional enhancements

**Required MVP (A+B+C):** shared diagnostic catalogue, framing readiness, five qualitative nullable current assessments, confidence/narratives, Overview/Focus, safe Markdown, consistency evaluation, explicit bounded proposals, scoped host Research, trajectories with horizon/assumptions/confidence, pressure arrows, guided flexible T1–T4, manual annotations, established portability and explicit iteration/reassessment. B is a useful current-structure milestone, not completion of the full request.

**Optional later:** dedicated AI framing proposal dialog; persistent freshness markers tied to explicit basis snapshots; scenario-specific trajectories/multiple horizons; richer source traceability; participant entities; causal driver graphs; specialized cross-framework transfer controls. Each needs demonstrated use and separate design. Numerical scoring, automatic industry redefinition, automatic recommendations, generic framework infrastructure, history/backends and automatic research are excluded from this plan.

**Planning verification:** repository/source inspection and planning-document whitespace/README checks only. No product tests, builds, validator or live canvas tests are claimed for this planning-only change. Implementation and necessary architecture/roadmap capability updates were subsequently authorized. Commits, distribution builds, push and publication are not included.

## Implementation record — 2026-11-08

A, B and C implemented with the user-approved numeric confidence/snippet/research-note contract. Fixed-force state and shared review/Research adapters preserve framework-owned boundaries. Perspective travels as steering; review remains atomic per force. All 257 tests passed; skill validation, manifests/resources, 216 local links, README integrity and whitespace checks passed. Desktop/narrow screenshots and independent code/methodology reviews completed. See [testing record](../testing.md) for exact commands and limits. No causal graph, distribution build, legacy extraction, commit, push or publication.

### MVP acceptance

The user approved a local MVP commit after using evaluation, whole-canvas improvement, annotation and paper-reconciliation workflows. These are qualitative usage observations, not a benchmark. The requested follow-up idea—decomposing accepted evaluation guidance into attributed contributions attached to relevant analytical elements for reading and scoped AI context—is recorded in the [Five Forces backlog](../roadmap.md#five-forces-backlog--accepted-evaluation-findings-attached-to-elements). This records future scope only; it is not part of the MVP implementation.
