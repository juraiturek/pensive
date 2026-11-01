# Testing strategy

## Slice 0: structure

No executable canvas or utility exists yet. Run the installed skill-creator validator:

```sh
python3 /Users/juraj/.codex/skills/.system/skill-creator/scripts/quick_validate.py .agents/skills/pensive
```

This environment-specific tool is not a project dependency. Elsewhere, use the corresponding installed skill-creator validator. It validates skill structure and metadata, not reasoning quality.

Check local Markdown links, conditional reference routing, absence of unfinished scaffolding, and honest capability claims. Verify README SHA-256 remains `372931125511c5fae95971c88a11fd725dffaa3724672c4bfb95291b23ea8c4e`. Review whitespace and file inventory for unexpected files or legacy code. These are structural checks, not runtime tests.

## Deterministic software tests

Introduce tests alongside executable slices. Prefer a standard-library or selected runtime's built-in runner. Add browser automation only when required for real browser behavior. No large framework, dependency manifest, or empty test suite is needed now.

| Area | Observable behavior |
| --- | --- |
| Standalone HTML | Opens through `file://` with network disabled; editing/export need no server or AI. |
| Editing and round-trip | Add/edit/delete/arrange supported content; import/export preserves complete semantic state and pending proposals. |
| State validation | Accept valid state; reject malformed input, wrong versions, invalid relationships, duplicate IDs, incompatible actions before mutation. |
| Safe embedding | Closing tags, quotes, ampersands, Unicode, and script-like strings round-trip without execution or markup corruption. |
| Identity | Existing IDs survive editing, round-trip, transformations, and acceptance; new IDs remain unique. |
| Proposals | Preserve content/proposals; require user acceptance/rejection; invalid or stale acceptance leaves state unchanged atomically. |
| Packaging | Each transformation creates new output; input stays intact; established HTML/CSS/JS outside the state slot is preserved. |
| Framework visuals | Verify distinctive layouts/interactions at useful viewport sizes; use focused screenshots/manual review as appropriate. |
| Shared actions | Exercise explicit concept/target mappings; reject incompatible targets and frameworks. |
| Regression | Run focused and relevant existing tests across implemented frameworks after shared behavior changes. |

Ground fixtures in actual schemas and extracted capabilities. Test meaningful invariants and failure paths rather than exact wording or mirrored implementation details. Verify a second transformation cycle preserves prior content; separate deterministic protocol testing from reasoning quality.

## Methodology evaluations

Keep LLM evaluations separate from software tests. Use realistic scenarios and documented rubrics to assess framework fidelity, useful reasoning, evidence/assumption distinctions, target adherence, user intent, proposal clarity, and handling of missing context. Apply framework-specific quality criteria. Record enough inputs and observed results to explain findings without requiring identical model wording.

Add scenarios as methods are implemented. Neither a structural validator pass nor valid response JSON proves analytical quality. Automated model-backed evaluations are not required for slice 0.

## Reporting

Report commands or review procedures actually performed, results, relevant regression coverage, and limitations. Record verification with each extraction. Do not claim offline operation, acceptance safety, or framework regressions until exercised against executable implementations.
