// CJS backward-compatibility shim.
// TypeScript compiles `export default function` to `exports.default = fn`,
// but CJS consumers expect `require('@opengovsg/formsg-sdk')` to return
// the function directly (matching the old v0.15.0 behavior).
// Object.assign preserves named exports (adaptV3ToV4, etc.) on the
// callable default so both `formsg(config)` and `formsg.adaptV3ToV4` work.
const mod = require('./dist/cjs/index.js')
module.exports = Object.assign(mod.default, mod)
