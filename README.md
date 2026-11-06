# Pensive

**A workspace for structured thinking**

Pensive gives you an editable canvas for working through a strategic question, examining a customer need, challenging a perspective, or investigating a recurring problem. Frame the question, develop the analysis, and save the work as a file you can reopen.

Pensive offers a different way to work with a language model. The canvas keeps the current analysis in view as you edit it. When you want a second look, send the model the current canvas and a specific request. Its assessment or proposed changes come back in a new copy of the canvas, where you can review them alongside your work.

**AI supports the thinking process. You own the conclusions.**

## How it works

Suppose you’re weighing whether a neighborhood repair shop should offer pickup and delivery.

1. **Frame the question.** Start a SWOT canvas and describe the shop, the objective, and the environment. Begin with a blank canvas or ask Pensive for a draft from the context you provide.
2. **Develop the analysis.** Add what you know about the shop’s capacity and customer demand. Attach a note where an assumption needs checking.
3. **Ask for a second look.** Choose **Strategize** to explore options that connect internal factors with external conditions. Copy the action request into the Pensive-enabled chat and open the returned canvas.
4. **Review and carry forward.** Compare the proposed strategies with your current analysis and decide which collections of changes to accept. Record conclusions, next steps, or open questions in **Takeaways**, then save the editable HTML.

The browser handles local editing. AI actions run in the chat after you send the request, which includes the complete current canvas state.

## What you can use today

| Canvas | What it helps you explore | AI actions |
| --- | --- | --- |
| **SWOT/TOWS** | What helps or hinders an objective, and which strategies follow from the combination of internal and external factors? | Strategize, Evaluate, Improve |
| **PAGES** | What parts, actions, goals, events, and self-concepts make up a perspective, and what follows if one of them changes? | Evaluate, Improve, Ripple |
| **Value Proposition Canvas** | How does an offering fit a particular customer segment’s jobs, pains, and gains? | Evaluate, Improve |
| **5 Whys** | What might explain a recurring problem, and where should you investigate competing causes? | Reflect, Expand a causal branch |

All four canvases support **Six Thinking Hats** for exploring one perspective at a time, **Annotation Mode** for keeping notes alongside the analysis, and **Takeaways** for recording what to carry forward. You can write Takeaways yourself or ask AI to formulate or review the text. The proposed text stays separate until you accept it.

SWOT/TOWS, PAGES, and Value Proposition Canvas review analytical proposals by collection. A 5 Whys expansion is reviewed as one batch. Assessments and Six Thinking Hats reflections add observations while leaving the analytical content intact.

## Try it

### Browser only

Download the [blank SWOT/TOWS canvas](.agents/skills/pensive/frameworks/swot/canvas.html) using GitHub’s raw download control and open the file in your browser. You can edit the canvas and add annotations locally. Use **Save to File** to download an editable copy and reopen that copy to continue. Changes in the tab need an explicit save or export.

**Export to clipboard** copies complete canvas JSON for reuse or transfer. **Import JSON** validates pasted state for the same framework and asks before replacing the current canvas. An AI action copies a separate request that includes the canvas and the instructions for the action.

### Codex

The repository includes the Pensive Skill at `.agents/skills/pensive/`. Open a local checkout as a Codex project, with Node.js available for packaging and a writable location for the generated HTML. The repository’s tests used Node.js 24.22.1.

1. Start a Codex chat in the checkout and try: “`$pensive` Create a blank SWOT canvas for a neighborhood repair shop evaluating pickup and delivery.”
2. Open the returned HTML in your browser and enter your framing and factors.
3. Choose **Evaluate**, copy the request, and paste it into the chat. Open the new HTML to read the assessment. Try **Strategize** to see a proposal you can accept or reject.
4. Use **Save to File** after editing or reviewing, then reopen the saved file to continue.

See [Codex skill discovery](https://learn.chatgpt.com/docs/build-skills) for project setup and the [testing guide](docs/testing.md) for contributor dependencies. The local canvas and packaging flows have regression coverage. A clean Codex installation walkthrough is pending for public release.

### Claude

Claude chat is an intended distribution target. A prior ZIP export exists, and its contents and compatibility with the current workflow are unverified. Current release support depends on testing Skill upload and activation, Node execution, and downloadable HTML delivery in Claude. See [Anthropic’s custom Skill setup](https://support.claude.com/en/articles/12512180-use-skills-in-claude) for the host requirements.

## Design and architecture

Each framework gives the analysis its own visual structure and analytical rules. Framing defines the question. Framework content develops the analysis. Annotations hold supporting observations and questions. Takeaways record what the user wants to carry forward.

- **The canvas** is standalone HTML, CSS, and JavaScript with embedded JSON. It runs locally without a Pensive backend, database, or account.
- **The Skill** selects the framework and action, then loads the relevant Markdown methodology. Each action starts from the submitted state, so local edits travel with the request.
- **The packager** validates the result and embeds it in the established canvas implementation. The model supplies analytical data. The browser presents proposed changes for explicit review.

Pensive uses **RrEAC — Research → Review → Extract → Adjust → Compile** to develop its methodological instructions. The [architecture notes](docs/architecture.md), [extraction map](docs/extraction-map.md), and [testing guide](docs/testing.md) describe design decisions, source provenance, and verification.

## Development

Pensive’s creator conceived the product, designed its architecture and human–AI workflow, developed and reviewed its methodological prompts, specified features, and reviewed and validated the resulting work. AI coding agents generated the application source code under the creator’s direction.

## Future direction

Dedicated contextual educational guidance is planned. Decision Canvases are being researched as a way to make alternatives, criteria, assumptions, and trade-offs visible for the person making the decision. See the [implementation roadmap](docs/roadmap.md) for delivery records and deferred work.

## Licensing and contributing

Licensing and contribution terms are pending for public release. Reuse and redistribution require permission.
