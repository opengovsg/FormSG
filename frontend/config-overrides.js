/* eslint-disable no-undef */
/**
 * Config overrides for CRA to allow importing of aliases.
 * Since we are aliasing `shared` folder, another function `aliasDangerous` is
 * needed.
 * See https://www.npmjs.com/package/react-app-rewire-alias#outside-of-root.
 */

const {
  aliasDangerous,
  configPaths,
  aliasJest,
} = require('react-app-rewire-alias/lib/aliasDangerous')

const aliasMap = configPaths('tsconfig.paths.json')

module.exports = function override(config) {
  aliasDangerous(aliasMap)(config)

  return config
}

module.exports.jest = aliasJest(aliasMap)
