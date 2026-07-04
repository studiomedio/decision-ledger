import * as vscode from 'vscode'
import { AdrIndex } from './core/adrIndex'
import { AdrCodeLensProvider } from './providers/codeLens'
import { AdrHoverProvider } from './providers/hover'
import { AdrTreeProvider } from './providers/tree'
import { AdrPreview } from './providers/preview'
import { DiagnosticsManager } from './providers/diagnostics'
import { StatusBar } from './statusBar'
import { registerCommands } from './commands'

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const index = new AdrIndex()
  context.subscriptions.push(index)

  const statusBar = new StatusBar(index)
  context.subscriptions.push(statusBar)

  const treeProvider = new AdrTreeProvider(index)
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('decisionLedger.records', treeProvider),
  )

  // dl:adr 0002
  const codeLensProvider = new AdrCodeLensProvider(index)
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider({ scheme: 'file' }, codeLensProvider),
  )

  const hoverProvider = new AdrHoverProvider(index)
  context.subscriptions.push(
    vscode.languages.registerHoverProvider({ scheme: 'file' }, hoverProvider),
  )

  const preview = new AdrPreview(index)
  context.subscriptions.push(
    preview,
    // Invoked with a string id (hover / command), or a tree node (view/item/context).
    vscode.commands.registerCommand('decisionLedger.preview', (arg: unknown) => {
      const id =
        typeof arg === 'string'
          ? arg
          : (arg as { adr?: { id?: string } })?.adr?.id
      if (id) preview.show(id)
    }),
  )

  const diagnostics = new DiagnosticsManager(index)
  context.subscriptions.push(diagnostics)

  registerCommands(context, index)

  // Keep the status bar in sync with the active editor.
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(() => statusBar.update()),
  )

  // Re-scan when configuration that affects discovery changes.
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (
        e.affectsConfiguration('decisionLedger.folder') ||
        e.affectsConfiguration('decisionLedger.fileGlob')
      ) {
        index.startWatching()
        void index.refresh()
      }
    }),
  )

  index.startWatching()
  await index.refresh()
  statusBar.update()
}

export function deactivate(): void {
  // Subscriptions are disposed by VS Code.
}
