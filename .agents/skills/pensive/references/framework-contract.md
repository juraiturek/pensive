# Minimal framework package contract

Status: architecture contract. No framework packages exist yet. Implement concrete manifest fields with the first slice and explicitly version breaking contract changes.

Future packages live at `../frameworks/<id>/` relative to this reference directory. Each owns `framework.yaml`, `canvas.schema.json`, `canvas.html`, and specialized Markdown methods in `prompts/` as needed. Manifest resource paths stay inside the package, except explicit references to shared methods within the skill.

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
