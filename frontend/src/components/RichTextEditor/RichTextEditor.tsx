import { useRef } from 'react'
import { Box, useToken } from '@chakra-ui/react'
import Link from '@tiptap/extension-link'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

import { LinkBubbleMenu } from './LinkBubbleMenu'
import { MenuBar } from './MenuBar'

type RichTextEditorProps = {
  value: string
  onChange: (value: unknown) => void
}

export const RichTextEditor = ({
  value,
  onChange,
}: RichTextEditorProps): JSX.Element => {
  const editor = useEditor({
    content: value,
    extensions: [
      // Disable features we do not need
      StarterKit.configure({
        blockquote: false,
        heading: false,
      }),
      // Re-enable default link behaviour
      // See: https://github.com/ueberdosis/tiptap/issues/2571
      Link.extend({
        inclusive: false,
      }).configure({
        openOnClick: false,
      }),
    ],
    // Update React Hook Form with new field value
    // Returning '' ensures that React Hook Form treats the field as empty.
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? '' : editor.getHTML()),
  })

  // Used for creating box shadows
  const [primary500] = useToken('colors', ['primary.500'])

  const containerRef = useRef<HTMLDivElement>(null)
  return (
    <Box
      border="1px solid"
      borderColor="neutral.400"
      borderRadius="base"
      overflow="hidden"
      ref={containerRef}
      _focusWithin={{
        borderColor: 'primary.500',
        boxShadow: `0 0 0 1px ${primary500}`,
      }}
    >
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
      <LinkBubbleMenu editor={editor} containerRef={containerRef} />
    </Box>
  )
}
