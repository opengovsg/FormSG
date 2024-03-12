import { ComponentMeta, ComponentStory } from '@storybook/react'

import { RichTextEditor } from './RichTextEditor'

export default {
  title: 'Components/RichTextEditor',
  component: RichTextEditor,
  decorators: [],
} as ComponentMeta<typeof RichTextEditor>

const Template: ComponentStory<typeof RichTextEditor> = (args) => (
  <RichTextEditor {...args} />
)

// In the application, we would pass in onChange from React Hook Form
const dummyFn = (val: unknown) => console.log(val)

export const Empty = Template.bind({})
Empty.args = { value: '', onChange: dummyFn }

export const Filled = Template.bind({})
Filled.args = {
  ...Empty.args,
  value:
    // eslint-disable-next-line no-multi-str
    '<p><s>Strikethrough</s></p>\
    <p><em>Italic</em></p>\
    <p><strong>Bold</strong></p>\
    <p><strong><em>BoldItalic</em></strong></p>\
    <ul><li><p> Bulleted</p><ul><li><p>List</p></li></ul></li></ul>\
    <ol><li><p> Numbered</p><ol><li><p> List</p></li></ol></li></ol>',
}

export const Link = Template.bind({})
Link.args = {
  ...Empty.args,
  value:
    '<p><a target="_blank" rel="noopener noreferrer nofollow" href="https://www.google.com">Link</a></p>',
}
