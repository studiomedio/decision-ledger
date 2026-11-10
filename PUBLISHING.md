# Publishing

Releases are published from GitHub Actions ([.github/workflows/publish.yml](.github/workflows/publish.yml))
with Marketplace **Trusted Publishing** (OIDC). There is no Personal Access Token and no repository
secret: the Marketplace accepts the workflow's short-lived GitHub token because it matches the
publisher's policy.

## One-time setup

At <https://marketplace.visualstudio.com/manage/publishers/studiomedio> → **Trusted Publishing**, the
policy must say:

| Field | Value |
|---|---|
| Repository owner | `studiomedio` |
| Repository | `decision-ledger` |
| Workflow | `publish.yml` |
| Environment | empty (the workflow uses no GitHub environment) |

If you add an environment to the policy, add the same `environment:` to the `publish` job.

## Notes

- Optional wider reach: Open VSX (Cursor / VSCodium) at <https://open-vsx.org> after creating a
  `studiomedio` namespace. `ovsx publish --trusted-publishing` supports the same OIDC approach.

## Release a new version

1. Bump `version` in `package.json` and add a matching entry to `CHANGELOG.md`.
2. Run the checks locally (CI runs only typecheck and unit tests):

   ```bash
   npm run typecheck && npm test && npm run test:integration
   ```

3. Commit, then tag and push:

   ```bash
   git tag vX.Y.Z
   git push origin master vX.Y.Z
   ```

   The tag must match `package.json` (`v` + version), otherwise the workflow stops before publishing.
   To publish without a new tag, use **Actions → Publish → Run workflow** on `master`.

4. (Optional) Draft a GitHub Release for the tag and attach the `.vsix` from the workflow run's
   artifacts.

The listing goes live at `https://marketplace.visualstudio.com/items?itemName=studiomedio.decision-ledger`
after the Marketplace's review (a few minutes). Publishing a version that already exists on the
Marketplace fails; bump the version.

## Pre-flight checklist

- [ ] `npm run typecheck`, `npm test` and `npm run test:integration` pass.
- [ ] `version` bumped and `CHANGELOG.md` updated.
- [ ] `npx vsce ls` lists only the bundled `dist/`, `media/`, `templates/`, README, CHANGELOG, LICENSE and `package.json` (no `src/` or `node_modules/`).

## Manual fallback

`npm run package` builds `decision-ledger-<version>.vsix`, which can be uploaded on the publisher page:
open the extension → **…** → **Update** (or **New extension → Visual Studio Code** for a new one).

## Testing the package locally

```bash
code --install-extension decision-ledger-<version>.vsix --force
```
