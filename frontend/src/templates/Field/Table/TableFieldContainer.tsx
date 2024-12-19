import { useFormState } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { FormControl } from '@chakra-ui/react'

import { Language } from '~shared/types'

import { getValueInSelectedLanguage } from '~utils/multiLanguage'
import FormLabel from '~components/FormControl/FormLabel'

import { TableFieldSchema } from '../types'

export type BaseTableFieldProps = {
  schema: TableFieldSchema
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
  children,
}: TableFieldContainerProps): JSX.Element => {
  const { i18n } = useTranslation()
  const { isSubmitting, isValid, errors } = useFormState({ name: schema._id })

  const selectedLanguage = i18n.language as Language

  const title = getValueInSelectedLanguage({
    defaultValue: schema.title,
    translations: schema.titleTranslations,
    selectedLanguage: selectedLanguage,
  })

  const description = getValueInSelectedLanguage({
    defaultValue: schema.description,
    translations: schema.descriptionTranslations,
    selectedLanguage: selectedLanguage,
  })

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
