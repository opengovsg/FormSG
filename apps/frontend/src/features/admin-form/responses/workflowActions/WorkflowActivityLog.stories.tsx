import { ComponentProps } from 'react'
import { Box } from '@chakra-ui/react'
import { Meta, StoryObj } from '@storybook/react-vite'

import {
  DateString,
  WorkflowEventType,
  WorkflowStatus,
} from 'formsg-shared/types'

import { viewportModes } from '~utils/storybook'

import { WorkflowActivityLog } from './WorkflowActivityLog'

const meta = {
  title: 'Features/AdminForm/Responses/WorkflowActions/WorkflowActivityLog',
  component: WorkflowActivityLog,
  decorators: [
    (Story) => (
      <Box p="1.5rem" maxW="48rem">
        <Story />
      </Box>
    ),
  ],
  parameters: { argos: { modes: viewportModes('mobile') } },
} satisfies Meta<typeof WorkflowActivityLog>
export default meta
type Story = StoryObj<typeof meta>
type History = NonNullable<
  ComponentProps<typeof WorkflowActivityLog>['history']
>
const workflow: History['workflow'] = [
  { _id: 'step-1', step_name: 'Requester' },
  { _id: 'step-2', step_name: 'Manager' },
  { _id: 'step-3', step_name: 'Procurement' },
  { _id: 'step-4', step_name: 'Finance' },
]
const history: History = {
  workflow,
  submittedSteps: [],
  workflowEvents: [
    {
      type: WorkflowEventType.StepSubmitted,
      stepNumber: 1,
      created: '2026-11-14T01:00:00.000Z' as DateString,
      outcome: WorkflowStatus.COMPLETED,
      emails: ['manager@agency.gov.sg'],
    },
    {
      type: WorkflowEventType.AssigneesAdded,
      stepNumber: 2,
      created: '2026-11-14T01:10:00.000Z' as DateString,
      actorEmail: 'sufyan@open.gov.sg',
      emails: ['deputy@agency.gov.sg'],
    },
    {
      type: WorkflowEventType.ReminderSent,
      stepNumber: 2,
      created: '2026-11-14T02:00:00.000Z' as DateString,
      actorEmail: 'sufyan@open.gov.sg',
      emails: ['manager@agency.gov.sg', 'deputy@agency.gov.sg'],
    },
    {
      type: WorkflowEventType.StepSubmitted,
      stepNumber: 2,
      created: '2026-11-14T02:30:00.000Z' as DateString,
      outcome: WorkflowStatus.APPROVED,
      emails: ['procurement@agency.gov.sg'],
    },
    {
      type: WorkflowEventType.SentBack,
      stepNumber: 1,
      fromStepNumber: 3,
      created: '2026-11-14T03:00:00.000Z' as DateString,
      actorEmail: 'sufyan@open.gov.sg',
      emails: ['alex@agency.gov.sg'],
      remarks:
        'Please update the equipment quantity.\nInclude the additional monitors.',
    },
    {
      type: WorkflowEventType.StepSubmitted,
      stepNumber: 1,
      created: '2026-11-14T03:30:00.000Z' as DateString,
      outcome: WorkflowStatus.COMPLETED,
      emails: ['manager@agency.gov.sg'],
    },
  ],
}

export const GroupedJourney: Story = { args: { history } }
export const ReviewNotNeeded: Story = {
  args: {
    history: {
      workflow,
      submittedSteps: [],
      workflowEvents: [
        {
          type: WorkflowEventType.FixStep,
          stepNumber: 2,
          fromStepNumber: 4,
          created: '2026-11-14T03:00:00.000Z' as DateString,
          actorEmail: 'sufyan@open.gov.sg',
          emails: [
            'manager@agency.gov.sg',
            'a.very.long.recipient.address@department.agency.gov.sg',
          ],
          remarks: 'Please correct the cost centre.',
        },
      ],
    },
  },
}
export const MissingMetadata: Story = {
  args: {
    history: {
      workflow,
      submittedSteps: [],
      workflowEvents: [
        {
          type: WorkflowEventType.StepSubmitted,
          stepNumber: 1,
          created: '2026-11-14T01:00:00.000Z' as DateString,
          outcome: WorkflowStatus.COMPLETED,
          emails: [],
        },
        {
          type: WorkflowEventType.Stopped,
          actorEmail: '',
          stepNumber: 2,
          created: '2026-11-14T02:00:00.000Z' as DateString,
          emails: [],
        },
      ],
    },
  },
}
