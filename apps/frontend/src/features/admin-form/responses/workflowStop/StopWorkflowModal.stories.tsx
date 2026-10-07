import { Box } from '@chakra-ui/react'
import { Meta, StoryFn } from '@storybook/react'

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

import { getMobileViewParameters, StoryRouter } from '~utils/storybook'

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

export default {
  title: 'Features/AdminForm/Responses/WorkflowStop/StopWorkflowModal',
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
    chromatic: { delay: 200 },
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
    // Step 1 done and sent to the team lead; waiting on step 2.
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
    assignees: [],
    responses: [{ _id: EMAIL_FIELD_ID, answer: 'wei_ling_koh@agency.gov.sg' }],
  },
} as Meta<StopWorkflowModalProps>

const Template: StoryFn<StopWorkflowModalProps> = (args) => (
  <StopWorkflowModal {...args} />
)

export const Default = Template.bind({})

export const Mobile = Template.bind({})
Mobile.parameters = getMobileViewParameters()
