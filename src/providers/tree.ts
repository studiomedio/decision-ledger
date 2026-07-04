import * as vscode from 'vscode'
import type { AdrIndex } from '../core/adrIndex'
import type { Adr, AdrStatus } from '../types/adr'
import { ADR_STATUSES } from '../types/adr'
import { STATUS_THEME_ICON } from '../core/format'

interface StatusGroup {
  kind: 'group'
  status: AdrStatus
  count: number
}

interface RecordNode {
  kind: 'record'
  adr: Adr
}

type Node = StatusGroup | RecordNode

const STATUS_LABEL: Record<AdrStatus, string> = {
  accepted: 'Accepted',
  proposed: 'Proposed',
  superseded: 'Superseded',
  deprecated: 'Deprecated',
}

export class AdrTreeProvider implements vscode.TreeDataProvider<Node> {
  private readonly _onDidChange = new vscode.EventEmitter<void>()
  readonly onDidChangeTreeData = this._onDidChange.event

  constructor(private readonly index: AdrIndex) {
    index.onDidChange(() => this._onDidChange.fire())
  }

  getTreeItem(node: Node): vscode.TreeItem {
    if (node.kind === 'group') {
      const item = new vscode.TreeItem(
        STATUS_LABEL[node.status],
        vscode.TreeItemCollapsibleState.Expanded,
      )
      item.description = String(node.count)
      item.iconPath = new vscode.ThemeIcon(STATUS_THEME_ICON[node.status])
      item.contextValue = 'adrGroup'
      return item
    }

    const { adr } = node
    const item = new vscode.TreeItem(
      `ADR-${adr.id} · ${adr.title}`,
      vscode.TreeItemCollapsibleState.None,
    )
    item.description = adr.date ?? ''
    item.tooltip = new vscode.MarkdownString(
      `**ADR-${adr.id} — ${adr.title}**\n\nStatus: \`${adr.status}\`` +
        (adr.summary ? `\n\n${adr.summary}` : ''),
    )
    item.iconPath = new vscode.ThemeIcon(STATUS_THEME_ICON[adr.status])
    item.contextValue = 'adrRecord'
    item.resourceUri = adr.uri
    item.command = {
      command: 'decisionLedger.openRecord',
      title: 'Open Record',
      arguments: [adr.id],
    }
    return item
  }

  getChildren(node?: Node): Node[] {
    const all = this.index.all()
    if (!node) {
      return ADR_STATUSES.map((status) => ({
        kind: 'group' as const,
        status,
        count: all.filter((a) => a.status === status).length,
      })).filter((g) => g.count > 0)
    }
    if (node.kind === 'group') {
      return all
        .filter((a) => a.status === node.status)
        .map((adr) => ({ kind: 'record' as const, adr }))
    }
    return []
  }
}
