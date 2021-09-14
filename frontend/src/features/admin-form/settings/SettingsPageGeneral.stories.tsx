// Note that this story still rendering the SettingsPage components, only making
// distinct stories about the General tab.
import { MemoryRouter, Route } from 'react-router-dom'
import { Meta, Story } from '@storybook/react'

import { FormStatus } from '~shared/types/form/form'

import {
  BASE_MOCK_FORM_SETTINGS,
  getExpectedSettings,
  testSettingsHandlers,
} from '~/mocks/msw/handlers/settings'

import { SettingsPage, SettingsPageProps } from './SettingsPage'

const MOCK_FORM_ID = 'hello-this-is-form-id'

export default {
  title: 'Pages/SettingsPage/General',
  component: SettingsPage,
  decorators: [
    (storyFn) => {
      return (
        <MemoryRouter initialEntries={[`/${MOCK_FORM_ID}`]}>
          <Route path="/:formId">{storyFn()}</Route>
        </MemoryRouter>
      )
    },
  ],
  parameters: {
    layout: 'fullscreen',
    msw: testSettingsHandlers,
  },
} as Meta

const Template: Story<SettingsPageProps> = (args) => <SettingsPage {...args} />
export const DefaultPublic = Template.bind({})
DefaultPublic.storyName = 'Default (Public form)'

export const PrivateForm = Template.bind({})
PrivateForm.parameters = {
  msw: [
    getExpectedSettings({
      ...BASE_MOCK_FORM_SETTINGS,
      status: FormStatus.Private,
    }),
  ],
}
