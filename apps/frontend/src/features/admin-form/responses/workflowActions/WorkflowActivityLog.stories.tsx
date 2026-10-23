import { Box } from '@chakra-ui/react'
import { Meta, StoryFn } from '@storybook/react-vite'

import {
  AdminSubmittedStep,
  DateString,
  WorkflowEventType,
  WorkflowStatus,
} from 'formsg-shared/types'

import { WorkflowActivityLog } from './WorkflowActivityLog'

const WORKFLOW = [
  { _id: 'step-1', step_name: 'Person' },
  { _id: 'step-2', step_name: 'Team lead' },
  { _id: 'step-3', step_name: 'Workplace team' },
]

const SUBMITTED_STEPS: AdminSubmittedStep[] = [
  {
    isApproval: false,
    submittedAt: '2026-10-07T00:17:08.000Z',
    nextStepRecipientEmails: ['reassigned_lead@agency.gov.sg'],
  },
  {
    isApproval: true,
    status: WorkflowStatus.APPROVED,
    submittedAt: '2026-10-07T03:40:12.000Z',
    nextStepRecipientEmails: ['workplace@agency.gov.sg'],
  },
]

export default {
  title: 'Features/AdminForm/Responses/WorkflowActions/WorkflowActivityLog',
  component: WorkflowActivityLog,
  decorators: [
    (storyFn) => (
      <Box p="1.5rem" maxW="40rem">
        {storyFn()}
      </Box>
    ),
  ],
} as Meta<typeof WorkflowActivityLog>

const Template: StoryFn<typeof WorkflowActivityLog> = (args) => (
  <WorkflowActivityLog {...args} />
)

export const Default = Template.bind({})
Default.args = {
  history: {
    workflow: WORKFLOW,
    submittedSteps: SUBMITTED_STEPS,
    workflowEvents: [
      {
        type: WorkflowEventType.StepSubmitted,
        outcome: WorkflowStatus.COMPLETED,
        stepNumber: 1,
        emails: ['daniel_tan@agency.gov.sg'],
        created: '2026-10-07T00:17:08.000Z' as DateString,
      },
      {
        type: WorkflowEventType.ReminderSent,
        actorEmail: 'admin@agency.gov.sg',
        stepNumber: 2,
        emails: ['daniel_tan@agency.gov.sg'],
        created: '2026-10-07T02:05:00.000Z' as DateString,
      },
      {
        type: WorkflowEventType.StepSubmitted,
        outcome: WorkflowStatus.APPROVED,
        stepNumber: 2,
        emails: ['workplace@agency.gov.sg'],
        created: '2026-10-07T03:40:12.000Z' as DateString,
      },
    ],
  },
}

export const SubmittedBeforeStepEvents = Template.bind({})
SubmittedBeforeStepEvents.args = {
  history: { workflow: WORKFLOW, submittedSteps: SUBMITTED_STEPS },
}
