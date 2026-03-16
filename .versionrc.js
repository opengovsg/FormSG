const packagePaths = [
  'package.json',
  'apps/frontend/package.json',
  'apps/backend/package.json',
  'packages/shared/package.json',
  'packages/react-email-preview/package.json',
  'services/form-payment-reconciliation/package.json',
  'services/virus-scanner-guardduty/package.json',
  'services/pdf-gen-sparticuz/package.json',
]
module.exports = {
  bumpFiles: packagePaths.map((filename) => ({ filename, type: 'json' })),
  types: [
    { type: 'feat', section: 'Features' },
    { type: 'fix', section: 'Fixes' },
    { type: 'chore', section: 'Chores' },
    { type: 'docs', section: 'Documentation' },
    { type: 'style', section: 'Styles' },
    { type: 'refactor', section: 'Refactoring' },
    { type: 'perf', section: 'Performance' },
    { type: 'test', section: 'Tests' },
    { type: 'build', section: 'Build System' },
    { type: 'ci', section: 'CI' },
    { type: 'revert', section: 'Reverts' },
    { type: 'deps', section: 'Dependencies' },
    { type: 'deps-dev', section: 'Dev-Dependencies' },
  ],
  writerOpts: {
    transform: (commit) => {
      const originalType = commit.type
      // Map special scopes to dedicated types for grouping
      if (commit.scope === 'deps') {
        commit.type = 'deps'
      } else if (commit.scope === 'deps-dev') {
        commit.type = 'deps-dev'
      }

      const headerPrefix = commit.scope
        ? `${originalType}(${commit.scope}): `
        : `${originalType}: `

      const ref = commit.references && commit.references[0]
      const shortHash = ref
        ? `${ref.prefix}${ref.issue}`
        : typeof commit.hash === 'string'
          ? commit.hash.substring(0, 7)
          : ''

      return {
        ...commit,
        shortHash,
        header: `${headerPrefix}${commit.subject}`,
      }
    },
    // Order commits by scope. If no scope present, place it below sorted alphabetically by header.
    commitsSort: (a, b) => {
      const aHasScope = Boolean(a.scope);
      const bHasScope = Boolean(b.scope);
      if (aHasScope && !bHasScope) return -1;   // scoped first
      if (!aHasScope && bHasScope) return 1;    // unscoped last
      return (a.header || '').localeCompare(b.header || ''); // both unscoped: sort by header
    },  
  releaseCommitMessageFormat: 'chore: bump version to {{currentTag}}',
};