import { useMemo } from 'react'
import { Controller, useFormContext } from 'react-hook-form'

import { CountryRegion } from '~shared/constants/countryRegion'
import { FormColorTheme } from '~shared/types'
import { CountryRegionFieldBase, FormFieldWithId } from '~shared/types/field'

import { createCountryRegionValidationRules } from '~utils/fieldValidation'
import { SingleSelect } from '~components/Dropdown'

import { BaseFieldProps, FieldContainer } from '../FieldContainer'
import { SingleAnswerFieldInput } from '../types'

export type CountryRegionFieldSchema = FormFieldWithId<CountryRegionFieldBase>
export interface CountryRegionFieldProps extends BaseFieldProps {
  schema: CountryRegionFieldSchema
  disableRequiredValidation?: boolean
}

// Exported for testing
export const SORTED_COUNTRY_OPTIONS = (() => {
  const countryOptions = Object.values(CountryRegion)
    .filter((country) => country !== CountryRegion.Singapore)
    .sort((a, b) => a.localeCompare(b))
  countryOptions.unshift(CountryRegion.Singapore)
  return countryOptions
})()

export const CountryRegionField = ({
  schema,
  disableRequiredValidation,
  colorTheme = FormColorTheme.Blue,
  selectedLanguage: language,
  ...fieldContainerProps
}: CountryRegionFieldProps): JSX.Element => {
  const schemaWithFieldOptions = useMemo(() => {
    return {
      ...schema,
      fieldOptions: SORTED_COUNTRY_OPTIONS,
    }
  }, [schema])

  const rules = useMemo(() => {
    return createCountryRegionValidationRules(
      schemaWithFieldOptions,
      disableRequiredValidation,
    )
  }, [schemaWithFieldOptions, disableRequiredValidation])

  const { control } = useFormContext<SingleAnswerFieldInput>()

  return (
    <FieldContainer
      schema={schemaWithFieldOptions}
      {...fieldContainerProps}
      selectedLanguage={language}
    >
      <Controller
        control={control}
        rules={rules}
        name={schemaWithFieldOptions._id}
        defaultValue=""
        render={({ field }) => (
          <SingleSelect
            colorScheme={`theme-${colorTheme}`}
            items={schemaWithFieldOptions.fieldOptions}
            {...field}
          />
        )}
      />
    </FieldContainer>
  )
}
