import { Box } from '@chakra-ui/react'
import { Meta, StoryFn } from '@storybook/react-vite'

import { DateString, WorkflowEventType } from 'formsg-shared/types'

import { viewportModes } from '~utils/storybook'

import { SendBackModal, SendBackModalProps } from './SendBackModal'

const submittedStep = {
  isApproval: false as const,
  submittedAt: '2026-11-04T01:00:00.000Z',
  nextStepRecipientEmails: ['daniel_tan@agency.gov.sg'],
}

export default {
  title: 'Features/AdminForm/Responses/WorkflowActions/SendBackModal',
  component: SendBackModal,
  decorators: [
    (storyFn) => (
      <Box w="100vw" h="100vh">
        {storyFn()}
      </Box>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    argos: { fitToContent: false, modes: viewportModes('mobile') },
  },
  args: {
    isOpen: true,
    onClose: () => undefined,
    onConfirm: () => undefined,
    canSendBackToStepOne: true,
    history: {
      submittedSteps: [submittedStep, submittedStep],
      workflow: [
        { _id: 'step-1', step_name: 'Applicant' },
        { _id: 'step-2', step_name: 'Team lead' },
        { _id: 'step-3', step_name: 'Finance' },
      ],
      workflowEvents: [
        {
          type: WorkflowEventType.AssigneesAdded,
          actorEmail: 'admin@agency.gov.sg',
          stepNumber: 2,
          emails: [
            'previously_added@agency.gov.sg',
            'a.very.long.recipient.email.address.for.wrapping@department.agency.gov.sg',
          ],
          created: '2026-11-04T01:30:00.000Z' as DateString,
        },
      ],
    },
  },
} as Meta<SendBackModalProps>

const Template: StoryFn<SendBackModalProps> = (args) => (
  <SendBackModal {...args} />
)

export const LaterStepWithAddedAssignees = Template.bind({})

export const StepOne = Template.bind({})
StepOne.args = {
  history: {
    submittedSteps: [submittedStep],
    workflow: [
      { _id: 'step-1', step_name: 'Applicant' },
      { _id: 'step-2', step_name: 'Team lead' },
    ],
    workflowEvents: [],
  },
}
