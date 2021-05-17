<<<<<<< HEAD
/* eslint-env node */
const { propNames } = require('@chakra-ui/styled-system')
=======
>>>>>>> 5fbcb881 (feat(react): add base react app directory in root of the application (#1819))
// Required to sync aliases between storybook and overriden configs
const config = require('../config-overrides')
const path = require('path')

const toPath = (_path) => path.join(process.cwd(), _path)
<<<<<<< HEAD
const excludedPropNames = propNames.concat(['as', 'apply', 'sx', '__css'])
=======
>>>>>>> 5fbcb881 (feat(react): add base react app directory in root of the application (#1819))

module.exports = {
  // Welcome story set first so it will show up first.
  stories: [
    './Welcome/Welcome.stories.tsx',
    '../src/**/*.stories.mdx',
    '../src/**/*.stories.@(js|jsx|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    'storybook-addon-pseudo-states',
    '@storybook/preset-create-react-app',
  ],
  typescript: {
<<<<<<< HEAD
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
=======
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      // Allows typed string unions to be generated properly.
      shouldExtractLiteralValuesFromEnum: true,
      compilerOptions: {
        allowSyntheticDefaultImports: false,
        esModuleInterop: false,
      },
      // Prevents extraneous props from showing up in controls.
      // See https://github.com/chakra-ui/chakra-ui/issues/2009#issuecomment-765538309.
      propFilter: (prop) =>
        prop.parent !== undefined &&
        (!prop.parent.fileName.includes('node_modules') ||
          (prop.parent.fileName.includes('node_modules') &&
            prop.parent.fileName.includes('node_modules/@chakra-ui/') &&
            !prop.parent.fileName.includes(
              'node_modules/@chakra-ui/styled-system',
            ))),
>>>>>>> 5fbcb881 (feat(react): add base react app directory in root of the application (#1819))
    },
  },
  // webpackFinal setup retrieved from ChakraUI's own Storybook setup
  // https://github.com/chakra-ui/chakra-ui/blob/main/.storybook/main.js
  webpackFinal: async (storybookConfig) => {
    // Required to sync aliases between storybook and overriden configs
    const customConfig = config(storybookConfig)
    return {
      ...storybookConfig,
      resolve: {
        ...storybookConfig.resolve,
        alias: {
          ...customConfig.resolve.alias,
          // Required so storybook knows where the npm package is to render ChakraUI components
          // as this is not directly installed in package.json.
          '@emotion/core': toPath('node_modules/@emotion/react'),
          'emotion-theming': toPath('node_modules/@emotion/react'),
        },
      },
    }
  },
}
