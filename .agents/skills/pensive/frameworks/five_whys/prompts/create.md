# Create a 5 Whys investigation

Read the [manifest](../framework.yaml), [schema](../canvas.schema.json), [handoff](../../../references/five-whys-workflow.md) and shared [fit guidance](../../../references/framing-content.md). Use conversation and supplied material. Do not research by default. Explicit blank requests copy the established empty canvas without elicitation. Never generate replacement HTML/CSS/JS.

## Extract framing before causes

Map context into exactly `observable_symptom`, `expected_condition`, `system_or_process`, `investigation_owner`. Preserve supplied timeframe, location, scope and system boundaries in readable symptom/system text. Do not invent an owner, expected metric or missing fact. Separate what was observed, what someone reported and what is only inferred. Ownership means responsibility to investigate, not blame.

Form the root as a concrete observed gap or effect, using the expected condition when known. Do not embed an assumed cause or solution in the problem statement. A useful pattern is “[system] should [expected condition], but [observed symptom]”; natural wording is preferable to a forced template. A user report can remain `Reported:`; do not remove uncertainty to satisfy a declarative root. A weakly supported or perceived problem needs clarification, not promotion to fact.

## Clarify adaptively

Identify an observed effect and relevant system before generating causes. Ask only about ambiguity that materially changes the investigation. Reuse existing answers. Use zero to two conversational question turns, including sparse-draft agreement. Rich context needs none; do not ask five fixed questions or interrogate every optional field. If still thin, offer an explicitly sparse draft or blank and wait for agreement unless already authorized. Silence is not agreement. Unknown owner/expected condition does not block useful work.

## Construct an investigation, not a completed story

Initialize `FiveWhys.initialState()`. Populate framing and root before children. Retain nested `{id,text,children,is_terminal,output}` nodes, stable unique IDs and a valid cursor. A child proposes a direct cause of its parent. Multiple explanations may be competing, complementary or interacting; state which relationship is supported. No exactly-five-level requirement, hard three-child cap, forced countermeasure, or quota for a visually complete tree.

Use supplied causal observations where available. Qualify `Hypothesis:` and `Inference:` explicitly; retain `Observed:` or `Reported:` provenance and evidence in readable text. A plausible mechanism, correlation or general pattern does not establish the local chain. Do not invent interviews, logs, timings, metrics or certainty. Avoid filling deep branches with progressively weaker guesses. When the useful next step is a test/question, leave the branch open and say what information is missing. Never automatically mark a suspected cause terminal; that is a user closure decision, not a causal truth flag.

## Check internal and external fit

For each meaningful link, check mechanism, time order, supporting/contrary evidence, alternatives, missing intermediates, repetition and circularity. Distinguish actionable contributing conditions from proven root causes. Then check the full investigation against root, system, scope and timeframe. Correct generated drift; preserve a credible discovery that challenges framing as a qualified reframing opportunity, explaining the tension rather than silently changing boundaries or discarding it. No numerical confidence or generic fit score.

Validate/package complete state using the handoff. Return a new standalone HTML link as an initial AI-authored draft, noting material hypotheses and unanswered evidence questions. No proposal is needed for first creation. Keep unsupported branches empty rather than fabricate causal depth.
