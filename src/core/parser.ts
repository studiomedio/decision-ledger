import matter from 'gray-matter'
import type { Uri } from 'vscode'
import type { Adr, AdrStatus } from '../types/adr'
import { ADR_STATUSES } from '../types/adr'
import { idFromFilename, normalizeId } from './ids'

/** Coerce a frontmatter value that may be a scalar or list into a string[]. */
function toStringArray(value: unknown): string[] {
  if (value === undefined || value === null) return []
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean)
  return String(value)
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
}

function toStatus(value: unknown): AdrStatus {
  const s = String(value ?? '').trim().toLowerCase()
  return (ADR_STATUSES as string[]).includes(s) ? (s as AdrStatus) : 'proposed'
}

/** First meaningful paragraph of the body, stripped of markdown headings. */
function firstParagraph(body: string): string {
  const lines = body.split(/\r?\n/)
  const collected: string[] = []
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed === '' || trimmed.startsWith('#')) {
      if (collected.length) break
      continue
    }
    collected.push(trimmed)
  }
  return collected.join(' ').replace(/\s+/g, ' ').slice(0, 240)
}

/**
 * Parse a markdown file into an Adr. Returns null only when the content cannot
 * be parsed at all; missing fields fall back to sensible defaults.
 */
export function parseAdr(raw: string, uri: Uri, relativePath: string): Adr | null {
  let parsed: matter.GrayMatterFile<string>
  try {
    parsed = matter(raw)
  } catch {
    return null
  }

  const data = parsed.data ?? {}
  const filename = relativePath.split('/').pop() ?? relativePath

  const id = normalizeId(data.id) || idFromFilename(filename)
  if (!id) return null

  const title =
    (typeof data.title === 'string' && data.title.trim()) ||
    filename.replace(/\.md$/i, '').replace(/^\d+[-_]?/, '').replace(/[-_]/g, ' ').trim() ||
    `ADR ${id}`

  return {
    id,
    title,
    status: toStatus(data.status),
    date: data.date !== undefined ? String(data.date) : undefined,
    deciders: toStringArray(data.deciders).map((d) => d.replace(/^@/, '')),
    supersedes: toStringArray(data.supersedes).map(normalizeId),
    tags: toStringArray(data.tags),
    appliesTo: toStringArray(data['applies-to'] ?? data.appliesTo),
    uri,
    relativePath,
    summary: firstParagraph(parsed.content),
    body: parsed.content.trim(),
  }
}
