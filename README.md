# Pensive

**A workspace for structured thinking**

An AI assistant can hold onto context and give you a useful answer in seconds. When you’re working through an open question, that answer can also set the direction before you’ve had time to decide what matters, which ideas belong together, or what you’re still unsure about. Even a good set of options reflects choices about what to put in front of you.

Thinking can also be hard to begin. Sometimes you need a starting point, an example, or a draft to react to. At other times, a useful question challenges an assumption, exposes a gap, or encourages you to consider another perspective.

Pensive gives you a different way to work with AI, making room for both assistance and challenge. You develop an analysis in an editable canvas at your own pace. Established management frameworks such as SWOT and the Value Proposition Canvas provide a starting point and a shared language for explaining your analysis to others who know the framework.

Work through ideas yourself, ask AI for a draft, or request framework-specific guidance to examine what you’ve developed. A reaction like “this doesn’t fit my situation” can be a starting point for revision, even before you can explain exactly why. You decide which suggestions to carry forward. Sometimes a review exposes a gap in the analysis. Sometimes it gives you a reason to reconsider the question you started with.

Some thoughts need time. Save a question alongside the item that raised it, or keep a reflection next to the analysis and revisit it as the work develops. An unresolved thought can stay in the canvas until you see what it connects to. When you’re ready, record what you want to carry forward in **Takeaways**.

**AI supports the thinking. You decide where it goes.**

## From conversation to canvas and back

Pensive works as a Skill within your AI conversation. Start in chat and open a standalone HTML canvas when the work needs a place of its own.

Edit the canvas in your browser. When you want the model’s help, choose an action and paste the request into the chat. The clipboard carries the complete current canvas and the action you chose as JSON. The Skill returns a new editable HTML file containing the assessment or proposal. You can continue editing locally, review suggested changes, and save the result when you’re ready.

Save the editable HTML to revisit the analysis, or exchange its complete JSON with someone using a compatible Pensive canvas for the same framework. They can import it and continue the work without the original conversation.

## Who it’s for

Bring a problem that would benefit from structure. You might be advising a client, investigating a recurring problem at work, thinking through a personal situation, or learning to apply a framework for the first time.

### Different ways to work

| When you want to… | What you can do |
| --- | --- |
| Start from scratch | Open a blank canvas and develop the analysis yourself. |
| Get past a blank page | Ask for an initial draft, then edit it or question its assumptions. |
| Examine your ideas | Request a framework-specific Evaluate or Reflect action. |
| Explore another perspective | Choose Six Thinking Hats, or explore the implications of changed PAGES dimensions with Ripple. |
| Preserve an unfinished thought | Attach a note or question and return to it as the analysis develops. |
| Develop conclusions | Write Takeaways or ask AI to propose text for review. |

When a SWOT proposal touches several collections, you can accept one change, reject another, and leave the rest pending while you continue thinking. Your review decisions travel with the saved canvas.

## Try it

To use Pensive with AI, install or enable the Pensive Skill in your assistant. The Skill supplies the framework methodology and the tools to validate results and return an updated canvas. Choose the Codex or Claude setup below.

### Preview the canvas

To preview the interface before setting up the Skill, download the [blank SWOT/TOWS canvas](.agents/skills/pensive/frameworks/swot/canvas.html) using GitHub’s raw download control and open the file in your browser. You can edit the canvas and add annotations locally. Use **Save to File** to download an editable copy and reopen that copy to continue. Changes in the tab need an explicit save or export.

You can also try the [blank VARS business-model canvas](.agents/skills/pensive/frameworks/vars/canvas.html), with Overview and Focus views.

**Export to clipboard** copies complete canvas JSON for reuse or transfer. **Import JSON** validates pasted state for the same framework and asks before replacing the current canvas. An AI action copies a separate request containing the canvas state and action settings. Processing that request requires an assistant with the Pensive Skill installed and available. The HTML file alone supports local editing, annotations, and saving.

### Codex

The repository includes the Pensive Skill at `.agents/skills/pensive/`. Open a local checkout as a Codex project, with Node.js available for packaging and a writable location for the generated HTML. The repository’s tests used Node.js 24.22.1.

1. Start a Codex chat in the checkout and try: “`$pensive` Create a blank SWOT canvas for a neighborhood repair shop evaluating pickup and delivery.”
2. Open the returned HTML in your browser and enter your framing and factors.
3. Choose **Evaluate**, copy the request, and paste it into the chat. Open the new HTML to read the assessment. Try **Strategize** to see a proposal you can accept or reject.
4. Use **Save to File** after editing or reviewing, then reopen the saved file to continue.

See [Codex skill discovery](https://learn.chatgpt.com/docs/build-skills) for project setup and the [testing guide](docs/testing.md) for contributor dependencies. The local canvas and packaging flows have regression coverage. A clean Codex installation walkthrough is pending for public release.

### Claude

Pensive is available as an experimental Skill package for Claude.

[**Download Pensive for Claude v0.1.0 (Experimental)**](https://github.com/juraiturek/pensive/releases/tag/v0.1.0-experimental.1)

1. Download `pensive-claude-v0.1.0-experimental.1.zip` from the release assets.
2. Upload the ZIP through Claude’s custom Skill installation interface.
3. Activate the Skill and start working with Pensive.

This is an experimental distribution. Compatibility has been tested in a limited environment, and additional validation is planned.

The linked release predates VARS and shared Research support; those capabilities are available in the current repository checkout.

See [all releases](https://github.com/juraiturek/pensive/releases) for future versions.

## What you can use today

| Canvas | What it helps you explore | AI actions |
| --- | --- | --- |
| **SWOT/TOWS** | What helps or hinders an objective, and which strategies follow from the combination of internal and external factors? | Strategize, Evaluate, Improve, Research |
| **PAGES** | What parts, actions, goals, events, and self-concepts make up a perspective, and what follows if one of them changes? | Evaluate, Improve, Ripple |
| **Value Proposition Canvas** | How does an offering fit a particular customer segment’s jobs, pains, and gains? | Evaluate, Improve |
| **5 Whys** | What might explain a recurring problem, and where should you investigate competing causes? | Reflect, Expand a causal branch |
| **VARS Business Model** | How do value proposition, activities/resources/capabilities, realization of value, and enterprise scope work together? | Evaluate Consistency, Improve, Ripple, Research |

All five canvases support **Six Thinking Hats** for exploring one perspective at a time, **Annotation Mode** for keeping notes alongside the analysis, and **Takeaways** for recording what to carry forward. You can write Takeaways yourself or ask AI to formulate or review the text. The proposed text stays separate until you accept it.

VARS starts with an editable four-quadrant Overview. Focus keeps compact statement summaries beside the selected quadrant’s supporting analysis. Quadrant and item details use Markdown, including optional VRI assessments of particular resources or capabilities.

**Research** in VARS and SWOT uses the host assistant’s available search tools. Findings include sources and await approval, together with any proposed edits. A report-only result is saved as a research thought when accepted.

SWOT/TOWS, PAGES, and Value Proposition Canvas review analytical proposals by collection; VARS reviews them by quadrant, including supporting details. Research and 5 Whys expansions each use one batch decision. Assessments and Six Thinking Hats reflections add observations while leaving the analytical content intact.

## Design and architecture

Each framework gives the analysis its own visual structure and analytical rules. **Framing → Canvas → Takeaways** describes how the pieces fit together. Framing defines the question. The canvas holds the analysis as it develops. Takeaways record what you want to carry forward. Annotations keep questions, observations, and tentative connections alongside the work. You can explicitly include relevant notes when asking AI to formulate or review Takeaways.

One way to think about the canvas is as a graph of free-text nodes. Each node holds an idea whose meaning depends in part on the other ideas around it. A change to one or more nodes can give you a reason to revisit others. In PAGES, **Ripple** makes this concrete. Select changed dimensions and ask AI to explore what those changes imply for the rest of the analysis. Pensive compares them with a saved baseline and returns proposed revisions for you to review.

In VARS, Ripple starts from an explicit proposed change and explores its effects across the business model, without a saved baseline. The initiating change and its consequences remain proposals for review.

- **The canvas** is standalone HTML, CSS, and JavaScript with embedded JSON. It runs locally without a Pensive backend, database, or account.
- **The Skill** selects the framework and action, then loads the relevant Markdown methodology. Each action starts from the submitted state, so local edits travel with the request.
- **The packager** validates the result and embeds it in the established canvas implementation. The model supplies analytical data. The browser presents proposed changes for explicit review.

Pensive uses **RrEAC — Research → Review → Extract → Adjust → Compile** to develop its methodological instructions. The [architecture notes](docs/architecture.md), [extraction map](docs/extraction-map.md), and [testing guide](docs/testing.md) describe design decisions, source provenance, and verification.

## Development and origins

Pensive began as a web app built around the idea of a *living parchment*, a surface where an analysis could grow and hold unfinished thoughts. The Skill version brings that workspace into an existing AI conversation and opens a canvas when needed.

Pensive’s creator conceived the product, designed its architecture and human–AI workflow, developed and reviewed its methodological prompts, specified features, and reviewed and validated the resulting work. AI coding agents generated the application source code under the creator’s direction.

## Future direction

Dedicated contextual educational guidance is planned. Decision Canvases are being researched as a way to make alternatives, criteria, assumptions, and trade-offs visible for the person making the decision. See the [implementation roadmap](docs/roadmap.md) for delivery records and deferred work.

## Licensing and contributing

Pensive is open-source software licensed under the [Apache License 2.0](LICENSE).

Contributions, bug reports, and feedback are welcome through [GitHub Issues](https://github.com/juraiturek/pensive/issues) and [pull requests](https://github.com/juraiturek/pensive/pulls).
