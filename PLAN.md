# Decision Ledger — VS Code Extension Plan

The VS Code extension for [decisionledger.dev](https://decisionledger.dev). It surfaces
Architectural Decision Records (ADRs) in the context of the code they govern — inline, in a
sidebar, and in the Problems panel — while keeping every record as plain markdown in the repo.

## Guiding principles

- **Markdown is the only source of truth.** No database. Records are MADR-style markdown files in
  `docs/adr/`. The extension builds a disposable in-memory index from them (rebuilt on change,
  optionally cached in `workspaceState`). Delete the extension and you keep everything — zero
  lock-in, as promised on the landing page.
- **Git-native.** Records are versioned, reviewed, and merged like code.
- **Low friction.** File-level links need no code changes; precise links are one command away.

## ADR file format (MADR + YAML frontmatter)

Only the frontmatter is machine-parsed; the body stays free-form MADR.

```markdown
---
id: "0042"
title: Adopt event sourcing for orders
status: accepted            # proposed | accepted | superseded | deprecated
date: 2026-06-14
deciders: [mika, tomasz]
supersedes: ["0017"]
tags: [architecture, orders]
applies-to:                 # linking rules — see below
  - "src/orders/**"
  - "src/payments/service.ts"
---

## Context
## Decision
## Consequences
```

## Linking model — how an ADR connects to code

Two mechanisms, added in order. Line numbers are **never** stored in the ADR (too brittle).

| Phase | Mechanism | Lives in | Granularity | Refactor-safe |
|-------|-----------|----------|-------------|---------------|
| **1** | `applies-to` globs | the ADR frontmatter | file / folder | ✅ path-based |
| **2** | inline anchor `// dl:adr 0042` | the code | line / symbol | ✅✅ moves with the code |

Phase 1 (this milestone) ships **globs only**. A file matches an ADR when its workspace-relative
path matches any `applies-to` glob (via `minimatch`).

## Display surfaces

- **CodeLens** (primary) — governing ADRs shown at the top of a matching file; click to open.
- **Tree View** (activity bar) — all ADRs grouped by status, searchable; click to open.
- **Status bar** — count of decisions governing the active file; click for a quick pick.
- **Hover** *(Phase 2)* — rich tooltip on an inline anchor.
- **Diagnostics** *(Phase 3)* — warn when editing code governed by a superseded/deprecated ADR.
- **Comment Threads** *(Phase 2, experimental)* — inline expandable "card" like a PR comment.

## Architecture

```
src/
├── extension.ts            # activate/deactivate, wiring
├── core/
│   ├── parser.ts           # gray-matter frontmatter → Adr
│   ├── adrIndex.ts         # in-memory index + file matching + watcher
│   └── ids.ts              # next-id / slug helpers
├── providers/
│   ├── codeLens.ts
│   └── tree.ts
├── commands/               # newAdr, openAdr, showFileDecisions, refresh
├── statusBar.ts
└── types/adr.ts            # Adr, AdrStatus (all types live here)
templates/madr.md           # New-ADR scaffold
docs/adr/                   # Decision Ledger's own ADRs (dogfooding)
```

**Stack:** TypeScript (strict, no semicolons, 2-space), esbuild bundling, `gray-matter` +
`minimatch`, packaged with `@vscode/vsce`, published to the VS Code Marketplace **and** Open VSX
(Cursor / VSCodium). Tested via `@vscode/test-electron`.

## Configuration (`contributes.configuration`)

| Setting | Default | Purpose |
|---------|---------|---------|
| `decisionLedger.folder` | `docs/adr` | Where records live |
| `decisionLedger.fileGlob` | `**/*.md` | Which files in that folder are records |
| `decisionLedger.codeLens.enabled` | `true` | Toggle inline CodeLens |

## Roadmap

- **Phase 1 — MVP ✅ shipped:** index + watcher, Tree View, New/Open ADR, Show-file-decisions,
  CodeLens from `applies-to` globs, status-bar count. End-to-end and testable.
- **Phase 2 — precision ✅ shipped:** inline anchors (`// dl:adr NNNN`, multi-id, language-aware),
  symbol-level CodeLens + rich hover, "Link Selection to Decision Record" command. *Deferred:*
  Comment-Thread inline "card" prototype (evaluate vs. hover+lens before building).
- **Phase 3 — lifecycle ✅ shipped:** staleness + dangling-anchor diagnostics, supersedes-chain
  (index + hover + read view), full-text search, themed webview read view. *Deferred:* semantic
  search (needs an embedding model — revisit once the CLI/web app share a core).
- **Phase 4 — ecosystem:** shared core extracted for a CLI + the web app; CI drift checks;
  semantic search.

## Dogfooding

Decision Ledger stores its own architectural decisions as ADRs in `docs/adr/`, so the extension is
exercised on its own repo from day one.
