import { Meta, Story } from '@storybook/react'

import { Banner, BannerProps } from './Banner'

export default {
  title: 'Components/Banner',
  component: Banner,
  decorators: [],
} as Meta

const Template: Story<BannerProps> = (args) => <Banner {...args} />
export const Default = Template.bind({})
Default.args = {
  children: 'You can insert a normal string here.',
  useMarkdown: false,
}

export const WithMarkdown = Template.bind({})
WithMarkdown.args = {
  children: `**Markdown** is also accepted.`,
  useMarkdown: true,
}

export const Info = Template.bind({})
Info.args = {
  variant: 'info',
  children: `Look at this [website](http://localhost:6006) or [Form](https://www.form.gov.sg).`,
  useMarkdown: true,
}

export const Warn = Template.bind({})
Warn.args = {
  variant: 'warn',
  children: `Look at this [website](http://localhost:6006) or [Form](https://www.form.gov.sg).`,
  useMarkdown: true,
}

export const Error = Template.bind({})
Error.args = {
  variant: 'error',
  children: `Look at this [website](http://localhost:6006) or [Form](https://www.form.gov.sg).`,
  useMarkdown: true,
}
