import ReactMarkdown from 'react-markdown'

import { FormFieldWithId, StatementFieldBase } from '~shared/types/field'

import { useMdComponents } from '~hooks/useMdComponents'

export type ParagraphFieldSchema = FormFieldWithId<StatementFieldBase>
export interface ParagraphFieldProps {
  schema: ParagraphFieldSchema
}

/**
 * Renderer for a paragraph field.
 * @note schema is still based on `StatementFieldBase`, but to the client code it is a paragraph field.
 */
export const ParagraphField = ({
  schema,
}: ParagraphFieldProps): JSX.Element => {
  const mdComponents = useMdComponents({
    styles: {
      text: {
        textStyle: 'body-1',
        color: 'secondary.700',
      },
    },
  })
  return (
    <ReactMarkdown components={mdComponents}>
      {schema.description}
    </ReactMarkdown>
  )
}
