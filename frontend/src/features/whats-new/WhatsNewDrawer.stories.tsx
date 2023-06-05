import { useEffect } from 'react'
import ReactDOM from 'react-dom'
import { useDisclosure } from '@chakra-ui/hooks'
import { Meta, Story } from '@storybook/react'

import {
  createFormBuilderMocks,
  getAdminFormCollaborators,
} from '~/mocks/msw/handlers/admin-form'
import { getUser } from '~/mocks/msw/handlers/user'

import {
  fullScreenDecorator,
  LoggedInDecorator,
  StoryRouter,
} from '~utils/storybook'

import { WhatsNewDrawer } from './WhatsNewDrawer'

const baseMswRoutes = [
  ...createFormBuilderMocks({}, 0),
  getAdminFormCollaborators(),
  getUser({ delay: 0 }),
]

export default {
  title: 'Features/WhatsNew/WhatsNewDrawer',
  decorators: [
    fullScreenDecorator,
    LoggedInDecorator,
    StoryRouter({ initialEntries: ['/12345'], path: '/:formId' }),
  ],
  parameters: {
    layout: 'fullscreen',
    // Prevent flaky tests due to modal animating in.
    chromatic: { pauseAnimationAtEnd: true },
    msw: baseMswRoutes,
  },
} as Meta

const modalRoot = document.createElement('div')
document.body.appendChild(modalRoot)

const Template: Story = () => {
  const drawerProps = useDisclosure({ defaultIsOpen: true })

  const el = document.createElement('div')

  useEffect(() => {
    modalRoot.appendChild(el)

    return () => {
      modalRoot.removeChild(el)
    }
  })

  return ReactDOM.createPortal(
    <WhatsNewDrawer
      {...drawerProps}
      onClose={() => console.log('close modal')}
    />,
    el,
  )
}

export const Desktop = Template.bind({})
