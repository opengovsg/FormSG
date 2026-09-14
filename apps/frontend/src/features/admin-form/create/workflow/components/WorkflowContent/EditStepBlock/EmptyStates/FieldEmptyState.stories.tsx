import { Box } from '@chakra-ui/react'
import { Meta, StoryFn } from '@storybook/react'

import { getMobileViewParameters } from '~utils/storybook'

import { FieldEmptyState } from './FieldEmptyState'

export default {
  title:
    'Features/AdminForm/create/workflow/components/EditStepBlock/FieldEmptyState',
  component: FieldEmptyState,
} as Meta

/**
 * The empty state never renders at the width of its own container. It sits
 * nested four levels deep, and the wrap these stories exist to watch only
 * happens at the width that nesting leaves, so the stand-in reproduces the
 * chain rather than the component in isolation:
 *
 *   CreatePageWorkflowTab  px 1.5rem (base)
 *   EditStepBlockContainer px 1.5rem (base)
 *   Radio                  px 0.5rem, plus a 1.5rem control and 0.5rem of
 *                          label spacing that only indent the left edge
 *
 * At a 320px viewport that leaves the InlineMessage 176px, and the button
 * inside it 112px once the info icon and the message padding are taken.
 */
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
  message: 'Your form has no email field yet.',
  actionLabel: 'Add an email field',
  onAction: () => undefined,
}

export const MobileNoEmailField = NestedTemplate.bind({})
MobileNoEmailField.args = NoEmailField.args
MobileNoEmailField.parameters = getMobileViewParameters()

export const NoDropdownField = NestedTemplate.bind({})
NoDropdownField.args = {
  picker: 'dropdown',
  message: 'Your form has no dropdown field yet.',
  actionLabel: 'Add a dropdown field',
  onAction: () => undefined,
}

export const MobileNoDropdownField = NestedTemplate.bind({})
MobileNoDropdownField.args = NoDropdownField.args
MobileNoDropdownField.parameters = getMobileViewParameters()
