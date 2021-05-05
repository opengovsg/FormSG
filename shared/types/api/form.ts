import { SetRequired, Merge } from 'type-fest'
import { FormField } from '../form'

import { EndPage, FormFieldWithId, IField, IForm } from '../form'

export type FormDto = Merge<
  SetRequired<
    IForm,
    | 'form_fields'
    | 'form_logics'
    | 'permissionList'
    | 'hasCaptcha'
    | 'authType'
    | 'status'
    | 'inactiveMessage'
    | 'submissionLimit'
    | 'isListed'
  >,
  {
    startPage: SetRequired<NonNullable<IForm['startPage']>, 'colorTheme'>
    endPage: SetRequired<NonNullable<IForm['endPage']>, 'title' | 'buttonText'>
    webhook: SetRequired<NonNullable<IForm['webhook']>, 'url'>
  }
>

export type FormSettingsDto = Pick<
  FormDto,
  | 'authType'
  | 'emails'
  | 'esrvcId'
  | 'hasCaptcha'
  | 'inactiveMessage'
  | 'status'
  | 'submissionLimit'
  | 'title'
  | 'webhook'
>

export type SettingsUpdateDto = Partial<FormSettingsDto>

export type FieldUpdateDto = FormFieldWithId

export type FieldCreateDto = FormField

/**
 * Form field POJO with functions removed
 */
export type FormFieldDto = IField

export type EndPageUpdateDto = EndPage
