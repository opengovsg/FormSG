import { useEffect, useMemo, useRef } from 'react'
import { Box, Flex, Stack, Text, VisuallyHidden } from '@chakra-ui/react'

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

  const submittedAriaText = useMemo(() => {
    if (formTitle) {
      return `You have successfully submitted your response for ${formTitle}.`
    }
    return 'You have successfully submitted your response.'
  }, [formTitle])

  return (
    <Flex flexDir="column">
      <Stack tabIndex={-1} ref={focusRef} spacing="1rem">
        <Box>
          <VisuallyHidden aria-live="assertive">
            {submittedAriaText}
          </VisuallyHidden>
          <Text as="h2" textStyle="h2" textColor="secondary.700">
            {endPage.title}
          </Text>
        </Box>
        {endPage.paragraph ? (
          <MarkdownText components={mdComponents}>
            {endPage.paragraph}
          </MarkdownText>
        ) : null}
        <Text textColor="secondary.300">Response ID: {submissionData.id}</Text>
      </Stack>
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
