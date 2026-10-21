import { Box } from '@chakra-ui/react'
import { GrowthBook, GrowthBookProvider } from '@growthbook/growthbook-react'
import { Meta, StoryFn } from '@storybook/react-vite'

import { featureFlags } from 'formsg-shared/constants'
import {
  AdminFormDto,
  BasicField,
  FormResponseMode,
  FormSettings,
  WorkflowType,
} from 'formsg-shared/types'

import {
  createFormBuilderMocks,
  getAdminFormSettings,
} from '~/mocks/msw/handlers/admin-form'
import { getUser } from '~/mocks/msw/handlers/user'

import { StoryRouter, viewportModes } from '~utils/storybook'

import { StopWorkflowModal, StopWorkflowModalProps } from './StopWorkflowModal'

const EMAIL_FIELD_ID = '6ac58f6be4846dec944bc221'

const WORKFLOW = [
  {
    _id: 'step-1',
    workflow_type: WorkflowType.Static,
    emails: [],
    edit: [EMAIL_FIELD_ID],
    step_name: 'Person',
  },
  {
    _id: 'step-2',
    workflow_type: WorkflowType.Static,
    emails: ['daniel_tan@agency.gov.sg'],
    edit: [],
    step_name: 'Team lead',
  },
  {
    _id: 'step-3',
    workflow_type: WorkflowType.Static,
    emails: ['workplace@agency.gov.sg'],
    edit: [],
    step_name: 'Workplace team',
  },
]

const FORM = {
  responseMode: FormResponseMode.Multirespondent,
  form_fields: [
    {
      _id: EMAIL_FIELD_ID,
      fieldType: BasicField.Email,
      title: 'Email',
      description: '',
      required: true,
      disabled: false,
    },
  ],
  workflow: WORKFLOW,
} as unknown as Partial<AdminFormDto>

const redesignOn = new GrowthBook({
  features: { [featureFlags.workflowBuilderRedesign]: { defaultValue: true } },
})

const withRedesignOn = (Story: StoryFn) => (
  <GrowthBookProvider growthbook={redesignOn}>
    <Story />
  </GrowthBookProvider>
)

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
    msw: [
      ...createFormBuilderMocks(FORM),
      getAdminFormSettings({
        mode: FormResponseMode.Multirespondent,
        overrides: {
          emails: ['records@agency.gov.sg'],
          stepOneEmailNotificationFieldId: EMAIL_FIELD_ID,
          stepsToNotify: ['step-2'],
        } as unknown as Partial<FormSettings>,
      }),
      getUser(),
    ],
  },
  args: {
    isOpen: true,
    onClose: () => undefined,
    onConfirm: () => undefined,
    history: {
      submittedSteps: [
        {
          isApproval: false,
          submittedAt: '2026-10-07T00:17:08.000Z',
          nextStepRecipientEmails: ['daniel_tan@agency.gov.sg'],
        },
      ],
      workflow: WORKFLOW,
    },
    responses: [{ _id: EMAIL_FIELD_ID, answer: 'wei_ling_koh@agency.gov.sg' }],
  },
} as Meta<StopWorkflowModalProps>

const Template: StoryFn<StopWorkflowModalProps> = (args) => (
  <StopWorkflowModal {...args} />
)

export const Default = Template.bind({})
Default.parameters = { argos: { modes: viewportModes('mobile') } }

export const Redesign = Template.bind({})
Redesign.decorators = [withRedesignOn]

export const NoEmailFields = Template.bind({})
NoEmailFields.decorators = [withRedesignOn]
NoEmailFields.parameters = {
  msw: [
    ...createFormBuilderMocks({ ...FORM, form_fields: [] }),
    getAdminFormSettings({
      mode: FormResponseMode.Multirespondent,
      overrides: { emails: [], stepsToNotify: [] } as Partial<FormSettings>,
    }),
    getUser(),
  ],
}
NoEmailFields.args = { responses: [] }
