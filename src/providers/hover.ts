import * as vscode from 'vscode'
import type { AdrIndex } from '../core/adrIndex'
import { findAnchors } from '../core/anchors'
import { STATUS_ICON, openRecordCommandUri } from '../core/format'
import type { Adr } from '../types/adr'

function section(adr: Adr): string {
  const lines = [
    `${STATUS_ICON[adr.status]} **ADR-${adr.id} · ${adr.status}**`,
    '',
    adr.title,
  ]
  const meta: string[] = []
  if (adr.date) meta.push(adr.date)
  if (adr.deciders.length) meta.push(adr.deciders.map((d) => `@${d}`).join(', '))
  if (meta.length) lines.push('', `_${meta.join(' · ')}_`)
  if (adr.summary) lines.push('', adr.summary)
  lines.push('', `[Open record](${openRecordCommandUri(adr.id)})`)
  return lines.join('\n')
}

/** Rich tooltip when hovering an inline `dl:adr NNNN` anchor. */
export class AdrHoverProvider implements vscode.HoverProvider {
  constructor(private readonly index: AdrIndex) {}

  provideHover(document: vscode.TextDocument, position: vscode.Position): vscode.Hover | undefined {
    const anchor = findAnchors(document).find((a) => a.range.contains(position))
    if (!anchor) return undefined

    const blocks = anchor.ids.map((id) => {
      const adr = this.index.get(id)
      return adr ? section(adr) : `$(warning) **ADR-${id}** — not found in the ledger`
    })

    const md = new vscode.MarkdownString(blocks.join('\n\n---\n\n'))
    md.isTrusted = true
    md.supportThemeIcons = true
    return new vscode.Hover(md, anchor.range)
  }
}
