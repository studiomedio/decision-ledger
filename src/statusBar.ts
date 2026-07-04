import * as vscode from 'vscode'
import type { AdrIndex } from './core/adrIndex'

/** Shows how many ADRs govern the active file; click opens a quick pick. */
export class StatusBar implements vscode.Disposable {
  private readonly item: vscode.StatusBarItem

  constructor(private readonly index: AdrIndex) {
    this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100)
    this.item.command = 'decisionLedger.showFileDecisions'
    index.onDidChange(() => this.update())
  }

  update(): void {
    const editor = vscode.window.activeTextEditor
    if (!editor) {
      this.item.hide()
      return
    }
    const matches = this.index.matchDocument(editor.document.uri)
    if (matches.length === 0) {
      this.item.hide()
      return
    }
    const noun = matches.length === 1 ? 'decision' : 'decisions'
    this.item.text = `$(law) ${matches.length} ${noun}`
    this.item.tooltip = matches.map((a) => `ADR-${a.id} · ${a.status} — ${a.title}`).join('\n')
    this.item.show()
  }

  dispose(): void {
    this.item.dispose()
  }
}
