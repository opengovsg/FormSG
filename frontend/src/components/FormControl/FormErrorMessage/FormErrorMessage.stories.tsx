import { FormControl } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'

import { FormErrorMessage, FormErrorMessageProps } from './FormErrorMessage'

export default {
  title: 'Components/FormControl/FormErrorMessage',
  component: FormErrorMessage,
  decorators: [],
} as Meta

const Template: Story<FormErrorMessageProps> = ({ children, ...args }) => (
  <FormControl isInvalid>
    <FormErrorMessage {...args}>{children}</FormErrorMessage>
  </FormControl>
)
export const Default = Template.bind({})
Default.args = {
  children: 'This is an error message.',
}
Default.storyName = 'FormErrorMessage'
