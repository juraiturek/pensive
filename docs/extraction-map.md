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
