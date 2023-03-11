import { MutateOptions } from '@tanstack/react-query'

import { FieldBase, FieldCreateDto, FormFieldDto } from '~shared/types/field'

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
