import { Result } from 'neverthrow'

import { IPopulatedForm, IUserSchema } from '../../../../types'
import { ForbiddenFormError } from '../form.errors'

export enum PermissionLevel {
  Read = 'read',
  Write = 'write',
  Delete = 'delete',
}

export type AssertFormFn = (
  user: IUserSchema,
  form: IPopulatedForm,
) => Result<true, ForbiddenFormError>
