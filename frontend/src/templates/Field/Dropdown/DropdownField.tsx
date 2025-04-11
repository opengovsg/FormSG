import { useMemo } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { FormColorTheme, Language } from '~shared/types'

import { createDropdownValidationRules } from '~utils/fieldValidation'
import { SingleSelect } from '~components/Dropdown/SingleSelect'
import { ComboboxItem } from '~components/Dropdown/types'

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
  highContrast,
  ...fieldContainerProps
}: DropdownFieldProps): JSX.Element => {
  const { i18n } = useTranslation()
  const rules = useMemo(() => {
    return createDropdownValidationRules(schema, disableRequiredValidation)
  }, [schema, disableRequiredValidation])

  const { control } = useFormContext<SingleAnswerFieldInput>()

  const selectedLanguage = i18n.language as Language

  // This has to be done because of how the SingleSelect function
  // extracts the value attribute from the fieldOption to set
  // as the selected option which will then be used to validate
  // against the schema fieldOptions which are the defaultFieldOptions.
  const fieldOptions: ComboboxItem[] = useMemo(() => {
    const englishFieldOptions = schema.fieldOptions
    const fieldOptionsTranslations = schema?.fieldOptionsTranslations ?? []

    const translationIdx = fieldOptionsTranslations.findIndex((translation) => {
      return translation.language === selectedLanguage
    })

    if (
      translationIdx !== -1 &&
      fieldOptionsTranslations[translationIdx].translation.length ===
        englishFieldOptions.length
    ) {
      const translatedFieldOptions =
        fieldOptionsTranslations[translationIdx].translation

      return translatedFieldOptions.map((translatedFieldOption, index) => {
        return {
          value: englishFieldOptions[index],
          label: translatedFieldOption,
        }
      })
    } else {
      return schema.fieldOptions.map((fieldOption) => {
        return {
          value: fieldOption,
        }
      })
    }
  }, [schema.fieldOptions, schema?.fieldOptionsTranslations, selectedLanguage])

  return (
    <FieldContainer schema={schema} {...fieldContainerProps}>
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
            highContrast={highContrast}
          />
        )}
      />
    </FieldContainer>
  )
}
