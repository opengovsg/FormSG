import { useTranslation } from 'react-i18next'
import { Box, forwardRef } from '@chakra-ui/react'

import { FormColorTheme, Language } from '~shared/types'

import { useMdComponents } from '~hooks/useMdComponents'
import { getValueInSelectedLanguage } from '~utils/multiLanguage'
import { MarkdownText } from '~components/MarkdownText'

import { SectionFieldContainerProps } from './SectionFieldContainer'
import { useSectionColor } from './useSectionColor'

export type SectionFieldProps = SectionFieldContainerProps

// Used by SectionFieldContainer
export const SectionField = forwardRef<SectionFieldContainerProps, 'div'>(
  (props, ref) => {
    return (
      <Box
        _notFirst={{
          mt: '1.5rem',
        }}
      >
        <BaseSectionField {...props} ref={ref} />
      </Box>
    )
  },
)

export const BaseSectionField = forwardRef<
  Pick<SectionFieldProps, 'schema' | 'colorTheme'>,
  'div'
>(({ schema, colorTheme = FormColorTheme.Blue, ...rest }, ref) => {
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
    defaultValue: schema.title,
    translations: schema.titleTranslations,
    selectedLanguage,
  })

  const description = getValueInSelectedLanguage({
    defaultValue: schema.description,
    translations: schema.descriptionTranslations,
    selectedLanguage,
  })

  return (
    // id given so app can scrolled to this section.
    <Box
      id={schema._id}
      ref={ref}
      _focus={{
        boxShadow: `0 0 0 2px var(--chakra-colors-theme-${colorTheme}-500)`,
      }}
      {...rest}
    >
      <Box as="h2" textStyle="h2" color={sectionColor}>
        {title}
      </Box>
      {description && (
        <Box mt="1rem">
          <MarkdownText multilineBreaks components={mdComponents}>
            {description}
          </MarkdownText>
        </Box>
      )}
    </Box>
  )
})
