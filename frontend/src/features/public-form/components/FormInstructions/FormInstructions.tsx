import { Text } from '@chakra-ui/react'

import { FormColorTheme } from '~shared/types'

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

  return (
    <>
      <Text textStyle="h2" color={sectionColor}>
        Instructions
      </Text>
      <Text
        textStyle="body-1"
        color="secondary.700"
        mt="1rem"
        whiteSpace="pre-line"
      >
        {content}
      </Text>
    </>
  )
}
