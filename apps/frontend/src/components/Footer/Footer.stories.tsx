import { Meta, StoryFn } from '@storybook/react-vite'

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

export const Mobile = Template.bind({})
Mobile.globals = { viewport: { value: 'mobile1', isRotated: false } }

export const Tablet = Template.bind({})
Tablet.globals = { viewport: { value: 'tablet', isRotated: false } }
