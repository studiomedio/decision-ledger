# Decision Ledger — VS Code extension

Surface [Architectural Decision Records](https://adr.github.io/) in the context of the code they
govern. Records stay as plain markdown in your repo — [decisionledger.dev](https://decisionledger.dev).

## Features

- **CodeLens**
  - *File-level* at the top of any file matched by a record's `applies-to` globs.
  - *Symbol-level* on any line carrying an inline `// dl:adr 0042` anchor.
- **Hover** — a rich tooltip (status, deciders, summary, open link) on an inline anchor.
- **Link Selection to Decision Record** — inserts a language-aware anchor comment above the
  current line, so precise links move with the code through refactors.
- **Decisions** view in the activity bar — every record grouped by status.
- **Status bar** count of decisions governing the active file.
- **Commands:** New Decision Record (from template), Open Decision Record, Show Decisions for This
  File, Link Selection to Decision Record.

Records are MADR-style markdown files in `docs/adr/` (configurable). Markdown is the only source of
truth; the extension keeps a disposable in-memory index warmed by a file watcher.

### Linking code to a decision

Two complementary mechanisms:

- **`applies-to` globs** (in the record) — coarse, file/folder level, zero code changes.
- **Inline anchors** (in the code) — `// dl:adr 0042` above a symbol; precise and refactor-proof.
  Use **Link Selection to Decision Record** from the editor context menu to insert one.

## Record format

```markdown
---
id: "0042"
title: Adopt event sourcing for orders
status: accepted            # proposed | accepted | superseded | deprecated
applies-to:
  - "src/orders/**"
---

## Context
## Decision
## Consequences
```

## Settings

| Setting | Default | Purpose |
|---|---|---|
| `decisionLedger.folder` | `docs/adr` | Folder holding records |
| `decisionLedger.fileGlob` | `**/*.md` | Which files in it are records |
| `decisionLedger.codeLens.enabled` | `true` | Toggle the file CodeLens |
| `decisionLedger.anchor.keywords` | `["dl:adr", "@adr"]` | Keywords that mark an inline anchor |

## Develop

```bash
npm install
npm run watch      # esbuild in watch mode
# press F5 in VS Code to launch the Extension Development Host
```

See [PLAN.md](./PLAN.md) for the full roadmap.
