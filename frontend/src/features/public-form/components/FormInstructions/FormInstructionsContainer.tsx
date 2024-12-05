import { Box, Flex } from '@chakra-ui/react'

import { Language, TranslationMapping } from '~shared/types'

import { getValueInSelectedLanguage } from '~utils/multiLanguage'

import { usePublicFormContext } from '~features/public-form/PublicFormContext'

import { useFormSections } from '../FormFields/FormSectionsContext'

import { FormInstructions } from './FormInstructions'

export const PUBLICFORM_INSTRUCTIONS_SECTIONID = 'instructions'

export const startPageTitleTranslations: TranslationMapping[] = [
  { language: Language.ENGLISH, translation: 'Instructions' },
  { language: Language.CHINESE, translation: '说明' },
  { language: Language.MALAY, translation: 'Arahan' },
  { language: Language.TAMIL, translation: 'வழிமுறைகள்' },
]

export const FormInstructionsContainer = (): JSX.Element | null => {
  const { sectionRefs } = useFormSections()
  const { form, submissionData, selectedPublicFormLanguage } =
    usePublicFormContext()

  if (submissionData || !form?.startPage.paragraph) return null

  const title = getValueInSelectedLanguage({
    defaultValue: 'Instructions',
    translations: startPageTitleTranslations,
    selectedLanguage: selectedPublicFormLanguage,
  })

  const paragraph = getValueInSelectedLanguage({
    defaultValue: form.startPage.paragraph,
    translations: form.startPage.paragraphTranslations,
    selectedLanguage: selectedPublicFormLanguage,
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
            title={title}
            content={paragraph}
            colorTheme={form?.startPage.colorTheme}
          />
        </Box>
      </Box>
    </Flex>
  )
}
