# SWOT AI actions implementation plan

Goal: export three guided AI requests from the local canvas and render resulting thoughts and user-controlled whole-canvas proposals in new standalone artifacts.

## Design

- Three compact controls: Strategize, Evaluate, Improve. Each opens one local dialog with optional steering guidance. Evaluate selects SWOT/TOWS/both; Strategize selects extend/replace; users can choose whether thoughts guide the task. No network/API calls or stored dialog preferences.
- Copy exactly `{canvas, action}` with complete current state. Pending proposals must be accepted/rejected before requesting a new transformation, so none are silently discarded.
- Evaluate adds a thought above the matrix and leaves content byte-equivalent as data. Strategize preserves SWOT/framing and either extends or explicitly replaces strategies. Improve proposes corrections to factors/strategies while preserving framing and stable identity for retained items.
- Add optional current `thoughts` and at most one `proposals` entry to the small state envelope; existing version-1.0 canvases remain valid. A proposal contains its temporary base content, complete candidate content, action, and explanatory thought. This base is a concurrency guard, not revision history.
- Review shows before/after content by collection. Accept applies the whole candidate atomically only if base content still matches; reject keeps current content. No section/item acceptance. Evaluation thoughts are immediate annotations, not content replacements.
- Model outputs `{thought}` for Evaluate or `{content, thought}` for Strategize/Improve. A deterministic result composer validates, assigns thought/proposal IDs, enforces action boundaries, and packages through the established canvas. Model never regenerates HTML/CSS/JS.

## Implementation

1. Add failing state and browser tests for request export, steering, scopes, thoughts, proposal review/accept/reject, stale guards, preservation and offline round-trip.
2. Extend state schema and SWOT-specific utilities; add result mode to the existing packager. Preserve blank canvas shape and prior creation capability.
3. Add local dialog, thought panel and proposal review controls. Keep the existing uncluttered layout and local editing/export behavior.
4. Add progressively loaded Markdown methods for Strategize, Evaluate, Improve and shared action handoff. Adapt V1 TOWS mapping/wizard and V2 grounded methodological criteria, not Jinja/server code.
5. Record exact legacy sources/hashes/revision and tests in extraction map. Update skill, manifest, contracts, architecture, roadmap, tests and documentation.
6. Execute full software tests, skill validation, visual inspection and independent review before small local commits. Keep README and legacy repositories unchanged; do not push.

## Validation limits

Deterministic fixtures can prove protocol, identity, preservation, acceptance and packaging behavior. Separate methodology scenarios/rubrics assess actual reasoning; no model-backed quality claim follows from protocol tests. No API integration or generic node actions are added.
