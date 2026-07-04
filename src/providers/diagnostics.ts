import * as vscode from 'vscode'
import type { AdrIndex } from '../core/adrIndex'
import { findAnchors } from '../core/anchors'
import type { Adr } from '../types/adr'

const STALE: Adr['status'][] = ['superseded', 'deprecated']

/**
 * Publishes lifecycle diagnostics for code files:
 *  - an inline anchor referencing a record that isn't in the ledger
 *  - a file governed by a superseded/deprecated record
 */
export class DiagnosticsManager implements vscode.Disposable {
  private readonly collection: vscode.DiagnosticCollection
  private readonly disposables: vscode.Disposable[] = []
  private debounce?: ReturnType<typeof setTimeout>

  constructor(private readonly index: AdrIndex) {
    this.collection = vscode.languages.createDiagnosticCollection('decisionLedger')
    this.disposables.push(
      this.collection,
      index.onDidChange(() => this.refreshAll()),
      vscode.workspace.onDidOpenTextDocument((doc) => this.update(doc)),
      vscode.workspace.onDidCloseTextDocument((doc) => this.collection.delete(doc.uri)),
      vscode.workspace.onDidChangeTextDocument((e) => this.scheduleUpdate(e.document)),
    )
  }

  private enabled(): boolean {
    return vscode.workspace
      .getConfiguration('decisionLedger')
      .get<boolean>('diagnostics.enabled', true)
  }

  refreshAll(): void {
    this.collection.clear()
    for (const doc of vscode.workspace.textDocuments) this.update(doc)
  }

  private scheduleUpdate(doc: vscode.TextDocument): void {
    if (this.debounce) clearTimeout(this.debounce)
    this.debounce = setTimeout(() => this.update(doc), 300)
  }

  private update(doc: vscode.TextDocument): void {
    if (doc.uri.scheme !== 'file') return
    if (!this.enabled()) {
      this.collection.delete(doc.uri)
      return
    }

    const diagnostics: vscode.Diagnostic[] = []

    // Anchor-based: unresolved ids and anchors pointing at stale records.
    for (const anchor of findAnchors(doc)) {
      for (const id of anchor.ids) {
        const adr = this.index.get(id)
        if (!adr) {
          diagnostics.push(
            this.diag(
              anchor.range,
              `ADR-${id} is referenced here but not found in the ledger.`,
              vscode.DiagnosticSeverity.Warning,
              'dangling-anchor',
            ),
          )
        } else if (STALE.includes(adr.status)) {
          diagnostics.push(
            this.diag(
              anchor.range,
              `ADR-${id} (${adr.title}) is ${adr.status}.`,
              vscode.DiagnosticSeverity.Warning,
              'stale-governance',
            ),
          )
        }
      }
    }

    // Glob-based: file governed by a stale record → flag at the top of the file.
    const topRange = doc.lineAt(0).range
    for (const adr of this.index.matchDocument(doc.uri)) {
      if (STALE.includes(adr.status)) {
        diagnostics.push(
          this.diag(
            topRange,
            `This file is governed by ADR-${adr.id} (${adr.title}), which is ${adr.status}.`,
            vscode.DiagnosticSeverity.Warning,
            'stale-governance',
          ),
        )
      }
    }

    this.collection.set(doc.uri, diagnostics)
  }

  private diag(
    range: vscode.Range,
    message: string,
    severity: vscode.DiagnosticSeverity,
    code: string,
  ): vscode.Diagnostic {
    const d = new vscode.Diagnostic(range, message, severity)
    d.source = 'Decision Ledger'
    d.code = code
    return d
  }

  dispose(): void {
    if (this.debounce) clearTimeout(this.debounce)
    for (const d of this.disposables) d.dispose()
  }
}
