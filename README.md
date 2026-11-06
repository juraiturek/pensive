# Pensive

**A workspace for structured thinking**

An AI assistant can hold onto context and give you a useful answer in seconds. When you’re working through an open question, that answer can also set the direction before you’ve had time to decide what matters, which ideas belong together, or what you’re still unsure about. Even a good set of options reflects choices about what to put in front of you.

Pensive gives you a different way to work with AI. You develop an analysis in an editable canvas at your own pace. Established management frameworks such as SWOT and the Value Proposition Canvas give you a starting point for a range of problems and a shared language for explaining your analysis to others who know the framework. As you work, you can ask Pensive to draw on guidance informed by research and practice, whether you need help applying the framework or want to explore another perspective. You can make connections yourself and decide which of the model’s suggestions to carry forward. Sometimes a review exposes a gap in the analysis. Sometimes it gives you a reason to reconsider the question you started with.

Some thoughts need time. Save a question alongside the item that raised it, or keep a reflection next to the analysis and revisit it as the work develops. An unresolved thought can stay in the canvas until you see what it connects to. When you’re ready, record what you want to carry forward in **Takeaways**.

**AI supports the thinking. You decide where it goes.**

## From conversation to canvas and back

Pensive began as a web app built around the idea of a *living parchment*, a surface where an analysis could grow and hold unfinished thoughts. This version brings that idea into the chat as a Skill. Start in conversation and open a standalone HTML canvas when the work needs a place of its own.

Edit the canvas in your browser. When you want the model’s help, choose an action and paste the request into the chat. The clipboard carries the complete current canvas and the action you chose as JSON. The Skill returns a new editable HTML file containing the assessment or proposal. You can continue editing locally, review suggested changes, and save the result when you’re ready.

## Who it’s for

Bring a problem that would benefit from structure. You might be advising a client, investigating a recurring problem at work, thinking through a personal situation, or learning to apply a framework for the first time.

Work through the canvas yourself or bring AI in when it would help you brainstorm, get past an impasse, or challenge an assumption. When you request AI help, Pensive uses guidance specific to the framework. You can also choose a shared technique such as **Six Thinking Hats** to examine the same analysis from a different perspective.

When a SWOT proposal touches several collections, you can accept one change, reject another, and leave the rest pending while you continue thinking. Your review decisions travel with the saved canvas.

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

Each framework gives the analysis its own visual structure and analytical rules. **Framing → Canvas → Takeaways** describes how the pieces fit together. Framing defines the question. The canvas holds the analysis as it develops. Takeaways record what you want to carry forward. Annotations keep questions, observations, and tentative connections alongside the work. You can explicitly include relevant notes when asking AI to formulate or review Takeaways.

One way to think about the canvas is as a graph of free-text nodes. Each node holds an idea whose meaning depends in part on the other ideas around it. A change to one or more nodes can give you a reason to revisit others. In PAGES, **Ripple** makes this concrete. Select changed dimensions and ask AI to explore what those changes imply for the rest of the analysis. Pensive compares them with a saved baseline and returns proposed revisions for you to review.

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
