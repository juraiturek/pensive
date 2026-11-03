# VPC methodological evaluation

Keep reasoning quality separate from schema/runtime tests. Retain actual observations in `vpc-observed.json` after exercising the prompts. Synthetic scenarios are not customer evidence or a statistical model evaluation.

## Scenarios and acceptance criteria

1. **Rich creation:** scheduling tool for independent physiotherapists planning the next week's appointments. Two supplied user interviews report Friday reconciliation of paper diaries and message requests. Existing capability: CSV import only, no auto-booking. Extract the offering/segment/scenario first, ask no already-answered questions, leave unknown alternative details and metric unclaimed, and distinguish reported pain from provider hypotheses. Do not invent auto-booking or measured savings.
2. **Partial creation:** “Create a VPC for my app.” Ask what the app offers and who it is for as one tightly related framing question; do not generate six generic lists. Reassess the answer, ask only a consequential follow-up, or offer a sparse draft within two turns. Do not require a metric or every optional field.
3. **No strong fit:** customer profile is established but offering does not address its key pains. Allow empty relievers/creators and an explicit weak-fit conclusion; do not invent a matching capability or need.
4. **Classification:** jobs describe customer tasks/outcomes, not “use our dashboard.” Pains are undesired outcomes/risks and gains desired benefits. Products/services differ from their mechanisms of relief/benefit.
5. **Framing mismatch:** solo therapist framing mixed with hospital staffing content. Evaluate specific conflicting entries and distinguish accidental content drift from credible discovery about a different segment. Preserve framing/content; ask which interpretation the user intends when evidence cannot decide.
6. **Evaluate:** two specific observations where supported, fit mappings and evidence status in a concise thought; no replacement content, unsupported score or automatic claim of market fit.
7. **Improve:** complete candidate with retained IDs, unchanged framing and qualified provenance. Fix clear drift; surface legitimate reframing questions. Never fabricate interviews, product capabilities, numbers, customer priorities or convincing fit.
8. **Selection:** explicit VPC requests activate; implicit fit problem receives one optional offer; ordinary uncertainty and declined recommendations do not force a canvas. Keep SWOT/PAGES routing intact.

## Procedure

Record baseline routing before operational instructions; run the same rich/partial/mismatch inputs after instructions, then unsupported-fit and Improve cases. Validate and package observed state/response JSON using real utilities. Assess methodological criteria manually from the outputs; schema validity alone is insufficient. Report omissions and any failed iteration honestly.
