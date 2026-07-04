import * as vscode from 'vscode'
import { normalizeId } from './ids'
import { commentMarkers, type CommentMarkers } from './comments'

/** An inline ADR reference found in a code comment. */
export interface Anchor {
  /** Normalized ADR ids referenced by this anchor (a comma-separated list is supported). */
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
  // Matches a keyword followed by one or more numeric ids.
  return new RegExp(`(?:${alternation})\\s+((?:\\d+[\\s,]*)+)`, 'gi')
}

/**
 * Whether `token` appears in `before` outside of a double-quoted string — i.e.
 * preceded by an even number of quotes. Stops `// dl:adr` inside a JSON/JSONC
 * string (or any string literal) being mistaken for a comment.
 */
function tokenOutsideString(before: string, token: string): boolean {
  for (let from = 0; ; ) {
    const i = before.indexOf(token, from)
    if (i === -1) return false
    let quotes = 0
    for (let j = 0; j < i; j++) if (before[j] === '"') quotes++
    if (quotes % 2 === 0) return true
    from = i + 1
  }
}

/** Whether the text preceding the keyword on its line opens a comment. */
function inComment(before: string, markers: CommentMarkers): boolean {
  for (const line of markers.lines) if (tokenOutsideString(before, line)) return true
  for (const [open] of markers.blocks) if (tokenOutsideString(before, open)) return true
  // Block-comment continuation lines, e.g. a JSDoc "*"-prefixed line.
  if (markers.blocks.length && before.trimStart().startsWith('*')) return true
  return false
}

/** The first configured keyword, used when writing new anchors. */
export function primaryKeyword(): string {
  return anchorKeywords()[0]
}

/** Find every anchor in a document — only matches that sit inside a comment. */
export function findAnchors(document: vscode.TextDocument): Anchor[] {
  const text = document.getText()
  const regex = anchorRegex()
  const markers = commentMarkers(document.languageId)
  const anchors: Anchor[] = []
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    const ids = (match[1].match(/\d+/g) ?? []).map(normalizeId).filter(Boolean)
    if (ids.length === 0) continue
    const start = document.positionAt(match.index)
    const lineText = document.lineAt(start.line).text
    if (!inComment(lineText.slice(0, start.character), markers)) continue
    const end = document.positionAt(match.index + match[0].length)
    anchors.push({ ids, range: new vscode.Range(start, end) })
  }
  return anchors
}
