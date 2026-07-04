import type { Uri } from 'vscode'

export type AdrStatus = 'proposed' | 'accepted' | 'superseded' | 'deprecated'

export const ADR_STATUSES: AdrStatus[] = ['proposed', 'accepted', 'superseded', 'deprecated']

/** A parsed Architectural Decision Record. */
export interface Adr {
  /** Zero-padded identifier, e.g. "0042". */
  id: string
  title: string
  status: AdrStatus
  /** ISO date string from frontmatter, if present. */
  date?: string
  deciders: string[]
  /** IDs of records this one supersedes. */
  supersedes: string[]
  tags: string[]
  /** Workspace-relative glob patterns this record governs. */
  appliesTo: string[]
  /** Location of the markdown file. */
  uri: Uri
  /** Workspace-relative path of the file, POSIX separators. */
  relativePath: string
  /** First non-empty paragraph of the body, for previews. */
  summary: string
}
