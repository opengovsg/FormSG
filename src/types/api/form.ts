import { LeanDocument } from 'mongoose'
import { ConditionalPick, PartialDeep, Primitive } from 'type-fest'

import {
  FormField,
  FormFieldSchema,
  FormFieldWithId,
  IFieldSchema,
  IPossiblyPrefilledField,
} from '../field'
import {
  EndPage,
  FormSettings,
  IForm,
  IPopulatedForm,
  Permission,
  PublicForm,
  ResponseMode,
  StartPage,
} from '../form'
import { SpcpSession } from '../spcp'

import { EditFormFieldParams } from './field'

export type SettingsUpdateDto = PartialDeep<FormSettings>

export type FieldUpdateDto = FormFieldWithId

export type FieldCreateDto = FormField

/**
 * Form field POJO with functions removed
 */
export type FormFieldDto = ConditionalPick<
  LeanDocument<FormFieldSchema>,
  Primitive
>

export type PermissionsUpdateDto = Permission[]

export type EndPageUpdateDto = EndPage

export type StartPageUpdateDto = StartPage

export type FormViewDto = { form: IPopulatedForm }

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

// NOTE: This is needed because PublicForm inherits from IFormDocument (where form_fields has type of IFieldSchema).
// However, the form returned back to the client has form_field of two possible types
interface PossiblyPrefilledPublicForm extends Omit<PublicForm, 'form_fields'> {
  form_fields: IPossiblyPrefilledField[] | IFieldSchema[]
}

export type PublicFormViewDto = {
  form: PossiblyPrefilledPublicForm
  spcpSession?: SpcpSession
  isIntranetUser?: boolean
  myInfoError?: true
}
