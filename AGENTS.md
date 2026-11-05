# Development guidance

README.md is the authoritative product vision. Preserve it unchanged unless the user approves an edit. Use docs/architecture.md and docs/roadmap.md for implementation decisions and sequencing.

- Keep developer guidance here and operational behavior in .agents/skills/pensive/.
- Default to this project's `outputs/` directory for generated deliverables such as standalone Pensive canvases, unless the user specifies another destination. Pass the destination explicitly to packaging scripts so the reusable skill can follow the conventions of its host project.
- Use a unique OS temporary directory for intermediate request and response JSON and other scratch files, and remove it when finished. Put any intermediate files the user asks to keep alongside the deliverables.
- Work in small vertical slices. Add dependencies, directories, and shared abstractions only for a demonstrated need.
- V1 and V2 are read-only references. Access only when granted; follow the extraction policy in docs/architecture.md. Never bulk-copy legacy directories.
- Preserve tested framework HTML/CSS/JS when packaging artifacts. Keep reasoning in readable Markdown and deterministic operations in code.
- Follow docs/testing.md. Run the skill validator for skill changes and relevant focused and regression tests for executable changes. Report checks actually run and their limits.
- Keep README vision statements separate from current capability claims. Do not add a remote, push, or publish without explicit authorization.
