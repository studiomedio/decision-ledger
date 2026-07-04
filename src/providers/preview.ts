import * as vscode from 'vscode'
import { marked } from 'marked'
import type { AdrIndex } from '../core/adrIndex'
import type { Adr } from '../types/adr'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function nonce(): string {
  let text = ''
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < 24; i++) text += chars.charAt(Math.floor(Math.random() * chars.length))
  return text
}

/** Singleton webview that renders a record with its metadata and chain. */
export class AdrPreview implements vscode.Disposable {
  private panel?: vscode.WebviewPanel

  constructor(private readonly index: AdrIndex) {
    index.onDidChange(() => {
      if (this.panel && this.currentId) this.render(this.currentId)
    })
  }

  private currentId?: string

  show(id: string): void {
    if (!this.panel) {
      this.panel = vscode.window.createWebviewPanel(
        'decisionLedger.preview',
        'Decision Record',
        vscode.ViewColumn.Beside,
        { enableScripts: true, retainContextWhenHidden: true },
      )
      this.panel.onDidDispose(() => {
        this.panel = undefined
        this.currentId = undefined
      })
      this.panel.webview.onDidReceiveMessage((msg: { type: string; id?: string }) => {
        if (msg.type === 'open' && msg.id) this.show(msg.id)
        if (msg.type === 'openFile' && this.currentId) {
          const adr = this.index.get(this.currentId)
          if (adr) void vscode.window.showTextDocument(adr.uri)
        }
      })
    }
    this.render(id)
    this.panel.reveal(vscode.ViewColumn.Beside, true)
  }

  private render(id: string): void {
    if (!this.panel) return
    const adr = this.index.get(id)
    if (!adr) {
      this.panel.webview.html = `<p>Record ADR-${escapeHtml(id)} not found.</p>`
      return
    }
    this.currentId = id
    this.panel.title = `ADR-${adr.id}`
    this.panel.webview.html = this.html(adr)
  }

  private chainHtml(id: string): string {
    const { supersedes, supersededBy } = this.index.chain(id)
    const link = (a: Adr) =>
      `<a href="#" data-id="${a.id}" class="chip">ADR-${a.id} · ${escapeHtml(a.title)}</a>`
    const rows: string[] = []
    if (supersedes.length) rows.push(`<div class="rel"><span>Supersedes</span>${supersedes.map(link).join('')}</div>`)
    if (supersededBy.length) rows.push(`<div class="rel"><span>Superseded by</span>${supersededBy.map(link).join('')}</div>`)
    return rows.join('')
  }

  private html(adr: Adr): string {
    const n = nonce()
    const csp = adr && this.panel
      ? `default-src 'none'; style-src ${this.panel.webview.cspSource} 'unsafe-inline'; script-src 'nonce-${n}';`
      : ''
    const body = marked.parse(adr.body, { async: false }) as string
    const meta = [
      adr.date && `<span>${escapeHtml(adr.date)}</span>`,
      adr.deciders.length && `<span>${adr.deciders.map((d) => '@' + escapeHtml(d)).join(', ')}</span>`,
      adr.tags.length && adr.tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join(''),
    ]
      .filter(Boolean)
      .join('')

    return `<!doctype html>
<html><head><meta charset="utf-8" />
<meta http-equiv="Content-Security-Policy" content="${csp}" />
<style>
  body { font-family: var(--vscode-font-family); color: var(--vscode-foreground); padding: 0 8px; line-height: 1.6; }
  .status { display: inline-block; font-size: 12px; padding: 2px 10px; border-radius: 999px; text-transform: capitalize;
    border: 1px solid var(--vscode-panel-border); }
  .status.accepted { color: var(--vscode-charts-green); }
  .status.proposed { color: var(--vscode-charts-yellow); }
  .status.superseded, .status.deprecated { color: var(--vscode-charts-orange); }
  h1 { font-size: 1.5em; margin: 8px 0; }
  .meta { display: flex; flex-wrap: wrap; gap: 10px; color: var(--vscode-descriptionForeground); font-size: 12px; margin-bottom: 10px; }
  .tag { border: 1px solid var(--vscode-panel-border); border-radius: 4px; padding: 0 6px; }
  .rel { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 6px 0; font-size: 12px; }
  .rel > span:first-child { color: var(--vscode-descriptionForeground); }
  .chip { text-decoration: none; border: 1px solid var(--vscode-panel-border); border-radius: 6px; padding: 2px 8px; color: var(--vscode-textLink-foreground); }
  .chip:hover { background: var(--vscode-list-hoverBackground); }
  hr { border: none; border-top: 1px solid var(--vscode-panel-border); margin: 14px 0; }
  pre { background: var(--vscode-textCodeBlock-background); padding: 10px; border-radius: 6px; overflow: auto; }
  code { font-family: var(--vscode-editor-font-family); }
  a { color: var(--vscode-textLink-foreground); }
  button.open { background: var(--vscode-button-background); color: var(--vscode-button-foreground);
    border: none; padding: 5px 12px; border-radius: 4px; cursor: pointer; margin-top: 6px; }
</style></head>
<body>
  <span class="status ${adr.status}">${adr.status}</span>
  <h1>ADR-${adr.id}: ${escapeHtml(adr.title)}</h1>
  <div class="meta">${meta}</div>
  ${this.chainHtml(adr.id)}
  <button class="open" id="openFile">Open markdown source</button>
  <hr />
  <div class="content">${body}</div>
  <script nonce="${n}">
    const vscode = acquireVsCodeApi()
    document.querySelectorAll('.chip').forEach((el) =>
      el.addEventListener('click', (e) => {
        e.preventDefault()
        vscode.postMessage({ type: 'open', id: el.getAttribute('data-id') })
      }),
    )
    document.getElementById('openFile').addEventListener('click', () =>
      vscode.postMessage({ type: 'openFile' }),
    )
  </script>
</body></html>`
  }

  dispose(): void {
    this.panel?.dispose()
  }
}
