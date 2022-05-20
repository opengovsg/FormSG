import { UserDto } from '../user'
import { FormField } from '../field'

import { FormLogic } from './form_logic'
import { FormStartPage, FormEndPage, FormAuthType } from '../form'

export interface FormTemplateBase {
  title: string
  admin: UserDto['_id']

  form_fields: FormField[]
  form_logics: FormLogic[]

  startPage: FormStartPage
  endPage: FormEndPage

  hasCaptcha: boolean
  authType: FormAuthType
}

export type FormTemplateDto = FormTemplateBase
