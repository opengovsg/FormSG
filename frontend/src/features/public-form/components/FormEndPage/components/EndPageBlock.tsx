import { useEffect, useMemo, useRef } from 'react'
import { Box, Flex, Text, VisuallyHidden } from '@chakra-ui/react'
import { format } from 'date-fns'

import { FormColorTheme, FormDto } from '~shared/types/form'

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
}

export const EndPageBlock = ({
  formTitle,
  endPage,
  submissionData,
  colorTheme = FormColorTheme.Blue,
  focusOnMount,
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
    <Flex flexDir="column">
      <Box ref={focusRef}>
        <VisuallyHidden aria-live="assertive">
          {submittedAriaText}
        </VisuallyHidden>
        <Text as="h2" textStyle="h2" textColor="secondary.500">
          {endPage.title}
        </Text>
        {endPage.paragraph ? (
          <Box mt="0.75rem">
            <MarkdownText components={mdComponents}>
              {endPage.paragraph}
            </MarkdownText>
          </Box>
        ) : null}
      </Box>
      <Box mt="2rem">
        <Text textColor="secondary.300" textStyle="caption-2">
          Response ID: {submissionData.id}
        </Text>
        <Text mt="0.25rem" textColor="secondary.300" textStyle="caption-2">
          {submissionTimestamp}
        </Text>
      </Box>
      <Box mt="2.25rem">
        <Button
          as="a"
          href={endPage.buttonLink || window.location.href}
          variant="solid"
          colorScheme={`theme-${colorTheme}`}
        >
          {endPage.buttonText || 'Submit another response'}
        </Button>
      </Box>
    </Flex>
  )
}
