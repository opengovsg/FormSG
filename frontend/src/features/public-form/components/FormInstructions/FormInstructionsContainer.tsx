import { useMemo } from 'react'
import { Box, Flex } from '@chakra-ui/react'

import { usePublicFormContext } from '~features/public-form/PublicFormContext'

import { useFormSections } from '../FormFields/FormSectionsContext'

import { FormInstructions } from './FormInstructions'

export const FormInstructionsContainer = (): JSX.Element | null => {
  const { sectionRefs } = useFormSections()
  const { form, submissionData } = usePublicFormContext()

  const content = useMemo(
    () => form?.startPage.paragraph,
    [form?.startPage.paragraph],
  )

  if (!!submissionData || !content) return null

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
        <Box id="instructions" ref={sectionRefs['instructions']}>
          <FormInstructions
            content={content}
            colorTheme={form?.startPage.colorTheme}
          />
        </Box>
      </Box>
    </Flex>
  )
}
