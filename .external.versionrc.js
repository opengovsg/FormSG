const getShortHash = (commit) => {
  const ref = commit.references && commit.references[0]
  return ref && typeof ref.issue === 'string' && ref.issue.length > 0
    ? `${ref.prefix || '#'}${ref.issue}` // e.g. "#9190"
    : typeof commit.hash === 'string'
      ? commit.hash.substring(0, 7)      // fallback to 7-char commit hash
      : ''
}
module.exports = {
  path: ["packages/sdk"],
  bumpFiles: [{ filename: 'packages/sdk/package.json', type: 'json' }],
  infile: 'packages/sdk/CHANGELOG.md',
  preMajor: true,
  tagPrefix: 'sdk-v',
  writerOpts: {
    groupBy: 'section',
    transform: (commit) => {
      commit.shortHash = getShortHash(commit)
      commit.references = [] // To avoid "closes #123" / "fixes #123" suffixes

      const typeToSection = {
        feat: 'Features',
        fix: 'Bug Fixes',
        perf: 'Performance',
        refactor: 'Refactors',
        build: 'Builds',
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
  releaseCommitMessageFormat: 'chore(sdk): bump version to {{currentTag}}',
};
