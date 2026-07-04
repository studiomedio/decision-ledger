# Publishing

The extension is published as **`studiomedio.decision-ledger`** to the VS Code Marketplace and,
optionally, to Open VSX (for Cursor / VSCodium / Gitpod).

Everything here runs from the repo root. `@vscode/vsce` and `ovsx` are already devDependencies —
use `npx` or the npm scripts below.

## 0. Pre-flight checklist

- [ ] `npm run typecheck` is clean and `npm run build` succeeds.
- [ ] `version` in `package.json` is bumped (see step 3 — or let `vsce` bump it).
- [ ] `CHANGELOG.md` has an entry for the new version.
- [ ] `npx vsce package` produces a sane `.vsix` (`npx vsce ls` lists the files that will ship).

## 1. VS Code Marketplace

You already publish under the `studiomedio` publisher (e.g. `studiomedio.tab-zone`), so the
publisher exists — you only need a valid Personal Access Token (PAT).

**Get a PAT** (they expire, so you may need a fresh one):

1. Sign in to <https://dev.azure.com> with the account that owns the `studiomedio` publisher.
2. User settings → **Personal Access Tokens** → **New Token**.
3. Organization: **All accessible organizations**. Scopes: **Marketplace → Manage**.
4. Copy the token.

**Authenticate & publish:**

```bash
npx vsce login studiomedio        # paste the PAT once (cached)
npm run publish                   # = vsce publish, uses the current version
```

Or publish and bump the version in one step:

```bash
npx vsce publish patch            # 1.0.0 -> 1.0.1 (also: minor | major)
```

CI-friendly alternative (no interactive login):

```bash
VSCE_PAT=xxxxxxxx npx vsce publish
```

The listing appears at
`https://marketplace.visualstudio.com/items?itemName=studiomedio.decision-ledger` within a minute
or two.

## 2. Open VSX (optional but recommended for an OSS dev tool)

1. Sign in at <https://open-vsx.org> with GitHub and create an **access token** (user settings).
2. Create the namespace once (first time only):

   ```bash
   npx ovsx create-namespace studiomedio -p <OPEN_VSX_TOKEN>
   ```

3. Publish:

   ```bash
   npm run publish:ovsx -- -p <OPEN_VSX_TOKEN>
   # or against a prebuilt vsix:
   npx ovsx publish decision-ledger-1.0.0.vsix -p <OPEN_VSX_TOKEN>
   ```

## 3. Releasing a new version

1. Make changes; update `CHANGELOG.md`.
2. `npx vsce publish patch` (bumps `package.json`, tags nothing — commit the bump yourself).
3. `npm run publish:ovsx -- -p <token>`.
4. `git commit -am "chore: release vX.Y.Z" && git tag vX.Y.Z && git push --tags`.

## 4. Automating with GitHub Actions

[`.github/workflows/release.yml`](.github/workflows/release.yml) publishes to both registries and
creates a GitHub Release whenever you push a `v*` tag.

**One-time setup** — add two repo secrets (Settings → Secrets and variables → Actions):

| Secret | Value |
|--------|-------|
| `VSCE_PAT` | Azure DevOps PAT (Marketplace → Manage) |
| `OVSX_TOKEN` | Open VSX access token (optional; that step is best-effort) |

**Cut a release:**

```bash
# bump version in package.json + add a CHANGELOG entry first, then:
git commit -am "chore: release v1.0.0"
git tag v1.0.0
git push --follow-tags
```

The workflow verifies the tag matches `package.json`, packages once, publishes the same `.vsix` to
the Marketplace and Open VSX, and attaches it to a generated GitHub Release. A tag/version mismatch
fails the run before anything is published.

## Notes

- The published bundle is just `dist/extension.js` (esbuild) plus `media/`, `templates/`, README,
  CHANGELOG, and LICENSE. `node_modules` and `src` are excluded via `.vscodeignore`, so `keytar`
  (pulled in by `vsce` for credential storage) never ships.
- Bump `engines.vscode` only if you start using newer API; a lower floor = more installs.
