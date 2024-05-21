import { Box, Flex } from '@chakra-ui/react'

import { Language } from '~shared/types'

import { usePublicFormContext } from '~features/public-form/PublicFormContext'

import { useFormSections } from '../FormFields/FormSectionsContext'

import { FormInstructions } from './FormInstructions'

export const PUBLICFORM_INSTRUCTIONS_SECTIONID = 'instructions'

export const FormInstructionsContainer = (): JSX.Element | null => {
  const { sectionRefs } = useFormSections()
  const { form, submissionData, publicFormLanguage } = usePublicFormContext()

  if (submissionData || !form?.startPage.paragraph) return null

  let content = form?.startPage.paragraph

  // English is the default even if multi lang is not supported for this form
  if (publicFormLanguage !== Language.ENGLISH) {
    const translations = form?.startPage?.translations ?? []

    const contentTranslationIdx = translations.findIndex(
      (translation) => translation.language === publicFormLanguage,
    )

    if (contentTranslationIdx !== -1) {
      content = translations[contentTranslationIdx].translation
    }
  }

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
            content={content}
            colorTheme={form?.startPage.colorTheme}
          />
        </Box>
      </Box>
    </Flex>
  )
}
