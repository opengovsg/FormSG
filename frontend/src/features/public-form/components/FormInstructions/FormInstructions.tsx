import { Box } from '@chakra-ui/react'

import { FormColorTheme } from '~shared/types'

import { MarkdownText } from '~components/MarkdownText'
import { useSectionColor } from '~templates/Field/Section/useSectionColor'

interface FormInstructionsProps {
  content: string
  colorTheme?: FormColorTheme
}

export const FormInstructions = ({
  content,
  colorTheme,
}: FormInstructionsProps): JSX.Element => {
  const sectionColor = useSectionColor(colorTheme)

  return (
    <>
      <Box as="h2" textStyle="h4" color={sectionColor}>
        Instructions
      </Box>
      <Box mt="1rem">
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
          {content}
        </MarkdownText>
      </Box>
    </>
  )
}
