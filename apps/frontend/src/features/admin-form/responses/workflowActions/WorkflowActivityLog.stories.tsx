import { Box } from '@chakra-ui/react'
import { GrowthBook, GrowthBookProvider } from '@growthbook/growthbook-react'
import { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'

import { featureFlags } from 'formsg-shared/constants'
import { FormAuthType, WorkflowStatus } from 'formsg-shared/types'

import { WorkflowActivityLog } from './WorkflowActivityLog'

const history = {
  submittedSteps: [
    {
      isApproval: false as const,
      submittedAt: '2026-10-29T01:00:00.000Z',
      nextStepRecipientEmails: ['approver@agency.gov.sg'],
      authType: FormAuthType.MyInfo as const,
    },
    {
      isApproval: true as const,
      status: WorkflowStatus.APPROVED as const,
      submittedAt: '2026-10-29T02:00:00.000Z',
      nextStepRecipientEmails: ['processor@agency.gov.sg'],
      authType: FormAuthType.CP as const,
    },
    {
      isApproval: false as const,
      submittedAt: '2026-10-29T03:00:00.000Z',
    },
  ],
  workflow: [
    { _id: 'requester', step_name: 'Requester' },
    { _id: 'approver', step_name: 'Approving officer' },
    { _id: 'processor', step_name: 'Processing officer' },
  ],
}

// Provider tags show only with step logins rolled out.
const stepLoginOn = new GrowthBook({
  features: {
    [featureFlags.mrfStepLogin]: { defaultValue: true },
    [featureFlags.isNricFieldEnabled]: { defaultValue: true },
  },
})

const meta = {
  title: 'Features/AdminForm/Responses/WorkflowActions/WorkflowActivityLog',
  component: WorkflowActivityLog,
  decorators: [
    (Story) => (
      <GrowthBookProvider growthbook={stepLoginOn}>
        <Box maxW="40rem" p="2rem">
          <Story />
        </Box>
      </GrowthBookProvider>
    ),
  ],
  args: { history },
} satisfies Meta<typeof WorkflowActivityLog>

export default meta
type Story = StoryObj<typeof meta>

/** The third submission used no login and therefore has no provider tag. */
export const MixedProviders: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getAllByText('Singpass')).toHaveLength(1)
    await expect(canvas.getAllByText('Corppass')).toHaveLength(1)
  },
}

export const LegacyHistory: Story = {
  args: {
    history: {
      ...history,
      submittedSteps: history.submittedSteps.map((step) => ({
        ...step,
        authType: undefined,
      })),
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.queryByText('Singpass')).not.toBeInTheDocument()
    await expect(canvas.queryByText('Corppass')).not.toBeInTheDocument()
  },
}
