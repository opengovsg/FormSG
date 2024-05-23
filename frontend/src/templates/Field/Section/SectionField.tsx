import { useMemo } from 'react'
import { Box, forwardRef } from '@chakra-ui/react'

import { FormColorTheme } from '~shared/types'

import { useMdComponents } from '~hooks/useMdComponents'
import { MarkdownText } from '~components/MarkdownText'

import { SectionFieldContainerProps } from './SectionFieldContainer'

export type SectionFieldProps = SectionFieldContainerProps

export const useSectionColor = (colorTheme?: FormColorTheme) =>
  useMemo(() => {
    switch (colorTheme) {
      case FormColorTheme.Orange:
      case FormColorTheme.Red:
        return `theme-${colorTheme}.600` as const
      default:
        return `theme-${colorTheme}.500` as const
    }
  }, [colorTheme])

// Used by SectionFieldContainer
export const SectionField = forwardRef<SectionFieldContainerProps, 'div'>(
  (props, ref) => {
    return (
      <Box
        _notFirst={{
          mt: '3.75rem',
        }}
      >
        <BaseSectionField {...props} ref={ref} />
      </Box>
    )
  },
)

export const BaseSectionField = forwardRef<
  Pick<SectionFieldProps, 'schema' | 'colorTheme' | 'selectedLanguage'>,
  'div'
>(
  (
    { schema, selectedLanguage, colorTheme = FormColorTheme.Blue, ...rest },
    ref,
  ) => {
    const sectionColor = useSectionColor(colorTheme)
    const mdComponents = useMdComponents({
      styles: {
        text: {
          textStyle: 'body-1',
          color: 'secondary.700',
        },
      },
    })

    let title = schema.title
    const titleTranslations = schema?.titleTranslations ?? []
    const titleTranslationIdx = titleTranslations.findIndex((translation) => {
      return translation.language === selectedLanguage
    })

    // If there exists a translation for title based on the selected language,
    // use that. If not default to english
    if (titleTranslationIdx !== -1) {
      title = titleTranslations[titleTranslationIdx].translation
    }

    let description = schema.description
    const descriptionTranslations = schema?.descriptionTranslations ?? []
    const descriptionTranslationIdx = descriptionTranslations.findIndex(
      (translation) => {
        return translation.language === selectedLanguage
      },
    )

    // If there exists a translation for description based on the selected language,
    // use that. If not default to english
    if (descriptionTranslationIdx !== -1) {
      description =
        descriptionTranslations[descriptionTranslationIdx].translation
    }

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
              {schema.description}
            </MarkdownText>
          </Box>
        )}
      </Box>
    )
  },
)
