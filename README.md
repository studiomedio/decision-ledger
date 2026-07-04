# Decision Ledger — VS Code extension

Surface [Architectural Decision Records](https://adr.github.io/) in the context of the code they
govern. Records stay as plain markdown in your repo — [decisionledger.dev](https://decisionledger.dev).

## Features (Phase 1)

- **CodeLens** at the top of any file governed by an ADR (matched via the record's `applies-to`
  globs), click to open the record.
- **Decisions** view in the activity bar — every record grouped by status.
- **Status bar** count of decisions governing the active file.
- **Commands:** New Decision Record (from template), Open Decision Record, Show Decisions for This
  File.

Records are MADR-style markdown files in `docs/adr/` (configurable). Markdown is the only source of
truth; the extension keeps a disposable in-memory index warmed by a file watcher.

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

## Develop

```bash
npm install
npm run watch      # esbuild in watch mode
# press F5 in VS Code to launch the Extension Development Host
```

See [PLAN.md](./PLAN.md) for the full roadmap.
