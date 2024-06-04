import { useFormState } from 'react-hook-form'
import { FormControl } from '@chakra-ui/react'

import { Language } from '~shared/types'

import FormLabel from '~components/FormControl/FormLabel'

import { TableFieldSchema } from '../types'

export type BaseTableFieldProps = {
  schema: TableFieldSchema
  selectedLanguage: Language
}

export interface TableFieldContainerProps extends BaseTableFieldProps {
  children: React.ReactNode
}

/**
 * Field container layout that all rendered form fields share.
 * @precondition There must be a parent `react-hook-form#FormProvider` component as this component relies on methods the FormProvider component provides.
 */
export const TableFieldContainer = ({
  schema,
  selectedLanguage,
  children,
}: TableFieldContainerProps): JSX.Element => {
  const { isSubmitting, isValid, errors } = useFormState({ name: schema._id })

  let title = schema.title

  const titleTranslations = schema.titleTranslations ?? []
  // check if there are any title translations for the selected language
  const titleTranslationIdx = titleTranslations.findIndex(
    (titleTranslation) => {
      return titleTranslation.language === selectedLanguage
    },
  )

  // If there are title translations for the selected language, use the translation.
  // If not default it to English.
  if (titleTranslationIdx !== -1) {
    title = titleTranslations[titleTranslationIdx].translation
  }

  let description = schema.description

  const descriptionTranslations = schema.descriptionTranslations ?? []
  // check if there are any description translations for the selected language
  const descriptionTranslationIdx = descriptionTranslations.findIndex(
    (descriptionTranslation) =>
      descriptionTranslation.language === selectedLanguage,
  )

  // If there are description translations for the language, use the translation.
  // If not default it to English.
  if (descriptionTranslationIdx !== -1) {
    description = descriptionTranslations[descriptionTranslationIdx].translation
  }

  return (
    <FormControl
      id={schema._id}
      isRequired={schema.required}
      isDisabled={schema.disabled}
      isReadOnly={isValid && isSubmitting}
      isInvalid={!!errors[schema._id]}
    >
      <FormLabel
        questionNumber={
          schema.questionNumber ? `${schema.questionNumber}.` : undefined
        }
        description={description}
      >
        {title}
      </FormLabel>
      {children}
    </FormControl>
  )
}
