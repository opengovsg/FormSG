import { Box } from '@chakra-ui/react'
import { Meta, StoryFn } from '@storybook/react-vite'

import {
  DateString,
  WorkflowEventType,
  WorkflowStatus,
} from 'formsg-shared/types'

import { viewportModes } from '~utils/storybook'

import { SendBackModal, SendBackModalProps } from './SendBackModal'

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
    // Pages fill the viewport; fit-to-content would crop them.
    argos: { fitToContent: false },
  },
  args: {
    isOpen: true,
    onClose: () => undefined,
    onConfirm: () => undefined,
    // Step 4 is pending, so the response can go back to step 2 or 3.
    history: {
      submittedSteps: [
        {
          isApproval: false,
          submittedAt: '2026-10-07T00:17:08.000Z',
          nextStepRecipientEmails: ['daniel_tan@agency.gov.sg'],
        },
        {
          isApproval: true,
          status: WorkflowStatus.APPROVED,
          submittedAt: '2026-10-07T03:42:51.000Z',
          nextStepRecipientEmails: ['workplace@agency.gov.sg'],
        },
        {
          isApproval: false,
          submittedAt: '2026-10-08T01:05:12.000Z',
          nextStepRecipientEmails: ['finance@agency.gov.sg'],
        },
      ],
      workflow: [
        { _id: 'step-1', step_name: 'Person' },
        { _id: 'step-2', step_name: 'Team lead' },
        { _id: 'step-3', step_name: 'Workplace team' },
        { _id: 'step-4', step_name: 'Finance' },
      ],
      workflowEvents: [
        {
          type: WorkflowEventType.AssigneesAdded,
          actorEmail: 'admin@agency.gov.sg',
          stepNumber: 3,
          emails: ['wei_ling_koh@agency.gov.sg'],
          created: '2026-10-07T05:00:00.000Z' as DateString,
        },
      ],
    },
  },
} as Meta<SendBackModalProps>

const Template: StoryFn<SendBackModalProps> = (args) => (
  <SendBackModal {...args} />
)

export const Default = Template.bind({})
Default.parameters = { argos: { modes: viewportModes('mobile') } }
