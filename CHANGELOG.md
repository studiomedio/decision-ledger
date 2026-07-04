# Changelog

## 1.0.0

Initial release.

- **CodeLens** — file-level (from `applies-to` globs) and symbol-level (from inline `// dl:adr NNNN`
  anchors).
- **Hover** on anchors with status, metadata, supersedes chain, and open/preview links.
- **Link Selection to Decision Record** — inserts a language-aware anchor comment.
- **Decisions** activity-bar view grouped by status; **status bar** count for the active file.
- **Diagnostics** — dangling-anchor and stale-governance (superseded/deprecated) warnings.
- **Read view** — themed webview with rendered markdown and chain navigation.
- **Full-text search** across id, title, tags, deciders, and body.
- Records are MADR-style markdown in `docs/adr/` (configurable). Markdown is the only source of truth.
