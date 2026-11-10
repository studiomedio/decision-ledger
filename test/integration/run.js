// Downloads an isolated VS Code into .vscode-test/ and runs the integration suite in it,
// with a throwaway workspace holding one decision record and code that references it.
const fs = require('fs')
const os = require('os')
const path = require('path')
const { runTests } = require('@vscode/test-electron')

async function main() {
  // Set when launched from VS Code's own terminal/extension host; it would start the test instance as plain Node.
  delete process.env.ELECTRON_RUN_AS_NODE
  const root = path.resolve(__dirname, '../..')
  const workspace = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'decision-ledger-it-')))
  const write = (file, content) => {
    fs.mkdirSync(path.dirname(path.join(workspace, file)), { recursive: true })
    fs.writeFileSync(path.join(workspace, file), content)
  }
  write(
    'docs/adr/0001-use-postgres.md',
    '---\nid: 1\ntitle: Use Postgres\nstatus: accepted\napplies-to:\n  - "src/**"\n---\n\nWe use Postgres.\n',
  )
  write('src/db.ts', 'export const db = 1\n// dl:adr 0001\nexport const a = 2\n// dl:adr 0099\n')
  write('data.json', '{\n  "a": 1\n}\n')

  try {
    await runTests({
      extensionDevelopmentPath: root,
      extensionTestsPath: path.join(root, 'out-test/integration/suite.js'),
      launchArgs: [workspace, '--disable-extensions', '--skip-welcome', '--skip-release-notes'],
    })
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true })
  }
}

main().catch(() => process.exit(1))
