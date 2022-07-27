import { Waypoint } from 'react-waypoint'
import { Box, Flex, forwardRef, Text } from '@chakra-ui/react'

import { FormColorTheme } from '~shared/types'

import { useSectionColor } from '~templates/Field/Section/SectionField'

interface FormInstructionsProps {
  content?: string
  colorTheme?: FormColorTheme
  handleSectionEnter?: () => void
}

export const FormInstructions = forwardRef<FormInstructionsProps, 'div'>(
  ({ content, colorTheme, handleSectionEnter }, ref): JSX.Element | null => {
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
          mt={{ base: '2rem', md: '0' }}
        >
          <Box id="instructions" ref={ref}>
            <Text textStyle="h2" color={sectionColor}>
              Instructions
            </Text>
            <Text textStyle="body-1" color="secondary.700" mt="1rem">
              {content}
            </Text>
          </Box>
          <Waypoint
            topOffset="80px"
            bottomOffset="70%"
            onEnter={handleSectionEnter}
          />
        </Box>
      </Flex>
    )
  },
)
