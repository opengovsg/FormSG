/* eslint-disable no-undef */
/**
 * Config overrides for CRA to allow importing of aliases.
 * Since we are aliasing `shared` folder, another function `aliasDangerous` is
 * needed.
 * See https://www.npmjs.com/package/react-app-rewire-alias#outside-of-root.
 */
const path = require('path')
const { override } = require('customize-cra')
const {
  aliasDangerous,
  configPaths,
  aliasJest,
} = require('react-app-rewire-alias/lib/aliasDangerous')

const aliasMap = configPaths('tsconfig.paths.json')

/**
 * Utility to allow for referencing folders outside of create-react-app root. \
 * See https://github.com/facebook/create-react-app/issues/9127.
 *
 * Retrieved from https://gist.github.com/stevemu/53c5006c5e66fc277dea1454eb6acdb4.
 */
const overridePath = (webpackConfig) => {
  const oneOfRule = webpackConfig.module.rules.find((rule) => rule.oneOf)
  if (oneOfRule) {
    const tsxRule = oneOfRule.oneOf.find(
      (rule) => rule.test && rule.test.toString().includes('tsx'),
    )

    const newIncludePaths = [path.resolve(__dirname, '../shared')]
    if (tsxRule) {
      if (Array.isArray(tsxRule.include)) {
        tsxRule.include = [...tsxRule.include, ...newIncludePaths]
      } else {
        tsxRule.include = [tsxRule.include, ...newIncludePaths]
      }
    }
  }
  return webpackConfig
}

module.exports = override(aliasDangerous(aliasMap), overridePath)

module.exports.jest = aliasJest(aliasMap)
