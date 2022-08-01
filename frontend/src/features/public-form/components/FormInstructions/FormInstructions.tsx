import { Box, Flex, forwardRef, Text } from '@chakra-ui/react'

import { FormColorTheme } from '~shared/types'

import { useSectionColor } from '~templates/Field/Section/SectionField'

interface FormInstructionsProps {
  content?: string
  colorTheme?: FormColorTheme
}

export const FormInstructions = forwardRef<FormInstructionsProps, 'div'>(
  ({ content, colorTheme }, ref): JSX.Element | null => {
    const sectionColor = useSectionColor(colorTheme)

    if (!content) return null

    return (
      <Flex justify="center">
        <Box
          w="100%"
          minW={0}
          h="fit-content"
          maxW="57rem"
          bg="white"
          py="2.5rem"
          px={{ base: '1rem', md: '2.5rem' }}
          mb="1.5rem"
        >
          <Box id="instructions" ref={ref}>
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
          </Box>
        </Box>
      </Flex>
    )
  },
)
