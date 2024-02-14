import { Link } from '@tiptap/extension-link'
import { EditorContent, useEditor } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'

import { BaseFieldProps } from '../FieldContainer'
import { ParagraphFieldSchema } from '../types'

export interface ParagraphFieldProps extends BaseFieldProps {
  schema: ParagraphFieldSchema
}

/**
 * Renderer for a paragraph field.
 * @note schema is still based on `StatementFieldBase`, but to the client code it is a paragraph field.
 */
export const ParagraphField = ({
  schema,
}: ParagraphFieldProps): JSX.Element => {
  // Using a read-only instance of Tiptap for rendering ensures that the HTML content is rendered consistently
  const editor = useEditor(
    {
      editable: false,
      content: schema.description,
      extensions: [
        StarterKit.configure({
          blockquote: false,
          heading: false,
        }),
        Link,
      ],
    },
    [schema],
  )

  return <EditorContent editor={editor} />
}
