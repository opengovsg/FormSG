import { Meta, Story } from '@storybook/react'

import { getMobileViewParameters } from '~utils/storybook'

import { TagInput, TagInputProps } from './TagInput'

export default {
  title: 'Components/TagInput',
  component: TagInput,
  decorators: [],
  parameters: {
    actions: { argTypesRegex: '^on.*' },
  },
} as Meta<TagInputProps>

const Template: Story<TagInputProps> = (args) => <TagInput {...args} />
export const Default = Template.bind({})
Default.args = {}

export const WithValue = Template.bind({})
WithValue.args = {
  defaultValue: ['foo', 'bar'],
}

export const Disabled = Template.bind({})
Disabled.args = {
  isDisabled: true,
}

export const DisabledWithValue = Template.bind({})
DisabledWithValue.args = {
  ...WithValue.args,
  ...Disabled.args,
}

export const Invalid = Template.bind({})
Invalid.args = {
  ...WithValue.args,
  isInvalid: true,
}

export const Mobile = Template.bind({})
Mobile.args = {
  defaultValue: [
    'somethingreallylong_that_should_overflow_the_input@example.com',
    'test@example.com',
  ],
}
Mobile.parameters = getMobileViewParameters()
