import { Box } from '@chakra-ui/react'
import { Meta, StoryObj } from '@storybook/react-vite'

import { ResponseViewTabs } from './ResponseViewTabs'

const meta = {
  title: 'Features/AdminForm/Responses/ResponseViewTabs',
  component: ResponseViewTabs,
  decorators: [
    (Story) => (
      <Box maxW="60rem">
        <Story />
      </Box>
    ),
  ],
  args: {
    views: [
      { id: 'pending', name: 'Pending approval' },
      { id: 'previous', name: 'Last quarter' },
    ],
    countState: { status: 'ready', count: 105 },
  },
} satisfies Meta<typeof ResponseViewTabs>
export default meta

type Story = StoryObj<typeof meta>
export const AllResponses: Story = {}
export const SavedView: Story = {
  args: {
    selectedViewId: 'pending',
    countState: { status: 'ready', count: 12 },
  },
}
export const FilteredZero: Story = {
  args: { countState: { status: 'ready', count: 0 } },
}
export const Loading: Story = { args: { countState: { status: 'loading' } } }
export const Unavailable: Story = { args: { countState: { status: 'error' } } }
