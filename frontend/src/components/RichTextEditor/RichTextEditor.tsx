import { useEffect, useRef } from 'react'
import { Box } from '@chakra-ui/react'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

import { LinkBubbleMenu } from './LinkBubbleMenu'
import { MenuBar } from './MenuBar'

type RichTextEditorProps = {
  value: string
  onChange: (value: unknown) => void
  invalid: boolean
}

export const RichTextEditor = ({
  value,
  onChange,
  invalid,
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
      Placeholder.configure({
        placeholder: 'Write something :)',
      }),
    ],
    // Update React Hook Form with new field value
    // Returning '' ensures that React Hook Form treats the field as empty.
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? '' : editor.getHTML()),
  })

  // Tiptap Editor does not respond to focus events fired from DOM nodes, thus we mimic the focusing of error inputs by RHF here
  useEffect(() => {
    if (invalid && !editor?.isFocused)
      editor?.chain().focus().scrollIntoView().run()
  }, [invalid, editor, editor?.isFocused])

  const containerRef = useRef<HTMLDivElement>(null)
  return (
    <Box
      border="1px solid"
      borderColor="neutral.400"
      borderRadius="base"
      overflow="hidden"
      ref={containerRef}
    >
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
      <LinkBubbleMenu editor={editor} containerRef={containerRef} />
    </Box>
  )
}
