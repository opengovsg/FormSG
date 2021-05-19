import { LeanDocument } from 'mongoose'
import { ConditionalPick, Primitive } from 'type-fest'

import { FormField, FormFieldSchema, FormFieldWithId } from '../field'
import { EndPage, FormSettings, Permission, StartPage } from '../form'

export type SettingsUpdateDto = Partial<FormSettings>

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
