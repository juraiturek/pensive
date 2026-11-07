# VARS and Shared Research Implementation Plan

Execution guidance: Implement this plan task by task, following the repository’s development and testing instructions.

**Status:** Approved by the user on 2026-11-07; implementation authorized. Publication and legacy access remain unauthorized.

**Goal:** Add a native VARS business-model canvas with progressive Markdown analysis, explicit-change Ripple, and host-executed Research reusable across frameworks.

**Architecture:** Preserve standalone framework packages, complete-state JSON handoffs, deterministic packaging, and explicit local proposal acceptance. Add framework-specific VARS state/UI/methodology and small shared Research utilities, demonstrated through VARS and SWOT. The host assistant performs inference and search; HTML has no inference client, search service, or network requirement.

**Tech Stack:** Existing JavaScript/Node, JSON Schema, YAML, Markdown methodology, standalone HTML/CSS, Ajv and Playwright tests. A small vendored Markdown renderer may be added only after dependency/license review; all browser assets must be embedded and work offline.

## 1. Agreed intent and boundaries

- Fixed layout: V/A above R/S. Overview is the default; Focus keeps a compact selectable matrix beside the selected quadrant's detail workspace.
- Concise editable summary items use stable identities. Optional Markdown exists at quadrant and item level. Empty/partial canvases and empty supporting analysis are valid.
- Markdown supports headings, paragraphs, lists, tables, emphasis, and source links. VRI is optional Markdown analysis attached to a particular A resource/capability, not a standalone framework or scored form.
- Create, Evaluate Consistency, Improve, Ripple, Research, annotations, Takeaways and existing Six Thinking Hats conventions are supported for VARS where semantically applicable.
- Research findings and proposed edits require explicit acceptance. Existing thought-only Evaluate and Six Hats behavior remains unchanged; initial creation produces a draft directly, as in existing frameworks. “Everything approved” concerns incorporation of research and proposed revisions, not a new acceptance gate on ordinary assessments or initial drafts.
- Ripple starts with an explicit user-described proposed change against the submitted current state. No persisted baseline, automatic edit detection, history or hidden reconstruction of previous content.
- Research infrastructure is shared. VARS and SWOT are the initial integrations; other frameworks are extension points, not claimed capabilities. Including SWOT is a proposed scope choice to prove reuse with an existing framework.
- Preserve README.md. Five Forces is planned, not available for reuse. Do not inspect legacy V1/V2. No push, remote changes or publication.

## 2. Proposed data and review contracts

### VARS state

Use `framework: "vars"`, `schema_version: "1.0"`, and framework-owned `content`:

```json
{
  "framing": {
    "business": "",
    "objective": "",
    "scope": ""
  },
  "v": [],
  "a": [],
  "r": [],
  "s": [],
  "details": {"v": "", "a": "", "r": "", "s": ""}
}
```

Items are `{id, text, details?}`, with optional `details` Markdown. Quadrant `content.details` is optional on import and reads as empty; missing and empty detail text compare equivalently. Framing fields can be empty; creation clarifies the business and analytical purpose only when needed. Proposed framing remains a design choice for approval, not a framework fact.

Keep existing optional `annotations`, `thoughts`, `takeaways`, and single pending `proposals` conventions. Item Markdown stays with its stable item identity. Deleting an item deletes its analytical detail; manual annotations follow existing unavailable-target retention. Selecting an item shows its Markdown alongside the quadrant analysis without copying text between them. Focus selection is transient and does not make a proposal stale.

Improve/Ripple resolve per quadrant or in bulk. Each review unit includes that quadrant's entire item collection, item details and quadrant Markdown atomically. No per-item approval. Extend the existing shared collection resolver with optional framework-owned section snapshot/replacement callbacks, preserving its existing array defaults. This avoids silently accepting a summary independently of its supporting analysis. Cross-quadrant partial approval does not certify coherence; retain the existing mixed-result rationale warning.

### Research request

Retain exactly `{canvas, action}`. Proposed action:

```json
{
  "id": "research",
  "target": {"type": "section", "id": "o"},
  "comment": "Investigate opportunities in the focal market",
  "use_thoughts": false,
  "include_annotations": false
}
```

Target IDs use the actual framework's declared keys (the `o` above is illustrative; use the existing SWOT opportunity key in implementation). Support canvas, section, and item targets through explicit framework adapters; reject missing, ambiguous, or incompatible targets. The UI always emits an explicit target. `use_thoughts` refers to existing AI thoughts; manual annotations remain a separate explicit opt-in. Default both flags false for Research. An optional `method: "vri"` is valid only for an explicitly selected A item in VARS. No generic nested-method registry.

The full canvas supplies context but does not authorize edits outside the selected target. Conversation can clarify the question or industry; unresolved materially conflicting framing is clarified before searching. Research preserves framing, annotations, Takeaways, unrelated content and stable identities. Broader implications appear in the report and may motivate a separate Improve/Ripple request.

### Research response and acceptance

Use a shared response shape: `{report, sources, content?}`. `report` is nonblank Markdown; `sources` contains minimal `{title, url}` entries; optional `content` is a complete framework candidate validated against target boundaries. No source-management database, graph, persistent evidence IDs or citation-status engine. Source entries validate syntax, not truth or credibility.

One atomic Research proposal contains the report, sources, optional candidate, and input snapshots. Accept applies permitted candidate changes and appends one research thought containing report and source links. Reject discards the entire batch. A report-only result still requires acceptance before joining persisted analytical thoughts. Proposal preview shows the full report, sources, and any content differences before acceptance. Rendering a pending result is not incorporation into accepted content.

Use the existing single pending slot; new actions wait until it is resolved. On acceptance, compare current analytical content with the submitted snapshot and compare opted-in annotations/AI thoughts when used. Reject remains available after local edits. Validate the complete result atomically. No silent replacement of accepted content.

SWOT stores approved findings as a research thought and can propose selected factor changes. It does not acquire Markdown item fields in this slice. External research on S/W supplies contextual or competitor evidence, not facts about the user's organization: ask the user whether comparator characteristics apply before proposing them as organizational S/W. Without confirmation, return report-only questions and differences to investigate.

### Ripple request and response

Use `action.id: "ripple"`, explicit section/item target, required nonblank `change` text, optional comment and existing thought-context option. The current canvas is the before-state. Selecting an item anchors the initiating change; the request may propose consequences across other quadrants. No broader mutation permission for Research follows from Ripple's wider scope.

Return complete candidate `content` plus `thought`. The initiating change and consequences are both proposals; preserve framing. Explain causal mechanisms, uncertainty and material trade-offs. No-change findings may return an assessment without creating an empty proposal. Do not compare against imagined earlier JSON. PAGES keeps its existing baseline and behavior unchanged.

## 3. Methodology preparation

Before implementation, independently verify seed methodology against primary academic/institutional sources using host search. Capture concise provenance and distinguish sourced principles, adaptations and original interface choices. Do not reproduce course materials. Research here concerns the framework's methodology, separately from the product's Research action.

Use progressive loading:

- VARS manifest and framework guidance: purpose, framing, coherence versus viability versus advantage.
- Element guidance: V, A, R, S; load only relevant detail.
- Optional method: VRI, with durability/relevance distinguished from the three criteria; resource inventories and activity systems as guidance rather than new editors.
- Operation methods: Create, Evaluate, Improve, Ripple, Research and Takeaways.
- Shared Research guidance: question formulation, search planning, source preference, provenance, conflicting evidence, uncertainty, target boundaries and host capability fallback.
- SWOT Research guidance: industry/time/geographic framing, external opportunities/threats, and competitor-proxy limits for S/W.

No automatic search. If search is unavailable, explain the limitation in chat and do not fabricate a completed Research response. Marketing claims remain attributed claims. General sources do not validate local company facts. Methodology gaps remain explicit, especially advanced R/S decisions, quantitative viability and time-dependent VRI evidence.

## 4. Implementation sequence

Use small vertical slices. For executable changes, add focused behavioral tests, run them to demonstrate the missing behavior, implement the smallest change, and rerun. Review the diff after each slice. Commits may be made at stable checkpoints if authorized during execution; no automatic publishing.

### Task 1 — Methodology and contract fixtures

Create:
- `docs/plans/2026-11-07-vars-methodology-review.md`
- `tests/methodology/vars.md`
- `tests/methodology/research.md`
- `tests/vars-methodology.test.mjs`
- `tests/research-methodology.test.mjs`

Record primary-source provenance, methodological gaps and representative valid/invalid request-response examples. Cover partial canvases, VRI uncertainty, unsupported viability, cross-element contradictions, scoped research, unavailable search, and SWOT competitor proxies. Qualitative walkthroughs establish observed behavior only, not broad model-quality guarantees.

### Task 2 — Minimal editable VARS canvas and packaging

Create under `.agents/skills/pensive/frameworks/vars/`:
- `framework.yaml`, `canvas.schema.json`, `state.js`
- `canvas.template.html`, `canvas.css`, `canvas.js`, generated `canvas.html`

Create `.agents/skills/pensive/scripts/package-vars.mjs` and `tests/vars-state.test.mjs`, `tests/vars-browser.test.mjs`. Modify `package.json` to add VARS to the existing build and add `build:vars`.

Implement initial state, strict structural/identity validation, framing and summary edits, add/delete/reorder, complete JSON import/export, exclusive packaging and standalone saving. Reuse shared editing assets and established style tokens; do not edit the global stylesheet to achieve VARS layout. Test malicious embedded strings, invalid imports, no-overwrite behavior and preservation of embedded implementation across repeated saves.

### Task 3 — Markdown and Overview/Focus

Create `.agents/skills/pensive/shared/markdown.js` and `tests/markdown.test.mjs`; add a browser test file if needed for link/render security. Any vetted vendored parser and license belongs alongside that helper with provenance recorded.

Implement a small supported Markdown subset or a vetted offline parser, chosen during the slice after reviewing existing dependencies. Prefer correctness over rich formatting: disable raw HTML, embedded media, remote assets and unsafe URL schemes; create safe HTTP(S) links. Do not use unsanitized `innerHTML`. Test tables, links, raw-HTML input, script termination, malicious links, and Markdown round-trip as original text.

Extend VARS state/schema/UI for quadrant/item detail editors and safe previews. Markdown editors retain normal multiline Enter; summary/framing fields retain Enter-to-finish behavior. Overview shows concise summaries. Focus highlights the selected quadrant, supports switching/back, exposes quadrant and optional selected-item detail, and uses one shared renderer/editor. Narrow screens stack navigation above detail without losing V/A/R/S arrangement. Test keyboard access, focus return, populated/empty detail, deletion, save/reopen and offline operation. Sketches describe interaction and hierarchy; reuse Pensive's existing visual language rather than treating them as pixel specifications.

### Task 4 — VARS AI operations and shared lifecycle

Create VARS `prompts/create.md`, `evaluate.md`, `improve.md`, `ripple.md`, `takeaways.md`; element guides under `methods/` and `methods/vri.md`. Create `.agents/skills/pensive/references/vars-workflow.md`.

Modify shared `proposal-review.js` only for the optional snapshot/replacement callbacks described above. Reuse existing `proposal-review-ui.js` where possible; if custom detail previews are needed, keep framework-owned rendering hooks and preserve old defaults. Extend existing partial-acceptance tests for old-framework regression and add VARS review cases.

Implement full-state actions and result composition, Evaluate thought-only, Improve/Ripple quadrant proposals, stale guards, identity preservation and immutable framing. Integrate shared annotations, Takeaways, and Six Hats with explicit VARS adapters; include detail text in relevant analytical context without treating it as independent instructions. Test pending locks, partial decisions across detail and summaries, invalid targets, cross-quadrant IDs and atomic failure. Ripple has no baseline fields or reset control.

### Task 5 — Shared Research with VARS and SWOT adapters

Create:
- `.agents/skills/pensive/shared/research.js`
- `.agents/skills/pensive/shared/research-ui.js`
- `.agents/skills/pensive/prompts/research.md`
- `.agents/skills/pensive/references/research-workflow.md`
- VARS and SWOT `prompts/research.md`
- `tests/research-state.test.mjs`
- `tests/research-browser.test.mjs`

Modify VARS and SWOT manifests, schemas, state/UI/templates and packagers to embed the shared helpers. Regenerate only affected standalone canvases, plus any whose embedded shared review asset changes. Existing SWOT actions retain their contracts and review granularity.

Shared helpers own Research request options, response/proposal validation, input snapshots, atomic report/content acceptance and common dialog/review presentation. Framework adapters own target enumeration, source guidance, allowed candidate changes and complete-state validation. Reuse safe Markdown rendering for reports in both integrations, without changing existing plain-text thoughts globally.

Test selected-target construction, context flags, report-only proposals, candidate edits, invalid links/sources, no-search fallback guidance, out-of-target changes, pending locks, stale content/context, rejection after edits, save/import with pending Research, accepted report preservation and single-slot interaction with Takeaways/Improve. Confirm S/W comparator research cannot be described as verified organizational facts in methodology walkthroughs.

### Task 6 — Routing, documentation and distribution compatibility

Modify:
- `.agents/skills/pensive/SKILL.md`
- `.agents/skills/pensive/references/framework-contract.md`
- `.agents/skills/pensive/references/state-action-contract.md`
- shared Takeaways/Six Hats references only where VARS compatibility must be declared
- `docs/architecture.md`, `docs/roadmap.md`, `docs/testing.md`

Update skill routing to load only selected methods. Make supported Research targets explicit per framework; do not advertise Research for VPC/PAGES/5 Whys yet. Explain host search requirements and conversational output alongside the new artifact. Verify `builds/claude/build.py` includes the new skill files; adjust only if its existing discovery requires it. Validate a temporary experimental package if applicable without changing release artifacts or publishing. README remains unchanged.

## 5. Verification and acceptance

Use a unique OS temporary directory for requests, responses, browser downloads and temporary distribution builds; remove it after verification. User-facing sample canvases go explicitly into `outputs/`, without overwriting existing files.

Commands, using the repository's working Node/browser paths when ordinary `node` is unavailable:

```sh
node --test tests/vars-state.test.mjs tests/markdown.test.mjs tests/research-state.test.mjs
node --test tests/vars-methodology.test.mjs tests/research-methodology.test.mjs
node --test tests/vars-browser.test.mjs tests/research-browser.test.mjs tests/partial-acceptance-state.test.mjs tests/partial-acceptance-browser.test.mjs
node --test tests/*.test.mjs
python3 /Users/juraj/.codex/skills/.system/skill-creator/scripts/quick_validate.py .agents/skills/pensive
git diff --check
git diff --exit-code -- README.md
```

Use `PLAYWRIGHT_BROWSERS_PATH=/tmp/pensive-playwright` and the bundled Node documented in `docs/testing.md` if required. The validator may need its existing temporary PyYAML environment. Missing dependencies/process access must be reported rather than represented as passing. Run all framework packagers and confirm deterministic rebuilt files match their sources. Check every new local Markdown guidance link and parse all manifests.

Inspect desktop and narrow screenshots for Overview, Focus, Markdown/VRI table, research dialog and pending review. Verify keyboard access and offline opening. Retain qualitative walkthrough results with actual source provenance; do not equate fixture checks with live search quality or cross-host validation.

Acceptance examples:
1. Blank VARS opens in Overview, supports partial summaries and keeps the fixed matrix recognizable.
2. Resource detail and VRI Markdown survive JSON and HTML round-trips without structured assessment fields.
3. Evaluate diagnoses a V/A/R/S mismatch without changing accepted content.
4. Improve and explicit-change Ripple preserve framing and present reviewable quadrant changes, including supporting details.
5. Research on a VARS quadrant/item and SWOT opportunities returns source-backed pending findings; rejection leaves accepted analysis unchanged.
6. A SWOT competitor report distinguishes competitor evidence from unverified applicability to the focal organization.
7. Accepted Research changes are scoped, atomic, portable and blocked when their input becomes stale.
8. Existing framework tests pass; unchanged README and no legacy extraction/publication are verified.

## 6. Deferred stories and limitations

- **Simpler approval:** Explore direct application or less granular approval after usage feedback. Evaluate it alongside **previous-version recovery**, potentially asking the host to load an earlier complete JSON. This is a future user story; this slice implements neither history nor rollback.
- Research adapters for VPC, PAGES and 5 Whys; shared infrastructure alone does not make them supported.
- Automatic detection of already-made changes for VARS Ripple; replacing PAGES' baseline is a separate decision.
- Structured VRI controls, evidence databases, dependency graphs, financial forecasting and generic nested-method infrastructure.
- Advanced revenue-design and make/buy methods; methodological evolution should follow usage and further primary-source research.
- Search availability, source quality and analytical output depend on the host. Static tests cannot establish parity across Codex, ChatGPT and Claude.
- Existing exported HTML retains its embedded runtime. Users need a newly packaged compatible canvas to obtain new controls; no automatic upgrade.

## Review gate

Review the proposed data shape, atomic Research approval, quadrant-level Improve/Ripple approval, and initial SWOT integration. After approval, execute the vertical slices with focused and full regression checks. No implementation has been performed as part of preparing this plan.
