import { Box, FormControl } from '@chakra-ui/react'
import { Meta, StoryFn } from '@storybook/react'

import { getMobileViewParameters } from '~utils/storybook'
import { SingleSelect } from '~components/Dropdown'
import FormLabel from '~components/FormControl/FormLabel'

import {
  WorkflowActionModal,
  WorkflowActionModalProps,
} from './WorkflowActionModal'

export default {
  title: 'Features/AdminForm/Responses/WorkflowActions/WorkflowActionModal',
  component: WorkflowActionModal,
  decorators: [
    (storyFn) => (
      <Box w="100vw" h="100vh">
        {storyFn()}
      </Box>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    chromatic: { delay: 200 },
  },
  args: {
    isOpen: true,
    onClose: () => undefined,
    onConfirm: () => undefined,
    title: 'Send a reminder',
    description: 'Remind the people who need to respond.',
    notifiedEmails: ['daniel_tan@agency.gov.sg', 'wei_ling_koh@agency.gov.sg'],
    confirmLabel: 'Send reminder',
  },
} as Meta<WorkflowActionModalProps>

const Template: StoryFn<WorkflowActionModalProps> = (args) => (
  <WorkflowActionModal {...args} />
)

export const Default = Template.bind({})

export const NoOneNotified = Template.bind({})
NoOneNotified.args = { notifiedEmails: [] }

export const WithInputs = Template.bind({})
WithInputs.args = {
  title: 'Stop this workflow?',
  description:
    'No further actions can be taken, and its status will change to Stopped.',
  isBeta: true,
  confirmLabel: 'Stop workflow',
  confirmColorScheme: 'danger',
  children: (
    <FormControl>
      <FormLabel>Step</FormLabel>
      <SingleSelect
        name="step"
        value=""
        onChange={() => undefined}
        items={['Step 1', 'Step 2']}
        initialIsOpen
      />
    </FormControl>
  ),
}

export const Mobile = Template.bind({})
Mobile.parameters = getMobileViewParameters()
