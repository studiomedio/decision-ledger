import * as vscode from 'vscode'
import { minimatch } from 'minimatch'
import type { Adr, AdrChain } from '../types/adr'
import { parseAdr } from './parser'

const decoder = new TextDecoder('utf-8')

function config() {
  const cfg = vscode.workspace.getConfiguration('decisionLedger')
  return {
    folder: cfg.get<string>('folder', 'docs/adr').replace(/^\/+|\/+$/g, ''),
    fileGlob: cfg.get<string>('fileGlob', '**/*.md'),
  }
}

function toPosix(p: string): string {
  return p.replace(/\\/g, '/')
}

/**
 * In-memory index of all ADRs in the workspace. Source of truth stays on disk;
 * this is rebuilt from markdown and kept warm with a file watcher.
 */
export class AdrIndex implements vscode.Disposable {
  private readonly records = new Map<string, Adr>()
  private watchers: vscode.FileSystemWatcher[] = []

  private readonly _onDidChange = new vscode.EventEmitter<void>()
  /** Fires whenever the set of records changes. */
  readonly onDidChange = this._onDidChange.event

  /** Full scan of every workspace folder. */
  async refresh(): Promise<void> {
    this.records.clear()
    const { folder, fileGlob } = config()
    const folders = vscode.workspace.workspaceFolders ?? []
    for (const wf of folders) {
      const pattern = new vscode.RelativePattern(wf, `${folder}/${fileGlob}`)
      const uris = await vscode.workspace.findFiles(pattern)
      await Promise.all(uris.map((uri) => this.load(uri)))
    }
    this._onDidChange.fire()
  }

  private async load(uri: vscode.Uri): Promise<void> {
    try {
      const bytes = await vscode.workspace.fs.readFile(uri)
      const rel = toPosix(vscode.workspace.asRelativePath(uri, false))
      const adr = parseAdr(decoder.decode(bytes), uri, rel)
      if (adr) this.records.set(adr.id, adr)
    } catch {
      // Unreadable file — skip; a later change event can pick it up.
    }
  }

  private removeByUri(uri: vscode.Uri): void {
    const target = uri.toString()
    for (const [id, adr] of this.records) {
      if (adr.uri.toString() === target) {
        this.records.delete(id)
        break
      }
    }
  }

  /** Watch the ADR folder in every workspace folder for incremental updates. */
  startWatching(): void {
    this.disposeWatchers()
    const { folder, fileGlob } = config()
    const folders = vscode.workspace.workspaceFolders ?? []
    for (const wf of folders) {
      const pattern = new vscode.RelativePattern(wf, `${folder}/${fileGlob}`)
      const watcher = vscode.workspace.createFileSystemWatcher(pattern)
      const onChange = async (uri: vscode.Uri) => {
        this.removeByUri(uri)
        await this.load(uri)
        this._onDidChange.fire()
      }
      watcher.onDidCreate(onChange)
      watcher.onDidChange(onChange)
      watcher.onDidDelete((uri) => {
        this.removeByUri(uri)
        this._onDidChange.fire()
      })
      this.watchers.push(watcher)
    }
  }

  /** All records, newest id first. */
  all(): Adr[] {
    return [...this.records.values()].sort((a, b) => b.id.localeCompare(a.id))
  }

  get(id: string): Adr | undefined {
    return this.records.get(id)
  }

  /** IDs currently in the index — used to compute the next id. */
  ids(): string[] {
    return [...this.records.keys()]
  }

  /** Records whose `applies-to` globs match the given document. */
  matchDocument(uri: vscode.Uri): Adr[] {
    const rel = toPosix(vscode.workspace.asRelativePath(uri, false))
    return this.all().filter((adr) =>
      adr.appliesTo.some((glob) => minimatch(rel, glob, { dot: true })),
    )
  }

  /** Supersession relationships for a record, resolved to known records. */
  chain(id: string): AdrChain {
    const adr = this.records.get(id)
    return {
      supersedes: (adr?.supersedes ?? [])
        .map((sid) => this.records.get(sid))
        .filter((a): a is Adr => a !== undefined),
      supersededBy: this.all().filter((a) => a.supersedes.includes(id)),
    }
  }

  /** Rank records against a free-text query across id, title, tags, and body. */
  search(query: string): Adr[] {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
    if (terms.length === 0) return this.all()
    const scored: { adr: Adr; score: number }[] = []
    for (const adr of this.records.values()) {
      const hay = {
        title: adr.title.toLowerCase(),
        rest: `${adr.id} ${adr.tags.join(' ')} ${adr.deciders.join(' ')} ${adr.body}`.toLowerCase(),
      }
      let score = 0
      let matchedAll = true
      for (const term of terms) {
        if (hay.title.includes(term)) score += 3
        else if (hay.rest.includes(term)) score += 1
        else matchedAll = false
      }
      if (matchedAll) scored.push({ adr, score })
    }
    return scored.sort((a, b) => b.score - a.score || b.adr.id.localeCompare(a.adr.id)).map((s) => s.adr)
  }

  private disposeWatchers(): void {
    for (const w of this.watchers) w.dispose()
    this.watchers = []
  }

  dispose(): void {
    this.disposeWatchers()
    this._onDidChange.dispose()
  }
}
