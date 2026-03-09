import { MutateOptions } from 'react-query'

import { FieldBase, FieldCreateDto, FormFieldDto } from 'formsg-shared/types/field'

export type FieldMutateOptions = MutateOptions<
  FormFieldDto,
  Error,
  FieldCreateDto,
  unknown
>

export type EditFieldProps<T extends FieldBase> = {
  field: T & {
    _id?: FormFieldDto['_id']
  }
}
