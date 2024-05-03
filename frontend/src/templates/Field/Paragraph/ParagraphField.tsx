import { MarkdownText } from '~components/MarkdownText2'

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
  return (
    <MarkdownText
      multilineBreaks
      componentProps={{
        styles: {
          text: {
            textStyle: 'body-1',
            color: 'brand.secondary.700',
          },
        },
      }}
    >
      {schema.description}
    </MarkdownText>
  )
}
