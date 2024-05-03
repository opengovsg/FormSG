import { useEffect, useMemo, useRef } from 'react'
import { Box, Text, VisuallyHidden } from '@chakra-ui/react'
import { Button } from '@opengovsg/design-system-react'
import { format } from 'date-fns'

import { FormColorTheme, FormDto } from '~shared/types/form'

import { MarkdownText } from '~components/MarkdownText2'

import { SubmissionData } from '~features/public-form/PublicFormContext'

export interface EndPageBlockProps {
  formTitle: FormDto['title'] | undefined
  endPage: FormDto['endPage']
  submissionData: SubmissionData
  colorTheme?: FormColorTheme
  focusOnMount?: boolean
  isButtonHidden?: boolean
}

export const EndPageBlock = ({
  formTitle,
  endPage,
  submissionData,
  colorTheme = FormColorTheme.Blue,
  focusOnMount,
  isButtonHidden,
}: EndPageBlockProps): JSX.Element => {
  const focusRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (focusOnMount) {
      focusRef.current?.focus()
    }
  }, [focusOnMount])

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
        <Text as="h2" textStyle="h4" textColor="brand.secondary.500">
          {endPage.title}
        </Text>
        {endPage.paragraph ? (
          <Box mt="0.75rem">
            <MarkdownText
              componentProps={{
                styles: {
                  text: {
                    textStyle: 'subhead-1',
                    color: 'brand.secondary.500',
                  },
                },
              }}
            >
              {endPage.paragraph}
            </MarkdownText>
          </Box>
        ) : null}
      </Box>
      <Box mt="2rem">
        <Box>
          <Text textColor="brand.secondary.300" textStyle="caption-2">
            Response ID: {submissionData.id}
          </Text>
          <Text
            mt="0.25rem"
            textColor="brand.secondary.300"
            textStyle="caption-2"
          >
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
