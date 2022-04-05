import { Country } from '~shared/constants/countries'
import {
  BasicField,
  DropdownFieldBase,
  FormFieldWithId,
} from '~shared/types/field'

import DropdownField from '~templates/Field/Dropdown'

import { BaseFieldProps } from '../FieldContainer'

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
