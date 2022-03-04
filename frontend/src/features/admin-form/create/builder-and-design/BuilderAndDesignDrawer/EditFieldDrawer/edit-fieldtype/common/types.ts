import { MutateOptions } from 'react-query'

import { FieldCreateDto, FormFieldDto } from '~shared/types/field'

export type FieldMutateOptions = MutateOptions<
  FormFieldDto,
  Error,
  FieldCreateDto,
  unknown
>
