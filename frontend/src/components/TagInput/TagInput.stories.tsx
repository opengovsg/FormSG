import { Meta, StoryFn } from '@storybook/react'

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

const Template: StoryFn<TagInputProps> = (args) => <TagInput {...args} />
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

export const InvalidField = Template.bind({})
InvalidField.args = {
  ...WithValue.args,
  isInvalid: true,
}

export const InvalidFieldWithInvalidTags = Template.bind({})
InvalidFieldWithInvalidTags.args = {
  isInvalid: true,
  defaultValue: ['foo', 'bar', 'bazinvalid'],
  tagValidation: (tag) => tag.length <= 3,
}

export const Mobile = Template.bind({})
Mobile.args = {
  defaultValue: [
    'somethingreallylong_that_should_overflow_the_input@example.com',
    'test@example.com',
  ],
}
Mobile.parameters = getMobileViewParameters()
