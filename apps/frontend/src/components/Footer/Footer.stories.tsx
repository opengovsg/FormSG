import { Meta, StoryFn } from '@storybook/react-vite'

import { viewportModes } from '~utils/storybook'

import { FooterProps } from './common/types'
import { Footer } from './Footer'

const DEFAULT_ARGS: FooterProps = {
  appName: 'Form',
  appLink: 'https://form.gov.sg',
  footerLinks: [
    {
      label: 'User guide',
      href: '',
    },
    {
      label: 'Privacy',
      href: '',
    },
    {
      label: 'Terms of use',
      href: '',
    },
    {
      label: 'Report vulnerability',
      href: '',
    },
  ],
}

export default {
  title: 'Components/Footer',
  component: Footer,
  decorators: [],
  parameters: {
    layout: 'fullscreen',
    // Pages fill the viewport; fit-to-content would crop them.
    argos: { fitToContent: false },
  },
  args: DEFAULT_ARGS,
} as Meta<FooterProps>

const Template: StoryFn<FooterProps> = (args) => <Footer {...args} />
export const Default = Template.bind({})
Default.parameters = { argos: { modes: viewportModes('tablet', 'mobile') } }

export const CompactVariant = Template.bind({})
CompactVariant.args = {
  ...DEFAULT_ARGS,
  variant: 'compact',
}

export const WithTagline = Template.bind({})
WithTagline.args = {
  ...DEFAULT_ARGS,
  tagline: 'Build secure government forms in minutes',
}
