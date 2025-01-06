import { useTranslation } from 'react-i18next'
import { Box, Flex } from '@chakra-ui/react'

import { Language } from '~shared/types'

import { getValueInSelectedLanguage } from '~utils/multiLanguage'

import { usePublicFormContext } from '~features/public-form/PublicFormContext'

import { useFormSections } from '../FormFields/FormSectionsContext'

import { FormInstructions } from './FormInstructions'

export const PUBLICFORM_INSTRUCTIONS_SECTIONID = 'instructions'

export const FormInstructionsContainer = (): JSX.Element | null => {
  const { i18n } = useTranslation()
  const { sectionRefs } = useFormSections()
  const { form, submissionData } = usePublicFormContext()

  if (submissionData || !form?.startPage.paragraph) return null

  const paragraph = getValueInSelectedLanguage({
    defaultValue: form.startPage.paragraph,
    translations: form.startPage.paragraphTranslations,
    selectedLanguage: i18n.language as Language,
  })

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
        sx={{
          '@media print': {
            pb: '0',
          },
        }}
      >
        <Box
          id={PUBLICFORM_INSTRUCTIONS_SECTIONID}
          ref={sectionRefs[PUBLICFORM_INSTRUCTIONS_SECTIONID]}
          // Allow focus on instructions when sidebar link is clicked.
          tabIndex={-1}
        >
          <FormInstructions
            content={paragraph}
            colorTheme={form?.startPage.colorTheme}
          />
        </Box>
      </Box>
    </Flex>
  )
}
