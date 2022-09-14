import { CountryRegion } from '~shared/constants/countryRegion'
import {
  BasicField,
  CountryRegionFieldBase,
  FormFieldWithId,
} from '~shared/types/field'

import DropdownField from '~templates/Field/Dropdown'

import { BaseFieldProps } from '../FieldContainer'

export type CountryRegionFieldSchema = FormFieldWithId<CountryRegionFieldBase>
export interface CountryRegionFieldProps extends BaseFieldProps {
  schema: CountryRegionFieldSchema
}

const SORTED_COUNTRY_OPTIONS = Object.values(CountryRegion).sort((a, b) => {
  if (a === CountryRegion.Singapore) return 1
  return a.localeCompare(b)
})

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
    />
  )
}
