import { Language } from '~shared/types'

import { useMdComponents } from '~hooks/useMdComponents'
import { getValueInSelectedLanguage } from '~utils/multiLanguage'
import { MarkdownText } from '~components/MarkdownText'

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
  selectedLanguage = Language.ENGLISH,
}: ParagraphFieldProps): JSX.Element => {
  const mdComponents = useMdComponents({
    styles: {
      text: {
        textStyle: 'body-1',
        color: 'secondary.700',
      },
    },
  })

  const description = getValueInSelectedLanguage({
    defaultValue: schema.description,
    translations: schema.descriptionTranslations ?? [],
    selectedLanguage,
  })

  return (
    <MarkdownText multilineBreaks components={mdComponents}>
      {description}
    </MarkdownText>
  )
}
