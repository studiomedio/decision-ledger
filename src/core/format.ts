import type { Adr, AdrStatus } from '../types/adr'

/** Codicon markup keyed by status, for CodeLens / hover titles. */
export const STATUS_ICON: Record<AdrStatus, string> = {
  accepted: '$(check)',
  proposed: '$(circle-outline)',
  superseded: '$(history)',
  deprecated: '$(warning)',
}

/** Bare ThemeIcon id keyed by status, for TreeItem / decorations. */
export const STATUS_THEME_ICON: Record<AdrStatus, string> = {
  accepted: 'check',
  proposed: 'circle-outline',
  superseded: 'history',
  deprecated: 'warning',
}

/** One-line lens label, e.g. "✓ ADR-0042 · accepted — Adopt event sourcing". */
export function lensTitle(adr: Adr): string {
  return `${STATUS_ICON[adr.status]} ADR-${adr.id} · ${adr.status} — ${adr.title}`
}

/** URI that runs the open-record command for an id. */
export function openRecordCommandUri(id: string): string {
  return `command:decisionLedger.openRecord?${encodeURIComponent(JSON.stringify([id]))}`
}
