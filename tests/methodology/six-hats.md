# Six Hats methodology walkthrough

Synthetic Codex application of the prompts. These outputs are qualitative review material. Browser and state tests separately exercise the handoff, persistence and preservation rules.

## Same SWOT weakness, six perspectives

A regional distributor wants to shorten dispatch time without losing order accuracy. Target weakness: one experienced reviewer checks every flagged order manually. Strength: the reviewer knows recurring exception patterns. Opportunity: a customer is offering a pilot for prevalidated orders. Threat: seasonal volume spikes. The canvas has no queue measurements or documented customer feelings.

| Hat | Observation |
| --- | --- |
| White | The canvas reports who checks flagged orders, but gives neither flag volume nor time spent waiting for the reviewer. It is unclear how much of the dispatch delay the review step accounts for. |
| Red | There is an intuitive tension between the reassurance of an experienced reviewer and the fragility of relying on one person. That is an impression from the setup. |
| Black | Every flagged order still needs the same reviewer. A seasonal spike could create a queue that defeats the dispatch objective even if the reviewer maintains accuracy. |
| Yellow | The manual step concentrates knowledge of recurring exceptions. If the prevalidated-order pilot reliably handles familiar cases, that knowledge could help define which orders can move faster while reserving reviewer time for unusual cases. |
| Green | Turn exception review into a pattern-discovery exercise. Cluster flags by what the reviewer actually resolves, then explore separate paths for routine and genuinely ambiguous cases. |
| Blue | The next thinking step is to clarify the decision. Is the aim to speed up every flagged order, or to identify which cases can safely bypass manual review? Those questions require different comparisons. |

White and Red are useful as observations alone. A Yellow suggestion could be to explore one recurring exception class with the pilot customer. The Yellow application uses a specific weakness–strength–opportunity relationship. A generic-only Yellow reading can already see upside in specialized review, for example that a single reviewer could yield more consistent decisions. The extension makes the relationship between that internal capability and an external opening explicit.

## 5 Whys node target with ancestor context

Framing: shipping labels occasionally fail after a packing station wakes from sleep. Expected condition: label prints on the first attempt. Root: first label after wake sometimes fails. Parent hypothesis: printer connection is unavailable. Target node: Wi-Fi credentials expired. Sibling hypothesis: print spooler resumes before the network.

Generic Green observation: another possibility is a temporary network reconnection delay after wake.

Green with the extension: the spooler could submit before network readiness, producing a failed first job while valid credentials reconnect normally. This is an alternative mechanism for the parent connection failure, supported as a hypothesis by the wake timing and the existing sibling. It shifts the inquiry from credential validity to the ordering of resume events.

The extension helps locate the alternative at the parent link. It does not treat the sibling hypothesis as confirmed or make changes to the tree.
