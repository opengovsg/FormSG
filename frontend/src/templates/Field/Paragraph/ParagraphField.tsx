import { useTranslation } from 'react-i18next'
import { Box } from '@chakra-ui/react'

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
}: ParagraphFieldProps): JSX.Element => {
  const { i18n } = useTranslation()
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
    selectedLanguage: i18n.language as Language,
  })

  return (
    // <MarkdownText> returns an array of components, this causes styles that affect
    // the immediate child layouts (i.e., gap) to be applied on the MarkdownText elements themselves.
    // Wrapping in a Box component isolates the elements to avoid this.
    <Box>
      <MarkdownText multilineBreaks components={mdComponents}>
        {description}
      </MarkdownText>
    </Box>
  )
}
