import { useEffect } from 'react'
import ReactDOM from 'react-dom'
import { useDisclosure } from '@chakra-ui/hooks'
import { Meta, StoryFn } from '@storybook/react'

import { getAdminForms } from '~/mocks/msw/handlers/admin-form'
import { transferAllFormsOwnership } from '~/mocks/msw/handlers/admin-form/transfer-ownership'
import { getUser, MOCK_USER } from '~/mocks/msw/handlers/user'

import {
  fullScreenDecorator,
  LoggedInDecorator,
  viewports,
} from '~utils/storybook'

import { TransferOwnershipModal } from './TransferOwnershipModal'

export default {
  title: 'Features/User/TransferOwnershipModal',
  component: TransferOwnershipModal,
  decorators: [fullScreenDecorator, LoggedInDecorator],
  parameters: {
    layout: 'fullscreen',
    // Prevent flaky tests due to modal animating in.
    chromatic: { pauseAnimationAtEnd: true },
    msw: [
      getUser({ delay: 0, mockUser: MOCK_USER }),
      getAdminForms.empty(),
      transferAllFormsOwnership(),
    ],
  },
} as Meta

const modalRoot = document.createElement('div')
document.body.appendChild(modalRoot)

const Template: StoryFn = () => {
  const modalProps = useDisclosure({ defaultIsOpen: true })

  const el = document.createElement('div')

  useEffect(() => {
    modalRoot.appendChild(el)

    return () => {
      modalRoot.removeChild(el)
    }
  })

  return ReactDOM.createPortal(
    <TransferOwnershipModal
      {...modalProps}
      onClose={() => console.log('close modal')}
    />,
    el,
  )
}

export const Default = Template.bind({})

export const Mobile = Template.bind({})
Mobile.parameters = {
  viewport: {
    defaultViewport: 'mobile1',
  },
  chromatic: { viewports: [viewports.xs] },
}

export const FailureBecauseTransferEndpointFailed = Template.bind({})
FailureBecauseTransferEndpointFailed.parameters = {
  msw: [
    getUser({ delay: 0, mockUser: MOCK_USER }),
    transferAllFormsOwnership({ overrides: { status: 500 } }),
  ],
}
