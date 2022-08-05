import { Meta, Story } from '@storybook/react'

import { TagInput, TagInputProps } from './TagInput'

export default {
  title: 'Components/TagInput',
  component: TagInput,
  decorators: [],
} as Meta<TagInputProps>

const Template: Story<TagInputProps> = (args) => <TagInput {...args} />
export const Default = Template.bind({})
Default.args = {}

export const WithValue = Template.bind({})
WithValue.args = {
  defaultValue: ['foo', 'bar'],
}
