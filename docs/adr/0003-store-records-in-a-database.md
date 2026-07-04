---
id: "0003"
title: Store decision records in a database
status: superseded
date: 2026-07-04
deciders: [slawomir]
supersedes: []
tags: [storage]
applies-to: []
---

# ADR-0003: Store decision records in a database

## Context

An early option was to keep records in a relational database with the extension and web app as
front-ends. This would make querying and cross-repo aggregation trivial.

## Decision

Rejected in favour of plain markdown — see ADR-0001. A database breaks the "git-native, zero
lock-in" promise and introduces a sync problem between the repo and an external store.

## Consequences

- Kept here as a record of the road not taken; superseded by ADR-0001.
