import { Meta, Story } from '@storybook/react'

import { DateString } from '~shared/types/generic'

import { getMobileViewParameters, StoryRouter } from '~utils/storybook'

import { AdminFormNavbar, AdminFormNavbarProps } from './AdminFormNavbar'

const MOCK_FORM: AdminFormNavbarProps['formInfo'] = {
  title: 'Storybook Test Form',
  lastModified: '2020-01-01T00:00:00.000Z' as DateString,
} as const

export default {
  title: 'Features/AdminForm/AdminFormNavbar',
  component: AdminFormNavbar,
  decorators: [StoryRouter({ path: 'test', initialEntries: ['/test'] })],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    formInfo: MOCK_FORM,
    previewFormLink: '/test',
  },
} as Meta<AdminFormNavbarProps>

const Template: Story<AdminFormNavbarProps> = (args) => (
  <AdminFormNavbar {...args} />
)
export const DefaultEditor = Template.bind({})

export const DefaultViewOnly = Template.bind({})
DefaultViewOnly.args = {
  formInfo: MOCK_FORM,
  viewOnly: true,
  previewFormLink: '/test',
}

export const Skeleton = Template.bind({})
Skeleton.args = {
  formInfo: undefined,
  previewFormLink: '/test',
}

export const Mobile = Template.bind({})
Mobile.args = {
  formInfo: {
    ...MOCK_FORM,
    title:
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  },
  previewFormLink: '/test',
}
Mobile.parameters = getMobileViewParameters()
