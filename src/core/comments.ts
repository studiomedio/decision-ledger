interface CommentStyle {
  line?: string
  block?: [string, string]
}

const HASH = ['python', 'ruby', 'shellscript', 'yaml', 'toml', 'dockerfile', 'makefile', 'perl', 'r', 'coffeescript', 'properties', 'ini', 'elixir']
const DASH = ['sql', 'lua', 'haskell', 'elm', 'ada']
const XML = ['html', 'xml', 'vue', 'markdown', 'svelte', 'handlebars', 'razor']

const STYLES: Record<string, CommentStyle> = {}
for (const id of HASH) STYLES[id] = { line: '#' }
for (const id of DASH) STYLES[id] = { line: '--' }
for (const id of XML) STYLES[id] = { block: ['<!--', '-->'] }
STYLES['css'] = { block: ['/*', '*/'] }

/** Comment style for a languageId, defaulting to C-style line comments. */
export function commentStyle(languageId: string): CommentStyle {
  return STYLES[languageId] ?? { line: '//' }
}

/** Wrap anchor text in the appropriate comment syntax for the language. */
export function wrapComment(languageId: string, text: string): string {
  const style = commentStyle(languageId)
  if (style.line) return `${style.line} ${text}`
  const [open, close] = style.block!
  return `${open} ${text} ${close}`
}
