/**
 * Config overrides for CRA to allow importing of aliases.
 * This will not work if aliasing folders that is outside of React app's `/src`
 * folder. If aliasing outside of `/src`, then another function aliasDangerous
 * will be needed.
 * See https://www.npmjs.com/package/react-app-rewire-alias#outside-of-root.
 */

const { alias, configPaths, aliasJest } = require('react-app-rewire-alias')

const aliasMap = configPaths('tsconfig.paths.json')

module.exports = function override(config) {
  alias(aliasMap)(config)

  return config
}

module.exports.jest = aliasJest(aliasMap)
