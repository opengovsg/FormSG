/* eslint-env node */
module.exports = {
  features: {
    storyStoreV7: true,
    emotionAlias: false,
  },
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
    // Note that @storybook/addon-interactions must be listed after @storybook/addon-actions or @storybook/addon-essentials.
    '@storybook/addon-interactions',
  ],
}
