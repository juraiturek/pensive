# Experimental candidate validation — 2026-11-07

Candidate: `pensive-claude-v0.1.0-experimental.1.zip`, generated under `outputs/claude/` (ignored).

- Builder passed: 78 files; 878,031 ZIP bytes; SHA-256 `c1a45e592aa13ff04657abac33542cc0b3be11d7579d64d3e7f8029fdfeae613`.
- Exact ZIP root/inventory, metadata, CRC, deterministic archive equality, isolated extraction and extracted-byte comparisons passed.
- All 117 relative Markdown file references resolved within the extracted skill.
- All four extracted framework packagers passed byte-identical blank rebuilding, initial-state JSON packaging, overwrite refusal and invalid-state rejection. Rebuilding exercised their resource/module paths without repository dependencies.
- `node --test tests/*-state.test.mjs`: 105 passed, zero failures/skips. These are repository state regressions; extracted-package execution is the separate builder check above.
- Start/end SHA-256 comparison: all 78 authoritative skill files and product README unchanged. README already had an uncommitted change before this task; it was preserved.
- `git diff --check` passed. Generated ZIP is Git-ignored.
- Installed `quick_validate.py` was attempted but could not execute: PyYAML unavailable in the active Python environment. A previously documented temporary dependency path also lacked a working PyYAML installation. No dependency was added. Builder checks validate this package's fixed metadata and references independently, not the full generic validator contract.

Only distribution adaptation: a shortened YAML description in the ZIP copy, meeting Claude's documented 200-character limit. The SKILL.md body and every other packaged file match source bytes.

Full ZIP inventory, individual file sizes and SHA-256 hashes are generated alongside the ZIP in `pensive-claude-v0.1.0-experimental.1.validation.md`.

No Claude.ai upload, discovery, model-quality, preview or runtime test was performed. No new browser tests were run: canvas implementation bytes are unchanged. Node 24.22.1/Python 3.14.3 local success does not establish the hosted environment's runtime versions. No tags, releases, remotes, pushes or publication were created.
