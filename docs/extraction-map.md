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
