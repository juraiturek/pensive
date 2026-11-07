# VARS qualitative scenarios

## Observed baseline

On 2026-11-07, `tests/vars-methodology.test.mjs` failed before guidance existed: missing VARS manifest and Evaluate method. No independent hosted-model run or user study is claimed. These scenarios are design/application walkthroughs with expected distinctions, not generated experimental results.

## Application walkthroughs

1. **Partial creation:** User describes a repair service and current customer benefit but supplies no pricing or partner commitments. A useful draft can contain V and limited A, with R/S empty or explicitly uncertain. It must not invent subscriptions, contracts, customer interviews or profitability to fill the matrix. Framing can name a proposed service and exploratory objective.
2. **Consistency versus viability:** V promises immediate unlimited support, A says support is supplied by one part-time technician, R says low flat fee. Evaluate should explain a possible capacity/cost conflict and assumptions required, distinguish demonstrated contradiction from uncertain usage, and recommend a usage/cost test. It cannot conclude failure or viability without quantitative evidence. Response is `{thought}` only.
3. **Optional VRI:** An A item says proprietary recommendation software. A partial Markdown table can say Valuable: plausible, Rare: unknown, Inimitable: not assessed. A patent or marketing claim does not justify all “Yes.” Durability/relevance and substitutes are distinct considerations. No aggregate A score or mandatory VRI completion.
4. **Explicit hypothetical Ripple:** Current R contains one-time sales. User selects R and proposes subscriptions. Candidate includes the proposed initiating change and supported consequences for continuing V, A billing/retention and S boundaries; assumptions remain hypotheses. No baseline is needed, and earlier edits cannot be inferred. Framing remains unchanged; output is complete `{content,thought}` awaiting review.
5. **Substantive improvement:** Weak capture despite strong customer benefit may call for a plausible payer/payment mechanism and enabling capabilities, rather than elegant rewriting of the same statements. Cross-quadrant trade-offs and remaining evidence gaps belong in the rationale. Retained item identities and unrelated supporting Markdown survive.
6. **Scope tension:** Outsourcing a critical activity may support lower cost while weakening control needed by V. This can be a real trade-off, not automatically a contradiction. Guidance should identify contractual/access uncertainty without fabricating an available partner.

## Verification limits

Static tests check guidance dependencies and explicit safeguards. Framework state/browser tests separately verify packaging, targets and review. Analytical success requires future live host/LLM observations and real user feedback; no benchmark improvement is claimed here.
