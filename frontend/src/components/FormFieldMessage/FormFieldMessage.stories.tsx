import { FormControl } from '@chakra-ui/form-control'
import { Meta, Story } from '@storybook/react'

import { FormFieldMessage, FormFieldMessageProps } from './FormFieldMessage'

export default {
  title: 'Components/FormFieldMessage',
  component: FormFieldMessage,
  decorators: [],
} as Meta

const Template: Story<FormFieldMessageProps> = ({ children, ...args }) => (
  // FormControl component required to pass appropriate props into component.
  <FormControl>
    <FormFieldMessage {...args}>{children}</FormFieldMessage>
  </FormControl>
)
export const Default = Template.bind({})
Default.args = {
  children: '200 characters left',
}

export const Info = Template.bind({})
Info.args = {
  children: 'Date of birth should be in DD/MM/YYYY format.',
  variant: 'info',
}

export const Error = Template.bind({})
Error.args = {
  children: 'This is an error message.',
  variant: 'error',
}

export const Success = Template.bind({})
Success.args = {
  children: 'This is a success message.',
  variant: 'success',
}
