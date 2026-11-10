# Changelog

## 1.0.1

- **Security:** hovers only allow Decision Ledger's own command links. Before, a record's title or
  summary could carry any `command:` link and run it when clicked.
- **Link Selection** no longer inserts a `//` comment into JSON and plain-text files, which have no
  comment syntax (use `applies-to` globs for those).
- Toggling `decisionLedger.codeLens.enabled` or `decisionLedger.diagnostics.enabled` takes effect
  immediately.
- Diagnostics are debounced per file, so switching files while typing no longer drops an update.
- The index is swapped in one step on refresh, so CodeLenses and the tree don't flicker empty.
- Record ids are escaped in the preview.

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
