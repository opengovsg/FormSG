// TODO #4279: Remove after React rollout is complete
import { Meta, Story } from '@storybook/react'

import { getUser, MOCK_USER } from '~/mocks/msw/handlers/user'

import {
  fullScreenDecorator,
  getMobileViewParameters,
  LoggedInDecorator,
  LoggedOutDecorator,
} from '~utils/storybook'

import { SwitchEnvFeedbackModal } from './SwitchEnvFeedbackModal'

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

const Template: Story = () => {
  return (
    <SwitchEnvFeedbackModal
      onChangeEnv={() => console.log('change env')}
      onSubmitFeedback={async () => console.log('submit feedback')}
      onClose={onClose}
      isOpen={true}
    />
  )
}

export const NotLoggedIn = Template.bind({})
NotLoggedIn.decorators = [LoggedOutDecorator]

export const MobileNotLoggedIn = Template.bind({})
MobileNotLoggedIn.parameters = getMobileViewParameters()
MobileNotLoggedIn.decorators = [LoggedOutDecorator]

export const LoggedIn = Template.bind({})
LoggedIn.decorators = [LoggedInDecorator]
LoggedIn.parameters = {
  msw: [
    getUser({
      delay: 0,
      mockUser: {
        ...MOCK_USER,
      },
    }),
  ],
}

export const MobileLoggedIn = Template.bind({})
MobileLoggedIn.parameters = {
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
MobileLoggedIn.decorators = [LoggedInDecorator]
