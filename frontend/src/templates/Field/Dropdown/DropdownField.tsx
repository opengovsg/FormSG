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
  ...fieldContainerProps
}: DropdownFieldProps): JSX.Element => {
  const { i18n } = useTranslation()
  const rules = useMemo(() => {
    return createDropdownValidationRules(schema, disableRequiredValidation)
  }, [schema, disableRequiredValidation])

  const { control } = useFormContext<SingleAnswerFieldInput>()

  const selectedLanguage = i18n.language as Language

  const fieldOptions: ComboboxItem[] = useMemo(() => {
    const englishFieldOptions = schema.fieldOptions
    const fieldOptionsTranslations = schema?.fieldOptionsTranslations ?? []

    const translationIdx = fieldOptionsTranslations.findIndex((translation) => {
      return translation.language === selectedLanguage
    })

    // Check if translations for field options exist and whether
    // each field option has its own respective translation. If not
    // render the default field options in English.
    if (
      translationIdx !== -1 &&
      fieldOptionsTranslations[translationIdx].translation.length ===
        englishFieldOptions.length
    ) {
      const translatedFieldOptions =
        fieldOptionsTranslations[translationIdx].translation

      // The label will be the translated option while the value is the
      // default English option so that upon form submission, the value recorded
      // will be the default english option. The indexes of the translated options
      // and the default English options are corresponding with each other.
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
          />
        )}
      />
    </FieldContainer>
  )
}
