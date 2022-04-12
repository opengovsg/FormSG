import { Country } from '~shared/constants/countries'
import {
  BasicField,
  DropdownFieldBase,
  FormFieldWithId,
} from '~shared/types/field'

import DropdownField from '~templates/Field/Dropdown'

import { BaseFieldProps } from '../FieldContainer'

// TODO: Change to CountryFieldBase when the new CountryField type is added in future PRs
export type CountryFieldSchema = FormFieldWithId<DropdownFieldBase>
export interface CountryFieldProps extends BaseFieldProps {
  schema: CountryFieldSchema
}

export const CountryField = ({ schema }: CountryFieldProps): JSX.Element => {
  return (
    <DropdownField
      schema={{
        ...schema,
        fieldType: BasicField.Dropdown,
        fieldOptions: Object.values(Country),
      }}
    />
  )
}
