# Minimal framework package contract

Status: the SWOT/TOWS package implements this contract for manual capabilities, AI-assisted creation, and guided existing-canvas actions. Explicitly version breaking contract changes.

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

New initialization produces a reviewable draft without proposals or acceptance controls. AI transformation acceptance granularity: The current implementation supports accepting or rejecting an entire AI transformation at canvas level. Section-level acceptance, corresponding to a declared framework field or collection, may be introduced later. Acceptance of individual items within a section is outside the current scope. Node-level action targeting does not imply node-level acceptance.

## Slice-1 manifest convention

`framework.yaml` uses `id`, `name`, `package_version`, `schema_version`, `state_schema`, `canvas`, `semantics`, `manual_capabilities`, `ai_actions`, `target_types`, `action_compatibility`, `quality_criteria`, and `acceptance`. Schema/canvas paths are package-local. SWOT declares `create`, `strategize`, `evaluate`, and `improve` in `ai_actions` with package-local `method`, `effect`, and `required_context`. Create initializes state. The other three declare canvas-level compatibility. Evaluate adds an annotation only; Strategize/Improve require whole-canvas acceptance. A declaration is not a runtime discovery mechanism.

The committed `canvas.html` is standalone. Separate source markup, styles, state operations, and UI runtime are assembled by the small SWOT-specific packaging script. No source file is loaded over the network when opening HTML.
