import { ParamsDictionary } from 'express-serve-static-core'

import { IFieldSchema, PublicForm } from 'src/types'

import { IPossiblyPrefilledField } from '../../myinfo/myinfo.types'

export type Metatags = {
  title: string
  description?: string
  appUrl: string
  images: string[]
  twitterImage: string
}

export type RedirectParams = ParamsDictionary & {
  state?: 'preview' | 'template' | 'use-template'
  // TODO(#144): Rename Id to formId after all routes have been updated.
  Id: string
}

// NOTE: This is needed because PublicForm inherits from IFormDocument (where form_fields has type of IFieldSchema).
// However, the form returned back to the client has form_field of two possible types
interface PossiblyPrefilledPublicForm extends Omit<PublicForm, 'form_fields'> {
  form_fields: IPossiblyPrefilledField[] | IFieldSchema[]
}

export interface IPublicFormView {
  form: PossiblyPrefilledPublicForm
  spcpSession?: { userName: string }
  isIntranetUser?: boolean
  myInfoError?: boolean
}
