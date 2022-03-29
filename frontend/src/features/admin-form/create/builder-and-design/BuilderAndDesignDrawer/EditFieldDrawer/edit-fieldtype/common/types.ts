import { MutateOptions } from 'react-query'

import { FieldBase, FieldCreateDto, FormFieldDto } from '~shared/types/field'

export type FieldMutateOptions = MutateOptions<
  FormFieldDto,
  Error,
  FieldCreateDto,
  unknown
>

export type EditFieldProps<T extends FieldBase> = {
  field: T
  isLoading: boolean
  isPendingField: boolean
  handleChange: (field: T) => void
  handleSave: (field: T, options?: FieldMutateOptions) => void
  handleCancel: () => void
}
