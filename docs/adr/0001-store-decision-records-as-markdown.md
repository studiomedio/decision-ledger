---
id: "0001"
title: Store decision records as plain markdown
status: accepted
date: 2026-07-04
deciders: [slawomir]
supersedes: ["0003"]
tags: [architecture, storage]
applies-to:
  - "src/core/**"
---

# ADR-0001: Store decision records as plain markdown

## Context

Decision Ledger needs a place to store ADRs. The two obvious options are a database or plain
markdown files committed to the repository. The product's core promise is "git-native, zero
lock-in" — decisions are code and should be versioned like code.

## Decision

Records are MADR-style markdown files under `docs/adr/`, with a small YAML frontmatter block for
machine-readable metadata. Markdown on disk is the single source of truth. The extension builds a
disposable in-memory index from those files and keeps it warm with a file watcher — never a
database.

## Consequences

- Records are diffable, reviewable, and greppable; deleting the extension loses nothing.
- The extension must parse frontmatter defensively and tolerate hand-edited files.
- Cross-repo querying and full-text search are the extension's responsibility, not a DB's.
