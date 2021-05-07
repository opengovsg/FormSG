// Config overrides for CRA to allow importing of aliases and the /shared folder.
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
