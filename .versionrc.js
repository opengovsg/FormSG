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
  // Keep default Conventional Commits type → section mapping,
  // plus our custom dependency sections.
  types: [
    { type: 'feat', section: 'Features' },
    { type: 'fix', section: 'Bug Fixes' },
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
    groupBy: 'section',
    transform: (commit) => {
      // Dependency-related scopes go to Dev-Dependencies section
      if (commit.scope === 'deps') {
        commit.section = 'Dependencies'
      }
      if (commit.scope === 'dev-deps') {
        commit.section = 'Dev-Dependencies'
      }
      // Build the header text exactly like "fix(deps): update version rc"
      const headerPrefix = commit.scope
        ? `${commit.type}(${commit.scope}): `
        : `${commit.type}: `

      const ref = commit.references && commit.references[0]
      const shortHash = ref
        ? `${ref.prefix}${ref.issue}`
        : typeof hash === 'string'
          ? hash.substring(0, 7)
          : ''

      return {
        ...commit,
        section: commit.section,
        shortHash,
        header: `${headerPrefix}${commit.subject}`,
      }
    },
    // Order sections: Features first, then Bug Fixes, then dependencies, etc.
    commitGroupsSort: (a, b) => {
      const order = [
        'Features',
        'Bug Fixes',
        'Performance',
        'Refactoring',
        'Build System',
        'CI',
        'Tests',
        'Documentation',
        'Styles',
        'Dependencies',
        'Dev-Dependencies',
        'Chores',
        'Reverts',
        'Other',
      ]
      const aIndex = order.indexOf(a.title)
      const bIndex = order.indexOf(b.title)
      return (aIndex === -1 ? order.length : aIndex) - (bIndex === -1 ? order.length : bIndex)
    },
    commitsSort: (a, b) => {
      const aHasScope = Boolean(a.scope);
      const bHasScope = Boolean(b.scope);
      if (aHasScope && !bHasScope) return -1;   // scoped first
      if (!aHasScope && bHasScope) return 1;    // unscoped last
      return (a.header || '').localeCompare(b.header || ''); // both unscoped: sort by header
    }, 
  },
  releaseCommitMessageFormat: 'chore: bump version to {{currentTag}}',
};