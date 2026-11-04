# Cross-framework fit review — 2026-11-03

## Principle and implementation

The durable principle is in `docs/architecture.md`, “Internal and external analytical fit.” Operational guidance is in `.agents/skills/pensive/references/framing-content.md`. Internal fit concerns methodology-defined relationships within content; external fit concerns content in relation to framing. Both apply during creation/review without requiring harmony, numerical scores or a generic engine. Discrepancies can call for content adjustment, reframing or investigation.

`SKILL.md` now loads shared guidance for analytical creation/actions. `references/framework-contract.md` makes framework ownership explicit and removes the obsolete statement excluding SWOT/PAGES from shared framing guidance. Blank copying and JSON-only packaging do not require analytical review.

## SWOT/TOWS

Inspected manifest, schema, state validation, Create/Strategize/Evaluate/Improve, handoff and existing methodology scenarios. Framing is `focal_entity`, `objective`, `environment`; analytical content is four factor collections plus SO/ST/WO/WT strategies. Creation already extracts entity/boundary, objective and environment from available conversation before generation, clarifies consequential gaps with a two-turn ceiling, discloses its general lens default and leaves unsupported quadrants empty. Factor classification is relative to the entity, not absolute control.

Internal-fit concepts already present include grounded TOWS pairing, mechanisms, feasibility, duplication, contradictions, resource conflicts, dependencies and strategies stale after factor edits. Those concepts and Strategize remain unchanged. Internal/external factor classification is distinct from the two fit concerns.

Gaps were implicit framing-fit review and insufficient distinction between drift and evidence challenging the objective/scope. Create now explicitly reviews framing fit; Evaluate triages discrepancies within its requested SWOT/TOWS scope; Improve retains credible discoveries and explains unresolved framing choices instead of forcing consistency. All action framing preservation rules remain intact. No schema or visual change was necessary.

## PAGES

Inspected manifest, schema, state validation, Create/Evaluate/Improve/Ripple, baseline contract, handoff and existing methodology scenarios. Framing is `what` (situation/scope), `why` (purpose), `intuition` (optional initial interpretation). Content is Parts, Actions, Goals, Events and Self-concepts. The perspective owner is established through context/readable framing, not a dedicated field. Intuition is not an established fact; display order is not a causal chain.

Creation already distinguishes discovery from shifting, grounds self-concepts in user statements and labels hypothetical alternatives. Evaluate already recognizes legitimate tensions. Ripple compares explicit selected source changes with the persisted content-only baseline, preserving current sources and framing; source changes do not prove new authority or resources.

Gaps concerned explicit framing-fit checks and what to do when a requested alternative premise cannot fit current framing. Create now makes framing-first generation/review explicit. Evaluate separates accidental situation/owner/purpose drift from productive perspective shifts. Improve and Ripple explain necessary reframing without applying it or forcing incompatible consequences into a proposal. The baseline cannot establish framing history or intent; prompts now name that uncertainty. Deliberate shifts within the same framing remain supported.

## Visualization: deferred

Existing evaluation thoughts suffice now. Potential framework-specific cues include SWOT strategy–factor/objective mismatches, PAGES premise-to-consequence explanations and VPC customer–offering links or scope discrepancies. Qualitative cues should identify evidence and uncertainty. Dedicated visuals, persistent fit status, numerical scoring and universal dashboards are not implemented.

## File record

- `docs/architecture.md`: durable principle and visualization assessment.
- `.agents/skills/pensive/references/framing-content.md`: shared operational distinction, retaining existing bidirectional discrepancy triage.
- `.agents/skills/pensive/references/framework-contract.md` and `SKILL.md`: framework authority and loading.
- SWOT `prompts/create.md`, `evaluate.md`, `improve.md`: focused external-fit guidance.
- PAGES `prompts/create.md`, `evaluate.md`, `improve.md`, `ripple.md`: framing fit and legitimate shifting/reframing.
- `docs/plans/2026-11-03-cross-framework-fit.md`: approved execution sequence.
- `tests/methodology/cross-framework-fit.md` and `cross-framework-fit-observed.json`: retained synthetic reasoning observations and representative inputs/outputs.
- `tests/cross-framework-fit-methodology.test.mjs`: reproducible schema/action/packaging checks over the retained observations.
- `docs/testing.md`: actual verification results and limitations.

README, VPC implementation plans, framework manifests/schemas, executable source, canvases, existing actions and proposal-acceptance machinery are unchanged. No new dependency, backend, legacy extraction, remote or publication is involved.
