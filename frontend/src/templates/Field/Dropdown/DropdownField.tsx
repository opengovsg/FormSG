import { useMemo } from 'react'
import { Controller, useFormContext } from 'react-hook-form'

import { FormColorTheme } from '~shared/types'

import { createDropdownValidationRules } from '~utils/fieldValidation'
import { SingleSelect } from '~components/Dropdown/SingleSelect'

import { BaseFieldProps, FieldContainer } from '../FieldContainer'
import { DropdownFieldSchema, SingleAnswerFieldInput } from '../types'

export interface DropdownFieldProps extends BaseFieldProps {
  schema: DropdownFieldSchema
  disableRequiredValidation?: boolean
}

/**
 * @precondition Must have a parent `react-hook-form#FormProvider` component.
 */
export const DropdownField = ({
  schema,
  disableRequiredValidation,
  colorTheme = FormColorTheme.Blue,
  selectedLanguage,
  ...fieldContainerProps
}: DropdownFieldProps): JSX.Element => {
  const rules = useMemo(() => {
    return createDropdownValidationRules(schema, disableRequiredValidation)
  }, [schema, disableRequiredValidation])

  const { control } = useFormContext<SingleAnswerFieldInput>()

  const fieldOptions = useMemo(() => {
    const fieldOptionsTranslations = schema?.fieldOptionsTranslations ?? []

    const translationIdx = fieldOptionsTranslations.findIndex((translation) => {
      return translation.language === selectedLanguage
    })

    if (translationIdx !== -1) {
      return fieldOptionsTranslations[translationIdx].translation
    } else {
      return schema.fieldOptions
    }
  }, [schema.fieldOptions, schema?.fieldOptionsTranslations, selectedLanguage])

  return (
    <FieldContainer
      schema={schema}
      {...fieldContainerProps}
      selectedLanguage={selectedLanguage}
    >
      <Controller
        control={control}
        rules={rules}
        name={schema._id}
        defaultValue=""
        render={({ field }) => (
          <SingleSelect
            colorScheme={`theme-${colorTheme}`}
            items={fieldOptions}
            {...field}
          />
        )}
      />
    </FieldContainer>
  )
}
