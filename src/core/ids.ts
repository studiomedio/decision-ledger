/** Normalize an id value to a zero-padded string (e.g. 42 → "0042"). */
export function normalizeId(value: unknown): string {
  const raw = String(value ?? '').trim()
  if (raw === '') return ''
  return /^\d+$/.test(raw) ? raw.padStart(4, '0') : raw
}

/** Extract a leading numeric id from a filename, e.g. "0042-title.md" → "0042". */
export function idFromFilename(filename: string): string {
  const match = filename.match(/^(\d+)/)
  return match ? match[1].padStart(4, '0') : ''
}

/** Kebab-case a title for use in a filename. */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

/** Compute the next id given the existing ones, zero-padded to 4 digits. */
export function nextId(existing: string[]): string {
  let max = 0
  for (const id of existing) {
    const n = Number.parseInt(id, 10)
    if (Number.isFinite(n) && n > max) max = n
  }
  return String(max + 1).padStart(4, '0')
}
