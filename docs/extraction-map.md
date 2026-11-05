# Slice-1 extraction map

## Source identity and scope

V1 reference root: `../Old-obsolete-app-codebase/pensieve-main` relative to the destination repository. The supplied snapshot has no Git metadata, so no revision can be attributed. SHA-256 hashes below identify the exact inspected files; the five hashes match those recorded during initial inspection.

V2 reference root: `../pensive-v2`. Revision: `a75617205cf342ebe851379ab43db52e35a07a5e`. No tracked legacy changes were present during inspection or final verification. A pre-existing untracked `440hz.wav` is unrelated and was left untouched.

Only relevant SWOT/TOWS source sections were inspected. Neither legacy repository was modified; no source directories or application dependencies were copied. The following are capability-level adaptations into new local code, not verbatim migrations.

## Selected capabilities

| Source | Why selected / exact capability | Destination and adaptation | Verification |
| --- | --- | --- | --- |
| V1 `templates/frameworks/swot.html` | Strongest interaction: default four-quadrant SWOT, explicit TOWS toggle, read-only S/W/O/T context around strategy intersections. | `frameworks/swot/canvas.template.html` and `canvas.js`: preserve arrangement and visibility model, replace template inheritance and application controls with local DOM. | Default SWOT, read-only context, all four strategies, repeated toggles, saved files start in SWOT. |
| V1 `static/swot/swot.js`: mode-toggle, strategyMap, initializeStrategyFields, renderStrategies, syncSwotToTows | Existing manual strategy editing and synchronization behavior. | `canvas.js` and `state.js`: one JSON state, synchronous per-item edits, UUID identity, context rendered directly from that state. No Tagify, fetch, deferred server saves, thought tools, Strategize, or Undo. | Add/edit/delete, stable IDs, no state loss on toggle, complete clipboard export and successive HTML saves. |
| V1 `static/swot/swot.css` | 2×2 SWOT / 3×3 TOWS, distinct category treatments and mobile stacking. | `canvas.css`: standalone responsive grid and scoped category styles; no inherited pages.css or external assets. | Desktop/mobile visual review and overflow checks. |
| V1 `schemas/swot.yml` | Four factors, four strategy types, and framing. | `framework.yaml` and `canvas.schema.json`: framework-owned semantics, strategies grouped by pair, stable item objects instead of string arrays. No thoughts schema. | Ajv and runtime valid/invalid tests, global identity checks. |
| V2 `app/frameworks/registry.py`: SWOT entry | Clear focal entity/objective/environment framing and explicit field typing. | Manifest, schema, framing controls: preserve semantics, allow blank drafts; omit arbitrary legacy list/text caps and text deduplication. | Valid empty state, wrong types/keys/versions rejected; local framing survives export. |
| V2 `app/frameworks/layouts/swot.canvas.yml` | Helpful/harmful and internal/external axes clarify SWOT methodology. | Direct static SWOT markup/CSS; no YAML layout engine or runtime composition. | Axis semantics in markup, visual review and responsive behavior. |
| V2 `static/css/pensive.css`: tokens/typography and SWOT responsive sections | Warm paper, restrained surfaces, serif headings and sans-serif controls. | Small framework-specific stylesheet, category palette adapted from V1. No generic application stylesheet copied. | Screenshot review at desktop/mobile widths. |

Destination paths in that table are relative to `.agents/skills/pensive/`. The new packager and stable-ID/state utilities are original destination code; neither legacy implementation supplied the standalone safe-packaging protocol.

## Inspected tests

V1 `tests/views/test_canvas_swot.py` checks server-rendered page labels. V2 `tests/unit/test_framework_registry.py` checks initial fields/roles, and the SWOT test in `tests/views/test_canvas_pages.py` checks grid/axis labels. These informed destination expectations; they were not copied or run with obsolete application dependencies. The destination's Node/Ajv and offline Playwright tests replace these limited checks with actual local behavior coverage.

## Source hashes

### V1

| Source file | SHA-256 |
| --- | --- |
| `templates/frameworks/swot.html` | `4e44547c01e6dda80825c84e0b3482ad848b722f66e4a1bfebb29183db2cbe56` |
| `static/swot/swot.js` | `bc7519b6dd04be4e3f2b2d575b28a7cdb539390d549d4297a2033358f9e136d3` |
| `static/swot/swot.css` | `579085783ddcefe13dd65441f5dff7a38d968752c30b3366546f6d0c050c5801` |
| `schemas/swot.yml` | `a0db0de7f55400aa35dc275584daac19e705c686428b9adfcfcf87dc164c369d` |
| `tests/views/test_canvas_swot.py` | `1e4c3cdfc33e9cb5222babd8763f6845bc08b59f5a6361174c34fa28fefa4941` |

### V2

| Source file | SHA-256 |
| --- | --- |
| `app/frameworks/registry.py` | `f6bfe38cc987fba62cee8e949a2fa44ef75fc94614141349985495cd4204910d` |
| `app/frameworks/layouts/swot.canvas.yml` | `6af2bdec8e6f1cd06e8b9ca0ca7b8bf577a71e32066c1ed1cf0c3983189a2c76` |
| `static/css/pensive.css` | `ad612bdae96b4f31ad02a1edf7f050802a2fac88216c560851df453d738139da` |
| `tests/unit/test_framework_registry.py` | `2e402fb783c04a9fd389f16604c1d9488b2b04186c926b2b4669ea0d16b0c951` |
| `tests/views/test_canvas_pages.py` | `5f565a8512542c78ceee042d2429545d5a7115558746dc9f5779683a64702fc5` |

## Verification record

On 2026-11-01, `node --test tests/*.test.mjs` executed 14 destination tests: 7 deterministic state/packaging and 7 offline Chromium tests, all passing, none skipped. Desktop and mobile screenshots were visually inspected. See [testing.md](testing.md) for commands and limits. Legacy files were read-only throughout; source identity checks and unchanged README checksum are part of delivery verification.

Deferred: AI Strategize, generic actions, proposal acceptance at any granularity, history, import UI, and local storage. No methodological prompts were extracted in Slice 1. The README's RrEAC process remains applicable to future methodology extraction.

## Slice 2A: creation methodology

Read-only research used the same V1 snapshot and V2 revision identified above. No legacy runtime or source was copied. RrEAC: research creation paths and prompts; review against destination contracts; extract useful concepts; adjust for Codex conversation and evidence limits; compile into `frameworks/swot/prompts/create.md` within the skill.

| Source / relevant location | Original behavior; strengths and limits | Decision / destination adaptation |
| --- | --- | --- |
| V1 `templates/wizard/chooser.html`; `static/wizard/wizard.js:74–219` | Framework selection, schema-ordered fields, one input at a time, prior answers visible, submission and redirect. Progressive but fixed; no conversation extraction or adaptive questions. | Adapt progressive elicitation in create.md; reject form/server flow. |
| V1 `schemas/swot.yml:4–37` | Required entity/objective, optional environment; internal/external tags. Clear framing but rigid requirements. | Adapt framing and classification; allow disclosed general lens. |
| V1 `prompts/generate/swot_generate.j2:1–15` | Framing to short JSON lists; minimum one item per declared node. Sparse methodology; declaration includes strategies. | Adapt concise framed generation; reject mandatory population and strategy generation. |
| V1 `app/service/wizard.py:107–170` | Validate framing, template selection, model call, parse, store canvas and separate framing. Basic checks do not assess analytical quality. | Adapt validation boundary; reject Jinja, client, stores, assertion-based validation. |
| V2 `app/routes/canvas_pages.py:696–718`; `templates/partials/canvas_detail_body.html:215–242` | Blank creation enters Problem view; generate from editable framing, confirm replacement. No adaptive elicitation in inspected path. | Adapt explicit framing; reject app wizard and replacement confirmation for initial artifacts. |
| V2 `app/frameworks/registry.py:91–173,490–588` | Framing/core roles, typed lists, caps and normalization. Useful semantics, arbitrary caps and string coercion. | Preserve destination semantics and validator; reject legacy normalization/caps. |
| V2 `prompt_templates/user/swot_generate.j2:1–26`; `system/generate_base.j2` | Four concrete lists, framing preserved by app; 3–8 items, 80-character limits. | Adapt distinct concrete factors; reject quotas and legacy nodes contract. |
| V2 `app/services/canvas_ai_service.py:47–84,406–453` | Any nonempty framing enables generation; four outputs merge into saved state. Too permissive as analytical sufficiency. | Adapt framing preservation and output checks; reject gate, replacement, persistence infrastructure. |

Original destination choices: one phased Markdown method, maximum two question turns including sparse-draft agreement, empty unsupported quadrants, evidence-aware generation, initial-draft exception to transformation acceptance, no research. Provenance review is distinct from methodology evaluation and deterministic packaging checks; see testing.md.

## Slice 2B: action methodology and steering

Reviewed on 2026-11-02. V1 remains an unversioned read-only snapshot. V2 is still at revision `a75617205cf342ebe851379ab43db52e35a07a5e`. Only action/wizard/prompt-related material was inspected; no legacy code or dependencies were copied wholesale.

| Source | Useful material / limitation | Adaptation |
| --- | --- | --- |
| V1 `static/wizard/wizard.js`, `templates/wizard/wizard.html` | One field at a time, framing retained across steps; tied to schema fetch and server creation. | Compact optional steering dialog, reusing current framing instead of another creation wizard; no fetch/server flow. |
| V1 `static/swot/swot.js`: initializeStrategyFields, showImproveModal, Strategize/Improve handlers | Manual strategies, free-form instruction and thoughts option; Strategize has no steering and server responses mutate state. | Three local guided request dialogs, full JSON export; reject server calls and automatic mutation. |
| V1 `prompts/strategize/swot_strategize.j2` | TOWS cross-matching, four named strategy collections; minimal reasoning and arbitrary max-three count. | Markdown Strategize with explicit mechanisms, constraints, uncertainty and extend/replace policy; reject quota. |
| V1 `prompts/improve/swot_improve.j2`, `prompts/reflect/swot_reflect.j2` | Revised state plus linked thought, or standalone reflection. Very broad instructions. | Explanatory thought and separate Evaluate/Improve effects, typed response contracts and proposal-first delivery. |
| V2 `templates/partials/canvas_detail_body.html`: reflection/improvement modal sections | Instruction field and recent-thought consideration; HTMX/Alpine backend coupling. | Scope/mode/guidance/consider-thoughts in native local dialog; no framework/server dependencies. |
| V2 `prompt_templates/user/swot_improve.j2` | Concrete nonduplicative factors, framing preservation, explanation of changes; SWOT-only, mandatory counts/length limits. | Improve factors and existing TOWS coherently, retain IDs, explain meaningful changes; reject quotas. |
| V2 `prompt_templates/user/swot_guidance.j2`, `docs/decisions/ADR-0002-guidance-method-vs-content.md` | Method-focused but grounded evidence; why/how; no replacement values. | Evaluate selected SWOT/TOWS scope, concrete observations and concise next steps without content replacement. |
| V2 `prompt_templates/user/swot_reflect.j2` | Optional reflection focus and thoughts, strategic insight; arbitrary short limit. | Useful distinction between thought and content update; use grounded evaluation instead of generic reflection. |

New destination decisions: `{canvas, action}` protocol, current thoughts, temporary whole-canvas proposal/base guard, atomic local acceptance/rejection, explicit extend/replace, stable IDs, and deterministic `--result` packaging. These are new code supporting the approved architecture, not an extraction of legacy application state management. RrEAC: inspect relevant methods/UI, compare methodological value, extract concepts, adjust for stateless explicit JSON and human agency, compile concise Markdown methods. See the [plan](plans/2026-11-02-swot-ai-actions.md) and [methodology observations](../tests/methodology/swot-actions.md).

### Additional exact source identities

| Source | SHA-256 |
| --- | --- |
| V1 `static/wizard/wizard.js` | `cba2a2b4c9fbca22e56ded15717c19ca1d6f923d4cc383613abdc09fcc1b6bd1` |
| V1 `templates/wizard/wizard.html` | `72f489f63ce098706c8ded522672bc441e1ce5ebcfe23de88dd2c1d837841f05` |
| V1 `app/service/wizard.py` | `dc2139927e13a561ff6322aef704d075893aaeacdb4b5ebd94460f55818eae78` |
| V1 `static/swot/swot.js` | `bc7519b6dd04be4e3f2b2d575b28a7cdb539390d549d4297a2033358f9e136d3` |
| V1 `prompts/strategize/swot_strategize.j2` | `49fae33d24ed77327201a633ca6f63b14492b0fcd9077839c62fde79f6e9a662` |
| V1 `prompts/improve/swot_improve.j2` | `3509908e6f5666d07f0353a7f1cc07694949efe43b6953dfc7cafc41934da9ae` |
| V1 `prompts/reflect/swot_reflect.j2` | `331d88111f6f327d728cbf1e482e9a225ef40b9a52344a5c80b4fad0d840eb51` |
| V2 `templates/partials/canvas_detail_body.html` | `d54c90b3e6bf36a550b3949b159e30775ecfdbe5e0f3fd814c29280283e8bbab` |
| V2 `prompt_templates/user/swot_improve.j2` | `a04682dd84c756016447d32bccc7119460d2250bb2365f887bdb38dcc116fe27` |
| V2 `prompt_templates/user/swot_guidance.j2` | `4c8d70b5901627ca8aa481fb96124ec23171c97aa76037caefae220a4b66feeb` |
| V2 `prompt_templates/user/swot_reflect.j2` | `a9db8c1e33bfc38684ed160c56451f2c8eac2b457987488656944beba6afb824` |
| V2 `docs/decisions/ADR-0002-guidance-method-vs-content.md` | `197c793824a092ea326241ff64d4cfb33cf4bd605f84af3400f3d73b4300667c` |

Verification: full destination tests, observed methodology sample, skill validation, and reference/integrity checks are recorded in [testing.md](testing.md). Legacy server suites were not run; destination regressions exercise the adapted behavior without obsolete infrastructure.

## PAGES: RrEAC extraction and adaptation

Research/review used the same V1 snapshot and V2 revision `a75617205cf342ebe851379ab43db52e35a07a5e`, read-only. Findings and rejected alternatives are in the [approved design](plans/2026-11-02-pages-design.md). Destination paths below are relative to `.agents/skills/pensive/`.

| Source | Relative value / extraction decision | Destination adaptation |
| --- | --- | --- |
| V1 schema and five-band template/CSS | Consistent five dimensions; stronger distinctive representation than V2 linear fallback. | `frameworks/pages/` manifest, schema and responsive S/E/G/A/P bands using Pensive typography and controls. No Tagify or application CSS copied. |
| V1 Ripple prompts and selected-node dialog | Change in one dimension implies possible changes elsewhere; self-concepts can affect goals. Current values alone do not record the change. | `prompts/ripple.md`, guided multi-source selection and before/after preview. Persist one initialization baseline, a new destination design explicitly requested by the user. |
| V1 Reflect and Improve | Grounded gaps/connections and explanatory revisions; broad prompts and direct server mutation. | Evaluate formulation, coverage, verbosity, gaps and content inconsistencies; Improve best-practice core changes. Whole-canvas review replaces direct mutation. |
| V2 registry and generate | Canonical Parts/Actions/Goals/Events/Self-concepts, what/why/intuition and perspective activation. | Context-aware create method, optional recommendation, bounded adaptive elicitation; no item quotas, list caps or invented self-beliefs. |
| V2 guidance and improve | Specific methodology checks and framing-preserving core revision. | Evaluate/Improve Markdown; balanced coverage is contextual, not equal item counts. “I am” is useful elicitation, not a mandatory format. |
| V2 framing restatement | Distinct framing-only action with evidence rationale. | Inspected but deferred at user request; no action shipped. |
| V1/V2 Six Hats and V1 generic tools | Supplementary tools, not equivalent to the PAGES model. Legacy V2 Six Hats outputs are thought-only. | Deferred. User's future contract spans canvases and includes reflections plus suggested changes, after stabilization and partial acceptance. |
| V2 dashboard design draft | Conflicting Players/Aspirations/Goals/Enablers/Scope expansion. | Rejected because implemented registry and both schemas/prompts consistently use the canonical five dimensions. |

Adjust/compile: original static state/schema, safe packager, persisted baseline diff, atomic import, proposal guards and browser controls. Shared Pensive CSS is included from the existing SWOT stylesheet at build time with PAGES-specific overrides, avoiding duplication of source visual infrastructure or SWOT runtime changes. Reasoning remains readable Markdown. No backend, dependency migration, API client, generic engine or legacy source directory copying.

Origin: V1 `prompts/generate/pages_generate.j2` explicitly attributes its PAGES principles to *The Craft of Creativity* by Matthew Cronin and Jeffrey Loewenstein. This recovers the legacy attribution; the book’s exact formulation was not independently inspected. The attribution to Edward de Bono in Six Hats prompts applies to Six Hats only. No missing methodology or historical attribution was invented.

### Exact source identities inspected for PAGES

| Version | Path | SHA-256 |
| --- | --- | --- |
| V1 | `schemas/pages.yml` | `008091444a113c2a21e5e5a0d296c94628e622f519e8cd4f195375ae7df7f404` |
| V1 | `templates/frameworks/pages.html` | `0627d97c78121db53470b538a37fd94ecc1098642d0d9b268364264ceea94a73` |
| V1 | `static/pages/pages.css` | `6ee3965a7801385ac73b6da9d0403226d636a6e4d9a2672de4f22274d02d4692` |
| V1 | `static/pages/pages.js` | `8263bd3e2dcb1ffe34b924937d1059d7771e19021f467f3de7e697b1cfa469dd` |
| V1 | `prompts/generate/pages_generate.j2` | `45d6e40556bf780998b6e4930b4ce0ad353a7c6b52f0fd1b5cc09dbe9c7a50d9` |
| V1 | `prompts/reflect/pages_reflect.j2` | `15cf1aa22557c61378a3665bd2b6b96caf1fbffcf1480ee050ea126568369451` |
| V1 | `prompts/improve/pages_improve.j2` | `307caa6306192c29d6deeeec8e0163fa8ea7277f0d248d394d82d785ab2efe66` |
| V1 | `prompts/ripple/pages_ripple.j2` | `6715ec36de7680a53458e527d8819320f76a085d817b3841f591490800dacb8e` |
| V1 | `prompts/ripple/pages_ripple_selfconcept.j2` | `e1f124f56dfdd3c9dbbbdcfd9fe6e8513367cea19b75a4f2580654b6d79bb35c` |
| V1 | `prompts/tools/pages_tool.j2` | `46d8f58507babfc4f49bfd5d6738a0bae48262fa77a1f4b37f143360d57e9150` |
| V1 | `prompts/viewpoints/pages_viewpoint_default.j2` | `50f07e45eeacbd296e144976d577b2da7af8dfd56d67647eb50132fa2ad15739` |
| V1 | `prompts/viewpoints/pages_viewpoint_white.j2` | `b82bf02cc34dd357a94525dfbf366714caa09e102a47f7deb990306841d7303f` |
| V2 | `app/frameworks/registry.py` | `f6bfe38cc987fba62cee8e949a2fa44ef75fc94614141349985495cd4204910d` |
| V2 | `prompt_templates/user/pages_generate.j2` | `1603d23d5e4183611a1ce7b5ca6c41e912a92fd2f00bbe55b1c97b2d337e3316` |
| V2 | `prompt_templates/user/pages_guidance.j2` | `aa78a3edaa58ac82e54ef7d0b86350ce26fc9fd469d00c493cc9a9642a87799b` |
| V2 | `prompt_templates/user/pages_improve.j2` | `3f7b2e753ad285e4b4658fdf2228f74a34a4638e5917585dbd20714939abec3b` |
| V2 | `prompt_templates/user/pages_reflect.j2` | `2bd4f3ac4602642d95f2c92e680beeb72aa9f45655542ad12ab58e61e803d2cc` |
| V2 | `prompt_templates/user/pages_restate_problem.j2` | `fa2d584aeeebabda198d40a3a5bbbc0dc55c0da78fcf5b6a46cb56fc6035b7d9` |
| V2 | `docs/plans/2026-03-03-dashboard-canvas-management-design.md` | `4d043e791abf1059f60051a10a46f2b0b4a3d8ba6a0a6a8dd0d1ab5f9bb7c911` |
| V2 | `prompt_templates/user/pages_viewpoint_white.j2` | `e6cac86f66ac08d70ee2c203baf14030e54f84f48369b25ee2474461b386a3b8` |
| V2 | `prompt_templates/user/pages_viewpoint_red.j2` | `a90ed7808baff27a96afcbf76c019e8345ebe8086908b6e45f5460c165a938f5` |
| V2 | `prompt_templates/user/pages_viewpoint_black.j2` | `6e32a8f8f51460376e38a61cbc35d1093fe83cd87559a4e7f4a543a00e2b070d` |
| V2 | `prompt_templates/user/pages_viewpoint_yellow.j2` | `708d00e0e3e191b0fdb3d60c03a18afbdbdabf080ac7cb9a520f5840b202a7cf` |
| V2 | `prompt_templates/user/pages_viewpoint_green.j2` | `ea0350d539126473f8bd9c141c76dcf7a61ac6e3d190cd6110bddf7d0ddecd34` |
| V2 | `prompt_templates/user/pages_viewpoint_blue.j2` | `fe1bdcc207288e3187daf2e3bc8d8f25eecf62450015219f1473457671db3f1f` |

Verification and methodological limits are recorded in [testing.md](testing.md). Legacy application/server tests are not migrated or run.


## VPC — 2026-11-03

Read-only source audit and adopt/adapt/reject decisions: [approved Phase A review](plans/2026-11-03-vpc-phase-a-review.md). Exact selected file fingerprints: [source manifest](plans/2026-11-03-vpc-phase-a-sources.json). V2 HEAD was `a75617205cf342ebe851379ab43db52e35a07a5e`; V1 had no resolvable Git repository at the inspected roots. Fingerprints record actual bytes without assuming clean legacy state.

V1's `schemas/vpc.yml` and V2's `app/frameworks/registry.py` agree on six methodological collections. V2's five-field framing and guidance criteria are adapted into `frameworks/vpc/` Markdown methods. V1/V2's outer jobs/products and paired pains/relievers, gains/creators geometry informs new destination CSS; no legacy canvas runtime was copied. Destination editor/export/import/state packaging patterns supply local behavior. Legacy quotas, text caps/deduplication, storage/server/Jinja/API infrastructure and automatic mutations are rejected. VPC has no partial review or source baseline.

The shared framing–content instruction and guarded fit assessment are destination methodological adaptations. Evidence labels and readable mappings retain the current `{id,text}` contract; no relationship graph or inferred quantitative score. Official Strategyzer methodology references are documented in the audit. Future thinking tools are not VPC-specific; the user requested their attribution be investigated as Cronin/Loewenstein methodology before implementation.

## 5 Whys — approved V2 extraction, 2026-11-03

Design/action gate: [Phase A review](plans/2026-11-03-five-whys-phase-a-review.md); implementation sequence: [plan](plans/2026-11-03-five-whys-implementation.md). Exact inspected source identities: [SHA-256 manifest](plans/2026-11-03-five-whys-phase-a-sources.json), V2 HEAD `a75617205cf342ebe851379ab43db52e35a07a5e`. V1 was not accessed.

| V2 asset | Destination within `.agents/skills/pensive/` | Reuse / adaptation / rationale |
| --- | --- | --- |
| `templates/partials/canvas_tree_strand.html` | `frameworks/five_whys/canvas.js`, `canvas.template.html` | Preserve two-lane strand/side-door DOM classes, depth/role/tip cues, connector add placement and inline Enter/blur/Escape semantics. Template rendering and HTMX/Alpine events replaced with safe local DOM/events because standalone HTML has no server/runtime framework. Added approved Expand and confirmed deletion controls. |
| `static/css/pensive.css` focused tree blocks | `frameworks/five_whys/canvas.css` | Copied strand, connector, side-door and overview selectors/geometry nearly unchanged; map tokens to Pensive's shared paper/green/type system. Always accessible pencil, local modal/focus styles, long text, bounded scrollable countermeasure cards and narrow viewport scrolling adapt server presentation. |
| `templates/partials/canvas_tree_overview_overlay.html` | `frameworks/five_whys/canvas.js`, `canvas.template.html` | Preserve overview cards, SVG orthogonal edges, active/tip/closed/unresolved cues, full-text titles and countermeasures; replace template/route events with local navigation and native dialog dismissal/focus containment. Root overview click closes overview without changing cursor. |
| `app/routes/canvas_pages.py` path/continuation/strand/overview helpers | `frameworks/five_whys/state.js` | Mechanically port deterministic Python behavior to JS: first-child preferred continuation, sibling side doors, leaf-unit subtree layout, 196×86 cards, 228/148 spacing, original edge paths. Iterative traversal avoids recursive helper stack limits. Retained actual V2 outputs independently check coordinates, edges, navigation and strand data. |
| `app/frameworks/registry.py` framing/node schema; `app/services/canvas_service.py` tree operations | `frameworks/five_whys/state.js`, `canvas.schema.json`, `framework.yaml` | Retain four framing fields, nested `{id,text,children,is_terminal,output}` semantics and root lock; destination envelope separates framing under content and cursor as view state. Strict validation replaces coercion. Approved three-child cap becomes advisory; five remains no fixed depth. Closure label is qualified and is not proof. Local confirmed subtree deletion/cursor repair is original destination work. |
| Dedicated Generate Problem Statement Jinja prompt + service/rules mapping | `frameworks/five_whys/prompts/create.md` | Reuse observed-vs-expected gap, specificity, no assumed cause/solution/blame. Reject mandate to state uncertain reports as facts. Standalone action deferred by approval; no separate root-generation control. |
| No registered 5 Whys Generate/Reflect/Expand/Improve/wizard methods | `prompts/{create,evaluate,expand}.md`, `references/five-whys-workflow.md` | Original destination methods from approved requirements; do not claim generic other-framework V2 actions are migrated. Reflect thought-only; Expand target/context/modification scopes and Deepen/Branch modes; explicit conversational research only. |
| V2 server snapshots, repositories, auth/CSRF, history/undo, debug application shell | None | Replaced by in-memory state and established complete JSON/standalone saving; no backend, automatic history or runtime dependencies retained. |

RrEAC: researched/reviewed authorized source and destination contracts; extracted original tree geometry and semantics; adjusted runtime/uncertainty/branch-limit boundaries under explicit approval; compiled into deterministic offline HTML and readable Markdown methods. [ASQ's 5 Whys guidance](https://asq.org/quality-resources/five-whys) corroborates variable depth, not a requirement of exactly five. Causal-fit/evidence requirements are user-directed adaptations, not claims attributed to uninspected sources.

Material behavior differences are approved in Phase A: advisory cap, qualified closure label, added deletion, no 300-character edit cap, removed history/backend, local native dialogs/events and existing destination exports/import. No drag/reparent/reorder or explicit collapse existed in the audited V2 tree surface; none is claimed here. Strand projection remains the branch-management model. Countermeasure outputs in overview are bounded scroll regions to preserve readability/geometry; all text survives export and remains fully visible in strand. Overview board adds bottom clearance for outputs. New action controls make strand cards taller than the original static fixture; the spine/side-door relationship remains intact.

Verification details and limits are in [testing.md](testing.md) and [methodology notes](../tests/methodology/five-whys.md). Original Jinja/CSS visual fixtures are rendered without legacy services or Alpine/HTMX execution; parity is helper/static-layout evidence plus new offline browser behavior, not a live legacy application comparison.

## Six Thinking Hats from V2

Source revision `a756172`. V2's `prompt_templates/system/viewpoint_base.j2` and the eighteen `user/{swot,pages,vpc}_viewpoint_{white,red,black,yellow,green,blue}.j2` templates supply the strict single-hat stance, six practical focus definitions and concise exploratory tone. SWOT and PAGES differed only by label. VPC had modest fit-oriented variants. The destination uses one shared Markdown method with separate, newly authored SWOT and 5 Whys application sections. PAGES and VPC use the common method directly.

V2's `prompt_templates/rules.json`, `app/services/prompt_library_service.py`, `app/services/canvas_ai_service.py` and `templates/partials/canvas_detail_body.html` show one hat per invocation, latest coerced framework nodes as context, a thought-only response and a hat picker. The current skill retains the picker vocabulary and thought boundary. It uses complete submitted state, explicit stable targets, observations with optional suggestions, and existing standalone packaging. The V2 server, Jinja composition, database repository and mandatory next step were outside the extraction.
