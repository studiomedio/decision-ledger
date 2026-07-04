# Publishing

The extension is published manually through the Marketplace web UI — no Personal Access Token,
no Azure DevOps, no CI. This avoids the PAT/Entra machinery entirely.

## Release a new version

1. Bump `version` in `package.json` and add a matching entry to `CHANGELOG.md`.
2. Build the package:

   ```bash
   cd decision-ledger
   npm run package          # -> decision-ledger-<version>.vsix
   ```

   (`npm run package` runs `vsce package`, which typechecks-free-builds via `vscode:prepublish`.)
3. Go to the Marketplace management page and upload the `.vsix`:
   <https://marketplace.visualstudio.com/manage/publishers/studiomedio>
   - Sign in with the account that owns the `studiomedio` publisher.
   - For a **new** extension: **New extension → Visual Studio Code**, drop the `.vsix`.
   - For an **update**: open the extension → **…** → **Update**, drop the new `.vsix`.
4. (Optional) Cut a GitHub Release manually and attach the `.vsix`:
   Repo → **Releases → Draft a new release** → tag `vX.Y.Z` → upload the `.vsix`.

The listing goes live at
`https://marketplace.visualstudio.com/items?itemName=studiomedio.decision-ledger` within a minute
or two of upload.

## Pre-flight checklist

- [ ] `npm run typecheck` clean, `npm run build` succeeds.
- [ ] `version` bumped and `CHANGELOG.md` updated.
- [ ] `npx vsce ls` shows a sane file list (bundled `dist/`, `media/`, `templates/`, README,
      CHANGELOG, LICENSE — no `src/` or `node_modules/`).

## Testing the package locally before uploading

```bash
code --install-extension decision-ledger-<version>.vsix --force
# ...try it, then optionally:
code --uninstall-extension studiomedio.decision-ledger
```

## Notes

- The published bundle is just `dist/extension.js` (esbuild) plus `media/`, `templates/`, README,
  CHANGELOG, and LICENSE. `node_modules` and `src` are excluded via `.vscodeignore`.
- Optional wider reach: Open VSX (Cursor / VSCodium) supports the same web upload at
  <https://open-vsx.org> after creating a `studiomedio` namespace.
- If you ever want hands-off releases later, this can be automated with a GitHub Actions workflow
  using Microsoft Entra OIDC (no long-lived token) — ask and it can be added back.
