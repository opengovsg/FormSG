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
  writerOpts: {
    groupBy: 'section',
    transform: (commit) => {
      const shortHash = 
        typeof commit.hash === 'string'
          ? commit.hash.substring(0, 7)
          : ''
      commit.shortHash = shortHash
      commit.references = []

      const typeToSection = {
        feat: 'Features',
        fix: 'Bug Fixes',
        perf: 'Performance',
        refactor: 'Refactoring',
        build: 'Build System',
        ci: 'CI',
        test: 'Tests',
        docs: 'Documentation',
        style: 'Styles',
        chore: 'Chores',
        revert: 'Reverts',
      }

      const matchedSection = typeToSection[commit.type]
      commit.section = matchedSection ? matchedSection : 'Miscellaneous'

      if (!commit.type) {
        return commit
      }
      
      if (commit.scope === 'deps') {
        commit.section = 'Dependencies'
      }
      if (commit.scope === 'deps-dev') {
        commit.section = 'Dev-Dependencies'
      }
      const headerPrefix = commit.scope
        ? `${commit.type}(${commit.scope}): `
        : `${commit.type}: `
      return {
        ...commit,
        section: commit.section,
        shortHash: commit.shortHash,
        header: `${headerPrefix}${commit.subject}`,
      }
    },
    // Do not render "closes #123" / "fixes #123" suffixes
    referenceActions: [],
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
        'Miscellaneous',
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
      return (a.header || '').localeCompare(b.header || ''); // both scoped or unscoped: sort by scope then header
    }, 
  },
  releaseCommitMessageFormat: 'chore: bump version to {{currentTag}}',
};