import { Box } from '@chakra-ui/react'
import { Meta, StoryFn } from '@storybook/react'

import { getMobileViewParameters } from '~utils/storybook'

import { FieldEmptyState } from './FieldEmptyState'

export default {
  title:
    'Features/AdminForm/create/workflow/components/EditStepBlock/FieldEmptyState',
  component: FieldEmptyState,
} as Meta

const NestedTemplate: StoryFn = (args) => (
  <Box bg="neutral.100" px="1.5rem">
    <Box bg="white" px="1.5rem">
      <Box pl="2.5rem" pr="0.5rem">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <FieldEmptyState {...(args as any)} />
      </Box>
    </Box>
  </Box>
)

export const NoEmailField = NestedTemplate.bind({})
NoEmailField.args = {
  picker: 'email',
  message: 'Your form has no Email field yet.',
  actionLabel: 'Add an Email field',
  onAction: () => undefined,
}

export const MobileNoEmailField = NestedTemplate.bind({})
MobileNoEmailField.args = NoEmailField.args
MobileNoEmailField.parameters = getMobileViewParameters()

export const NoDropdownField = NestedTemplate.bind({})
NoDropdownField.args = {
  picker: 'dropdown',
  message: 'Your form has no Dropdown field yet.',
  actionLabel: 'Add a Dropdown field',
  onAction: () => undefined,
}

export const MobileNoDropdownField = NestedTemplate.bind({})
MobileNoDropdownField.args = NoDropdownField.args
MobileNoDropdownField.parameters = getMobileViewParameters()
