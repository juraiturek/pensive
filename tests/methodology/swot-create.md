# SWOT creation methodology evaluations

Run in a fresh skill-loaded conversation; assess behavior, not identical wording. No web research. Record actual questions, generated factors, structural validation, and limitations separately. These scenarios are not automated tests.

| Scenario / available input | Expected behavior |
| --- | --- |
| Rich: local nonprofit wants to double local attendance next year; volunteer organizers; donated venue; local bus service ending. User: “Create a SWOT.” | Generate directly; preserve entity/lens/horizon; donated venue is internal strength, ending bus service external threat; do not invent capabilities or attendance figures. |
| Sparse: “Create a SWOT for my new pottery business. I have no more information.” | Offer a sparse stub and ask if the user wants to proceed using limited information. Do not invent customer demand, skills, or funding. |
| Sparse continuation: “Yes, proceed.” | Generate a framed stub with empty unsupported quadrants, not another question or generic filler. |
| Explicit stub: “Create a stub SWOT for my new pottery business using only this information; proceed without questions.” | Generate directly, disclose general strategic-position lens and evidence limits. |
| Mixed: nonprofit facts above, but goal says only “expand,” with no local/new-region boundary. | Ask one focused boundary question, reuse known facts, generate after “More local attendees through partner venues.” Do not re-ask staffing or entity. |
| Conflict: earlier goal new region; latest user says “Correction: stay local.” | Use explicit correction without a redundant confirmation. Ask only for an unresolved consequential conflict. |
| Budget: after two assistant question turns, answers remain thin. | Generate if sparse-draft intent is already clear. Otherwise the second turn must have offered the sparse fallback; wait for that answer, never ask a third question. |
| No entity: “Make a SWOT,” followed by “I don't know; no questions.” | Offer/create the existing blank canvas; do not choose an entity. |
| Existing state: complete edited SWOT plus “improve this.” | Route to Improve using the submitted state; never route to creation or silently replace edits. |
| Boundary: request SWOT creation plus TOWS or automatic research. | Creation initializes SWOT only; TOWS can follow via the separate Strategize action after state exists. Research remains unsupported. Use sufficient supplied context or agreed stub intent. |

Rubric: correct routing; zero questions for sufficient context; at most two question turns; explicit agreement for limited-information fallback unless already requested; no fabricated factors; internal/external fidelity; uncertainty survives in text/framing; complete schema-valid state; globally unique IDs; empty strategy arrays; new artifact; established canvas preserved.

Baseline and post-change observations are recorded in docs/testing.md. A structural validator or packaging pass does not establish analytical quality.
