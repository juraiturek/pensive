# SWOT consumer-mode experiment: findings and proposed backlog

Date: 2026-11-04  
Status: Final report of one exploratory session; backlog proposed, not approved for implementation.

## Purpose and evidence

This exploratory session tested the SWOT workflow through conversation, manual canvas editing, JSON handoffs and reviewable proposals. The participant reported using Safari and copying JSON from the canvas. Successive states supported observations about product use.

## Overall finding

Chat and the canvas served complementary purposes. Chat developed meaning, questioned interpretations and negotiated next steps. The canvas preserved an editable analytical structure and supported explicit, reviewable transformations. Repeated exchanges produced a more concrete analysis than the first draft.

The principal gap was continuity: discoveries, questions, decisions and outcomes emerging in conversation did not have an adequate home in the canvas. The user wanted a collaborator aware of joint work over the analysis, rather than an assistant that only processes isolated requests. The session also exposed the difference between accepting analytical content and choosing a strategy to pursue.

This is promising evidence for the interaction model, not proof that it improves decisions compared with ordinary chat or other tools.

## Interaction sequence and communication modes

| Stage | Mode | Observed contribution |
| --- | --- | --- |
| Establish purpose | Conversational elicitation | Clarified the objective and its scope. |
| Create starting analysis | Chat to HTML | Supplied a sparse draft that the user could react to and edit. |
| Develop local detail | Manual canvas editing, JSON export, chat | Added observations and corrected assumptions. |
| Challenge interpretations | Ordinary conversation | Separated actions from conditions and observations from explanations. |
| Improve | Explicit action envelope and reviewable HTML proposal | Revised wording, removed empty bullets and qualified uncertain claims. |
| Accept and revise | Safari interaction and subsequent JSON submissions | Later state showed accepted changes, corrected framing and a new local opportunity. |
| Strategize | Explicit action envelope and TOWS proposal | Produced a bounded set of options linked to supplied factors. |
| Reach implications | Chat and separate Markdown shortlist | Suggested priorities, experiments and next steps. |
| Reflect on use | Consumer wishes and product discussion | Identified ordering, annotations, strategy selection, framing control and Outcomes needs. |

The session included elicitation, free discussion, factual correction, direct authoring, explicit transformation, proposal acceptance, prioritization and product feedback. A formal Evaluate action was not exercised; evaluative conversation was.

## Activation and initiative

The skill loaded at the start. SWOT creation guidance loaded when the user explicitly asked whether SWOT could help. This was not a test of recognizing an implicit need for an unnamed framework: the user named Pensive and SWOT early.

The assistant clarified the objective and asked for evidence about the problem. The latter question was difficult for the user. The user then explicitly asked to create the SWOT before the assistant generated it.

The opportunity is therefore a better transition from discussion into creation. Once sufficient framing exists, the assistant should offer a bounded draft, including a sparse draft when appropriate, rather than waiting for another generation command. There is no observable evidence of a hidden activation decision that failed.

The framework-selection guidance contains more explicit selective-offer wording for PAGES, VPC and 5 Whys than for SWOT. That asymmetry warrants review, but did not cause failure to select SWOT here: selection was already explicit.

## Chat and state: separate strengths and combined friction

### Chat

Conversation helped the user separate an observed problem from an unverified explanation and explore ideas outside the factor collections.

### HTML and JSON

The user reported working in Safari and copying JSON from the canvas. Successive submitted states showed manual additions, acceptance of the Improve proposal, framing cleanup and further editing. The Strategize output preserved factors and framing and added pending strategies. This supports successful use of the local edit/export/transform loop in this session.

Complete submitted state gave transformations a clear authority boundary. Bare-state export and action-envelope export also served different purposes: the former supported discussion but sometimes required clarification; the latter specified an operation.

### Combined workflow

Important conversational knowledge could remain absent from the submitted state. The assistant preserved that state, but then explained the omission in technical terms rather than proposing reconciliation. A better collaboration pattern is to identify the specific discrepancy and ask whether to incorporate it through a reviewable change. Conversation must not silently overwrite canvas edits.

Outputs also became fragmented: analytical factors and strategies in HTML, actions in a separate Markdown file, and Outcomes in chat. New HTML files per transformation create a potential version-management burden, although confusion between files was not directly reported.

## Quality of outputs

### Initial creation

A sparse draft gave the user something to edit. Leaving unsupported categories empty avoided inventing evidence. Manual edits supplied much of the specificity.

### Conversational review

The discussion clarified the difference between an action and the external condition that could support it. It also distinguished an aspiration from an opportunity and an observed issue from a causal hypothesis.

### Improve

The proposal clarified wording, removed empty bullets and preserved item identities. A later export showed that the participant had accepted the proposed changes. Some bullets became too long, combined multiple mechanisms or lost useful detail. Repeated qualifications also reduced scanability.

Framing preservation prevented silent scope changes. The participant corrected outdated framing manually, highlighting the need to distinguish factual cleanup from substantive reframing.

### Strategize

The participant welcomed a limited set of strategies and would also have considered a few additional options. Some suggestions read as operational steps or investigations. The analysis could have made trade-offs between strategic directions clearer.

### Outcomes

The imagined Outcomes section distinguished takeaways, proposed direction, next steps, open questions and parked possibilities. It preserved the distinction between proposals and agreements and did not invent owners or dates. It answered the user's explicit need for the “so what?” but was not part of persisted canvas state.

## User-expressed wishes

| Expressed need | Product implication |
| --- | --- |
| Reorder bullets by dragging up/down | Local organization without AI. |
| Move bullets between nodes | Reclassification while preserving identity. |
| Add comments/thoughts to bullets or nodes | Keep supporting discussion beside its subject. |
| Mark which strategies are agreed with | Individual strategy decisions distinct from proposal acceptance. |
| Identify implementation or validation steps | Connect chosen options to actions or tests. |
| Add Outcomes/Takeaways/Actions at the bottom | Persist conclusions with the analysis. |
| Allow framing changes under explicit control | Support correction and reconsideration without silent scope changes. |
| Offer useful canvas updates from conversation | Behave as a collaborator aware of the shared work. |
| Choose a few strategies first or a broader set to prune | Adjust generation breadth when the option space warrants it. |
| Minimize older thoughts while preserving them in JSON | Reduce clutter without discarding prior annotations. |
| Consider proofreading within Improve | Correct obvious language defects while preserving meaning. |

The typo correction itself was ordinary content maintenance. The later question about proofreading is the explicit product signal. No scoring system, automatic assignment, full project manager or automatic research was requested.

## Proposed backlog: low-hanging improvements

“Low-hanging” means a bounded candidate with limited expected scope, not an implementation estimate. Confirm against current code and tests before scheduling. Priorities are recommendations.

| ID | Priority | Improvement | Acceptance criteria / boundaries |
| --- | --- | --- | --- |
| E1 | High | Offer creation when enough framing exists | In a suitable conversation, offer a useful draft rather than waiting for repeated generation requests. Respect sparse-draft agreement and question budgets. Do not automatically create an implicitly suggested framework. |
| E2 | High | Suggest reconciliation of conversational discoveries | Identify a specific relevant discrepancy and offer to include it in an authorized proposal. Never silently replace submitted state or make a separate question mandatory when the user has already authorized the exact update. |
| E3 | High | Improve brevity and proofreading guidance | Improve fixes obvious spelling/grammar and keeps bullets concise. Preserve meaning, IDs and specialist terms; retain material uncertainty without repeated boilerplate. Explain consequential analytical edits. |
| E4 | High | Compact older thoughts | Show the latest thought prominently and collapse older thoughts with a visible count. Preserve all thought text/order in JSON and saved HTML. Keep proposal rationale and accepted annotations distinguishable. Exact default remains to be chosen. |
| E5 | Medium | Shorter, clearer AI rationale | Lead with material changes and reasoning; avoid protocol narration and repeated caveats. Clearly label prior rationale so obsolete instructions are not presented as current tasks. Automatic stale-instruction detection is outside this small item. |
| E6 | Medium | Conditional strategy-breadth choice | When many plausible options exist and preference is absent, offer “few first, then expand” versus “broader set to prune.” Avoid a compulsory wizard and avoid Cartesian-product generation. |
| E7 | Medium | Distinguish state export from action requests | Make each export's purpose clear. A bare canvas remains valid for discussion; an action request carries explicit intent. Preserve existing JSON contracts. |
| E8 | Medium | Reorder within a collection | Provide accessible up/down controls; assess drag-and-drop as an enhancement. Preserve item IDs, text and order through export/save/reopen. Define behavior with pending proposals; do not include cross-collection moves in this slice. |

E1–E3, E5 and E6 are primarily skill/methodology refinements. E4, E7 and E8 require bounded interface work. E8 is the largest item in this group and may need a separate slice after code inspection.

## Proposed backlog: larger developments requiring design

| ID | Priority | Development | Decisions needed before implementation |
| --- | --- | --- | --- |
| L1 | High | Persisted Outcomes section | Begin by comparing a lightweight editable section with structured takeaways/decisions/actions/questions. Define JSON, save/export, AI update scope, proposal review and preservation of manual edits. Do not assume every outcome is a task. |
| L2 | High | Individual strategy selection and follow-through | Separate content acceptance from pursue/test/park/decline. Define optional first step, assumption to test, owner and review point. Decide how decisions survive strategy editing/deletion; avoid expanding into a project manager. |
| L3 | High | Bullet- and collection-level annotations | Define target identities, author/source distinctions, display, export and behavior when targets move or are removed. Separate local comments, AI thoughts and prior rationale. Resolve annotation freshness without claiming full revision history. |
| L4 | Medium | Cross-collection moves | Preserve identity and annotations; define atomic moves and interactions with pending proposals. A TOWS category move may invalidate pairing logic; do not silently certify the moved strategy. |
| L5 | Medium | Controlled framing proposals | Distinguish factual cleanup from objective/entity/environment changes. Decide explicit authorization, review controls, action boundaries and consequences for existing factors/strategies. A new permission must not silently weaken existing contracts. |
| L6 | Medium | Broader collaborative state reconciliation | Beyond E2's conversational offer, design reviewable handling of chat discoveries alongside local edits. Decide how to establish which state is current and incorporate approved discoveries without hidden reconstruction. Avoid automatic history or synchronization unless separately justified. |

L1 and L2 are related but need not ship together. A small manual Outcomes section could test demand before structured action fields. L3 and L4 share identity concerns but should remain independently scoped. E4 can reduce thought clutter without waiting for L3.

## Suggested sequence

1. Refine collaborative guidance and output quality: E1–E3 and E5.
2. Reduce thought clutter and test breadth preferences: E4 and E6; improve handoff wording with E7.
3. Add within-collection organization as a focused interaction slice: E8.
4. Design the smallest useful persisted Outcomes slice: L1.
5. Use that experience to scope strategy decisions and annotations: L2–L3.
6. Plan cross-collection moves, framing proposals and richer reconciliation with their state/review consequences: L4–L6.

This sequence is a proposal, not a roadmap amendment or implementation authorization. Follow existing architecture and testing guidance for each approved slice; preserve README.md unchanged.

## What remains untested

- Implicit recognition of a framework need when the user does not name one.
- Ease of first use for someone unfamiliar with Pensive, JSON or Codex.
- Time, effort and comprehension during review; acceptance was observed in exported state, not directly watched.
- Systematic Safari compatibility, other browsers, accessibility and mobile behavior.
- Acceptance or implementation of the TOWS proposal.
- Effectiveness of proposed actions or accuracy of case-specific hypotheses.
- Decision quality relative to ordinary chat, a document or facilitated discussion.
- Long-term use, file-version confusion, competing edits and collaboration among multiple users.
- Whether free-text Outcomes suffices or structured fields earn their complexity.
- Whether the proposed breadth choice improves satisfaction without adding friction.

Useful follow-up tests would separately exercise implicit framework recognition, proactive transition to creation, reconciliation of one chat discovery, compact thought display, and a lightweight Outcomes section. Collect task completion, user interpretation and effort rather than relying only on successful JSON validation.

## Verification and limits

During the experiment, generated Improve and Strategize results passed the existing state/composition validation. Checks confirmed preservation of original content pending acceptance and preservation of factors/framing during Strategize. The standard shell Node executable was unavailable; artifacts were produced through the existing state/packaging core in the available Node runtime. No replacement canvas implementation was generated.

The user's Safari use supplies real browser-use evidence. The assistant did not conduct fresh visual inspection or systematic browser/regression testing. This report is a documentation-only change; no skill, runtime, schema, README or roadmap changes are included, and no product tests are claimed for it.
