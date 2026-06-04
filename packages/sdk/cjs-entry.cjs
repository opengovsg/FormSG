// CJS backward-compatibility shim.
// TypeScript compiles `export default function` to `exports.default = fn`,
// but CJS consumers expect `require('@opengovsg/formsg-sdk')` to return
// the function directly (matching the old v0.15.0 behavior).
module.exports = require('./dist/cjs/index.js').default
