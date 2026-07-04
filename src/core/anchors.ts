import * as vscode from 'vscode'
import { normalizeId } from './ids'

/** An inline `dl:adr NNNN` reference found in source code. */
export interface Anchor {
  /** Normalized ADR ids referenced by this anchor (supports `dl:adr 0042, 0017`). */
  ids: string[]
  /** Range covering the marker and its ids, for hover hit-testing. */
  range: vscode.Range
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function anchorKeywords(): string[] {
  const configured = vscode.workspace
    .getConfiguration('decisionLedger')
    .get<string[]>('anchor.keywords', ['dl:adr', '@adr'])
  const cleaned = configured.map((k) => k.trim()).filter(Boolean)
  return cleaned.length ? cleaned : ['dl:adr']
}

/** Build the anchor-matching regex from the configured keywords. */
export function anchorRegex(): RegExp {
  const alternation = anchorKeywords().map(escapeRegExp).join('|')
  // e.g. (?:dl:adr|@adr) 0042, 0017
  return new RegExp(`(?:${alternation})\\s+((?:\\d+[\\s,]*)+)`, 'gi')
}

/** The first configured keyword, used when writing new anchors. */
export function primaryKeyword(): string {
  return anchorKeywords()[0]
}

/** Find every anchor in a document. */
export function findAnchors(document: vscode.TextDocument): Anchor[] {
  const text = document.getText()
  const regex = anchorRegex()
  const anchors: Anchor[] = []
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    const ids = (match[1].match(/\d+/g) ?? []).map(normalizeId).filter(Boolean)
    if (ids.length === 0) continue
    const start = document.positionAt(match.index)
    const end = document.positionAt(match.index + match[0].length)
    anchors.push({ ids, range: new vscode.Range(start, end) })
  }
  return anchors
}
