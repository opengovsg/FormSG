import { Box } from '@chakra-ui/react'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { EditorProvider } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

import { MenuBar } from './MenuBar'

export const RichTextEditor = ({
  value,
  onChange,
}: {
  value: string
  onChange: (value: unknown) => void
}) => {
  return (
    <Box
      border="1px solid"
      borderColor="neutral.400"
      borderRadius="base"
      overflow="hidden"
    >
      <EditorProvider
        content={value}
        slotBefore={<MenuBar />}
        extensions={[
          StarterKit.configure({
            blockquote: false,
            heading: {
              levels: [2],
            },
          }),
          Link,
          Placeholder.configure({
            placeholder: 'Write something :)',
          }),
        ]}
        onUpdate={({ editor }) => onChange(editor.getHTML())}
        // EditorProvider has invalid types (children property is required)
        // See: https://github.com/ueberdosis/tiptap/issues/4618
        children={<></>}
      />
    </Box>
  )
}
