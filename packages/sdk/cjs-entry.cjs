// CJS backward-compatibility shim.
// TypeScript compiles `export default function` to `exports.default = fn`,
// but CJS consumers expect `require('@opengovsg/formsg-sdk')` to return
// the function directly (matching the old v0.15.0 behavior).
const _mod = require('./dist/cjs/index.js')
module.exports = _mod.default
// Re-export named exports so CJS consumers can access them
Object.keys(_mod).forEach((key) => {
  if (key !== 'default') {
    module.exports[key] = _mod[key]
  }
})
