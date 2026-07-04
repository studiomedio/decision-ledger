import * as vscode from 'vscode'
import type { AdrIndex } from '../core/adrIndex'
import type { Adr } from '../types/adr'
import { nextId, slugify } from '../core/ids'

const encoder = new TextEncoder()
const decoder = new TextDecoder('utf-8')

function today(): string {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

function quickPickItems(adrs: Adr[]): (vscode.QuickPickItem & { id: string })[] {
  return adrs.map((adr) => ({
    id: adr.id,
    label: `ADR-${adr.id} · ${adr.title}`,
    description: adr.status,
    detail: adr.summary || undefined,
  }))
}

async function openRecord(index: AdrIndex, id: string): Promise<void> {
  const adr = index.get(id)
  if (!adr) {
    void vscode.window.showWarningMessage(`Decision Ledger: record ADR-${id} not found.`)
    return
  }
  const doc = await vscode.workspace.openTextDocument(adr.uri)
  await vscode.window.showTextDocument(doc, { preview: true })
}

async function newAdr(context: vscode.ExtensionContext, index: AdrIndex): Promise<void> {
  const title = await vscode.window.showInputBox({
    prompt: 'Title for the new decision record',
    placeHolder: 'Adopt event sourcing for orders',
    validateInput: (v) => (v.trim().length === 0 ? 'A title is required.' : undefined),
  })
  if (!title) return

  const workspaceFolder = vscode.workspace.workspaceFolders?.[0]
  if (!workspaceFolder) {
    void vscode.window.showErrorMessage('Decision Ledger: open a folder first.')
    return
  }

  const cfg = vscode.workspace.getConfiguration('decisionLedger')
  const folder = cfg.get<string>('folder', 'docs/adr').replace(/^\/+|\/+$/g, '')
  const id = nextId(index.ids())
  const filename = `${id}-${slugify(title)}.md`
  const dirUri = vscode.Uri.joinPath(workspaceFolder.uri, ...folder.split('/'))
  const fileUri = vscode.Uri.joinPath(dirUri, filename)

  const templateUri = vscode.Uri.joinPath(context.extensionUri, 'templates', 'madr.md')
  const template = decoder.decode(await vscode.workspace.fs.readFile(templateUri))
  const content = template
    .replaceAll('{{id}}', id)
    .replaceAll('{{title}}', title)
    .replaceAll('{{date}}', today())
    .replaceAll('{{status}}', 'proposed')

  await vscode.workspace.fs.createDirectory(dirUri)
  await vscode.workspace.fs.writeFile(fileUri, encoder.encode(content))
  await index.refresh()

  const doc = await vscode.workspace.openTextDocument(fileUri)
  await vscode.window.showTextDocument(doc)
}

async function openAdr(index: AdrIndex): Promise<void> {
  const adrs = index.all()
  if (adrs.length === 0) {
    void vscode.window.showInformationMessage('Decision Ledger: no records found yet.')
    return
  }
  const picked = await vscode.window.showQuickPick(quickPickItems(adrs), {
    placeHolder: 'Open a decision record',
    matchOnDescription: true,
    matchOnDetail: true,
  })
  if (picked) await openRecord(index, picked.id)
}

async function showFileDecisions(index: AdrIndex): Promise<void> {
  const editor = vscode.window.activeTextEditor
  if (!editor) return
  const matches = index.matchDocument(editor.document.uri)
  if (matches.length === 0) {
    void vscode.window.showInformationMessage('Decision Ledger: no decisions govern this file.')
    return
  }
  const picked = await vscode.window.showQuickPick(quickPickItems(matches), {
    placeHolder: 'Decisions governing this file',
    matchOnDetail: true,
  })
  if (picked) await openRecord(index, picked.id)
}

export function registerCommands(context: vscode.ExtensionContext, index: AdrIndex): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('decisionLedger.newAdr', () => newAdr(context, index)),
    vscode.commands.registerCommand('decisionLedger.openAdr', () => openAdr(index)),
    vscode.commands.registerCommand('decisionLedger.openRecord', (id: string) =>
      openRecord(index, id),
    ),
    vscode.commands.registerCommand('decisionLedger.showFileDecisions', () =>
      showFileDecisions(index),
    ),
    vscode.commands.registerCommand('decisionLedger.refresh', () => index.refresh()),
  )
}
