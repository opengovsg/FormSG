import { Meta, Story } from '@storybook/react'

import { FormLabel, FormLabelProps } from './FormLabel'

export default {
  title: 'Components/FormControl/FormLabel',
  component: FormLabel,
  decorators: [],
} as Meta

const Template: Story<FormLabelProps> = (args) => <FormLabel {...args} />
export const Label = Template.bind({})
Label.args = {
  children: 'This is a label',
}
Label.storyName = 'FormLabel'
