# Canvas workflow

Use the [server-free paired-file workflow](working-folder-workflow.md) for all six frameworks. Framework methods own analysis, validation and review; file utilities own saved state and identity.

## Initialize

Use the selected framework’s established renderer and validated complete state. SWOT follows [Create](../frameworks/swot/prompts/create.md); other frameworks follow their own methods. Reuse the registered analysis unless the user requests a separate one. New analyses return one portable HTML and current JSON, grouped in the originating conversation folder. PAGES initializes its baseline only for genuinely new content.

## Transform

Validate the complete request and selected target. Preserve saved handoff metadata; raw browser requests must capture complete submitted state against the intended saved identity before reasoning. Never reconstruct local edits from memory. Use the selected method and deterministic framework composer. Commit updated JSON with `workspace.mjs result`, which synchronizes the same HTML’s state slot, and return the existing page link for refresh. No ordinary iteration creates another HTML file. Its embedded state slot is synchronized from current JSON so normal refresh works.

## Review

Evaluate adds a thought; transformation actions propose changes. Opening a result never accepts it. Users accept/reject locally under [proposal review](proposal-review.md), then export complete state for the next turn. Preserve stable IDs, annotations, Takeaways and framework-specific baseline/detail fields. Invalid or stale acceptance leaves state unchanged.

## Exports

JSON file import and paste import validate before confirmed replacement. Download JSON and clipboard export include complete state. Save to File is an explicit portable HTML snapshot. Normal browser operation needs no server, Node, neighboring-file access or network. Packager commands in framework handoffs are available for explicit standalone exports and development rebuilds, not ordinary turns, which synchronize the existing HTML state slot.
