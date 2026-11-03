# Create a Value Proposition Canvas

Read the [manifest](../framework.yaml), [schema](../canvas.schema.json), [handoff](../../../references/vpc-workflow.md) and [framing–content contract](../../../references/framing-content.md). Use only available conversation and supplied material; do not research or invent evidence. Explicit blank requests package the established empty canvas without questions. Existing-canvas actions require complete submitted state, not reconstruction from chat.

## A. Extract framing before generating lists

Map known context into exactly `product_offering`, `customer_segment`, `scenario_job_context`, `current_alternative`, `success_metric`. Separate user statements, reasonable inferences and unresolved assumptions. Put material inferred scope in readable framing text so it survives export. Do not add fields for objective/geography/market; include relevant boundaries in scenario/context and known decision criteria in success metric without inventing a number.

Identify one segment and offering variant. Distinguish customer, user and buyer if that distinction changes the jobs. Do not silently combine multiple segments or assume a provider's assertion is a customer observation.

## B. Clarify essential framing gaps

Normally establish an identifiable offering and customer segment, with enough scenario context to avoid materially different jobs. Clarify only consequential ambiguity; unknown alternative or metric does not block creation. Reuse answers already in context.

Use zero to two conversational question turns, including sparse-draft agreement. Ask the highest-value question first, not a fixed field questionnaire. Rich context needs no question. “What does the app offer, and who is it for?” can resolve the tightly related essential boundary. Reassess each answer. When still thin, offer an explicitly sparse draft and wait for agreement unless already authorized; preserve unsupported lists empty. If only customer needs are known, an agreed customer-profile draft is valid without inventing an offering. If no focal context can be established, offer blank. Never ask a third question or treat silence as agreement. Do not build a wizard app.

## C. Generate within established framing

Only after framing is sufficient, populate six stable-ID collections:

- `jobs`: what this customer tries to accomplish in the scenario, expressed as contextual activities/outcomes. Include functional, social or emotional jobs only when supported. “Use our product” is usually the means, not the underlying job.
- `pains`: obstacles, risks and undesired outcomes around those jobs.
- `gains`: benefits or successful outcomes the customer wants; not automatic opposites of pains.
- `products_services`: supplied offering components, distinguishing existing capabilities from explicit proposals.
- `pain_relievers`: explain how an offering component addresses a specific pain.
- `gain_creators`: explain how an offering component creates a specific desired gain.

Form the customer profile independently of what the offering happens to do. Preserve supplied attribution and evidence. Use readable prefixes when material: `Customer report:`, `Provider hypothesis:`, `Proposed capability:`. A user's speculation about customers is a provider hypothesis unless actual customer evidence is supplied. Do not invent interviews, priorities, metrics, quantified improvement, features or demand.

Describe mappings in readable text naming the target need and mechanism. Important unmatched needs and unsupported/absent fit are valid. Do not invent relievers or creators to make six lists look complete. No count quotas, forced symmetry, arbitrary text caps, fit scores or graph fields. Prioritize only where evidence supports priority; distinguish a proposed fit hypothesis from evidence that the mechanism works and from market validation.

## D. Check coherence and package

Review all content against segment, scenario, offering, alternative and metric. Correct generated scope drift; qualify or omit unsupported assumptions. If a credible discovery challenges framing, explain the tension rather than silently changing it. Resolve material ambiguity within the question budget or provide an agreed sparse draft. Preserve unknown optional fields as empty strings, not invented answers.

Initialize `Vpc.initialState()`, populate framing and six arrays of `{id,text}`, validate and write state JSON outside the skill. No baseline, action envelope, thoughts or proposal are needed for initial creation. Package with `node scripts/package-vpc.mjs state.json new-output.html` from the skill directory. Return a new standalone HTML link as an AI-authored draft, briefly noting material hypotheses. Never regenerate canvas HTML/CSS/JS.
