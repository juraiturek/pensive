# Create VARS

Delivery follows the default [conversation working-folder workflow](../../../references/working-folder-workflow.md): initialize/reuse the analysis in its chat folder, let the host launch it, and return its live browser URL. A repeated iteration reuses its HTML and saves JSON. A separate canvas is for a newly requested analysis. Standalone packager commands below are for explicit export or a disclosed fallback chosen by the user. Analytical creation rules remain unchanged.


Read the [manifest](../framework.yaml), [handoff](../../../references/vars-workflow.md) and shared [framing–content guidance](../../../references/framing-content.md). Explicit blank requests initialize empty state through the conversation workflow without elicitation. Existing-state actions require submitted complete JSON; do not recreate local state from chat.

Extract `business`, `objective` and `scope` framing from conversation and supplied materials before generating content. Identify which business model and whether it is current or proposed. Clarify only consequential ambiguity. Use zero to two question turns including sparse-draft agreement; reuse prior answers. Rich context needs no question. With thin context, obtain agreement to a sparse draft unless already requested; if no focal model is identifiable, offer blank. Never infer agreement from silence.

Load the four element guides: [V](../methods/v.md), [A](../methods/a.md), [R](../methods/r.md), [S](../methods/s.md). Populate concise stable-ID `{id,text,details?}` items only where supported. Keep hypotheses visibly qualified, unknown framing as empty strings and unsupported quadrants empty. No quotas, forced symmetry or compulsory VRI. Put useful supporting evidence/assumptions in optional quadrant/item Markdown, not long overview paragraphs. Use available context only; search requires an explicit Research request.

Review material links between elements and fit to framing. Correct generated drift without inventing facts or making all quadrants appear coherent. A preliminary representation is not verified viability. Label a proposed model as proposed and distinguish it from current operations. Optionality applies to supporting detail, not to retaining supplied relevant evidence.

Initialize the framework's valid state, populate framing and content, validate, and initialize/reuse it through the conversation workflow. New creation is a draft, not an existing-state proposal. Return the live canvas URL and briefly identify material assumptions; only explicit standalone export returns a new HTML file link. Never generate replacement canvas HTML/CSS/JS.
