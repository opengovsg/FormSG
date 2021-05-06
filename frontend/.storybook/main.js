const path = require('path')

const toPath = (_path) => path.join(process.cwd(), _path)

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
    'storybook-addon-performance/register',
    'storybook-addon-pseudo-states',
    '@storybook/preset-create-react-app',
  ],
  typescript: {
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
    },
  },
  // webpackFinal setup retrieved from ChakraUI's own Storybook setup
  // https://github.com/chakra-ui/chakra-ui/blob/main/.storybook/main.js
  webpackFinal: async (storybookConfig) => {
    return {
      ...storybookConfig,
      resolve: {
        ...storybookConfig.resolve,
        // Required so storybook knows where the npm package is to render ChakraUI components
        // as this is not directly installed in package.json.
        alias: {
          ...storybookConfig.resolve.alias,
          '@emotion/core': toPath('node_modules/@emotion/react'),
          'emotion-theming': toPath('node_modules/@emotion/react'),
        },
      },
    }
  },
}
