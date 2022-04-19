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
  viewports,
} from '~utils/storybook'

import { CollaboratorModal } from './CollaboratorModal'

const baseMswRoutes = [
  ...createFormBuilderMocks({}, 0),
  getAdminFormCollaborators(),
  getUser({ delay: 0 }),
]

export default {
  title: 'Features/AdminForm/CollaboratorModal',
  component: CollaboratorModal,
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
  const modalProps = useDisclosure({ defaultIsOpen: true })

  const el = document.createElement('div')

  useEffect(() => {
    modalRoot.appendChild(el)

    return () => {
      modalRoot.removeChild(el)
    }
  })

  return ReactDOM.createPortal(
    <CollaboratorModal
      {...modalProps}
      onClose={() => console.log('close modal')}
    />,
    el,
  )
}
export const Default = Template.bind({})

export const WithCollaborators = Template.bind({})
WithCollaborators.parameters = {
  msw: [
    getAdminFormCollaborators({
      delay: 0,
      overrides: [
        {
          email: 'viewer@example.com',
          write: false,
        },
        {
          email: 'editor@example.com',
          write: true,
        },
      ],
    }),
    ...baseMswRoutes,
  ],
}

export const Loading = Template.bind({})
Loading.parameters = {
  msw: [getAdminFormCollaborators({ delay: 'infinite' }), ...baseMswRoutes],
}

export const Mobile = Template.bind({})
Mobile.parameters = {
  viewport: {
    defaultViewport: 'mobile1',
  },
  chromatic: { viewports: [viewports.xs] },
  msw: [
    getAdminFormCollaborators({
      delay: 0,
      overrides: [
        {
          email: 'viewer@example.com',
          write: false,
        },
        {
          email: 'editor@example.com',
          write: true,
        },
      ],
    }),
    ...baseMswRoutes,
  ],
}
