import { Box } from '@chakra-ui/react'
import { Meta, StoryObj } from '@storybook/react-vite'

import {
  DateString,
  WorkflowEventType,
  WorkflowStatus,
} from 'formsg-shared/types'

import Button from '~components/Button'

import { WorkflowCurrentState } from './WorkflowCurrentState'

const meta = {
  title: 'Features/AdminForm/Responses/WorkflowActions/WorkflowCurrentState',
  component: WorkflowCurrentState,
  decorators: [
    (Story) => (
      <Box as="ol" listStyleType="none" p="2rem" maxW="45rem">
        <Story />
      </Box>
    ),
  ],
  args: {
    mrf: {
      workflowCurrentStepNumber: 2,
      workflowNumTotalSteps: 3,
      workflowStatus: WorkflowStatus.PENDING,
      lastSubmittedAt: undefined,
      hasNextStepRecipientEmails: true,
    },
    history: {
      submittedSteps: [
        {
          isApproval: false,
          submittedAt: '2026-11-14T01:00:00Z',
          nextStepRecipientEmails: ['manager@agency.gov.sg'],
        },
        {
          isApproval: false,
          submittedAt: '2026-11-14T02:00:00Z',
          nextStepRecipientEmails: ['finance@agency.gov.sg'],
        },
      ],
      workflow: [
        { _id: '1', step_name: 'Applicant' },
        { _id: '2', step_name: 'Manager' },
        { _id: '3', step_name: 'Finance' },
      ],
    },
    actions: (
      <Button size="sm" variant="outline">
        Remind
      </Button>
    ),
  },
} satisfies Meta<typeof WorkflowCurrentState>
export default meta
type Story = StoryObj<typeof meta>
export const Pending: Story = {}
export const CorrectingStepOne: Story = {
  args: {
    mrf: { ...meta.args.mrf, workflowCurrentStepNumber: 0 },
    history: {
      ...meta.args.history,
      workflowEvents: [
        {
          type: WorkflowEventType.FixStep,
          stepNumber: 1,
          fromStepNumber: 3,
          actorEmail: 'admin@agency.gov.sg',
          emails: ['applicant@agency.gov.sg'],
          created: '2026-11-14T03:00:00Z' as DateString,
        },
      ],
    },
    actions: (
      <Button size="sm" variant="outline" colorScheme="danger">
        Void
      </Button>
    ),
  },
}
export const Completed: Story = {
  args: { mrf: { ...meta.args.mrf, workflowStatus: WorkflowStatus.COMPLETED } },
}
export const Rejected: Story = {
  args: { mrf: { ...meta.args.mrf, workflowStatus: WorkflowStatus.REJECTED } },
}
export const Voided: Story = {
  args: { mrf: { ...meta.args.mrf, stoppedAt: '2026-11-14T03:00:00Z' } },
}
