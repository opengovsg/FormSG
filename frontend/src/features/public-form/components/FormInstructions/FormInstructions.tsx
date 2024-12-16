import { useTranslation } from 'react-i18next'
import { Box } from '@chakra-ui/react'

import { FormColorTheme, Language } from '~shared/types'

import { useMdComponents } from '~hooks/useMdComponents'
import { getValueInSelectedLanguage } from '~utils/multiLanguage'
import { MarkdownText } from '~components/MarkdownText'
import { useSectionColor } from '~templates/Field/Section/useSectionColor'

import { titleTranslations } from '.'

interface FormInstructionsProps {
  content: string
  colorTheme?: FormColorTheme
}

export const FormInstructions = ({
  content,
  colorTheme,
}: FormInstructionsProps): JSX.Element => {
  const { i18n } = useTranslation()
  const sectionColor = useSectionColor(colorTheme)
  const mdComponents = useMdComponents({
    styles: {
      text: {
        textStyle: 'body-1',
        color: 'secondary.700',
      },
    },
  })

  const selectedLanguage = i18n.language as Language
  const title = getValueInSelectedLanguage({
    defaultValue: 'Instructions',
    translations: titleTranslations,
    selectedLanguage,
  })

  return (
    <>
      <Box as="h2" textStyle="h2" color={sectionColor}>
        {title}
      </Box>
      <Box mt="1rem">
        <MarkdownText multilineBreaks components={mdComponents}>
          {content}
        </MarkdownText>
      </Box>
    </>
  )
}
