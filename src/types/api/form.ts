import { LeanDocument } from 'mongoose'
import { ConditionalPick, PartialDeep, Primitive } from 'type-fest'

import { FormField, FormFieldSchema, FormFieldWithId } from '../field'
import { EndPage, FormSettings, Permission } from '../form'

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
