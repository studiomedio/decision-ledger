import * as vscode from 'vscode'
import type { AdrIndex } from '../core/adrIndex'
import type { Adr } from '../types/adr'

const STATUS_ICON: Record<Adr['status'], string> = {
  accepted: '$(check)',
  proposed: '$(circle-outline)',
  superseded: '$(history)',
  deprecated: '$(warning)',
}

/** Shows governing ADRs as a CodeLens at the top of a matching file. */
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

    const matches = this.index.matchDocument(document.uri)
    if (matches.length === 0) return []

    const range = new vscode.Range(0, 0, 0, 0)
    return matches.map(
      (adr) =>
        new vscode.CodeLens(range, {
          title: `${STATUS_ICON[adr.status]} ADR-${adr.id} · ${adr.status} — ${adr.title}`,
          command: 'decisionLedger.openRecord',
          arguments: [adr.id],
        }),
    )
  }
}
