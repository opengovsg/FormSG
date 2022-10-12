import { CountryRegion } from '~shared/constants/countryRegion'
import {
  BasicField,
  CountryRegionFieldBase,
  FormFieldWithId,
} from '~shared/types/field'

import { createCountryRegionValidationRules } from '~utils/fieldValidation'
import DropdownField from '~templates/Field/Dropdown'

import { BaseFieldProps } from '../FieldContainer'

export type CountryRegionFieldSchema = FormFieldWithId<CountryRegionFieldBase>
export interface CountryRegionFieldProps extends BaseFieldProps {
  schema: CountryRegionFieldSchema
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
}: CountryRegionFieldProps): JSX.Element => {
  return (
    <DropdownField
      schema={{
        ...schema,
        fieldType: BasicField.Dropdown,
        fieldOptions: SORTED_COUNTRY_OPTIONS,
      }}
      validationRules={createCountryRegionValidationRules}
    />
  )
}
