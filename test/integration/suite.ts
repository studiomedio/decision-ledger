import { strict as assert } from 'node:assert'
import * as vscode from 'vscode'

// Runs inside a real VS Code instance (see run.js). Minimal runner — no mocha needed.
const cases: [string, () => Promise<void>][] = []
const test = (name: string, fn: () => Promise<void>) => cases.push([name, fn])

const file = (path: string) => vscode.Uri.joinPath(vscode.workspace.workspaceFolders![0].uri, path)
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function until<T>(
  read: () => T | Thenable<T>,
  ok: (value: T) => boolean,
  timeout = 5000,
): Promise<T> {
  const started = Date.now()
  let value = await read()
  while (!ok(value) && Date.now() - started < timeout) {
    await pause(100)
    value = await read()
  }
  return value
}

test('extension activates', async () => {
  const extension = vscode.extensions.getExtension('studiomedio.decision-ledger')
  assert.ok(extension, 'extension is installed')
  await extension.activate()
})

test('CodeLenses: one from applies-to, one per anchor', async () => {
  await vscode.window.showTextDocument(file('src/db.ts'))
  const lenses = await until(
    () =>
      vscode.commands.executeCommand<vscode.CodeLens[]>(
        'vscode.executeCodeLensProvider',
        file('src/db.ts'),
      ),
    (l) => (l?.length ?? 0) >= 3,
  )
  const titles = lenses.map((l) => l.command?.title ?? '')
  assert.equal(titles.filter((t) => t.includes('ADR-0001')).length, 2, titles.join(' | '))
  assert.ok(
    titles.some((t) => t.includes('ADR-0099') && t.includes('not found')),
    titles.join(' | '),
  )
})

test('a dangling anchor is reported in the Problems panel', async () => {
  const diagnostics = await until(
    () => vscode.languages.getDiagnostics(file('src/db.ts')),
    (d) => d.length > 0,
  )
  assert.deepEqual(
    diagnostics.map((d) => d.code),
    ['dangling-anchor'],
  )
  assert.equal(diagnostics[0].range.start.line, 3)
})

test('hover on an anchor links to the record', async () => {
  const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
    'vscode.executeHoverProvider',
    file('src/db.ts'),
    new vscode.Position(1, 5),
  )
  const text = hovers
    .flatMap((h) => h.contents)
    .map((c) => (typeof c === 'string' ? c : c.value))
    .join('\n')
  assert.ok(text.includes('ADR-0001'), text)
  assert.ok(text.includes('command:decisionLedger.openRecord'), text)
})

test('Link Selection leaves JSON files untouched', async () => {
  const editor = await vscode.window.showTextDocument(file('data.json'))
  const before = editor.document.getText()
  await vscode.commands.executeCommand('decisionLedger.linkSelection')
  assert.equal(editor.document.getText(), before)
})

export async function run(): Promise<void> {
  const failures: string[] = []
  for (const [name, fn] of cases) {
    try {
      await fn()
      console.log(`  ✔ ${name}`)
    } catch (error) {
      console.log(
        `  ✘ ${name}\n${String((error as Error).stack ?? error).replace(/^/gm, '      ')}`,
      )
      failures.push(name)
    }
  }
  console.log(`\n${cases.length - failures.length} passed, ${failures.length} failed`)
  if (failures.length > 0) throw new Error(`${failures.length} integration test(s) failed`)
}
