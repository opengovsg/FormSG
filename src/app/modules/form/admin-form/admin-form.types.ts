import { Result } from 'neverthrow'

import { EditFieldActions } from '../../../../shared/constants'
import {
  IFieldSchema,
  IForm,
  IPopulatedForm,
  IUserSchema,
  ResponseMode,
} from '../../../../types'
import { ForbiddenFormError } from '../form.errors'

import { EditFieldError } from './admin-form.errors'

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
} & (
  | {
      responseMode: ResponseMode.Email
      emails: string | string[]
    }
  | {
      responseMode: ResponseMode.Encrypt
      publicKey: string
    }
)

export type OverrideProps = {
  endPage?: IForm['endPage']
  startPage?: IForm['startPage']
  admin: string
  title: string
  responseMode: ResponseMode
  emails?: string | string[]
  publicKey?: string
}

export type EditFormFieldParams = {
  field: IFieldSchema
} & (
  | {
      action: {
        name: Exclude<EditFieldActions, EditFieldActions.Reorder>
      }
    }
  | {
      action: {
        name: EditFieldActions.Reorder
        position: number
      }
    }
)

export type FormUpdateParams = {
  editFormField?: EditFormFieldParams
  authType?: IForm['authType']
  emails?: IForm['emails']
  esrvcId?: IForm['esrvcId']
  form_logics?: IForm['form_logics']
  hasCaptcha?: IForm['hasCaptcha']
  inactiveMessage?: IForm['inactiveMessage']
  permissionList?: IForm['permissionList']
  status?: IForm['status']
  title?: IForm['title']
  webhook?: IForm['webhook']
}

export type EditFormFieldResult = Result<IFieldSchema[], EditFieldError>
