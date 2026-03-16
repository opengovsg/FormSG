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