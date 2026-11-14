# Kaizen: revisioned canvas working folders — implementation plan

> Execution: use the executing-plans skill to implement this plan task by task. This document authorizes no implementation, distribution build, publication or README edit by itself.

**Goal:** Keep one stable canvas interface per working folder, persist complete ordered revisions, and derive compact, deterministic change reports for later reflection.

**Architecture:** An optional loopback working-folder service owns validated persistence and revision checks. The existing framework renderer and result composer remain authoritative. Complete immutable snapshots are the source of truth; Python derives deltas without replay being required to recover state. Begin with SWOT as a vertical pilot, then explicitly review rollout.

**Tech stack:** Existing Node.js framework validation and HTTP/filesystem standard libraries; browser JavaScript; Python standard library for delta extraction; existing Node test runner and Playwright.

**Status:** Approved by the user’s “go” on November 14 and implemented as the SWOT pilot. See [validation record](../testing.md#kaizen-swot-working-folders--2026-11-14).

## Design and boundaries

The current LLM produces analytical data, and deterministic packagers replace the JSON slot in established HTML. This slice reduces repeated HTML artifacts and improves continuity; it must not claim that models currently regenerate the renderer. History token savings are a hypothesis to measure with retained representative inputs, not an established percentage.

The existing H3/H4 exploration in `docs/plans/2026-11-07-host-integration-spikes.md` supplies the relevant conflict and recovery cases. This implementation chooses an external-browser loopback workflow; native Claude/ChatGPT/Codex bindings remain separate investigations. No legacy access is needed.

Proposed folder, explicitly created under the host project's `outputs/` unless another destination is supplied:

```text
outputs/my-analysis/
  canvas.html
  current.json
  history/
    000001-<revision-id>.json
    000002-<revision-id>.json
```

`canvas.html` is generated once at initialization and does not change on saves or AI results. It contains the established renderer and an opt-in working-folder adapter. `current.json` is a complete revision envelope. Every revision, including the current one, also has an immutable snapshot in `history/`; this deliberate small JSON duplication permits recovery after interruption. Standalone HTML export still embeds the complete plain canvas and opens without the service.

### Revision envelope

Keep persistence metadata outside framework-owned state:

```json
{
  "storage_version": "1.0",
  "canvas_id": "uuid",
  "revision_id": "uuid",
  "parent_revision_id": null,
  "revision_number": 1,
  "saved_at": "2026-11-14T16:30:00.000Z",
  "event": { "kind": "initialize", "source": "host" },
  "canvas": { "framework": "swot", "schema_version": "1.0", "content": {} }
}
```

The example `content` is schematic; actual state must pass `Swot.validate`. Existing `schema_version` retains its format meaning. Persistence assigns identity, sequence and UTC save time; the LLM cannot assign trusted history metadata. Parent references and sequence establish ordering, with filenames only for readability. This slice allows one linear head per folder; stale parents are rejected. Branch creation/merging and cross-framework history are deferred.

Use event kinds `initialize`, `manual_save`, `ai_result`, `proposal_accept`, `proposal_reject`, `baseline_reset` (for later PAGES rollout), and `import`. Record the review target/selection when applicable and the action ID for AI results. Event labels describe observed operations, not inferred intent. No user identity, model provenance or reason is asserted unless actually supplied. Keep existing rationale in canvas thoughts/proposals; do not duplicate it into metadata.

### Persistence and recovery

1. Serialize writes through one owner per working folder; reject a second writer process with a clear recovery path for a stale lock.
2. Validate the expected parent and complete candidate state before writing anything.
3. Write the next immutable snapshot exclusively; then replace `current.json` through a same-directory temporary file and atomic rename. Never rename away the only current copy before its replacement exists.
4. An interrupted publication may leave an orphan snapshot. Detect it on startup, report it, and require explicit recovery before allocating another sequence. Do not silently choose the newest timestamp or delete evidence. Preserve a valid current head.
5. Treat a retried identical revision submission as idempotent using a client operation ID; distinguish it from another intentional save. Bind that ID to the submitted parent and payload and reject conflicting reuse. No-content-change manual saves may be no-ops; review events still deserve a revision even if their final analytical content is unchanged.

Define process-interruption guarantees separately from power-loss guarantees. Test filesystem failure paths and document platform limits; do not promise multi-file transactions or universal crash durability.

### Browser workflow

- Launch the folder on loopback only, using a free port. Load `current.json` before enabling edits. Fetch state with caching disabled.
- Add explicit Save Revision and Reload Latest controls with clean/dirty/saving/conflict/error status. Save to File remains portable HTML export.
- Track all persisted changes, including framing, annotations, Takeaways, thoughts, review resolutions and import; transient selection/hover state is not a history event.
- Save the exact current state before preparing an AI request. Preserve the existing full `{canvas, action}` reasoning request, with revision transport information alongside it in a separate host handoff record. Do not change framework action schemas or rely on conversation memory.
- Review decisions commit their own revisions. Serialize them and ordinary saves. On failure, retain the changed tab state, visibly mark it unsaved and allow retry/export; never claim a durable decision before acknowledgement.
- An AI response is composed with `Swot.composeResult` against the exact saved request revision. Commit only if that revision remains the head. Duplicate or late responses cannot overwrite subsequent manual edits.
- Do not auto-refresh an open dirty tab. Reload asks before discarding edits, and navigation has a dirty-state warning. A clean tab can explicitly reload the latest head. No polling or collaborative synchronization in this slice.
- Standalone exports remove/disable working-folder binding and retain no service credential. Existing plain JSON import/export remains compatible and carries framework state, not the history envelope.

### Loopback service contract

Use a service-scoped random capability token, same-origin checks, exact route allowlisting and bounded JSON bodies. Never expose unrestricted filesystem paths, permissive CORS, remote binding or arbitrary script execution. GET returns state only; writes require the token, JSON content type and expected parent. Validate Host/Origin against the actual loopback address. Do not log tokens or put them in exported files. A launch URL fragment may deliver the ephemeral token; clear it after initialization.

Proposed routes: `GET /canvas.html`, `GET /api/current`, `POST /api/revisions`. Serve only the chosen folder's canvas and explicit API responses, with no directory listing. Host-side AI-result commits use the same persistence owner; a CLI must not independently mutate a live folder. Stop/restart and token renewal retain saved state.

### Deterministic deltas

Python loads complete snapshots, validates envelope identity/parent/sequence, and compares adjacent states. It rejects missing, duplicate, foreign-canvas, incompatible or malformed revisions rather than inventing a chain. Use Python's strict finite-number parsing and explicit type checks; schema validation remains with the framework's existing Node validator, not a second Python implementation.

Output ordered transitions with from/to revision IDs, observed event, changed field paths and before/after values. Match SWOT factors/strategies and annotations by stable IDs, keeping collection location and position separate from text. Distinguish add/remove/edit/move/reorder; equal text with a new ID remains remove/add. Compare framing, Takeaways, thought additions and pending/partial proposal changes explicitly. Exclude storage timestamps and revision identifiers from analytical differences. Do not discard unknown state fields silently: include a deterministic generic field diff, or reject incompatible schema versions.

Emit JSON for machines and readable Markdown for inspection. A selected-range reflection packet includes the starting state, ordered deltas and optional current state; it states omitted ranges/context explicitly. History text is untrusted analytical data. No automatic history reasoning, replay engine, new reflection action, timeline UI or measured token claim in this slice. Exact-state action-only requests are also deferred: transport reduction must not reduce necessary reasoning context.

## Implementation tasks

Resolve proposed contracts above during plan review, then use an isolated implementation branch/worktree if needed. Each task follows failing test → observed intended failure → smallest implementation → focused passing test → local commit checkpoint. Do not commit unrelated work or change README. Suggested new paths below are intentional; create abstractions only when their task demonstrates a need.

### 1. Revision storage and failure recovery

**Create:** `.agents/skills/pensive/scripts/lib/revision-store.mjs`; `tests/revision-store.test.mjs`.

1. Write tests using `mkdtemp` and cleanup for initialization, valid save, identity/sequence/parent, exclusive snapshots, stale-parent rejection, invalid state and retry IDs.
2. Run `node --test tests/revision-store.test.mjs`; verify failures arise from missing behavior.
3. Implement store operations with an injected framework validator and serial writer ownership. Keep plain framework state untouched. Use explicit destination paths.
4. Add fault-injection cases before snapshot write, after snapshot write and before/after current replacement; test lock contention, restart and orphan detection. Verify old valid current and archived bytes remain intact after rejected writes.
5. Rerun the focused test and commit only the task's files.

### 2. Working-folder initializer and service

**Create:** `.agents/skills/pensive/scripts/workspace.mjs`; `tests/workspace-service.test.mjs`.

**Modify:** `.agents/skills/pensive/scripts/package-swot.mjs` only if an explicit build option is necessary to embed the adapter.

1. Test proposed commands `node .agents/skills/pensive/scripts/workspace.mjs init state.json outputs/my-analysis` and `... serve outputs/my-analysis`, with test destinations under unique OS temp directories. Test existing-folder refusal and invalid-state refusal before creating deliverables.
2. Implement initialization from the established HTML, service startup/shutdown, exact allowed routes and revision-store ownership. Keep standalone packaging default behavior unchanged.
3. Exercise token/Origin/Host rejection, route traversal, arbitrary methods, oversized payloads, cache headers and restart. Test no non-loopback binding and no token in exports/logged output.
4. Run `node --test tests/revision-store.test.mjs tests/workspace-service.test.mjs`; inspect actual failures and passes before the commit checkpoint.

### 3. SWOT browser binding and revision controls

**Create:** `.agents/skills/pensive/shared/working-folder.js`; `tests/workspace-browser.test.mjs`.

**Modify:** `.agents/skills/pensive/frameworks/swot/canvas.template.html`, `canvas.js`, and the packager adapter insertion point. Rebuild `frameworks/swot/canvas.html` if the source changes require it.

1. Write loopback Playwright cases for current-state startup, manual Save Revision, unchanged HTML bytes across saves, reload and standalone recovery. Allow only the test loopback origin; existing offline standalone tests keep their network prohibition.
2. Implement opt-in binding using the existing `state`, `edited`, `refreshCanvas`, export and import flows. No generic renderer rewrite and no change to standalone default behavior.
3. Test failed saves retaining tab state, two-tab conflicts, dirty reload cancellation, annotations, Takeaways, framing and clipboard fallback. Verify detached portable exports reopen offline without credentials.
4. Run `node --test tests/workspace-browser.test.mjs tests/swot-browser.test.mjs tests/canvas-editing-browser.test.mjs`; inspect desktop/narrow status and controls before the commit checkpoint.

### 4. Saved AI handoff and review-event persistence

**Create:** `tests/workspace-actions.test.mjs`.

**Modify:** `workspace.mjs`, `working-folder.js`, SWOT request preparation and all SWOT review callbacks, including shared Research and Takeaways hooks only where required.

1. Test save-before-copy, exact saved-request binding and result composition through the real existing validator/composer. A failed save must not yield an apparently usable saved-revision handoff.
2. Add host commands `workspace.mjs request <folder> <action-json> <request-output>` and `workspace.mjs result <folder> <handoff-json> <response-json>` with precise argument validation and a single write owner. Preserve the plain full-state request separately from transport metadata.
3. Test annotations/local edits after submission, stale and out-of-order results, duplicate operations, acceptance/rejection and partial review. An `ai_result` revision must retain pending review and must not imply acceptance. Intercept every relevant review path rather than only `ProposalReviewUI`.
4. Verify complete standalone JSON/HTML recovery and unchanged existing action boundaries, then run `node --test tests/workspace-actions.test.mjs tests/workspace-browser.test.mjs tests/swot-state.test.mjs tests/partial-acceptance-state.test.mjs tests/research-state.test.mjs tests/takeaways-state.test.mjs` before committing.

### 5. Python delta extraction

**Create:** `.agents/skills/pensive/scripts/history_delta.py`; `tests/history-delta.test.mjs` (Node harness invokes Python); small retained fixtures under `tests/fixtures/history/` only as needed.

1. Write failing tests for text edits, equal-text replacement IDs, cross-collection movement, reorder, framing, Takeaways, annotations, thoughts and review lifecycle. Include Unicode, absent optional fields, malformed chains, foreign identity and incompatible versions.
2. Implement CLI `python3 .agents/skills/pensive/scripts/history_delta.py <folder> --from 1 --to 3 --format json` and Markdown output. Resolve selected revisions by authoritative metadata, not lexical directory order or timestamps.
3. Add deterministic selected-range packet output with explicit context inclusion. Check repeated runs produce identical output; preserve meaningful before/after text and do not infer causes.
4. Run `node --test tests/history-delta.test.mjs`; retain one readable example and compare packet character/UTF-8 byte counts with complete repeated snapshots. Label these size measurements, not exact tokenizer counts or proven reasoning quality. Commit the task.

### 6. Guidance, regression and pilot decision

**Create:** `.agents/skills/pensive/references/working-folder-workflow.md`.

**Modify:** `.agents/skills/pensive/SKILL.md`, `docs/architecture.md`, `docs/roadmap.md`, `docs/testing.md`.

1. Document opt-in SWOT workflow, explicit host destination, startup, exact revision handoff, safe conflict recovery, save boundaries and standalone fallback. Replace categorical “no history” claims with scoped accurate wording; do not imply other frameworks or native viewers support this mode.
2. Record this scoped architecture as a deliberate exception to earlier no-backend/no-history implementation boundaries: a local persistence service performs no inference, remote search or account integration. Preserve README unchanged until separate approval.
3. Run focused new suites, then the documented full regression:

```sh
PLAYWRIGHT_BROWSERS_PATH=/tmp/pensive-playwright /Users/juraj/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test --test-concurrency=2 tests/*.test.mjs
```

4. Run the skill validator using a temporary PyYAML dependency location if needed:

```sh
python3 /Users/juraj/.codex/skills/.system/skill-creator/scripts/quick_validate.py .agents/skills/pensive
git diff --check
git diff --exit-code -- README.md
```

5. Check local skill links and deterministic framework HTML rebuilds using the repository's established checks; inspect desktop/narrow loopback screenshots and offline standalone reopening. Use a unique OS temporary directory for intermediates and remove it afterward. Report actual counts, environment failures and untested browsers/host surfaces.
6. Review the pilot against the acceptance criteria below. Commit the reviewed slice; do not generate distributions, add a remote, push or publish. Rollout is a separately agreed next slice, including PAGES baseline events, VPC/VARS collection semantics, 5 Whys tree deltas and Five Forces fixed-section/trajectory deltas.

## Acceptance criteria and limits

- Three successive saves/AI iterations reuse byte-identical working HTML and produce valid, ordered, recoverable complete JSON snapshots.
- Manual edits, annotations, Takeaways, pending/partial review and explicit decisions survive save/reopen and standalone export.
- Missing/stale state, duplicate operations, second writers and interrupted publications cannot silently replace a valid head or discard an unsaved tab.
- Deterministic deltas identify actual saved changes by stable identity, include meaningful before/after context and refuse invalid chains.
- One retained end-to-end example demonstrates creation → manual save → AI proposal → partial decision → final decision → delta packet. The packet makes proposed versus accepted changes unambiguous.
- Existing standalone contracts and focused/full regression checks pass; limits are recorded. Size comparison is reported honestly and does not stand in for reasoning evaluation.
- Pilot only: no branch/merge UI, restoration UI, automatic synchronization, generalized renderer, exact-reference-only action transport, new analytical history action, distribution build or native host integration.

## Agreed slice boundary

Recommended defaults are: SWOT pilot; optional loopback launcher; external storage envelope; explicit ordinary saves with automatic review-event saves; Python deltas; full-state reasoning handoff retained. These defaults were accepted with implementation approval. A wider all-framework rollout or a new user-facing history reflection action needs additional task design rather than being silently absorbed here.
