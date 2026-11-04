# Cross-framework fit observations — 2026-11-03

## Procedure and limits

A Codex evaluator inspected the pre-change SWOT/PAGES creation and action methods and shared framing reference before the prompt changes. That baseline found incomplete explicit instruction coverage, not a sampled model failure: both frameworks already contained useful boundary and coherence guidance. The shared discrepancy triage was not routed to SWOT/PAGES; PAGES did not explicitly explain when an intentional shift requires reframing.

After reading the changed skill routing, shared guidance and seven framework methods, the evaluator constructed six creation drafts and twelve existing-action responses. Inputs, complete states, synthetic clarification exchange, responses and observations are retained in [cross-framework-fit-observed.json](cross-framework-fit-observed.json). These are synthetic instruction-following observations authored by the evaluator, not live-user answers, external API calls, independent model sampling or a statistical benchmark. They show how the guidance can be applied, not reliability or analytical truth.

## Creation observations

| Case | Observed application |
| --- | --- |
| SWOT aligned | Extracted River studio, regional-sales objective and external environment before generating relevant factors. No redundant questions; strategies remain empty. |
| SWOT unrelated entity | Excluded the explicitly unrelated parent's hotel capability instead of expanding River's entity boundary. |
| SWOT credible discovery | Wholesale-pottery objective conflicts with a reported preference for workshops. One explicitly simulated clarification preserves current scope while retaining the discovery as a scope question. Neither deletes the finding nor silently changes objective. |
| PAGES aligned | Situation/purpose and Maya's ownership precede five-dimensional generation; self-belief remains reported experience. Initial baseline matches content. |
| PAGES unrelated perspective | Excluded unlinked CEO acquisition beliefs rather than merging another person's identity into Maya's lens. |
| PAGES intentional reframing | An explicitly requested hypothetical company-wide policy-design analysis receives broader, labeled framing before generation. It asserts no authority or other people's identities. |

## Existing-action observations

SWOT Evaluate covers aligned factors with unresolved feasibility, another-entity drift, and a workshop discovery questioning a specifically **wholesale pottery** objective. Improve removes only the unsupported other-entity claim in the drift case; the discovery case retains the finding and requests an explicit scope decision/investigation rather than manufacturing an improvement. Internal/external factor classification remains distinct from the two fit types.

PAGES Evaluate covers a useful internal tension within an aligned situation, accidental owner drift and a policy discovery potentially warranting broader scope. Improve removes an unrelated CEO identity but refuses to silently replace Maya's owner framing with a team perspective. Ripple covers both a deliberate within-frame shift toward developing reviewers and an explicitly broader company-wide policy-design premise. The latter preserves the meaningful source edit, proposes no incompatible consequences, recommends explicit reframing and names the content-only baseline's historical limitation.

All twelve response thoughts distinguish implemented diagnosis/proposal from a future user decision. No fit scores, universal checklist, new actions or UI statuses are introduced. Useful tensions remain visible.

## Executed protocol verification

Run from the repository root:

```sh
/Users/juraj/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test tests/cross-framework-fit-methodology.test.mjs
```

Result: **1 test passed**, covering all **6 creation cases and 12 action cases**. The retained test runs runtime and Ajv schema validation, real creation/result packaging CLIs, embedded-state round-trip, unchanged HTML implementation bytes, immutable requests, unchanged accepted content before review, framing preservation, explicit whole-proposal acceptance, Ripple source/baseline preservation and rejection of attempted framing mutation. Temporary packaged artifacts are removed after the test.

These deterministic checks establish protocol compatibility; they do not establish that a model will follow the new guidance consistently. Browser controls and broader regressions are recorded separately in `docs/testing.md`; this evaluation did not exercise UI, live elicitation or new evidence gathering.
