---
id: "0004"
title: Keep records off-chain; use cryptographic timestamping for verifiable immutability
status: accepted
date: 2026-07-05
deciders: [slawomir]
supersedes: []
tags: [architecture, storage, security, immutability]
applies-to: []
---

# ADR-0004: Keep records off-chain; use cryptographic timestamping for verifiable immutability

## Context

A question was raised about anchoring decision records on a blockchain (specifically Cronos) to
guarantee immutability of the audit trail.

The underlying goal — a tamper-resistant, verifiable history of decisions — is legitimate. But most
of it is already provided by our existing storage model (ADR-0001):

- Git is a Merkle DAG: every commit hashes its content and its parent, so a past record cannot be
  altered without changing every subsequent hash. That is built-in tamper-evidence.
- Signed commits/tags (GPG / SSH / Sigstore) add authorship non-repudiation.
- Host-side branch protection and PR review deter silent rewrites.

The one genuine gap: a maintainer with write access can rewrite history (force-push), and git alone
offers no *independent* proof that "commit X existed at time T and is unaltered." That gap is a
timestamping/notarization problem, not a consensus problem.

## Decision

Decision records are **not** stored on, or bound to, any blockchain.

- Git remains the single source of truth (ADR-0001). Immutability is served by signed commits and
  branch protection.
- If independent, verifiable proof-of-existence is needed, it will be provided by lightweight,
  chain-neutral **cryptographic timestamping** — e.g. an optional `notarize`/`verify` step that
  anchors the record or commit *hash* via OpenTimestamps (free, tokenless) or an RFC-3161 timestamp
  authority. Only a hash is ever published; content stays in the repo.
- On-chain anchoring to a specific network may be offered later as an optional, paid, chain-agnostic
  plugin **only** if a concrete customer or regulator contractually requires it. It will never be a
  core dependency.

## Consequences

- **Preserves zero lock-in** (the product's headline constraint): no dependency on a specific L1's
  liveness, RPC, or gas token, and no wallet/key management in the normal workflow.
- **No cost or friction** for the common case; the trail everyone gets is git + signed commits.
- **No metadata leak** for private repos — nothing (not even decision cadence) is posted to a public
  chain by default.
- **Threat-model honesty**: blockchain-grade, trustless immutability answers a threat few software
  teams have for ADRs; timestamping matches the real need at a fraction of the complexity.
- If a regulated customer needs on-chain anchoring, we take on that integration deliberately as an
  add-on rather than imposing it on all users.
