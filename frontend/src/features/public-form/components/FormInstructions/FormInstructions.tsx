import { Box } from '@chakra-ui/react'

import { FormColorTheme } from '~shared/types'

import { useMdComponents } from '~hooks/useMdComponents'
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
  const mdComponents = useMdComponents({
    styles: {
      text: {
        textStyle: 'body-1',
        color: 'secondary.700',
      },
    },
  })

  return (
    <>
      <Box as="h2" textStyle="h2" color={sectionColor}>
        Instructions
      </Box>
      <Box mt="1rem">
        <MarkdownText multilineBreaks components={mdComponents}>
          {content}
        </MarkdownText>
      </Box>
    </>
  )
}
