# SWOT refinement: retained synthetic application observations

Date: 2026-11-04. Actor: fresh child agent, before and after reading the revised SWOT methods. No external research, live-user conversation, model API sampling, runtime validation or artifact packaging was performed. Cases use compact analytical inputs, not complete schema-valid requests, except where a complete candidate content object is shown. Outputs below are actual authored walkthrough outputs, not expected-output fixtures. This is narrow qualitative evidence, not a statistical evaluation. The actor inherited the parent discussion and therefore is not a blind experimental condition.

## Shared primary input

Entity: an enterprise integration consultancy. Objective: win regulated enterprise integrations. Environment: enterprise integration services. Strengths: experienced PMs, with no comparative information; integration team certified for regulated workflows, with supplied benchmark that only 2 of 10 rivals are certified; community newsletter, with objective relevance unknown. Weakness: no Japan office, with no demonstrated disadvantage. Opportunity: “Expand into Japan.” Threat: “EU firms request auditable AI integration,” supported by two supplied inquiries. No TOWS strategies. Action: Evaluate SWOT, default compact output, no extra context or research.

## Baseline, before prompt edits

Read the old Evaluate and shared framing-content guidance. Actual response:

```json
{"thought":"The regulated-workflow certification is a concrete strength for winning regulated enterprise integrations, with the supplied 2-of-10 rival benchmark supporting its relative significance; experienced project managers are plausible support but too general to establish an advantage. ‘Expand into Japan’ is an action rather than an external opportunity, while the two EU inquiries for auditable AI integration look potentially favorable rather than inherently threatening, although two inquiries do not establish broad demand. The lack of a Japan office and the community newsletter have no demonstrated link to this objective, so their strategic significance needs clarification rather than an assumed deficiency or automatic removal. Clarify whether Japan is part of the intended scope and what evidence connects these factors to winning regulated work before using them to support strategies."}
```

Additional baseline input: assess overall competitive strength when ten useful capabilities are established industry parity and two are evidenced differentiators; no further facts supplied. Actual response:

```json
{"thought":"The ten industry-parity capabilities may support reliable delivery, but their number does not establish a competitive advantage; the two evidenced differentiators offer the stronger basis for explaining why customers would choose this organization. Overall competitive strength depends on how materially those differentiators affect the objective and customer choice, together with the organization's ability to deliver, rather than the balance of item counts. Retain the useful parity capabilities, but separate their operational contribution from claims of superiority and clarify the differentiators' relevance and limitations."}
```

Baseline observations: classification, uncertain evidence and preservation of emerging factors passed. Directional comparison without counting also passed. The primary output did not expressly ask for PM comparison or articulate the overall competitive implication. These are omissions in this compact output, not proof of a general model failure. Existing instructions permitted good reasoning; source review established missing explicit requirements more clearly than this sample did. No fabricated RED-stage failure is claimed.

## Revised primary Evaluate, compact

Read revised Create, Evaluate, Strategize and Improve. Same shared primary input. Actual response:

```json
{"thought":"Regulated-workflow certification is a supported differentiator against the supplied rival benchmark and strengthens the competitive case for regulated work; experienced PMs may still be useful, but their distinctiveness is unknown. ‘Expand into Japan’ is a proposed action rather than an opportunity, while the two EU inquiries belong more naturally under opportunities if audit-ready delivery can benefit the consultancy; they establish inquiries, not broad market demand. No Japan office is not yet a demonstrated weakness, and the newsletter may have an indirect contribution worth clarifying rather than deleting. Which PM capabilities distinguish your delivery from relevant alternatives, and what supports that assessment?"}
```

Observations: four sentences, thought-only, no mutation; distinction between supported differentiation and unknown comparison; specific classification destinations/conditions; no missing-capability penalty; focused unanswered question. It prioritizes defects rather than listing every check. No scores or uniqueness counts.

## Context and thought eligibility

Input: shared primary input; current action comment says “PM capability is established industry parity; do not ask for this again.” Existing thought says “The newsletter yields regulated-client referrals.” No independent supporting evidence for that thought. Evaluate SWOT with use_thoughts=true. Actual response:

```json
{"thought":"Certification provides an evidenced differentiator, while the PM capability supports delivery at established industry parity rather than adding a demonstrated competitive advantage. The prior thought suggests the newsletter may support regulated-client acquisition through referrals, but that claim needs corroboration rather than automatic promotion to evidence. ‘Expand into Japan’ is an action rather than an opportunity; the EU audit-ready inquiries are a potential opportunity, while lacking a Japan office has no demonstrated disadvantage under the current objective. What supports the newsletter referral claim?"}
```

Same input, use_thoughts=false. Actual response:

```json
{"thought":"Certification strengthens the competitive case through the supplied rival comparison; the PM capability remains useful at established industry parity without demonstrating additional differentiation. ‘Expand into Japan’ is an action rather than an external opportunity, and the two EU audit-ready inquiries are a potential opportunity whose delivery requirements need checking. Neither the missing Japan office nor the newsletter has an established objective link in the permitted input, so their significance remains open rather than automatically negative. What role, if any, does the newsletter play in winning regulated enterprise work?"}
```

Observations: current steering answered the PM question in both outputs. Eligible prior thought treated as claim; excluded assertion not used to infer referrals. This is reasoning inspection only; preservation of the excluded thought in saved state was not exercised.

## Detailed Evaluate: widespread framing mismatch

Input: shared primary input plus current steering: “Please give a detailed evaluation. Also assess that most remaining canvas items concern a community pottery programme—kiln capacity, clay prices and exhibition invitations—with no supplied consultancy connection.” Actual response:

```json
{"thought":"The certification is the clearest supported competitive differentiator for regulated enterprise integrations: only 2 of the 10 supplied rivals share the credential. That comparison improves the competitive assessment, but does not establish customer preference, delivery quality or commercial success. Experienced PMs can still be operationally useful; their comparative status is unknown, so I would ask what distinguishes their delivery rather than presume parity or inferiority. ‘Expand into Japan’ describes a possible move and needs an external opening before it can be assessed as an opportunity. The two EU inquiries are evidence of specific prospective demand for audit-ready integration, potentially an opportunity if the consultancy can deliver, not evidence of a general market trend or an inherently harmful threat. Lack of a Japan office is not a demonstrated weakness unless local presence is necessary for a relevant objective or customer requirement. The newsletter may matter indirectly, but its acquisition or delivery contribution is not established. The pottery-related majority creates substantial framing mismatch: this could reflect imported content, an unstated programme boundary, or an objective that needs broadening or separation. I would surface that choice before recommending wholesale deletion or silently changing the objective. First clarify whether those programme items belong to this consultancy analysis; separately, supply the comparative PM assessment when available."}
```

Observations: expanded only on explicit request; both content drift and framing revision considered; no automatic deletion. No full checklist compliance or precise optimal length claimed.

## WO Evaluate and concise Strategize

Input content used for both actions:

```json
{"framing":{"focal_entity":"Enterprise integration consultancy","objective":"Win regulated enterprise integrations","environment":"Enterprise integration services"},"strengths":[],"weaknesses":[{"id":"w-audit","text":"Audit-ready integration delivery capability is not yet established"}],"opportunities":[{"id":"o-inquiries","text":"Two EU prospects have requested audit-ready AI integrations"}],"threats":[],"strategies":{"so":[],"st":[],"wo":[{"id":"wo-generic","text":"Invest in AI"}],"wt":[]}}
```

Evaluate TOWS; no partner, budget or delivery resources supplied. Actual response:

```json
{"thought":"‘Invest in AI’ does not explain how the consultancy would close its audit-ready delivery gap to serve the two EU requests. The opportunity is grounded in those inquiries, but it does not itself supply the missing capability, and no budget, partner or training route is established. A useful WO option needs a plausible capability remedy and delivery conditions rather than a broader technology commitment; that reasoning can sit in a thought while the strategy stays concise."}
```

Strategize extend, current steering: “Add a concise conditional partner option; preserve existing strategy.” Actual response:

```json
{"content":{"framing":{"focal_entity":"Enterprise integration consultancy","objective":"Win regulated enterprise integrations","environment":"Enterprise integration services"},"strengths":[],"weaknesses":[{"id":"w-audit","text":"Audit-ready integration delivery capability is not yet established"}],"opportunities":[{"id":"o-inquiries","text":"Two EU prospects have requested audit-ready AI integrations"}],"threats":[],"strategies":{"so":[],"st":[],"wo":[{"id":"wo-generic","text":"Invest in AI"},{"id":"wo-partner","text":"If a qualified partner is viable, jointly deliver the EU prospects’ audit-ready AI integrations"}],"wt":[]}},"thought":"The new partner option connects the two supplied requests to the audit-delivery gap: a qualified partner could provide missing delivery capability while the consultancy establishes how responsibility and knowledge transfer would work. No partner availability or agreement is established; qualification, commercial feasibility, delivery accountability and prospect acceptance must be checked before commitment. The existing ‘Invest in AI’ strategy is preserved in extend mode but still lacks a specific capability remedy. Empty SO/ST/WT collections reflect absent supporting factors, not proof that no alternatives exist."}
```

Observations: actual complete candidate content shown; factors/framing and old strategy object preserved by inspection. New strategy concise and conditional, remedy/limits in thought, no invented available partner or budget, no printed IDs in prose. No packaging or acceptance was run.

## Improve: no change warranted

Input content:

```json
{"framing":{"focal_entity":"Enterprise integration consultancy","objective":"Win regulated enterprise integrations","environment":"Enterprise integration services"},"strengths":[{"id":"s-pm","text":"Experienced project managers coordinate complex integrations; industry-parity capability"}],"weaknesses":[],"opportunities":[{"id":"o-requests","text":"Two EU prospects have requested regulated integration projects"}],"threats":[],"strategies":{"so":[{"id":"so-delivery","text":"Use experienced project managers to coordinate delivery plans for the two EU integration requests"}],"st":[],"wo":[],"wt":[]}}
```

Action: Improve; no additional constraints or thoughts. Actual response:

```json
{"content":{"framing":{"focal_entity":"Enterprise integration consultancy","objective":"Win regulated enterprise integrations","environment":"Enterprise integration services"},"strengths":[{"id":"s-pm","text":"Experienced project managers coordinate complex integrations; industry-parity capability"}],"weaknesses":[],"opportunities":[{"id":"o-requests","text":"Two EU prospects have requested regulated integration projects"}],"threats":[],"strategies":{"so":[{"id":"so-delivery","text":"Use experienced project managers to coordinate delivery plans for the two EU integration requests"}],"st":[],"wo":[],"wt":[]}},"thought":"No substantive revision is warranted: the ordinary PM capability is useful without claiming differentiation, the opportunity is limited to two reported requests, and the concise SO strategy shows how the capability supports a practical response. Content, framing and identities are unchanged. The strategy supports planning rather than asserting that regulated delivery capability, prospect commitment or commercial success is already established."}
```

Observations: exact content preservation inspected; no manufactured differentiation, missing-quadrant filling or change. This tests methodological restraint, not runtime handling of a no-change proposal.

## Create: sufficient context, no forced comparison question

Input: “Create a SWOT for our enterprise integration consultancy to win regulated enterprise integrations. Use only these facts and proceed without questions: PMs experienced, comparison unknown; team certified for regulated workflows, only 2/10 supplied rivals certified; no Japan office but no known customer disadvantage; we are considering expansion into Japan; two EU firms have asked for audit-ready AI integration; we have a community newsletter, relevance to the objective unknown. Treat scope as enterprise integration services.”

Actual authored draft state:

```json
{"framework":"swot","schema_version":"1.0","content":{"framing":{"focal_entity":"Enterprise integration consultancy","objective":"Win regulated enterprise integrations","environment":"Enterprise integration services; Japan expansion is under consideration, with no supplied evidence of a market opening"},"strengths":[{"id":"s-certified","text":"Team certified for regulated workflows; only 2 of 10 supplied rivals share the certification"},{"id":"s-pms","text":"Experienced project managers; comparative delivery advantage is unassessed"},{"id":"s-newsletter","text":"Community newsletter; contribution to regulated enterprise acquisition is unclear"}],"weaknesses":[],"opportunities":[{"id":"o-eu","text":"Two EU firms have requested audit-ready AI integration; potential demand if delivery requirements can be met"}],"threats":[],"strategies":{"so":[],"st":[],"wo":[],"wt":[]}}}
```

Actual delivery explanation: “This draft uses the supplied certification benchmark and two inquiries without treating them as proof of market-wide demand. The newsletter is retained as an emerging factor with uncertain relevance. No Japan office is not yet a demonstrated disadvantage, and considering Japan expansion does not establish an external opportunity.”

Observations: zero questions, no forced quadrant balancing; ordinary capability retained, uncertified assumptions not invented, no strategies or new thought/rationale fields. The draft is a reasoning walkthrough, not a packaged artifact; schema and identity checks were not executed. It does not imply this particular newsletter placement is uniquely correct.

## Review findings and limits

Additional input: objective regulated enterprise integrations; most factors concern an unrelated local retail campaign. Actual compact Evaluate response:

```json
{"thought":"Most factors concern a local retail campaign, so the canvas currently gives little basis for assessing regulated enterprise integration choices. That substantial mismatch could reflect imported campaign content or an objective that omits an intended business scope; it does not justify automatically deleting the factors. Clarify whether the intended analysis is the consultancy's enterprise strategy, the retail campaign, or a broader business objective before revising the content or framing."}
```

Additional revised input: ten useful established industry-parity capabilities versus two evidenced differentiators; assess overall competitive strength. Actual response:

```json
{"thought":"The industry-parity capabilities support execution but provide limited evidence of competitive advantage, regardless of their number. The two evidenced differentiators strengthen the competitive assessment to the extent that they materially affect the objective and customer choice. Retain the useful ordinary capabilities while testing applicability and constraints; two differentiators do not guarantee success, and ten parity capabilities do not outweigh them by count."}
```

Objective-requirement counter-case: a regulated integration contract explicitly requires a local licensed delivery office; the consultancy lacks that office. Actual evaluation excerpt: “The missing licensed office is a supported weakness against an explicit contract requirement, even without competitor comparisons, because it blocks eligibility for that contract. Confirm whether obtaining the licence and presence is feasible before treating the associated demand as actionable.” This contrasts with the primary case's absence of demonstrated Japan-office disadvantage.

No-change Improve review: the PM capability supports delivery planning at industry parity, the two requests constitute a bounded external opening, and the SO action proposes plans without inventing full regulated delivery capability. Retaining that concise content is warranted; unknown delivery feasibility is disclosed rather than fabricated into a new factor.

The revised instructions explicitly cover comparison, conditional external grounding, two-way framing fit and concise causal strategy reasoning. Application outputs above complied with the inspected criteria. No contradictory instruction was found requiring architecture changes: Create has no thought, Evaluate is thought-only, and transformations explain detail in their existing thought. The inherited compact Evaluate default requires prioritization, so not every issue appears in every short output; absence from a compact thought is not automatically failure to assess it.

The supplied WO example is close to the revised prompt's example; it checks instruction retrieval and constraints more than generalization. Baselines already performed well, so these observations do not establish measured quality improvement. Further independent scenario/model sampling would be needed for reliability claims. No legacy source, runtime/UI, schema or existing fixtures were modified by this actor.
