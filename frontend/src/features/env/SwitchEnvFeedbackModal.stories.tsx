// TODO #4279: Remove after React rollout is complete
import { Meta, Story } from '@storybook/react'

import { getUnauthedUser, getUser, MOCK_USER } from '~/mocks/msw/handlers/user'

import {
  fullScreenDecorator,
  getMobileViewParameters,
  LoggedInDecorator,
  LoggedOutDecorator,
} from '~utils/storybook'

import {
  ADMIN_RADIO_OPTIONS,
  PUBLIC_RADIO_OPTIONS,
  SwitchEnvFeedbackModal,
} from './SwitchEnvFeedbackModal'

export default {
  title: 'Pages/SwitchEnvFeedbackModal',
  decorators: [fullScreenDecorator],
  parameters: {
    layout: 'fullscreen',
    // Prevent flaky tests due to modal animating in.
    chromatic: { delay: 200 },
    msw: [getUser({ delay: 0 })],
  },
} as Meta

const onClose = () => {
  return
}

const AdminTemplate: Story = () => {
  return (
    <SwitchEnvFeedbackModal
      onChangeEnv={() => console.log('change env')}
      onSubmitFeedback={async () => console.log('submit feedback')}
      onClose={onClose}
      isOpen={true}
      radioOptions={ADMIN_RADIO_OPTIONS}
    />
  )
}

const PublicRespondentTemplate: Story = () => {
  return (
    <SwitchEnvFeedbackModal
      onChangeEnv={() => console.log('change env')}
      onSubmitFeedback={async () => console.log('submit feedback')}
      onClose={onClose}
      isOpen={true}
      radioOptions={PUBLIC_RADIO_OPTIONS}
    />
  )
}

export const PublicRespondent = PublicRespondentTemplate.bind({})
PublicRespondent.decorators = [LoggedOutDecorator]
PublicRespondent.parameters = {
  msw: [getUnauthedUser()],
}

export const MobilePublicRespondent = PublicRespondentTemplate.bind({})
MobilePublicRespondent.parameters = {
  ...getMobileViewParameters(),
  msw: [getUnauthedUser()],
}
MobilePublicRespondent.decorators = [LoggedOutDecorator]

export const Admin = AdminTemplate.bind({})
Admin.decorators = [LoggedInDecorator]
Admin.parameters = {
  msw: [
    getUser({
      delay: 0,
      mockUser: {
        ...MOCK_USER,
      },
    }),
  ],
}

export const MobileAdmin = AdminTemplate.bind({})
MobileAdmin.parameters = {
  ...getMobileViewParameters(),
  msw: [
    getUser({
      delay: 0,
      mockUser: {
        ...MOCK_USER,
      },
    }),
  ],
}
MobileAdmin.decorators = [LoggedInDecorator]
