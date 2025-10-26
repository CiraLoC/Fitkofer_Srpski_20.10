const path = require('path');
const { execSync } = require('child_process');
const huskyModule = require('husky');
const huskyInstall =
  typeof huskyModule?.install === 'function'
    ? huskyModule.install.bind(huskyModule)
    : typeof huskyModule?.default === 'function'
    ? huskyModule.default
    : typeof huskyModule === 'function'
    ? huskyModule
    : null;

function getGitRoot() {
  try {
    return execSync('git rev-parse --show-toplevel', {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
  } catch (error) {
    console.warn('[husky] Skipping install (git repository not found).');
    return null;
  }
}

const gitRoot = getGitRoot();

if (!gitRoot) {
  process.exit(0);
}

const hooksDir = path.join(gitRoot, '.husky');
if (huskyInstall) {
  huskyInstall(hooksDir);
  console.log(`[husky] Hooks installed at ${hooksDir}`);
} else {
  console.warn('[husky] Unable to run install hook. Please run "npx husky install .husky" from the repo root.');
}
