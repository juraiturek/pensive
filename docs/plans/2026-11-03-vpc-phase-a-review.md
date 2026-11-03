# VPC Phase A: extraction audit and design for approval

Status: approved by the user on 2026-11-03. Core → Evaluate → Improve is authorized. Deferred generic tools and VPC follow-ups are recorded in the roadmap. Audit date: 2026-11-03.

## Recommendation and alternatives

Implement the core VPC plus Evaluate, then Improve. Evaluate combines methodological guidance, fit assessment and framing–content diagnosis in a thought-only response. Improve proposes core-content revisions with framing preserved. Both require separate focused verification before moving on.

Alternatives: core plus Evaluate alone offers the smallest useful slice but requires manual revisions; implementing Ripple, Restate and viewpoint actions now gives more flexibility but adds baseline, framing-change and action-selection complexity before VPC has been exercised. The recommended middle option provides diagnosis and a reviewable response without those additional protocols.

This review is the mandatory Phase A gate. Phase B and C start only after approval. Do not add VPC partial acceptance: existing SWOT/PAGES support is not authorization to extend it here. No commit or push is part of this audit.

## Current destination conventions

- `README.md` is vision and remains unchanged. `docs/architecture.md`, `docs/roadmap.md` and `docs/testing.md` govern sequencing and verification. Their historical slice descriptions are not all current capability statements.
- `.agents/skills/pensive/frameworks/{swot,pages}/` each own a manifest, JSON Schema, state operations, source template/styles/runtime, committed standalone HTML and progressively loaded Markdown methods.
- State envelope: `framework`, `schema_version`, `content`; `content.framing` holds scalar strings, analytical collections hold stable `{id,text}` items. Optional thoughts and a single proposal are current state, not history.
- Framing is explicitly separated in both schemas. Current transformations preserve it; PAGES Ripple additionally preserves selected source collections and guards its persisted baseline.
- `scripts/package-{swot,pages}.mjs` safely embed data in the established HTML and exclusively create user outputs. No model-generated replacement implementation. Development builds are separate from user packaging.
- `SKILL.md` routes explicit framework requests and selectively offers PAGES when appropriate. Creation prompts reuse conversation, resolve consequential gaps adaptively, then generate and validate state. SWOT/PAGES use zero to two question turns, including sparse-draft agreement.
- UI pattern: framing above the canvas, compact action toolbar, thought/proposal areas, local editing, clipboard export with manual fallback, Save to File. PAGES adds confirmed pasted-JSON import; SWOT has no import UI.
- Shared proposal state/UI helpers exist under `shared/`; styles are reused from SWOT at build time. Do not migrate a generic renderer. Existing helpers are collection-resolution oriented and cannot automatically be reused unchanged for VPC whole-canvas review.
- Tests: Node built-in runner, Ajv and Playwright; no production package dependencies in HTML. Deterministic validity does not establish methodological truth.

## Read-only provenance and RrEAC findings

V1 root: `../Old-obsolete-app-codebase/pensieve-main/`. No Git revision could be resolved at that root or its parent; selected inspected files are fingerprinted in the companion source JSON. V2 root: `../pensive-v2/`, HEAD `a75617205cf342ebe851379ab43db52e35a07a5e`; fingerprints record actual inspected bytes rather than assuming a clean legacy checkout. No source directory was copied or changed. Findings are from source inspection, not execution of either legacy server.

| Source relative to its legacy root | Purpose and strengths | Limits | Treatment |
| --- | --- | --- | --- |
| V1 `schemas/vpc.yml` | Six standard collections; product/customer/optional market framing; customer vs offer tags | Thin scenario/alternative context; no stable item identities or relationship evidence | Adapt semantics; prefer V2 framing |
| V2 `app/frameworks/registry.py` VPC entry | Five framing fields with explicit framing/core roles, six content collections | Character/item caps and text deduplication; four required framing declarations exceed runtime generation gate | Adapt field model; reject caps/dedup and rigid completeness |
| V1 `app/service/wizard.py`, `app/api/wizard_router.py`, `static/wizard/wizard.js` (wizard JS located, not inspected) | Schema-led framing precedes generation; required product/customer checked | Fixed app form, server/OpenAI/storage, separately persisted framing with swallowed persistence errors | Adapt sequencing; reject infrastructure. No claim that browser wizard was tested |
| V2 `app/services/canvas_ai_service.py`, `app/routes/canvas_pages.py` | Generate merges only core output into existing framing; explicit action boundaries and framing/core UI flags | Generate validation accepts any one nonempty framing field, despite registry required flags; append-state/backend persistence | Adapt boundary; replace readiness with methodological sufficiency |
| V1 `prompts/generate/vpc_generate.j2` | Product/segment/context feed six lists | Minimum one per list encourages unsupported fill; little VPC guidance | Replace with destination Markdown creation method |
| V2 `prompt_templates/user/vpc_generate.j2` | Scenario-specific customer profile and mapped value map; core-only output | Forces 3–8 items/list, short character caps; can manufacture apparent fit | Adapt methodological requirements; reject quotas |
| V2 `prompt_templates/user/vpc_guidance.j2` | Jobs as contextual verbs, pains/gains as outcomes, evidence, priority, alternative and metric, explicit fit mappings | Rigid response length; can imply every canvas needs quantified thresholds | Main source for Evaluate; no invented metric or threshold |
| V1 `prompts/reflect/vpc_reflect.j2`; V2 `prompt_templates/user/vpc_reflect.j2` | Concise observation; V2 explicitly calls out weak/unsupported fit | V1 generic; V2 under-300-character constraint loses nuance | Merge useful behavior into Evaluate |
| V1 `prompts/improve/vpc_improve.j2`; V2 `prompt_templates/user/vpc_improve.j2` | Revision plus rationale; V2 preserves framing and maps needs to offering | V1 broad replacement; V2 quotas and pressure to strengthen fit | Adapt as Improve; preserve uncertainty and legitimate non-fit |
| V1 `prompts/ripple/vpc_ripple.j2`, `vpc_ripple_pains.j2`, `app/api/ripple_router.py` | General consequences and pains→relievers/product specialization | No artifact baseline; response updates applied directly, permissive update keys; risks inventing product capability | Defer; if selected later, adapt persisted comparison and explicit source preservation |
| V2 `prompt_templates/user/vpc_restate_problem.j2`, service extraction/validation | Content can reveal better framing; framing-only restatement | Infers segment/alternative/metric; may retrofit framing to justify content; append-state semantics | Defer explicit reviewed reframing |
| V2 `prompt_templates/user/vpc_viewpoint_{white,red,black,yellow,green,blue}.j2` | Six focused thought-only lenses | Overlap with evaluation; not the future cross-framework reflection-plus-suggestions design | Defer as separate cross-framework scope |
| V1 `prompts/tools/vpc_tool.j2`, `static/vpc/canvas.js`, `app/api/canvas_router.py` tool endpoint | Analogy, Combination, Re-Categorization, Association on selected node | Tool prompt sees selected content and thoughts, not full fit/framing context; replaces node directly | Omit from initial VPC; do not port unsafe isolated transformation |
| V1 `app/service/prompt_rules.yml`; V2 `prompt_templates/rules.json`, `system/*.j2`, `app/services/prompt_library_service.py` | Confirms reachable action/template families; V1 viewpoint uses PAGES templates | Jinja/server dispatcher and inconsistent legacy JSON shapes | Adapt explicit manifest declarations and progressive Markdown routing only |
| V1 `templates/frameworks/vpc.html`, `static/vpc/vpc.css`, `static/vpc/{vpc,canvas}.js`; V2 `app/frameworks/layouts/vpc.canvas.yml` | Four-column/two-row layout pairs gains/creators and pains/relievers, outer jobs/products span rows | V1 server fetches/session storage and legacy CSS; V2 generic layout compiler | Adapt geometry, reuse destination visual language; reject runtime/compiler |
| V1 `tests/views/test_canvas_vpc.py`; V2 `tests/unit/test_framework_layout_service.py` | Rendering labels and responsive ordering examples | Presence assertions/layout tests do not prove fit analysis or offline behavior | Adapt scenarios into destination tests, not server fixtures |

The source inventory covers VPC-specific files and registered VPC routes. No separate VPC Evaluate prompt was found: the strongest equivalent is V2 Guidance plus Reflect. V1 viewpoints route to shared PAGES templates rather than VPC-specific hat prompts. No V2 VPC Ripple mapping was found in the inspected rules. V1 node notes are manual annotations, not AI actions.

## Standard methodology check

Primary references reviewed:

- [Strategyzer official VPC](https://www.strategyzer.com/library/the-value-proposition-canvas): one customer segment and the two complementary halves.
- [Strategyzer explanation](https://www.strategyzer.com/library/achieve-product-market-fit-with-our-brand-new-value-proposition-designer-canvas): functional/social/emotional jobs, pains/gains, products/services and how they relieve pain/create benefits.
- [Strategyzer testing roadmap](https://www.strategyzer.com/library/roadmap-to-test-your-value-proposition): test customer-profile assumptions before treating proposed value as validated.

The legacy six collections match the standard model. V2's scenario, current alternative and success metric are useful framing extensions, not additional VPC content quadrants. Prioritization and testability are useful criteria, not permission to invent rankings or numeric evidence. Do not equate a plausible written match with demonstrated product–market fit.

Customer-side descriptions must stand independently of the proposed solution: jobs are what the customer seeks to accomplish, pains are obstacles/risks/undesired outcomes, gains are desired benefits. Provider-side products/services are actual or explicitly proposed offering components; relievers/creators explain a mechanism tied to a specific pain/gain. A product feature is not automatically a customer job or a proven benefit. Important unmatched needs and irrelevant offering components are useful findings.

Evidence provenance stays readable in item text: `Customer report: …`, `Observed in supplied study: …`, `Provider hypothesis: …`, `Proposed capability: …`. A user's belief about customers is not automatically a customer report. Preserve actual supplied source details; never invent interviews, measured outcomes, customer priorities or causal effects. Empty collections and weak-fit conclusions are valid.

## Proposed schema and framing contract

Use V2's field names; this is an explicit proposed destination contract rather than an automatic migration:

```json
{
  "framework": "vpc",
  "schema_version": "1.0",
  "content": {
    "framing": {
      "product_offering": "",
      "customer_segment": "",
      "scenario_job_context": "",
      "current_alternative": "",
      "success_metric": ""
    },
    "jobs": [],
    "pains": [],
    "gains": [],
    "products_services": [],
    "pain_relievers": [],
    "gain_creators": []
  }
}
```

Each list item uses `{id,text}` and stable identity, as in existing frameworks. No extra objective, geography or market fields: relevant boundaries go in scenario/context; the decision criterion can be expressed in success metric when known without inventing a number. Empty strings and arrays remain structurally valid for manual creation. Semantic readiness is separate from structural validity.

Initial populated creation normally needs an identifiable offering and one customer segment. Scenario must be clear enough to avoid materially different jobs; clarify it when consequential. Alternative and metric are optional when unknown. If the user only knows the customer problem, offer an explicitly sparse customer-profile draft rather than inventing an offering. Distinguish user and buyer when relevant; do not combine multiple segments into one apparent profile.

Initially describe fit relationships in readable text, referring unambiguously to the target need and mechanism. Keep IDs stable but do not introduce a link editor, relationship graph or separately persisted fit score. Revisit structured links only if demonstrated ambiguity makes them necessary.

Optional current thoughts and one pending proposal follow the existing envelope, specialized to approved VPC actions. Evaluate returns exactly `{thought}`; Improve returns `{content,thought}` with complete candidate content, unchanged framing and stable retained IDs. Proposed VPC acceptance is whole-canvas, with current-content stale checking and no `resolutions` or partial controls. No Ripple baseline unless Ripple is separately approved later.

## Creation: context → framing → content

1. Explicit empty request: package the blank editable canvas; ask nothing.
2. Extract only the five framing fields from available context before drafting lists. Separate explicit statements, reasonable inferences and unresolved assumptions. Do not silently collapse audiences or product variants.
3. Resolve the most consequential essential gap in one focused conversational question. Reuse known answers. At most two question turns, including agreement to a sparse draft; no standalone wizard. If still insufficient, obtain sparse-draft agreement or offer blank rather than invent facts. An optional unknown alternative/metric does not block creation.
4. Establish the working framing explicitly in the state, labeling material inferred scope in its text. No mandatory confirmation when context is sufficiently clear.
5. Generate the customer profile independently from supplied customer evidence, then the offering side from supplied capabilities or labeled proposals. Derive a reliever/creator only when its mechanism and target are supportable; do not generate content just to fill six lists.
6. Check content against framing. Out-of-scope generated content should be removed/corrected. An unsupported claim should be qualified or omitted. Material ambiguous framing warrants clarification. A credible discovery challenging framing should be surfaced for user choice, not silently edited into framing.
7. Validate and package a new artifact. Explain sparse evidence and hypotheses briefly. No creation proposal or fake historical baseline.

## Ongoing framing–content coherence

A lightweight new shared methodological reference defines the directional creation contract and the three-way discrepancy response: revise content, consider reframing, or seek evidence/clarification. VPC create/Evaluate/Improve reference and specialize it. Add a link to the framework contract without rerouting or rewriting SWOT/PAGES methods.

Deterministic validation enforces types, keys, IDs, exact framing preservation and proposal boundaries. It cannot decide whether a new customer insight warrants a different frame. Evaluate identifies concrete contradictory entries and explains both plausible interpretations. Improve fixes clear content drift, but where discovery may invalidate the frame it preserves the disputed insight with provenance and explains the unresolved choice rather than forcing a cosmetic fit. User may edit framing locally, then request a fresh analysis. Do not implement background coherence checking or automatic propagation.

## Complete action inventory and priority

All existing-state actions take complete current canvas state. Optional steering and `use_thoughts` follow destination conventions; no hidden legacy thought-store context. Complexity is relative, not an effort estimate.

| Candidate / source | Purpose, relevant nodes and expected output | User value | Complexity / dependency / overlap | Recommendation |
| --- | --- | --- | --- | --- |
| Create / V1 Generate, V2 Generate | Established framing → six lists and initial state; creates content | Grounded first canvas | Medium; core schema/UI/packaging; quotas rejected | Phase B, first |
| Evaluate / V2 Guidance + Reflect, V1 Reflect | All framing and core; thought only on classifications, priority, supported/unsupported fit and scope mismatches | Diagnosis without changing analysis | Low–medium; complete-state handoff and thoughts; subsumes separate Reflect/Guidance | Phase C1, now |
| Improve / V1 and V2 Improve | All framing as fixed context, six core lists → complete candidate plus rationale; transforms content | Address diagnosed weaknesses without losing edits or inventing fit | Medium; proposal validation, stable IDs, whole-canvas review; verify after Evaluate | Phase C2, now |
| Reflect / V1 and V2 Reflect | All nodes → brief fit observation; evaluates | Fast insight | Low, but duplicates Evaluate | Omit separate button; preserve purpose inside Evaluate |
| Guidance / V2 Guidance | All nodes → methodological thought; evaluates | Better framing, evidence and mapping discipline | Low, overlaps Evaluate | Omit separate button; main Evaluate source |
| Fit assessment / derived from V2 criteria, not a separately named legacy action | Customer profile ↔ value map in context → supported links, gaps and tests in thought | Avoid convincing-looking but unsupported fit | Medium reasoning; overlaps Evaluate, no new score schema needed | Include in Evaluate; omit separate action initially |
| Ripple / V1 general prompt | Changed collection(s) and actual before/after → implications in other collections plus rationale | Explore change consequences | High; persisted baseline, source guards, proposal review; overlaps Improve for routine repair | Later |
| Pains Ripple / V1 specialized prompt | Changed pains → proposed relievers/product adjustments | Focus offering response to needs | Depends on Ripple and actual capability evidence; easy to fabricate solutions | Later as Ripple specialization, not separate button |
| Restate framing / V2 Restate Problem | Core evidence plus original framing → framing-only proposal and explanation | Legitimate discoveries can challenge original scope | High; new permission boundary/review handling; conflicts with initial framing-preservation rule | Later, explicit approval required |
| White Hat / V2; V1 shared viewpoint | All nodes → evidence-gap thought | Inspect assumptions | Overlaps Evaluate; future cross-framework tool | Later |
| Red Hat / V2; V1 shared default | All nodes → intuitive concern thought | Surface a reaction to test | Must not invent customer feelings; cross-framework dependency | Later |
| Black Hat / V2; V1 shared default | All nodes → risk/weak-mapping thought | Stress-test proposition | Overlaps Evaluate; cross-framework dependency | Later |
| Yellow Hat / V2; V1 shared default | All nodes → conditional upside thought | Explore constructive potential | Must not turn possibility into evidence; cross-framework dependency | Later |
| Green Hat / V2; V1 shared default | All nodes → alternative/experiment thought | Explore alternatives | Overlaps Improve; future tool may also propose changes | Later |
| Blue Hat / V2; V1 shared default | All nodes → process/sequence thought | Select next analytical step | Overlaps Evaluate; cross-framework dependency | Later |
| Analogy / V1 Tool | Selected collection + thoughts → replacement values and optional thought | Generate alternatives | Legacy input omits framing/full canvas; needs redesigned target contract | Omit initial scope |
| Combination / V1 Tool | Same node-only transform | Combine concepts | Same missing-context problem; overlap Improve | Omit initial scope |
| Re-Categorization / V1 Tool | Same node-only transform | Reconsider classification | Cross-node moves require full context and identity guarantees | Omit initial scope |
| Association / V1 Tool | Same node-only transform | Discover associations | Weak fit/evidence constraints; overlap Improve | Omit initial scope |

No separate enrichment or research action is proposed. Evaluate can name missing evidence or a possible test, but it cannot conduct customer research. Improve may preserve/qualify supported content and propose conditional mechanisms; it must not fabricate capabilities or customer findings.

## Canvas and integration design

Use a VPC-specific two-half layout: Value Map left, Customer Profile right. Within it retain the legacy four-column/two-row geometry: products/services at outer left, creators above relievers in the middle-left, gains above pains in the middle-right, jobs at outer right. Side headings make ownership explicit. Matching rows communicate relationship without implying evidence of fit. At narrow widths stack complete halves and maintain clear labels; do not inherit V2 registry's accidental stack ordering.

Reuse current typography, colors, spacing, buttons, framing styles, editors and status patterns by adapting destination code and including existing CSS at build time. Add only VPC layout CSS. No embedded app libraries, remote fonts or external requests. Do not port V1's server calls/session storage or V2's layout compiler.

Framing: offering, segment and scenario prominent; alternative and metric available as optional secondary fields. No required-field browser validation blocking empty canvases. Toolbar: approved actions only, Import JSON, Export to clipboard, Save to File. Import validates before confirmed replacement; denied clipboard shows complete selectable JSON. Review uses current/proposed comparison and whole-canvas accept/reject only. Existing shared review UI cannot be included unchanged because it exposes partial controls; adapt a minimal VPC whole-canvas view, not a new generalized engine.

Activation: explicit VPC requests route immediately. Implicit opportunities receive one selective suggestion about customer–offering fit and wait for user choice. SWOT is internal/external strategy; PAGES is perspective composition/shifting; VPC is one segment's needs and an offering's response. No automatic conversions or intrusive suggestions.

## Proposed files and staged sequence

After approval:

1. Core contract and blank vertical slice: `frameworks/vpc/{framework.yaml,canvas.schema.json,state.js,canvas.template.html,canvas.css,canvas.js,canvas.html}` and `scripts/package-vpc.mjs`; independent VPC state/browser tests. No unapproved action dispatcher or baseline.
2. Creation: `frameworks/vpc/prompts/create.md`, `references/vpc-workflow.md`, new `references/framing-content.md`, small links/routing additions in `SKILL.md` and `references/framework-contract.md`. Retained methodology examples and observed outputs under `tests/methodology/vpc*`.
3. Evaluate: `frameworks/vpc/prompts/evaluate.md`, action contract/dialog/thought support and focused tests. Verify before proceeding.
4. Improve: `frameworks/vpc/prompts/improve.md`, proposal validation and whole-canvas review, then focused tests and full regression.
5. Update `docs/{architecture,roadmap,extraction-map,testing}.md` and package build scripts. Do not modify README, old framework schemas/methods or existing behavior. No new runtime dependency. Source layout files inform geometry only; no bulk extraction.

An executable implementation plan with failing tests and exact edits follows approval. This audit is not an implementation claim.

## Verification plan and acceptance scenarios

- Empty VPC opens offline; six independent editable collections and five framing strings; stable identity; no required-field blocking.
- Rich case: one supplied customer, scenario, offering and evidence, no questions; preserve provenance and distinguish customer reports from provider claims.
- Partial case: known offering with ambiguous buyer/user; one focused clarification establishes segment before content. Unknown alternative/metric stay empty. Unresolved essential gaps offer an agreed sparse draft or blank.
- Negative case: fictional offering with no customer evidence; no invented confirmed needs, interviews, relievers or strong-fit conclusion. Weak or absent fit is a legitimate result.
- Classification case: “use our dashboard” must not replace the customer's underlying job; a feature is not automatically a gain or a pain-relief mechanism.
- Coherence cases: enterprise buyer frame mixed with student content; accidental drift corrected, credible new-segment discovery surfaced, and ambiguity left unresolved with a useful question. Framing never silently rewritten.
- Evaluate independently: unchanged content, specific observations, uncertainty, mappings and mismatches; no unsupported score or replacement values.
- Improve independently: fixed framing, existing IDs retained for retained concepts, plausible non-fit allowed, no fabricated provider capability, current content unchanged pending whole acceptance; stale acceptance atomic; reject preserves edits.
- Import/export, invalid JSON/version/IDs, confirmed replacement/cancel, clipboard fallback, successive saved-file reopen, adversarial text and exclusive packaging. Pending proposals and annotations round-trip.
- Desktop/mobile visual review for distinct halves, Pensive consistency, keyboard focus and overflow. Rebuild byte reproducibility and implementation preservation.
- Full SWOT/PAGES regression after integration. Skill validator, local Markdown links, README checksum and diff review. Methodological observations recorded separately from deterministic tests, including their limits. No claims about legacy server or other browser engines unless actually exercised.

## Decisions requested

1. Approve five-field V2-derived framing, six stable-ID collections, and readable evidence/mapping text rather than a relationship graph.
2. Approve core → Evaluate → Improve, with fit/coherence inside Evaluate; defer Ripple, Restate and Six Hats, omit separate Reflect/Guidance/node tools initially.
3. Approve whole-canvas VPC review only; do not extend existing partial acceptance.
4. Approve the lightweight framing–content reference used by VPC, with no retrofits to SWOT/PAGES methods.

No code was changed or run for this Phase A review. Structural document checks and source fingerprints are reported separately; implementation and analytical acceptance testing remain future work.
