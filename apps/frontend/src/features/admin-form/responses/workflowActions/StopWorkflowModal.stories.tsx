import { Box } from '@chakra-ui/react'
import { Meta, StoryFn } from '@storybook/react-vite'

import { FormResponseMode, FormSettings } from 'formsg-shared/types'

import { getAdminFormSettings } from '~/mocks/msw/handlers/admin-form'
import { getUser } from '~/mocks/msw/handlers/user'

import { StoryRouter, viewportModes } from '~utils/storybook'

import { StopWorkflowModal, StopWorkflowModalProps } from './StopWorkflowModal'

const withSettingsEmails = (emails: string[]) => [
  getAdminFormSettings({
    mode: FormResponseMode.Multirespondent,
    overrides: { emails } as Partial<FormSettings>,
  }),
  getUser(),
]

export default {
  title: 'Features/AdminForm/Responses/WorkflowActions/StopWorkflowModal',
  component: StopWorkflowModal,
  decorators: [
    (storyFn) => (
      <Box w="100vw" h="100vh">
        {storyFn()}
      </Box>
    ),
    StoryRouter({
      initialEntries: ['/admin/form/61540ece3d4a6e50ac0cc6ff'],
      path: '/admin/form/:formId',
    }),
  ],
  parameters: {
    layout: 'fullscreen',
    // Pages fill the viewport; fit-to-content would crop them.
    argos: { fitToContent: false },
    msw: withSettingsEmails(['records@agency.gov.sg']),
  },
  args: {
    isOpen: true,
    onClose: () => undefined,
    onConfirm: () => undefined,
  },
} as Meta<StopWorkflowModalProps>

const Template: StoryFn<StopWorkflowModalProps> = (args) => (
  <StopWorkflowModal {...args} />
)

export const Default = Template.bind({})
Default.parameters = { argos: { modes: viewportModes('mobile') } }

export const NoSettingsEmails = Template.bind({})
NoSettingsEmails.parameters = { msw: withSettingsEmails([]) }
