# Kaizen correction: conversation folders and reusable canvases

**Goal:** Make the user's expected one-chat-folder, one-HTML-per-analysis workflow the default for all six frameworks in writable local hosts.

**Reason:** The initial optional SWOT pilot left ordinary PAGES creation and Ripple on the old versioned-HTML route. The Raffin test reproduced that gap. Its two standalone files are evidence and must be preserved during migration.

**Approved direction:** User's correction: each conversation owns an outputs folder; each analysis has one stable HTML with multiple ordered complete JSON snapshots; a separate analysis creates another canvas. Existing loopback persistence remains the binding mechanism, with standalone HTML an explicit export/fallback rather than the normal iteration path.

## Contract

- `outputs/<readable-chat-slug>-<stable-id>/conversation.json` identifies the originating conversation and lists its canvases.
- Each canvas lives in `<framework>/canvas.html`, `current.json`, `history/*.json`; another explicitly new analysis gets `<framework>-2/` and its own identity/history.
- Default creation locates/creates the conversation by exact `CODEX_THREAD_ID` (or explicit portable conversation ID). Repeated framework lookup reuses its current analysis; never overwrite it with a newly generated initial state. Explicit new-analysis creation is separate.
- Default all-framework skill routing precedes creation/action packaging. A live action saves full state, returns an exact revision handoff, then commits through existing framework composition. Existing raw requests are adopted explicitly without reconstructing browser edits or inferring canvas identity from text.
- Local service startup/reuse is host-operated; return a usable loopback link to the user. Do not ask the user to run a server for ordinary local creation. Existing direct file URLs remain detached legacy artifacts, not live JSON bindings.
- Framework state schemas and analytical boundaries remain unchanged. Add framework-owned browser binding for save/reload, request, import and proposal decisions; PAGES baseline reset becomes a saved event. Preserve full submitted Ripple baseline and pending/partial reviews.
- Generalize persistence validation/composition to all six existing cores. Python history extraction validates framework identity and retains generic exact changes where no specialized identity projection exists; retain SWOT specialization and add PAGES collection identities. Do not claim tree move semantics without implementation.
- Preserve all existing standalone exports and no-network behavior. No README edits, legacy access, distribution, remote or push.

## Tasks and verification

1. Generalize workspace service/core resolution. Failing tests for creation/evaluation/composition across all six frameworks, cross-framework rejection and PAGES Ripple baseline/proposal persistence, then implementation and focused regression.
2. Add browser bindings to the five remaining established renderers. Tests for each loading/saving/reloading, detached export and exact requests; focused PAGES Ripple manual source edit → save → proposal → partial acceptance/rejection, baseline reset and successive generations.
3. Implement conversation registry and host service startup/reuse. Test chat separation, safe path names, one default canvas per framework, explicit new canvas, duplicate creation, registry consistency, state immutability and reuse without extra HTML.
4. Update default skill routing and all contradictory operational packaging guidance. A fresh application check must choose conversation persistence for initial creation and PAGES Ripple, not ordinary standalone packaging. Explain explicit fallback and local-URL behavior.
5. Extend deterministic deltas to validate other frameworks and PAGES item changes without altering schemas. Retain semantic limits for other representations.
6. Migrate saved Raffin PAGES generations to a chat folder without deleting originals or inventing intermediate history; preserve pending Ripple proposal. Include the separately requested SWOT if its saved artifact is available, under the same chat identity, without interrupting the other chat.
7. Rebuild six framework HTML files, run focused suites then the full existing regression, validator, manifests/links, deterministic build and README/whitespace checks. Inspect desktop/mobile PAGES output and real folder/HTML hash across iterations. Record actual checks and limitations. Keep temporary work isolated and remove it after integration.
