# Pensive for Claude.ai — experimental candidate

This distribution builds from the single authoritative `.agents/skills/pensive/` directory. It does not change Pensive behavior. `0.1.0-experimental.1` is a local candidate identifier, not an approved release or a product capability version.

## Get the ZIP

The initial candidate is generated locally at `outputs/claude/pensive-claude-v0.1.0-experimental.1.zip`. No GitHub Release exists from this task. Once a release is explicitly approved and published, download its versioned `pensive-claude-v<version>.zip` asset from GitHub Releases, rather than GitHub's repository source ZIP. Compare its SHA-256 with the accompanying validation inventory.

From the repository root, with Python 3.9+ and Node.js available:

```sh
python3 builds/claude/build.py --version 0.1.0-experimental.1 --output-dir outputs/claude
```

Local validation used Python 3.14.3 and Node.js 24.22.1. Runtime packaging needs Node.js supporting ES modules and `node:` built-ins; no npm install, server, API key or external package is required. Python is only a distribution-build requirement. `--node /path/to/node` selects a validation executable without embedding that path in the package.

The builder writes the ZIP and a `.validation.md` report containing checks, full inventory, sizes and SHA-256 hashes. Scratch extraction/state files use a unique temporary directory and are removed automatically. ZIP entries use sorted paths, fixed timestamps/permissions and uncompressed storage for reproducibility independent of compression-library versions. ZIPs under this directory and all default `outputs/` deliverables are ignored by Git.

## Upload and enable

1. Enable **Code execution and file creation** (also called **Create and edit files**) in Claude's Settings > Capabilities. Team/Enterprise administrators must permit both cloud code execution/file creation and Skills under Organization settings > Plugins & skills > Policy.
2. Open **Customize > Skills**, click **+**, then **Create skill > Upload a skill**, and select the generated ZIP without unpacking it.
3. Toggle Pensive on in the skills list. Start a chat and request Pensive explicitly for the initial test.

Skills are currently documented as available on Free, Pro, Max, Ultra, Team and Enterprise plans, subject to organization policy. UI labels and availability may change. User testing reported successful upload, skill discovery and executable packaging in Claude. This is one exploratory session, not comprehensive hosted compatibility validation.

## Initialize SWOT

Ask: **“Use Pensive to create a new blank SWOT canvas. Copy the bundled standalone canvas to a new downloadable HTML file.”**

For an initial draft: **“Use Pensive to create a SWOT/TOWS canvas for [entity], to help decide [objective], within [scope]. Use the context below and distinguish assumptions from evidence: […]”**

Download the HTML and open it in a modern browser for editing. Save to File preserves the editable artifact; Export to clipboard copies complete JSON, with a manual-copy fallback. Edits remain in the tab until saved/exported. For a later analytical action, paste the complete exported request JSON into Claude. Review proposed changes in the returned HTML.

## Known Claude viewer limitation and workarounds

In user testing, Claude's native HTML file viewer blocked clipboard copying of canvas JSON/AI requests and also showed an annotation-save failure. Other interactions, including expanding/collapsing elements and opening overlays, worked. The cause is not yet diagnosed; do not assume all JavaScript is disabled. If Copy appears to do nothing, use one of these routes:

1. **Ask Claude to publish the canvas as an artifact.** Suggested prompt: “Publish this Pensive HTML as an artifact, preserving its existing HTML/CSS/JavaScript. For subsequent updates, reuse the same artifact and exchange the canvas JSON through this conversation. Keep the interface unchanged; if this environment supports updating only its JSON state, use that mechanism. Otherwise, package the validated state and update the same artifact.” This route enabled JSON handoff in the reported test. Export the complete current canvas/action JSON, send it to Claude, and review the returned proposal in the updated artifact. A stable artifact was observed; JSON-only updates and persistence across reloads have not yet been verified. Artifact download/save controls may still be restricted, so retain exported JSON for recovery.
2. **Open the downloaded HTML in Chrome or Safari.** Edit there, copy the complete JSON/AI request, paste it into the Claude conversation, then open the returned HTML for review. Safari worked in the reported session; Chrome is an alternative to test, not a separately verified result. Use Save to File or export JSON to retain local edits. If clipboard access is denied, use the selectable JSON fallback and copy manually.

Until host integration is validated, always send complete current state with the action. Action-only requests, automatic chat synchronization and reliable separate-JSON binding are exploratory work, not current guarantees.

## Included capabilities and limits

- SWOT/TOWS: blank/context creation, manual editing, Strategize, Evaluate and Improve.
- PAGES: creation, Evaluate, Improve and Ripple with persisted baselines.
- Value Proposition Canvas: creation, Evaluate and Improve.
- 5 Whys: creation, causal-tree editing/navigation, Reflect and targeted Expand.
- All four: JSON import/export, standalone HTML, manual thoughts, Takeaways and Six Thinking Hats. Proposal review follows each framework's current rules.

The canvas does not call AI directly. Built-in research actions, automatic chat synchronization, revision history, additional frameworks, bullet-level proposal acceptance, cross-collection moves and keyboard reordering are unavailable. Explicit conversational research depends on available authorized tools. Clipboard permissions and browser behavior vary. Downloaded HTML in an external browser is the documented editing path. User testing reported clipboard/action and annotation-save failures in Claude's native file viewer, while other JavaScript interactions worked. The same canvas worked in Safari; publishing it as an artifact reportedly enabled JSON handoff, but download warnings remained. Artifact delivery is an exploratory alternative, not yet a guaranteed workflow. Separate JSON storage, automatic synchronization and JSON-only artifact updates are not established. Analytical quality and model adherence have not been systematically evaluated on Claude.

## Format and compatibility decisions

The ZIP has exactly one `pensive/` root, containing `SKILL.md` and operational `frameworks/`, `prompts/`, `references/`, `scripts/`, and `shared/` resources. Templates and generated blank HTML are both needed: blank copying uses the latter; deterministic rebuilding uses the former. Repository docs, tests, dependencies, Git data and development tools are excluded.

Required metadata is YAML `name` and `description`; the directory matches `name: pensive`. Claude's help guide specifies a 200-character description maximum, while the Agent Skills standard permits 1024. The build copy therefore uses a shorter description (within both limits). Its instruction body and every other included file remain byte-identical. No Claude adapter, dependency metadata, model-specific prompt or runtime dependency is introduced.

The builder checks exact inventory, metadata, relative Markdown references, extraction integrity and reproducibility. It runs each extracted framework's blank rebuild and JSON packaging, plus invalid-input and overwrite checks. Successful rebuilding also exercises template resources and runtime module imports. This does not establish browser compatibility or Claude.ai compatibility.

Future platform builders can read the same authoritative directory. No other distribution directories or duplicated framework implementations are needed. Choose explicit semantic versions for later approved releases as features evolve; this build script requires a version and never tags, pushes or publishes.

Official guidance reviewed on 2026-11-07:

- [Create custom skills](https://support.claude.com/en/articles/12512198-how-to-create-custom-skills): ZIP folder root, metadata and scripting.
- [Use skills in Claude](https://support.claude.com/en/articles/12512180-use-skills-in-claude): capability settings, upload and enablement.
- [Agent Skills specification](https://agentskills.io/specification): uppercase `SKILL.md`, portable naming and metadata constraints. The help article uses lowercase examples; the standard and Anthropic repository use `SKILL.md`, retained here.
- [Anthropic skills repository](https://github.com/anthropics/skills): self-contained skill folders and progressive resource loading.

## Experimental release readiness

Recommend an explicitly experimental GitHub pre-release rather than claiming stable compatibility. Keep `0.1.0-experimental.1` for the current local candidate; give a revised distributable its own candidate version. Persistent artifacts, compact requests and history are future investigations, not release promises; see [the spike plan](../../docs/plans/2026-11-07-host-integration-spikes.md).

Before public release, include the repository LICENSE and any required notices in the ZIP (the current candidate does not include LICENSE), rerun local validation, and record an upload/create/edit/export/action/review smoke test for the documented external-browser route. Resolve silent data loss or an unusable recovery path before release. Native-viewer clipboard restrictions can remain a declared limitation when the external-browser handoff is verified. Attach the versioned ZIP and validation inventory, mark the GitHub release as a pre-release, and list observed versus untested capabilities. No release or tag has been created.
