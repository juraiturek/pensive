# Minimal framework package contract

Status: the SWOT/TOWS package implements this contract for manual capabilities, AI-assisted creation, and guided existing-canvas actions. Explicitly version breaking contract changes.

PAGES also implements this contract with five explicit dimensions and Evaluate/Improve/Ripple. See its [manifest](../frameworks/pages/framework.yaml) and [handoff](pages-workflow.md). Its artifact-persisted Ripple baseline is a single comparison snapshot, not revision history. Framework-specific validation owns its action boundaries; identical action names alone do not select a handoff.

Packages live at `../frameworks/<id>/` relative to this reference directory. Each owns `framework.yaml`, `canvas.schema.json`, `canvas.html`, and specialized Markdown methods in `prompts/` as needed. Manifest resource paths stay inside the package, except explicit references to shared methods within the skill.

| Declaration | Meaning |
| --- | --- |
| Identity | Stable ID, human-readable name, package version, and supported state schema version. Package and schema versions are distinct. |
| Semantics | Framework concepts, fields, relationships, and constraints; not generic page composition. |
| State schema | JSON Schema for framework content and framework-owned proposal payloads. |
| Actions | Stable action IDs, shared method references or specialized prompt paths, intended effects, and required context. |
| Targets | Target types, identity resolution, and explicit action compatibility, including canvas-level actions. |
| Quality criteria | Framework-specific methodological and evaluation criteria. |
| Canvas | Established standalone implementation and required local interactions. |
| Acceptance | Supported proposal types and rules, including specialized validation where required. |

Generic action reuse requires an explicit mapping from method concepts and targets to framework semantics. Matching action names alone do not establish compatibility. Keep substantial reasoning in Markdown, with shared methods in future `../prompts/` and specialized interpretation in the package. The manifest introduces neither a template runtime nor a generic canvas engine.

Future organization-specific packages can satisfy this contract through an explicitly configured local path. Discovery, permissions, installation, registries, and commercial distribution are deferred. No private package is implicitly trusted or loaded.

New initialization produces a reviewable draft without proposals or acceptance controls. PAGES and SWOT/TOWS support section-level acceptance, corresponding to a declared framework collection, plus batch/bulk resolution. See [proposal review](proposal-review.md) for the decision protocol. Individual-item acceptance remains outside scope. Acceptance granularity is independent of AI action targeting.

## Slice-1 manifest convention

`framework.yaml` uses `id`, `name`, `package_version`, `schema_version`, `state_schema`, `canvas`, `semantics`, `manual_capabilities`, `ai_actions`, `target_types`, `action_compatibility`, `quality_criteria`, and `acceptance`. Schema/canvas paths are package-local. SWOT declares `create`, `strategize`, `evaluate`, and `improve` in `ai_actions` with package-local `method`, `effect`, and `required_context`. Create initializes state. The other three declare canvas-level compatibility. Evaluate adds an annotation only; Strategize/Improve require explicit local acceptance of changed collections, individually or in bulk. A declaration is not a runtime discovery mechanism.

The committed `canvas.html` is standalone. Separate source markup, styles, state operations, and UI runtime are assembled by the small SWOT-specific packaging script. No source file is loaded over the network when opening HTML.
