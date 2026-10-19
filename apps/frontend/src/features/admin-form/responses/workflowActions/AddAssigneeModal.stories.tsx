import { Box } from '@chakra-ui/react'
import { Meta, StoryFn } from '@storybook/react-vite'

import { getMobileViewGlobals } from '~utils/storybook'

import { AddAssigneeModal, AddAssigneeModalProps } from './AddAssigneeModal'

export default {
  title: 'Features/AdminForm/Responses/WorkflowActions/AddAssigneeModal',
  component: AddAssigneeModal,
  decorators: [
    (storyFn) => (
      <Box w="100vw" h="100vh">
        {storyFn()}
      </Box>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    isOpen: true,
    onClose: () => undefined,
    onConfirm: () => undefined,
    currentAssignees: ['daniel_tan@agency.gov.sg'],
  },
} as Meta<AddAssigneeModalProps>

const Template: StoryFn<AddAssigneeModalProps> = (args) => (
  <AddAssigneeModal {...args} />
)

export const Default = Template.bind({})

export const Mobile = Template.bind({})
Mobile.globals = getMobileViewGlobals()
Mobile.globals = getMobileViewGlobals()
