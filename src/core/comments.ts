/** Comment tokens a language supports, used to detect and write anchors. */
export interface CommentMarkers {
  lines: string[]
  blocks: [string, string][]
}

const C_LIKE: CommentMarkers = { lines: ['//'], blocks: [['/*', '*/']] }
const HASH: CommentMarkers = { lines: ['#'], blocks: [] }
const DASH: CommentMarkers = { lines: ['--'], blocks: [] }
const XML: CommentMarkers = { lines: [], blocks: [['<!--', '-->']] }
const CSS: CommentMarkers = { lines: [], blocks: [['/*', '*/']] }
const NONE: CommentMarkers = { lines: [], blocks: [] }

const BY_LANGUAGE: Record<string, CommentMarkers> = {}
const assign = (ids: string[], markers: CommentMarkers) => {
  for (const id of ids) BY_LANGUAGE[id] = markers
}

assign(['python', 'ruby', 'shellscript', 'yaml', 'toml', 'dockerfile', 'makefile', 'perl', 'r', 'coffeescript', 'properties', 'ini', 'elixir'], HASH)
assign(['sql', 'lua', 'haskell', 'elm', 'ada'], DASH)
assign(['html', 'xml', 'vue', 'markdown', 'svelte', 'handlebars', 'razor'], XML)
assign(['css', 'scss', 'less'], CSS)
assign(['jsonc', 'json5'], C_LIKE)
// Data / prose formats with no comment syntax — anchors never apply.
assign(['json', 'plaintext', 'csv', 'log'], NONE)

/** Comment markers for a languageId, defaulting to C-style. */
export function commentMarkers(languageId: string): CommentMarkers {
  return BY_LANGUAGE[languageId] ?? C_LIKE
}

/** Wrap anchor text in the appropriate comment syntax for the language. */
export function wrapComment(languageId: string, text: string): string {
  const m = commentMarkers(languageId)
  if (m.lines.length) return `${m.lines[0]} ${text}`
  if (m.blocks.length) {
    const [open, close] = m.blocks[0]
    return `${open} ${text} ${close}`
  }
  return `// ${text}`
}
