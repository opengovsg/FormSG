import { useEffect, useMemo, useRef } from 'react'
import { Box, Text, VisuallyHidden } from '@chakra-ui/react'
import { format } from 'date-fns'

import { FormColorTheme, FormDto, Language } from '~shared/types/form'

import { useMdComponents } from '~hooks/useMdComponents'
import Button from '~components/Button'
import { MarkdownText } from '~components/MarkdownText'

import { SubmissionData } from '~features/public-form/PublicFormContext'

export interface EndPageBlockProps {
  formTitle: FormDto['title'] | undefined
  endPage: FormDto['endPage']
  submissionData: SubmissionData
  colorTheme?: FormColorTheme
  focusOnMount?: boolean
  isButtonHidden?: boolean
  selectedLanguage: Language
}

export const EndPageBlock = ({
  formTitle,
  endPage,
  submissionData,
  colorTheme = FormColorTheme.Blue,
  focusOnMount,
  isButtonHidden,
  selectedLanguage,
}: EndPageBlockProps): JSX.Element => {
  const focusRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (focusOnMount) {
      focusRef.current?.focus()
    }
  }, [focusOnMount])

  const mdComponents = useMdComponents({
    styles: {
      text: {
        textStyle: 'subhead-1',
        color: 'secondary.500',
      },
    },
  })

  const title = useMemo(() => {
    let content = endPage.title

    if (selectedLanguage !== Language.ENGLISH) {
      const translations = endPage.titleTranslations ?? []
      const titleTranslationIdx = translations.findIndex(
        (translation) => translation.language === selectedLanguage,
      )

      if (titleTranslationIdx !== -1) {
        content = translations[titleTranslationIdx].translation
      }
    }

    return content
  }, [endPage.title, endPage.titleTranslations, selectedLanguage])

  const paragraph = useMemo(() => {
    let content = endPage?.paragraph

    if (selectedLanguage !== Language.ENGLISH) {
      const translations = endPage.paragraphTranslations ?? []
      const paragraphTranslationIdx = translations.findIndex(
        (translation) => translation.language === selectedLanguage,
      )

      if (paragraphTranslationIdx !== -1) {
        content = translations[paragraphTranslationIdx].translation
      }
    }

    return content
  }, [endPage?.paragraph, endPage.paragraphTranslations, selectedLanguage])

  const submissionTimestamp = useMemo(
    () => format(new Date(submissionData.timestamp), 'dd MMM yyyy, HH:mm:ss z'),
    [submissionData.timestamp],
  )

  const submittedAriaText = useMemo(() => {
    if (formTitle) {
      return `You have successfully submitted your response for ${formTitle}.`
    }
    return 'You have successfully submitted your response.'
  }, [formTitle])

  return (
    <>
      <Box ref={focusRef}>
        <VisuallyHidden aria-live="assertive">
          {submittedAriaText}
        </VisuallyHidden>
        <Text as="h2" textStyle="h2" textColor="secondary.500">
          {title}
        </Text>
        {paragraph ? (
          <Box mt="0.75rem">
            <MarkdownText components={mdComponents}>{paragraph}</MarkdownText>
          </Box>
        ) : null}
      </Box>
      <Box mt="2rem">
        <Box>
          <Text textColor="secondary.300" textStyle="caption-2">
            Response ID: {submissionData.id}
          </Text>
          <Text mt="0.25rem" textColor="secondary.300" textStyle="caption-2">
            {submissionTimestamp}
          </Text>
        </Box>
        <Box mt="2.25rem">
          {isButtonHidden || (
            <Button
              as="a"
              href={endPage.buttonLink || window.location.href}
              variant="solid"
              colorScheme={`theme-${colorTheme}`}
            >
              {endPage.buttonText || 'Submit another response'}
            </Button>
          )}
        </Box>
      </Box>
    </>
  )
}
