# Five Forces handoff

Read the [manifest](../frameworks/five_forces/framework.yaml), [methodology](../frameworks/five_forces/methodology.md) and only the selected prompt/force guides. Use the established canvas; do not regenerate HTML/CSS/JS. No legacy source or backend is needed.

## State and framing

`framework: five_forces`, `schema_version: 1.0`. `content.framing` contains text industry (including product/service boundary), geography, objective and participant fields rivals/buyers/suppliers/substitutes/entrants. `content` also owns fixed sections new_entrants/substitutes/buyers/suppliers/rivalry.

Each force: `{strength,confidence,analysis:[{id,text}],research_notes,trajectory?}`. Strength is null or very_weak/weak/moderate/strong/very_strong. Confidence is null or finite 0–1, rendered as percent. Trajectory: `{direction,horizon,confidence,analysis:[{id,text}],research_notes}`; direction null/increasing/decreasing/stable/uncertain. Assumptions live in its analysis. No coverage rating, numeric strength or graph edges.

Blank manual work is valid. All substantive AI requests require industry, geography, objective and some preliminary participant identification; explicit unknown groups are valid. Semantic framing sufficiency is also a host judgment. Clarify before analysis if necessary; never silently infer a whole arena from a firm name. Findings can propose reconsideration. Users edit framing explicitly and request reassessment; the page preserves all analysis and prompts reassessment after local changes, with no persisted validity guarantee.

## Actions and result packaging

Complete `{canvas,action}` is authoritative. Validate with the framework state.js before reasoning. Resolve pending review before another action. Evaluate/Improve accept optional target `{type:"canvas"}` or `{type:"section",id:<force>}`, comment and use_thoughts (default true). The page includes the selected Current structure / Structural trajectory perspective as explicit comment steering; deterministic mutation boundaries remain per force. Evaluate returns `{thought}` and changes only thoughts. Improve returns `{content,thought}`; framing immutable and section target bounds changes. Composer creates pending snapshots/metadata. Force-level/bulk review includes all current and trajectory fields atomically, guards against stale content and preserves rejected/local content.

Research uses the shared protocol, canvas/force-section targets and independent use_thoughts/include_annotations flags defaulting false. It returns report/sources/optional complete candidate, with one atomic decision. Six Hats supports canvas/force-section targets; observations append without content changes. Takeaways uses the shared single-body whole-text proposal; guided T1–T4 remains flexible. Annotations target canvas/force sections and remain separate from AI thoughts.

From skill directory:

```
node scripts/package-five-forces.mjs state.json new-output.html
node scripts/package-five-forces.mjs --result request.json response.json new-output.html
```

Use a unique OS temporary directory for request/response JSON and remove it afterward. Pass a new explicit output path, normally the host project’s outputs/. Never silently overwrite. Import validates complete state then confirms replacement; Export copies complete JSON with fallback; Save preserves the standalone implementation and pending decisions. Updates stay in the tab until saved/exported. No history, automatic sync/research, API client or automatic framing rewrite.
