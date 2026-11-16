# Issue Tree: full versus MECE evaluation

Synthetic scope walkthrough, 2026-11-15. This checks method intent and contract behavior, not live-model accuracy or independent verification of business facts.

## Supplied case

Governing question: What explains the revenue decline? Children: Transactions and Basket value. No period, store/channel boundary or metric definition is supplied. User flags and notes are preserved.

## MECE review

The branches can form a coherent initial decomposition if basket value means average revenue per transaction. Clarify that definition and whether all stores/channels are covered. Otherwise branch overlap or omitted revenue may be difficult to judge. Identify these as boundary/definition questions, not confirmed deficiencies; do not invent case facts or guarantee completeness. A Markdown assessment with named branches and possible clarifications is enough. Do not produce a financial recommendation, score or task status.

## General evaluation

The tree aligns with the revenue question, but absent periods, definitions and supporting data limit substantive conclusions. Revenue deterioration alone does not establish an explanation. General review may mention the same structural boundary concern while also examining reasoning, meaning and supplied-evidence support.

## Actual contract checks

The Issue Tree state tests compose both synthetic reviews through the real workspace request/result path, including exact retry. Dedicated mece_evaluate and legacy evaluate/evaluation_scope=mece append scope=mece notes; ordinary evaluate and legacy full append scope=full. The response contains only thought. Old unscoped history, full analytical content, cursor and user priority/investigation judgments remain unchanged. Tests reject extra response fields, invalid scope, scoped alternative rationale and pending-proposal actions.

Browser fixtures render a mixed history above/below the tree, safely render hostile Markdown, preserve complete JSON/HTML and verify collapsed prior reviews. Previous findings are not matched, assigned statuses or inferred resolved.
