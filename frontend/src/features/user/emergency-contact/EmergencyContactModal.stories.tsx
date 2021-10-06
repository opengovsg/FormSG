import { useEffect } from 'react'
import { useDisclosure } from '@chakra-ui/hooks'
import { Meta, Story } from '@storybook/react'
import { omit } from 'lodash'

import {
  getUser,
  MOCK_USER,
  postGenerateContactOtp,
  postVerifyContactOtp,
  userHandlers,
} from '~/mocks/msw/handlers/user'

import { LOGGED_IN_KEY } from '~constants/localStorage'
import { viewports } from '~utils/storybook'
import Button from '~components/Button'

import { EmergencyContactModal } from './EmergencyContactModal'

export default {
  title: 'Features/User/EmergencyContactModal',
  component: EmergencyContactModal,
  decorators: [
    (storyFn) => {
      useEffect(() => {
        window.localStorage.setItem(LOGGED_IN_KEY, JSON.stringify(true))

        return () => window.localStorage.removeItem(LOGGED_IN_KEY)
      }, [])

      return storyFn()
    },
  ],
  parameters: {
    layout: 'fullscreen',
    msw: userHandlers({ delay: 0 }),
  },
} as Meta

const Template: Story = () => {
  const modalProps = useDisclosure({ defaultIsOpen: true })

  return (
    <>
      <Button onClick={modalProps.onOpen}>Open modal</Button>
      <EmergencyContactModal {...modalProps} />
    </>
  )
}
export const WithContact = Template.bind({})

export const NoContact = Template.bind({})
NoContact.parameters = {
  msw: [
    getUser({ delay: 0, mockUser: omit(MOCK_USER, 'contact') }),
    postGenerateContactOtp({ delay: 0 }),
    postVerifyContactOtp({ delay: 0 }),
  ],
}

export const Loading = Template.bind({})
Loading.parameters = {
  msw: userHandlers({ delay: 'infinite' }),
}

export const Mobile = Template.bind({})
Mobile.parameters = {
  viewport: {
    defaultViewport: 'mobile1',
  },
  chromatic: { viewports: [viewports.xs] },
}
