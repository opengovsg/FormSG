import { useEffect } from 'react'
import ReactDOM from 'react-dom'
import { useDisclosure } from '@chakra-ui/hooks'
import { Meta, StoryFn } from '@storybook/react-vite'

import {
  createFormBuilderMocks,
  getAdminFormCollaborators,
  updateFormCollaborators,
} from '~/mocks/msw/handlers/admin-form'
import { getUser, MOCK_USER } from '~/mocks/msw/handlers/user'

import {
  fullScreenDecorator,
  LoggedInDecorator,
  StoryRouter,
  viewportModes,
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
    // Pages fill the viewport; fit-to-content would crop them.
    argos: { fitToContent: false },
    // Prevent flaky tests due to modal animating in.
    msw: baseMswRoutes,
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
    <CollaboratorModal
      {...modalProps}
      onClose={() => console.log('close modal')}
      formId="mockStoryFormId"
    />,
    el,
  )
}
export const EditView = Template.bind({})

export const EditViewWithCollaborators = Template.bind({})
EditViewWithCollaborators.parameters = {
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
        {
          email:
            'super-duper-long-email-the-quick-brown-fox-jumps-over-the-lazy-dog@example.com',
          write: true,
        },
      ],
    }),
    ...baseMswRoutes,
  ],
}

export const EditViewLoading = Template.bind({})
EditViewLoading.parameters = {
  msw: [getAdminFormCollaborators({ delay: 'infinite' }), ...baseMswRoutes],
}

export const EditViewMobile = Template.bind({})
EditViewMobile.parameters = {
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
EditViewMobile.globals = { viewport: { value: 'mobile1', isRotated: false } }

export const ViewerView = Template.bind({})
ViewerView.parameters = {
  argos: { modes: viewportModes('mobile') },
  msw: [
    ...createFormBuilderMocks({}, 0),
    getUser({
      mockUser: { ...MOCK_USER, email: 'viewer@example.com' },
      delay: 0,
    }),
    getAdminFormCollaborators({
      overrides: [
        {
          email: 'viewer@example.com',
          write: false,
        },
        {
          email:
            'super-duper-long-email-the-quick-brown-fox-jumps-over-the-lazy-dog@example.com',
          write: true,
        },
      ],
    }),
  ],
}

export const ViewerViewLoading = Template.bind({})
ViewerViewLoading.parameters = {
  msw: [
    ...createFormBuilderMocks({}, 0),
    getUser({
      mockUser: { ...MOCK_USER, email: 'viewer@example.com' },
      delay: 0,
    }),
    getAdminFormCollaborators({
      delay: 'infinite',
    }),
  ],
}

export const EditCollaboratorBadRequestError = Template.bind({})
EditCollaboratorBadRequestError.parameters = {
  msw: [
    updateFormCollaborators({ delay: 0, errorCode: 400 }),
    ...baseMswRoutes,
  ],
}
