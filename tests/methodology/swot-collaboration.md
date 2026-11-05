# SWOT collaborative guidance evaluation — E1/E2/E3/E5/E6

Date: 2026-11-04. These behavioral cases assess guidance through authored application outputs, not phrase matching. Use no research. Treat runtime validity separately from analytical quality.

## Baseline evidence from the consumer experiment

The actual consumer conversation is summarized in [the experiment report](../../docs/2026-11-04-swot-consumer-test-report.md). Observed gaps before this refinement:

- After the entity and objective were clear, the user had to ask again for creation. This tests transition initiative, not implicit framework recognition: SWOT had been explicitly named.
- The chat established a new observation, but the submitted canvas still described it as hypothetical. Improve preserved the submitted state and missed a chance to offer reconciliation.
- Improve wording became verbose with repeated methodological caveats despite a request to shorten and balance.
- Rationale accumulated explanatory protocol text and instructions that later became obsolete.
- The user liked restrained Strategize output and suggested a conditional few-first versus broad-and-prune choice. No observed failure of a breadth-choice implementation is claimed.

## Repeatable cases

| Case | Input and boundary | Assessment |
| --- | --- | --- |
| A: transition | SWOT already selected; tool library; objective to make borrowing easier; staffed pickup desk and clear instructions. After one clarification, user says barriers to borrowing are hard to identify. | Offer a bounded starting draft when evidence is sparse; wait for agreement if needed. Do not demand every quadrant's inputs or require another generation command. Remain within two creation question turns. |
| A2: implicit framework | User asks how a volunteer group can grow sustainably, without naming a framework. | May selectively offer SWOT with a concrete reason and wait for choice. Ordinary advice remains valid; do not force a canvas or repeatedly offer after decline. |
| B: conversational discovery | The canvas describes checkout delays as hypothetical. The user reports that the scanner sometimes needs a restart, and the effect on abandoned loans is unknown. User asks for thoughts. | Give useful analysis and suggest an exact canvas clarification. Ask whether to propose it; do not silently mutate state. |
| B2: authorized reconciliation | Same complete canvas plus Improve request and explicit user direction to incorporate that clarification. | Propose that narrow correction while preserving framing/IDs and separating scanner delays from abandoned-loan causation. Do not ask again or alter the original request file. |
| B3: incompatible action | Same correction during Evaluate or Strategize. | Do not change factors. Evaluate stays thought-only; Strategize preserves factors. Explain that a separate Improve proposal or local edit can incorporate the correction. No implicit action switch. |
| C: polish | Complete Improve state has strength `s-practice`: “Insturctions for borrowers”; partner “Alder Workshop”; an opportunity marked “Potential”. Steering requests short, polished wording. | Correct clear spelling, retain proper names and material uncertainty, preserve IDs/framing, avoid new evidence or padded caveats. |
| D: strategy breadth | Many plausible combinations, no breadth preference. | A brief few-first versus broader-set choice is appropriate if consequential; not mandatory for a small obvious set. Respect an explicit preference and proceed without re-asking. Never generate every pair mechanically. |
| E: concise rationale | Improve or Strategize returns material changes. | Explain main changes and practical implications in a compact thought; no repeated protocol narration or stale imperatives. Preserve existing thoughts unmodified. |

## Execution record

Sanitized baseline and revised walkthrough examples are retained separately in `swot-collaboration-observed.json`. These are narrow synthetic application checks by an agent with inherited task context, not blind model sampling, a statistical evaluation, or proof of reliable user experience. The real consumer conversation supplies direct baseline evidence; synthetic baselines may already satisfy some criteria.

The baseline actor proceeded toward a sparse draft without agreement in A, already proofread correctly in C, and followed the old small-set default in D. The revised actor offered and waited in A/A2/B/D, incorporated explicit clarification without re-asking in B2, and kept Evaluate/Strategize boundaries in B3/E. A2 has no matched synthetic baseline; its result does not establish improved implicit recognition. D's new choice is preference support, not a reproduced defect correction.

Executed deterministic checks through the bundled Node runtime: baseline C, revised C and revised B2 all composed successfully with the real SWOT core, retained the unchanged request and pending original content, preserved framing and every item ID, and passed standalone HTML packaging in memory. No browser interaction or saved-file round trip was run for these fixtures. The prose-only Evaluate/Strategize cases do not claim composed runtime responses.

Skill-creator validator passed with the existing temporary PyYAML dependency path. All 104 local Markdown references within the skill resolved. These checks establish structure/references and inspected application behavior, not general reasoning reliability.
