import { FormState } from 'react-hook-form'
import { Divider, Flex, Text } from '@chakra-ui/react'

import { FormField, Language } from '~shared/types'
import { BasicField } from '~shared/types/field'

import { OptionsTranslationContainer } from './OptionsTranslationContainer'
import { TableTranslationContainer } from './TableTranslationContainer'
import { TranslationContainer } from './TranslationContainer'
import { TranslationInput } from './TranslationSection'

interface FormFieldTranslationContainerProps {
  formFieldData: FormField | undefined
  capitalisedLanguage: string
  unicodeLocale: Language
  formState: FormState<TranslationInput>
}

export const FormFieldTranslationContainer = ({
  formFieldData,
  capitalisedLanguage,
  unicodeLocale,
  formState,
}: FormFieldTranslationContainerProps) => {
  if (!formFieldData) return null

  const hasDescription =
    formFieldData.description && formFieldData.description !== ''
  const titleTranslations = formFieldData.titleTranslations ?? []
  const descriptionTranslations = formFieldData.descriptionTranslations ?? []

  const prevTitleTranslation =
    titleTranslations.find(
      (translation) => translation.language === unicodeLocale,
    )?.translation ?? ''

  const prevDescriptionTranslation =
    descriptionTranslations.find(
      (translation) => translation.language === unicodeLocale,
    )?.translation ?? ''

  const isTableField = formFieldData.fieldType === BasicField.Table

  return (
    <>
      <Flex justifyContent="flex-start" mb="2.5rem" direction="column">
        <Text
          color="secondary.500"
          fontSize="1.25rem"
          fontWeight="600"
          mb="1rem"
        >
          Question
        </Text>
        <TranslationContainer
          language={capitalisedLanguage}
          defaultString={formFieldData.title}
          editingTranslation="titleTranslation"
          previousTranslation={prevTitleTranslation}
        />
      </Flex>
      {hasDescription && (
        <>
          <Divider mb="2.5rem" />
          <Flex justifyContent="flex-start" mb="2.5rem" direction="column">
            <Text
              color="secondary.500"
              fontSize="1.25rem"
              fontWeight="600"
              mb="1rem"
            >
              Description
            </Text>
            <TranslationContainer
              language={capitalisedLanguage}
              defaultString={formFieldData.description}
              editingTranslation="descriptionTranslation"
              previousTranslation={prevDescriptionTranslation}
            />
          </Flex>
        </>
      )}
      {(formFieldData.fieldType === BasicField.Radio ||
        formFieldData.fieldType === BasicField.Checkbox ||
        formFieldData.fieldType === BasicField.Dropdown) && (
        <>
          <Divider mb="2.5rem" />
          <OptionsTranslationContainer
            unicodeLocale={unicodeLocale}
            language={capitalisedLanguage}
            formFieldData={formFieldData}
            errors={formState.errors.fieldOptionsTranslations}
          />
        </>
      )}
      {isTableField && (
        <>
          <Divider mb="2.5rem" />
          <TableTranslationContainer
            unicodeLocale={unicodeLocale}
            language={capitalisedLanguage}
            columns={formFieldData.columns}
            errors={formState.errors.tableColumnDropdownTranslations}
          />
        </>
      )}
    </>
  )
}
