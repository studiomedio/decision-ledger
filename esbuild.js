const esbuild = require('esbuild')
const fs = require('fs')
const path = require('path')

const production = process.argv.includes('--production')
const watch = process.argv.includes('--watch')
const test = process.argv.includes('--test')
const integration = process.argv.includes('--integration')

// Prints the lines the `npm: watch` task's problem matcher (.vscode/tasks.json) waits for, so F5
// knows when the build is ready and errors land in the Problems panel.
const watchReporter = {
  name: 'watch-reporter',
  setup(build) {
    build.onStart(() => console.log('[watch] build started'))
    build.onEnd((result) => {
      for (const { text, location } of result.errors) {
        console.error(`✘ [ERROR] ${text}`)
        if (location) console.error(`    ${location.file}:${location.line}:${location.column + 1}:`) // esbuild columns are 0-based
      }
      console.log('[watch] build finished')
    })
  },
}

// Desktop and remote.
const extension = {
  entryPoints: ['src/extension.ts'],
  bundle: true,
  format: 'cjs',
  platform: 'node',
  target: 'node18',
  external: ['vscode'],
  outfile: 'dist/extension.js',
  sourcemap: !production,
  minify: production,
  logLevel: 'info',
  ...(watch ? { logLevel: 'silent', plugins: [watchReporter] } : {}),
}

// Unit tests cover the modules without a `vscode` dependency and run on `node --test`.
function testTarget() {
  const entryPoints = fs
    .readdirSync('test')
    .filter((f) => f.endsWith('.test.ts'))
    .map((f) => path.join('test', f))
  return {
    entryPoints,
    bundle: true,
    format: 'cjs',
    platform: 'node',
    target: 'node18',
    outdir: 'out-test',
    sourcemap: true,
    logLevel: 'warning',
  }
}

async function main() {
  if (test) {
    fs.rmSync('out-test', { recursive: true, force: true })
    await esbuild.build(testTarget())
    return
  }
  if (integration) {
    await esbuild.build({
      entryPoints: ['test/integration/suite.ts'],
      bundle: true,
      format: 'cjs',
      platform: 'node',
      target: 'node18',
      external: ['vscode'],
      outfile: 'out-test/integration/suite.js',
      logLevel: 'warning',
    })
    return
  }

  const ctx = await esbuild.context(extension)
  if (watch) {
    await ctx.watch()
  } else {
    await ctx.rebuild()
    await ctx.dispose()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
