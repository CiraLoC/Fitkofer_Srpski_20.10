# Husky Setup & Usage

## Installing hooks

Run from the repository root (one directory above `fitkofer-app/`):

```bash
npm install
```

The install script calls `node fitkofer-app/scripts/installHusky.cjs`, which detects the repo root and installs hooks into `.husky/`.

If the Git repository is mis-detected (e.g. in a shallow clone), install manually:

```bash
npx --yes husky install .husky
```

## Windows-specific notes

Git for Windows respects `core.hooksPath`. Husky sets it to `.husky/_`, relative to the repo root. If you previously overrode it globally, reset before installing:

```powershell
git config --global core.hooksPath ""
```

After running the install script, `core.hooksPath` should read `.husky/_`. The bundled pre-commit hook `cd`s into `fitkofer-app/` and runs ESLint + Prettier through `lint-staged`.

If hooks are not firing, verify the path:

```powershell
git config --get core.hooksPath
```

It should print `.husky/_`. If it shows a custom path, reset it as above or re-run the manual install command.

## Verifying locally

From the repo root:

```bash
git add fitkofer-app/package.json
git commit -m "test hooks"
```

You should see `husky > pre-commit` followed by ESLint/Prettier output. Abort the commit afterwards with `git reset --soft HEAD~1`.
