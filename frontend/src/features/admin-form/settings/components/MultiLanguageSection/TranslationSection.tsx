import { FormProvider, useForm } from 'react-hook-form'
import { BiChevronLeft } from 'react-icons/bi'
import { Button, Flex, Skeleton } from '@chakra-ui/react'

import { Language } from '~shared/types'

import { useToast } from '~hooks/useToast'
import { convertUnicodeLocaleToLanguage } from '~utils/multiLanguage'

import { useAdminForm } from '~features/admin-form/common/queries'

import { useTranslationLogic } from './mutations/useTranslationLogic'
import { EndPageTranslationsContainer } from './EndPageTranslationContainer'
import { FormFieldTranslationContainer } from './FormFieldTranslationContainer'
import { StartPageTranslationContainer } from './StartPageTranslationContainer'

export type TranslationInput = {
  titleTranslation: string
  descriptionTranslation: string
  paragraphTranslations: string
  fieldOptionsTranslations: string
  tableColumnTitleTranslations: string[]
  tableColumnDropdownTranslations: string[]
}

interface TranslationSectionProps {
  language: string
  formFieldNumToBeTranslated: number
  isStartPageTranslations?: boolean
  isEndPageTranslations?: boolean
}

export const TranslationSection = ({
  language,
  formFieldNumToBeTranslated,
  isStartPageTranslations = false,
  isEndPageTranslations = false,
}: TranslationSectionProps) => {
  const { data: form, isLoading } = useAdminForm()
  const methods = useForm<TranslationInput>()
  const { formState } = methods
  const toast = useToast({ status: 'danger' })
  const isFormField = formFieldNumToBeTranslated !== -1
  const unicodeLocale = language as Language
  const capitalisedLanguage = convertUnicodeLocaleToLanguage(unicodeLocale)

  if (!isLoading && !form) {
    toast({
      description:
        'There was an error retrieving your form. Please try again later.',
    })
  }

  const {
    handleOnBackClick,
    handleOnSaveClick,
    formFieldData,
    formStartPage,
    formEndPage,
  } = useTranslationLogic({
    form,
    language,
    formFieldNumToBeTranslated,
    isStartPageTranslations,
    isEndPageTranslations,
    isFormField,
    methods,
  })

  return (
    <Skeleton isLoaded={!isLoading && !!form}>
      <Flex mb="3.75rem">
        <Button
          variant="clear"
          colorScheme="primary"
          aria-label="Back Button"
          size="sm"
          leftIcon={<BiChevronLeft fontSize="1.5rem" />}
          onClick={handleOnBackClick}
          marginRight="2.25rem"
        >
          Back to all questions
        </Button>
      </Flex>
      <FormProvider {...methods}>
        <Flex ml="6.25rem" direction="column">
          {isStartPageTranslations && (
            <StartPageTranslationContainer
              startPage={formStartPage}
              capitalisedLanguage={capitalisedLanguage}
              unicodeLocale={unicodeLocale}
            />
          )}
          {isFormField && formFieldData && (
            <FormFieldTranslationContainer
              formFieldData={formFieldData}
              capitalisedLanguage={capitalisedLanguage}
              unicodeLocale={unicodeLocale}
              formState={formState}
            />
          )}
          {isEndPageTranslations && formEndPage && (
            <EndPageTranslationsContainer
              endPage={formEndPage}
              capitalisedLanguage={capitalisedLanguage}
              unicodeLocale={unicodeLocale}
            />
          )}
          <Button variant="solid" width="30%" onClick={handleOnSaveClick}>
            Save Translation
          </Button>
        </Flex>
      </FormProvider>
    </Skeleton>
  )
}
