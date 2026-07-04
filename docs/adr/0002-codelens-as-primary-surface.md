---
id: "0002"
title: Use CodeLens as the primary in-editor surface
status: accepted
date: 2026-07-04
deciders: [slawomir]
supersedes: []
tags: [ux, editor]
applies-to:
  - "src/providers/**"
---

# ADR-0002: Use CodeLens as the primary in-editor surface

## Context

We want developers to see the decision that governs a file without leaving the editor. VS Code
offers several surfaces: CodeLens, hover, decorations, comment threads, and the Problems panel.
Each has different affordances and implementation cost.

## Decision

CodeLens is the primary surface for Phase 1: a lens at the top of any file matched by an ADR's
`applies-to` globs, showing status and title and opening the record on click. Hover and inline
"card" widgets (comment threads) are deferred to Phase 2, where inline anchors give them a precise
line-level position to attach to.

## Consequences

- Immediate, low-friction value with no changes required to a team's code.
- CodeLens is file-level in Phase 1; symbol-level precision waits for inline anchors.
- The lens must refresh when the index changes, so the provider listens to the index's change event.
