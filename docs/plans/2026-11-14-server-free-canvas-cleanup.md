# Server-free canvas cleanup implementation plan

> User correction after implementation: the stable requirement is the HTML **path and renderer**, not byte-identical embedded state. Workspace turns now synchronize the existing HTML state slot from current JSON so a normal refresh displays updates. Manual import is optional. This supersedes the original byte-identical-HTML acceptance criteria below.

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove Pensive’s local webserver while keeping one portable HTML per analysis and replacing its current JSON on each assistant turn across all six frameworks.

**Architecture:** Keep the existing framework renderers, validators and result composers. Replace loopback persistence with explicit browser JSON import/export and short-lived host file operations. Conversation grouping remains file-based; no server, socket, service token or background writer is required.

**Tech Stack:** Existing HTML/CSS/JavaScript, framework state modules, short-lived Node file utilities, existing Node/Playwright tests. No new runtime dependency for viewing or editing artifacts.

## Review findings

- Working tree was clean at review. The server implementation is committed, not merely an uncommitted change to discard.
- Relevant commits: `384a539` (SWOT persistence/history), `4f4cc3b` (paths-with-spaces tests), `9b4567f` (conversation defaults and six-framework rollout). Review their diff against `5de0a39`; do not blindly revert them because conversation identity, full-state validation and history protections are useful independently of HTTP.
- These commits affect 61 tracked files, including generated framework HTML, guidance, tests and history fixtures. README has no change in that range.
- `scripts/workspace.mjs` imports `node:http` and implements authenticated loopback endpoints. `scripts/conversation.mjs` starts/reuses its detached process. `shared/working-folder.js` injects Save Revision/Reload Latest and fetches those endpoints.
- All six framework `canvas.js` files contain working-folder hooks. Shared Research and Takeaways UI also changed. Existing framework state/action modules and normal packagers remain the analytical source of truth.
- This conversation initially produced separate standalone HTML iterations, then a saved SWOT handoff was committed through the server as revision 6. Preserve those user artifacts and pending proposals during migration.
- Known conversation data: `outputs/raffin-64dabd96/`, containing PAGES and SWOT. Both folders contain service metadata at review. Do not kill unrelated Node processes or delete user JSON/history.

## Agreed target and boundaries

One analysis has `canvas.html` and `current.json` in its framework folder; different frameworks share the conversation folder. A separately requested analysis gets a separate identity. The HTML is portable and does not fetch an adjacent file on startup. It contains a valid initial state and imports complete updated JSON explicitly. Ordinary turns leave HTML bytes unchanged and replace `current.json` after validation. Loading JSON updates the existing viewer; it does not require generating another HTML.

The browser can select/import a JSON file or paste JSON and can download complete current state. It cannot universally overwrite a neighboring file or automatically notice a replacement from an artifact sandbox. Do not claim automatic refresh, durable autosave, universal Claude artifact integration, or automatic filesystem access. Native file handles, service workers and browser-specific bridges are outside scope.

Assistant turns use complete submitted state, including manual edits, as authoritative input. Existing state/action schemas stay unchanged. Proposal generation is not proposal acceptance. Preserve annotations, Takeaways, AI thoughts, partial review state, PAGES baseline, VARS details, Five Whys trees and Five Forces assessments.

Keep existing saved history and pure file-based snapshot/delta functionality where it remains useful. History is internal supporting data, not an additional browser requirement. Do not introduce a new history UI or expand its semantics in this cleanup.

## Task 1: Establish preservation and failure cases

**Files:** `tests/conversation-workspace.test.mjs`, `tests/workspace-framework-state.test.mjs`, `tests/workspace-actions.test.mjs`; new `tests/file-workspace.test.mjs` as needed.

1. Record the baseline test result and README checksum before executable edits.
2. Add tests for all six frameworks: create one HTML, apply two valid file-based turns, verify byte-identical HTML and a replaced/validated current JSON.
3. Cover conversation reuse, distinct analyses, paths with spaces, exact canvas identity, expected-revision conflicts, idempotent retries and invalid responses leaving current state unchanged.
4. Cover manual-state handoff persistence and pending review preservation without accepting proposals.
5. Run the focused tests to establish failures before replacing the server path.

## Task 2: Replace transport with short-lived file operations

**Files:** `.agents/skills/pensive/scripts/workspace.mjs`, `scripts/conversation.mjs`, `scripts/lib/revision-store.mjs`, `scripts/lib/framework-core.mjs` (paths relative to the skill).

1. Separate initialization/request/result composition from HTTP. Reuse framework `validateRequest` and `composeResult`, rather than copying analytical rules.
2. Retain conversation registry/identity lookup but remove `launch`, detached child processes, localhost probes, authorization tokens, logs and service rendezvous handling.
3. Implement file-based create/request/result operations with short-lived locking, validation and atomic current-JSON replacement. Current browser-facing JSON must be directly importable as framework state; keep revision metadata in sidecar/history rather than making the browser depend on a storage envelope.
4. Reuse existing immutable history and stale/idempotence protections where possible; update history tooling only where the current-file format changes.
5. On an assistant request containing unsaved browser edits, validate and capture that complete state against the expected saved identity/revision before composing. Do not silently substitute an older saved canvas.
6. Do not overwrite unrelated analyses or bypass stale-result errors. Preserve failed-turn analytical responses in a reported recovery file if needed, rather than deleting the only copy.
7. Verify that file operations exit normally and bind no listening socket.

## Task 3: Make portable JSON exchange consistent in all six viewers

**Files:** `.agents/skills/pensive/shared/working-folder.js` (remove), `frameworks/{swot,pages,vpc,vars,five_whys,five_forces}/canvas.js`, their templates if required, `shared/research-ui.js`, `shared/takeaways-ui.js`.

1. Remove WorkingFolder connections, injected revision controls, service-specific statuses and action-request wrapping from the browser.
2. Keep the existing confirmed JSON paste import and clipboard export. Add consistent local JSON-file loading and JSON downloading with a small shared helper only if the current controls do not cover it.
3. Validate complete state before replacement, confirm discarding local edits, and leave the current state untouched after cancelled/invalid imports. Finish or explicitly resolve transient editors before export/request preparation.
4. Keep existing full-state AI request generation and proposal acceptance/rejection entirely local. Export after review so the next assistant turn receives accepted state, rather than an obsolete pending proposal.
5. Keep Save HTML as an explicit portable snapshot export; ordinary AI delivery returns updated JSON for the existing HTML.
6. Rebuild the six committed framework HTML files with their existing packagers, not distribution builds.

## Task 4: Rewrite operational guidance and remove obsolete code/tests

**Files:** `.agents/skills/pensive/SKILL.md`, `references/working-folder-workflow.md`, framework creation prompts and workflow references changed in the reviewed commits, `docs/architecture.md`, `docs/roadmap.md`, `docs/testing.md`.

1. Define one server-free default across creation, framework actions, Research, Six Hats and Takeaways. Require explicit output destinations and unique temporary directories.
2. Document initial HTML+JSON delivery, subsequent JSON replacement, explicit browser load/export, preservation of manual edits and stale-state recovery.
3. Remove server/launcher/API integration tests and replace their useful state-preservation cases with file and offline-browser coverage. Keep revision-store/history tests if their code remains in use.
4. Remove all service runtime code, not merely disable its launch path. Audit references for localhost URLs, `node:http`, fetch APIs to the service, service tokens, `.service.json`, service locks and service-specific controls.
5. Mark the two earlier Kaizen plans as superseded by this plan; retain historical records without leaving contradictory current instructions.
6. Preserve README unchanged. Do not access legacy applications, create distribution ZIPs, push or publish.

## Task 5: Migrate this conversation safely

**Files:** ignored user data under `outputs/raffin-64dabd96/`; preserve original standalone Raffin HTML files.

1. Before stopping services, ask the user to export any unsaved tab edits if the current saved JSON cannot establish their presence. Do not infer that browser tabs are clean.
2. Back up the exact current JSON, history, HTML and migration records. Verify and stop only the Pensive service PIDs associated with these two folders, after preserving browser-only edits; remove service metadata only after shutdown.
3. Convert both analyses to portable HTML plus directly importable current JSON. Preserve the latest SWOT pending strategies and all PAGES content/baseline. Do not auto-accept or discard drafts.
4. This conversion may replace the existing server-bound HTML once; subsequent turns must leave its bytes unchanged. Keep old files in the migration backup instead of deleting the conversation’s artifacts.
5. Return file/artifact links and instructions to load current JSON. Do not claim that an already-open server tab or Claude artifact was automatically updated.

## Task 6: Verify and report

1. Run focused file/state tests, then offline browser tests for each of the six frameworks: file import, JSON download, cancelled/invalid replacement, pending proposal review and two consecutive turns with unchanged HTML.
2. Block browser network access during portable-viewer tests. Confirm no service UI, API fetch, listening socket or background process is needed. Test initial embedded state as well as subsequently imported state.
3. Run regression suite from repository root:
   `PLAYWRIGHT_BROWSERS_PATH=/tmp/pensive-playwright /Users/juraj/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test --test-concurrency=2 tests/*.test.mjs`
4. Run skill validator:
   `python3 /Users/juraj/.codex/skills/.system/skill-creator/scripts/quick_validate.py .agents/skills/pensive`
   If PyYAML is unavailable, use a unique temporary dependency directory and remove it afterward.
5. Validate skill-local links, generated HTML parity, README checksum and `git diff --check`.
6. Verify the migrated Raffin state is equivalent to its preserved source, including proposals and annotations.
7. Report actual checks and limitations. Local Chromium/file tests do not prove native Claude artifact compatibility; test that host separately when available rather than assert parity. No distribution build is authorized.

## Review decision

Recommended: server-free paired files with explicit JSON load/export, retaining file-only identity/history tooling. A browser-specific direct-filesystem writer would reduce import steps but weaken portability. Reverting all three commits would remove useful work and restore the unwanted new-HTML-per-turn workflow. Neither alternative fits the request as well.

Implementation completed after user approval. See [verification record](../testing.md) for checks and limits. The server/launcher/browser adapter were removed, all six frameworks use explicit portable JSON exchange, and saved Raffin data was backed up and migrated without analytical changes. README remains unchanged. Changes are left uncommitted for review.
