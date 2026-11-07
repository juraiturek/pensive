# Host integration exploratory spikes

Recorded by user request on 2026-11-07. This is an investigation backlog, not authorization to implement runtime changes or publish a release.

## Architectural direction

Pensive owns core behavior, validation, framework semantics, analytical instructions, review and portable state. Add a thin host-specific layer only where evidence demonstrates a need to amend host instructions, delivery structure or integration. Keep one authoritative implementation; do not duplicate framework code in distributions. Current implementation and product README remain unchanged during these spikes.

## Evidence and uncertainty

User-reported Claude testing exercised skill import/discovery, framework choice, PAGES creation/Improve/Ripple, green/blue Six Hats and 5 Whys creation. Some native file-viewer operations failed, while expand/collapse and overlays worked; therefore blanket JavaScript blocking is not established. Safari worked, and publishing the canvas as an artifact enabled the reported JSON handoff. Artifact download warnings remained. These are exploratory observations, not independently reproduced or comprehensive compatibility certification.

The visible HTML filename reportedly stopped at v4 while artifact versions advanced. The debrief describes packaging and republishing. Neither observation proves whether HTML bytes changed, only JSON changed, or a host bridge supplied state. Resolve through source/hash comparison and exact tool-call evidence; avoid treating filenames or stable URLs as proof.

## H1 — Claude native viewer clipboard and annotation failures

Reproduce Copy AI request, complete-state export, annotation Save and local expand/collapse/overlay in the same viewer. Distinguish native file preview from artifact view and external browser, recording platform/browser/app version. Inspect actual clipboard exceptions, secure context, frame sandbox/permissions policy, focus/user activation and fallback visibility where accessible. These are hypotheses, not diagnosed causes. Check whether the dialog closes, whether manual JSON selection/copy works, and whether annotation changes persist in exported state. Determine the smallest fix and whether it belongs in core error/fallback behavior or host configuration/instructions. Do not try to bypass host restrictions.

Exit evidence: reproducible interaction matrix, precise failure category, viable fallback, and a scoped fix proposal or documented host limitation. Track successful-copy confirmation/green checkmark and dialog dismissal as separate UX follow-ups; do not announce success when only fallback text is shown.

## H2 — Codex and ChatGPT surface comparison

Test the same unchanged canvas in the available Codex desktop HTML preview, ChatGPT HTML/artifact surface and external browser. Do not assume these surfaces share permissions or synchronization capabilities. Record availability, environment, clipboard success/fallback, annotation Save, JSON import/export, HTML download, reopening and state retention. Distinguish unavailable surfaces from tested failures. CLI has no native visual preview; evaluate a browser route separately if needed.

Exit evidence: surface capability matrix and supported-workflow recommendation, with actual tests separated from official documentation and assumptions.

## H3 — Persistent interface and versioned JSON

Explore generating a framework's HTML/CSS/JS once and binding it to successive complete JSON revisions. First inspect the Claude test's actual artifact source, publish/update calls, source hashes and JSON revisions. Then investigate the corresponding Codex/ChatGPT capability rather than assuming feature parity.

Separate stable artifact identity, source republishing, live state replacement, durable storage and assistant access to current state. Identify any documented file binding, host storage or message bridge; verify both directions. Host-specific code/instructions must remain thin and optional. Preserve portable standalone export as a recovery path.

Test manual edits after the last assistant response; pending/partial review; annotations; Takeaways; Ripple baseline; refresh/reopen; duplicate submissions; stale responses; and switching canvases/frameworks. An update must not discard unsent edits or imply acceptance. Measure packaging work and latency only after establishing the actual mechanism.

Exit evidence: minimal isolated proof of concept, unchanged renderer hash across data updates if genuinely supported, state-retention/conflict results, capability requirements and a decision between host binding, explicit JSON import or same-artifact repackaging. No automatic persistence/synchronization claim without proof.

## H4 — Action-only requests referencing exact canvas state

Explore a compact request carrying action/target/steering plus canvas identity and an exact immutable revision identifier or content hash. Resolve that reference to stored complete state deterministically before invoking existing validation and reasoning. Conversation memory alone is insufficient. Define behavior for missing revisions, stale local edits, branches, duplicate requests and out-of-order responses. Full-state export remains the fallback. Do not reduce the context required by framework reasoning merely to shorten transport.

Investigate an optional standard-library Python utility shipped with the skill to resolve snapshots/revisions and reconstruct changes. Language and storage format are not decided. Complete snapshots with parent links and optional diffs may be simpler than a replay-only event log. History must capture manual edits, acceptance/rejection and baseline changes as well as AI proposals; actions alone cannot reconstruct them. Distinguish observed state differences from inferred intent or reasoning. Define canonical hashing, schema compatibility, branch identity, corruption detection and recovery before claiming replay/history.

Exit evidence: proposed request/reference contract, deterministic resolution/reconstruction examples, missing/stale-state rejection and full-state recovery. This is future behavior, not a capability of the current experimental package.

## Separate product follow-ups

- Clarify Improve granularity: capture expected node/collection/item targeting and framework semantics before design; do not silently extend existing action permissions.
- Copy completion: close the action prompt at the appropriate point and show an accessible visible success indicator after actual success. Reproduce first: current PAGES source already closes its action dialog before awaiting clipboard copy.
- Skill-location/prompt resolution: investigate the wrong installed path and prompt filename reported in the session; use installed-root-relative resources and verify before adding host instructions.

## Suggested sequence and release boundary

H1/H2 establish safe editing and handoff paths; H3 establishes persistent delivery; H4 follows once exact current state can be retrieved. Product UX follow-ups remain separately scoped. None is automatically a prerequisite for an experimental release if the documented external-browser workflow remains reliable. Silent state loss, missing recovery/export, invalid artifacts or a broken primary documented workflow block release until addressed.

Before public distribution: include the existing repository LICENSE and any required notices in the distributable, rerun package validation, complete a short documented upload/create/edit/export/action/review smoke test, and state host limitations. Keep initial publication a GitHub pre-release with an experimental version and explicit known issues. Publication, tags, remotes and pushes require separate authorization.
