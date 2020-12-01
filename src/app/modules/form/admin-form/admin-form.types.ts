import { Result } from 'neverthrow'

import {
  IForm,
  IPopulatedForm,
  IUserSchema,
  ResponseMode,
} from '../../../../types'
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

export type DuplicateFormBody = {
  title: string
  isTemplate: boolean
  emails?: string | string[]
  publicKey?: string
  responseMode: ResponseMode
}

export type OverrideProps = {
  customLogo?: undefined
  endPage?: IForm['endPage']
  isNew: true
  admin: string
  title: string
  responseMode: ResponseMode
  emails?: string | string[]
  publicKey?: string
}
