import ReactMarkdown from 'react-markdown'
import { Box, Text } from '@chakra-ui/react'
import gfm from 'remark-gfm'

import { FormColorTheme } from '~shared/types'

import { useMdComponents } from '~hooks/useMdComponents'
import { useSectionColor } from '~templates/Field/Section/SectionField'

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
      <Text textStyle="h2" color={sectionColor}>
        Instructions
      </Text>
      {/* Wrap markdown with a <div white-space='pre-wrap'> to get consecutive newlines to show up */}
      <Box mt="1rem" whiteSpace="pre-wrap">
        <ReactMarkdown components={mdComponents} remarkPlugins={[gfm]}>
          {content}
        </ReactMarkdown>
      </Box>
    </>
  )
}
