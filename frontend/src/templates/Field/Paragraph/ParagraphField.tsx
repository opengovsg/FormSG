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
  const editor = useEditor({
    editable: false,
    content: schema.description,
    extensions: [StarterKit, Link],
  })

  return <EditorContent editor={editor} />
}
