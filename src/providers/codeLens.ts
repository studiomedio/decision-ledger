import * as vscode from 'vscode'
import type { AdrIndex } from '../core/adrIndex'
import { findAnchors } from '../core/anchors'
import { lensTitle } from '../core/format'

/**
 * Shows governing ADRs as CodeLenses:
 *  - file-level, at the top of a file matched by an ADR's `applies-to` globs
 *  - symbol-level, on any line carrying an inline `dl:adr NNNN` anchor
 */
export class AdrCodeLensProvider implements vscode.CodeLensProvider {
  private readonly _onDidChange = new vscode.EventEmitter<void>()
  readonly onDidChangeCodeLenses = this._onDidChange.event

  constructor(private readonly index: AdrIndex) {
    index.onDidChange(() => this._onDidChange.fire())
  }

  provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    const enabled = vscode.workspace
      .getConfiguration('decisionLedger')
      .get<boolean>('codeLens.enabled', true)
    if (!enabled) return []

    const lenses: vscode.CodeLens[] = []

    // File-level lenses from applies-to globs, pinned to the top of the file.
    const topRange = new vscode.Range(0, 0, 0, 0)
    for (const adr of this.index.matchDocument(document.uri)) {
      lenses.push(
        new vscode.CodeLens(topRange, {
          title: lensTitle(adr),
          command: 'decisionLedger.openRecord',
          arguments: [adr.id],
        }),
      )
    }

    // Symbol-level lenses from inline anchors.
    for (const anchor of findAnchors(document)) {
      for (const id of anchor.ids) {
        const adr = this.index.get(id)
        lenses.push(
          new vscode.CodeLens(anchor.range, {
            title: adr ? lensTitle(adr) : `$(warning) ADR-${id} — not found`,
            command: 'decisionLedger.openRecord',
            arguments: [id],
          }),
        )
      }
    }

    return lenses
  }
}
