/* eslint-env node */
const { propNames } = require('@chakra-ui/styled-system')
const path = require('path')

const toPath = (_path) => path.join(process.cwd(), _path)
const excludedPropNames = propNames.concat(['as', 'apply', 'sx', '__css'])

module.exports = {
  stories: [
    // Introduction stories set first so stories are ordered correctly.
    './introduction/Welcome/Welcome.stories.tsx',
    './introduction/Principles/Principles.stories.tsx',
    './foundations/**/*.stories.@(mdx|js|jsx|ts|tsx)',
    '../src/**/*.stories.mdx',
    '../src/**/*.stories.@(js|jsx|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    'storybook-preset-craco',
  ],
  typescript: {
    check: false,
    checkOptions: {},
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      shouldRemoveUndefinedFromOptional: true,
      allowSyntheticDefaultImports: true,
      esModuleInterop: true,
      propFilter: (prop) => {
        if (!prop.parent) {
          return !prop.declarations.some((d) =>
            d.fileName.includes('node_modules'),
          )
        }

        const isStyledSystemProp = excludedPropNames.includes(prop.name)
        const isHTMLElementProp = prop.parent.fileName.includes('node_modules')
        return !(isStyledSystemProp || isHTMLElementProp)
      },
    },
  },
  // webpackFinal setup retrieved from ChakraUI's own Storybook setup
  // https://github.com/chakra-ui/chakra-ui/blob/main/.storybook/main.js
  webpackFinal: async (storybookConfig) => {
    // Required to sync aliases between storybook and overriden configs
    return {
      ...storybookConfig,
      resolve: {
        ...storybookConfig.resolve,
        alias: {
          ...storybookConfig.resolve.alias,
          // Required so storybook knows where the npm package is to render ChakraUI components
          // as this is not directly installed in package.json.
          '@emotion/core': toPath('node_modules/@emotion/react'),
          'emotion-theming': toPath('node_modules/@emotion/react'),
        },
      },
    }
  },
}
