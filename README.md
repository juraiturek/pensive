# Pensive

**Less conversation. More thinking.**

Pensive is a local-first, methodology-driven visual thinking environment. It offers distinctive, editable canvases for structured analysis and lets people invoke AI selectively for substantive reasoning—not for routine editing or navigation.

> **Project status:** Architecture agreed; existing application audit and selective extraction are planned. This repository is not yet a released product.

## Why Pensive?

Long, linear AI conversations can obscure the structure of an analysis and make it difficult to maintain perspective. Pensive explores a different interaction model: the user works in a persistent visual representation of a thinking methodology, controls its content and organization, and requests AI assistance only when useful.

The central product hypothesis is that framework-specific visual interaction combined with selective, well-grounded AI transformations can support clearer, more deliberate thinking. This hypothesis will be evaluated through use and testing.

## Design principles

1. **Human agency first.** Users own the analysis, its structure, and decisions. AI suggestions must be distinguishable from user-authored content.
2. **Visual structure is methodological.** SWOT, PAGES, Value Proposition Canvas, and 5 Whys deserve different visual interfaces; they are not skins on a generic node editor.
3. **Less code, more methodology.** Encode reasoning strategies, conditional guidance, and evaluation criteria in readable Markdown. Write software for interaction, deterministic state management, validation, and packaging—not to imitate model reasoning.
4. **Useful without AI.** Editing, arranging, tagging, and exporting must work locally without an LLM or server.
5. **Portable, explicit state.** Framework-specific JSON is the authoritative canvas state. Users can export and reuse it outside Pensive.
6. **Stateless AI operations.** Each transformation request contains the complete current canvas JSON plus an action trigger and optional instructions. No server session or stored history is required.
7. **Small, testable increments.** Extract proven functionality from the original application; avoid wholesale rewrites and premature generalization.
8. **Inspectability.** Methodological prompts and AI-generated changes should be understandable and reviewable.

## How it works (MVP)

1. A user or the Pensive skill selects a thinking framework.
2. Pensive initializes a framework-specific, standalone HTML canvas containing its JSON state.
3. The user edits the canvas locally, without AI.
4. When the user selects an AI action, the canvas exports a JSON request with two top-level fields: `canvas` and `action`.
5. The user supplies that request to Codex. The Pensive skill loads the relevant framework definition and Markdown methodology prompt.
6. Codex applies the methodology and produces a new standalone HTML canvas with updated embedded JSON, reusing the established HTML/CSS/JS implementation rather than regenerating it.
7. The user reviews the result, continues editing, and can repeat the process.

The transformation is stateless: the submitted canvas is authoritative. Conversation context can assist interpretation but must not silently override user edits. The MVP does not track revisions automatically.

### Illustrative action request

```json
{
  "canvas": {
    "framework": "swot",
    "schema_version": "1.0",
    "content": {
      "strengths": [],
      "weaknesses": [],
      "opportunities": [],
      "threats": []
    }
  },
  "action": {
    "id": "evaluate",
    "comment": "Check whether significant risks have been overlooked."
  }
}
```

This example is conceptual; the final SWOT schema will be selected after auditing the existing application.

## Architecture

- **Codex skill (`SKILL.md`):** Activation, framework selection, canvas initialization, action routing, and output rules.
- **Framework definitions (YAML):** Framework semantics, fields, relationships, and supported actions; not generic page composition.
- **Framework-specific HTML/JavaScript:** Distinctive visual presentation and local interactions.
- **JSON schemas:** Explicit contracts for each framework's canvas state and action requests.
- **Markdown prompt library:** Framework-specific and shared methodological transformations, conditional reasoning rules, and common output/evidence requirements.
- **Shared assets:** Limited styling and browser utilities where reuse is demonstrably useful.

The MVP requires **no Unicorn server, backend, database, Jinja runtime, SDK, MCP, or hosted inference service**. It is initially packaged for Codex; the semantic JSON protocol is intended to remain usable with ChatGPT when the necessary prompts and file-generation capabilities are available.

## Proposed repository layout

```text
pensive/
├── README.md
├── AGENTS.md
├── LICENSE                 # Choose before public release
├── .gitignore
├── .agents/
│   └── skills/
│       └── pensive/
│           ├── SKILL.md
│           ├── guidance/
│           │   ├── framework-selection.md
│           │   └── canvas-workflow.md
│           ├── frameworks/
│           │   └── swot/
│           │       ├── framework.yaml
│           │       ├── canvas.html
│           │       ├── canvas.schema.json
│           │       └── prompts/
│           │           ├── evaluate.md
│           │           └── cross-analyze.md
│           ├── prompts/
│           │   ├── shared/
│           │   └── common/
│           └── assets/
│               └── shared/
├── examples/
├── tests/
└── docs/
    ├── architecture.md
    ├── extraction-map.md
    └── roadmap.md
```

This is a target structure, not a claim that these files already exist. Add files as they become necessary.

## Methodology development

Pensive uses **RrEAC — Research → Review → Extract → Adjust → Compile** to develop methodological instructions. Source-supported principles, adaptations, and original design choices should be distinguished and documented. The prompt library is a core product asset, not incidental application configuration.

Markdown prompts should be human-readable and refer directly to framework JSON fields. They may contain conditional reasoning instructions. Deterministic operations and JSON validation remain conventional code responsibilities.

## Initial milestone: SWOT vertical slice

The first MVP is complete when:

- A standalone SWOT canvas opens locally without a server.
- Users can add, edit, delete, and organize factors.
- JSON export and import preserve the canvas state.
- An explicit `cross_analyze` request carries the complete canvas and action.
- Codex uses the SWOT methodology prompt to generate an updated standalone HTML canvas.
- Existing user-authored factors remain intact unless the requested action explicitly changes them.
- A second transformation cycle works without losing prior content.

## Roadmap

**Phase 1 — Working MVP:** Read-only audit of the existing application; selective extraction of SWOT interface, semantic YAML/Pydantic concepts, and Jinja methodology content into Markdown; standalone HTML and JSON workflow; one tested AI transformation.

**Phase 2 — Reflection and continuity:** Historical snapshots and lookback across prior states, including examination of how the analysis and the user's thinking evolved. This is a promising research direction but is intentionally excluded from the MVP.

**Later:** Additional visual frameworks, richer evaluations, optional MCP/SDK integration, and potential distribution of specialized methodology packs. These are possibilities, not committed MVP features.

## Development approach

The original local Git repository remains intact as a read-only reference. Pensive starts with a separate Git history and a new GitHub repository. Codex performs a read-only architectural and historical audit before any extraction. Components are copied or minimally adapted into the new structure in small, tested commits. No original server infrastructure is migrated by default.

## Contributing and licensing

Contribution guidelines and a license will be selected before public release. Until a license is explicitly added, do not assume the repository grants permission for reuse or redistribution.
