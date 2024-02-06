import Link from '@tiptap/extension-link'
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
    <EditorProvider
      content={value}
      slotBefore={<MenuBar />}
      extensions={[
        StarterKit.configure({
          blockquote: false,
        }),
        Link,
      ]}
      onUpdate={({ editor }) => onChange(editor.getHTML())}
      // EditorProvider has invalid types (children property is required)
      // See: https://github.com/ueberdosis/tiptap/issues/4618
      children={<></>}
    />
  )
}
