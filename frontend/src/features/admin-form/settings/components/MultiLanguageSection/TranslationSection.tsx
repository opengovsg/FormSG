import { FormProvider, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { BiChevronLeft } from 'react-icons/bi'
import { Button, Flex, Skeleton } from '@chakra-ui/react'

import { Language } from '~shared/types'

import { useToast } from '~hooks/useToast'
import { convertUnicodeLocaleToLanguage } from '~utils/multiLanguage'

import { useAdminForm } from '~features/admin-form/common/queries'

import { useTranslationLogic } from './mutations/useTranslationLogic'
import { EndPageTranslationsContainer } from './EndPageTranslationContainer'
import { FormFieldTranslationContainer } from './FormFieldTranslationContainer'
import { FormLogicTranslationContainer } from './FormLogicTranslationContainer'
import { StartPageTranslationContainer } from './StartPageTranslationContainer'

export type TranslationInput = {
  titleTranslation: string
  descriptionTranslation: string
  paragraphTranslations: string
  fieldOptionsTranslations: string
  tableColumnTitleTranslations: string[]
  tableColumnDropdownTranslations: string[]
  preventSubmitMessageTranslations: string[]
}

interface TranslationSectionProps {
  language: string
  formFieldNumToBeTranslated: number
  isStartPageTranslations?: boolean
  isEndPageTranslations?: boolean
  isFormLogicTranslations?: boolean
}

export const TranslationSection = ({
  language,
  formFieldNumToBeTranslated,
  isStartPageTranslations = false,
  isEndPageTranslations = false,
  isFormLogicTranslations = false,
}: TranslationSectionProps) => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.settings.multiLanguage',
  })
  const { data: form, isLoading } = useAdminForm()
  const toast = useToast({ status: 'danger' })

  if (!isLoading && !form) {
    toast({
      description: t('retrievalError'),
    })
  }

  const methods = useForm<TranslationInput>()
  const { formState } = methods
  const isFormField = formFieldNumToBeTranslated !== -1
  const unicodeLocale = language as Language
  const capitalisedLanguage = convertUnicodeLocaleToLanguage(unicodeLocale)

  const {
    handleOnBackClick,
    handleOnSaveClick,
    formFieldData,
    formStartPage,
    formEndPage,
    formLogicsPreventSubmissions,
  } = useTranslationLogic({
    form,
    language,
    formFieldNumToBeTranslated,
    isStartPageTranslations,
    isEndPageTranslations,
    isFormLogicTranslations,
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
          {t('backToQuestions')}
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
          {isFormLogicTranslations && formLogicsPreventSubmissions && (
            <FormLogicTranslationContainer
              language={capitalisedLanguage}
              unicodeLocale={unicodeLocale}
              formLogics={formLogicsPreventSubmissions}
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
            {t('saveTranslation')}
          </Button>
        </Flex>
      </FormProvider>
    </Skeleton>
  )
}
