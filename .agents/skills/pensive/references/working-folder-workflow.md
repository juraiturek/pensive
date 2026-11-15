# Server-free conversation canvases

All seven frameworks use the same paired-file workflow. One analysis has one portable `canvas.html` and directly importable `current.json`. Normal assistant turns replace JSON and synchronize the state slot of the same HTML file. The browser never fetches an adjacent file or requires a local server. Existing framework methods, full-state requests and proposal review rules remain authoritative.

## Files and identities

Use the originating conversation’s exact ID (`CODEX_THREAD_ID` where available, otherwise an explicit host chat ID). Default to the host project’s explicit outputs destination. A conversation registry groups its analyses; another framework shares that folder. A separately requested new analysis gets another identity. Never identify a canvas solely by topic or content similarity.

```text
outputs/raffin-<chat-suffix>/
  conversation.json
  swot/
    canvas.html       # same portable file; renderer unchanged, state slot synchronized
    current.json      # complete framework state; import this into the viewer
    head.json         # saved revision metadata and complete state for host validation
    history/          # immutable complete snapshots, including the head
  pages/
    canvas.html
    current.json
    head.json
    history/
```

Only HTML and current JSON are needed for portable viewing/editing. Metadata/history support host-side identity, conflict checks and optional history analysis; they are not browser dependencies. The host synchronizes embedded state from validated current JSON on every workspace turn. Refreshing or reopening that same HTML displays the latest saved state. This is host-side state-slot synchronization, not a browser fetch of an adjacent file. Renderer/style/script bytes remain unchanged.

## Create or reuse

Read the selected framework’s creation method. Draft and validate complete state; initialize PAGES’ Ripple baseline only for genuinely new content. Use a unique OS temporary directory for scratch state/request/response JSON and remove it after success. Preserve a failed response in a reported recovery file beside the deliverables if it is the only copy.

From the skill directory:

```sh
node scripts/conversation.mjs create /absolute/temp/state.json /absolute/host-project/outputs --conversation <originating-chat-id> --title raffin
```

The result includes `folder`, `html`, `canvas_id` and `reused`. Return links to the HTML and its `current.json` on initial creation. A reused result does not overwrite the saved canvas with the supplied draft: inspect saved state and use an appropriate action. `--new` is only for a separately requested analysis, not conflict recovery. No launch step exists.

On a host that registers HTML as an artifact, register/reuse that one artifact when the host supports it; return JSON updates on later turns. Do not promise host registration, adjacent-file access or automatic artifact refresh without evidence. If no local writable workspace exists, use the selected framework core to validate/compose the full submitted state and deliver complete JSON for the existing artifact; do not silently regenerate its HTML.

## Browser edits and explicit JSON exchange

Import JSON accepts either a chosen local file or pasted complete state. Reading a file fills the import text; Replace canvas validates it and confirms replacement. Invalid/cancelled imports preserve current state. Download JSON saves the entire current canvas, including pending proposals and annotations; clipboard export remains available. Save to File produces an optional standalone HTML snapshot.

Edits and proposal decisions stay in the tab until exported. After accepting/rejecting a proposal, export the resulting JSON or copy the next full-state action request. The next assistant turn must include that complete state. Never infer browser decisions or replace manual edits with an older saved copy. File downloads may receive a browser-added numeric suffix; they do not automatically replace a particular disk file. Short-lived host tools replace the designated workspace JSON.

## Prepare direct actions and capture submitted state

For a direct chat action against the latest saved state, put the ordinary action object in a temporary file:

```sh
node scripts/workspace.mjs request /absolute/canvas-folder /absolute/temp/action.json /absolute/temp/handoff.json
```

For a full `{canvas,action}` copied from the browser, locate its exact registered analysis from a known source path/chat identity, inspect `head.json` and prepare this capture input:

```json
{"parent_revision_id":"exact-saved-head-id","canvas":{},"action":{}}
```

The real `canvas` and `action` must be complete. The parent must match the known saved head; do not silently rebase if newer work conflicts with the submitted state. Run the same request command with this capture input. It validates framework/action before recording the submitted state as a manual-save snapshot if changed, then returns an exact revision handoff and synchronizes the HTML. This preserves browser edits and proposal decisions as the basis of inference. It does not infer every browser event or author intent.

A standalone analysis with no registered identity can be adopted from complete submitted state into this conversation folder while preserving the original file. Do not overwrite another analysis to adopt it; use `--new` only if necessary for a genuinely distinct analysis. Adoption starts available saved history, not invented prior revisions.

## Saved handoffs and results

Recognize storage handoffs before framework/shared-tool action routing:

```json
{"storage_version":"1.0","canvas_id":"...","revision_id":"...","request_id":"...","request":{"canvas":{},"action":{}}}
```

Preserve the envelope unchanged and reason over the complete inner request using the selected method. Write only that method’s normal response shape, then run:

```sh
node scripts/workspace.mjs result /absolute/canvas-folder /absolute/temp/handoff.json /absolute/temp/response.json
```

The process opens the file store briefly, validates exact immutable request state, composes through the framework and records `ai_result`; then it releases its lock and exits. No socket, service token, background process or browser API exists. `current.json` is replaced with directly importable framework state. The existing HTML state slot is atomically replaced from that JSON; renderer/style/script bytes remain unchanged. If synchronization fails, report the failure and retry the same operation or run `node scripts/workspace.mjs sync /absolute/canvas-folder`; do not claim a refreshed view is current until synchronization succeeds.

Return the existing HTML link with the saved revision and tell the user to refresh. Current JSON remains available as a companion download. Saving a proposal never accepts it or updates an already-open tab. Exact retries are idempotent; changed responses under the same request ID fail. Do not change IDs to force a retry.

## Failure and recovery

- A stale result or conflicting parent leaves current state unchanged. Preserve the response and ask for the latest complete state before reasoning again; never silently overwrite/rebase.
- Short-lived writer locks prevent simultaneous host writers. Inspect the recorded owner before recovering a stale lock; never break a live lock.
- Immutable snapshots are written before head publication; `current.json` is a portable projection of `head.json.canvas`. A crash can interrupt the multi-file publication. Startup rejects orphan chains or mismatched projections; inspect/back up first, then explicitly recover. This is not a universal power-loss transaction guarantee.
- Invalid responses fail before publication. Publication I/O errors may require recovery; preserve snapshots and response data.
- Portable HTML and JSON need no Node to open/edit. Host file utilities use Node during generation/update. Do not imply universal filesystem or native artifact integration across assistant hosts.

## Migrating earlier server folders

Preserve complete current state, immutable history and original HTML in a backup. Protect unsaved browser-only edits before stopping the exact recorded old service. Convert the old revision-envelope `current.json` to `head.json` and write its complete `canvas` as portable current JSON. Replace the server-bound HTML once with the established portable renderer containing that state; subsequent turns synchronize its state slot without changing its renderer or path. Remove old service metadata only after its owner has stopped. Never discard proposals, PAGES baselines or user annotations, or stop unrelated processes.

## Optional history inspection

The existing file-only history helper remains available:

```sh
python3 scripts/history_delta.py /absolute/canvas-folder --from 1 --to 4 --format markdown
python3 scripts/history_delta.py /absolute/canvas-folder --from 1 --to 4 --packet --include-current
```

It validates complete snapshot chains and their current head, including older archived envelope-format fixtures. Saved differences do not establish every intervening action, authorship or intent. No automatic history UI, restore/merge mechanism or model reflection is introduced.
