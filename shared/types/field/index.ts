import type { AttachmentFieldBase } from './attachmentField'
import type { CheckboxFieldBase } from './checkboxField'
import type { CountryRegionFieldBase } from './countryRegionField'
import type { DateFieldBase } from './dateField'
import type { DecimalFieldBase } from './decimalField'
import type { DropdownFieldBase } from './dropdownField'
import type { EmailFieldBase } from './emailField'
import type { HomenoFieldBase } from './homeNoField'
import type { ImageFieldBase } from './imageField'
import type { LongTextFieldBase } from './longTextField'
import type { MobileFieldBase } from './mobileField'
import type { NricFieldBase } from './nricField'
import type { NumberFieldBase } from './numberField'
import type { RadioFieldBase } from './radioField'
import type { RatingFieldBase } from './ratingField'
import type { SectionFieldBase } from './sectionField'
import type { ShortTextFieldBase } from './shortTextField'
import type { StatementFieldBase } from './statementField'
import type { TableFieldBase, TableFieldDto } from './tableField'
import type { UenFieldBase } from './uenField'
import type { YesNoFieldBase } from './yesNoField'
import type { SetRequired } from 'type-fest'

export * from './attachmentField'
export * from './base'
export * from './checkboxField'
export * from './countryRegionField'
export * from './dateField'
export * from './decimalField'
export * from './dropdownField'
export * from './countryRegionField'
export * from './emailField'
export * from './homeNoField'
export * from './imageField'
export * from './longTextField'
export * from './mobileField'
export * from './nricField'
export * from './numberField'
export * from './radioField'
export * from './ratingField'
export * from './sectionField'
export * from './shortTextField'
export * from './statementField'
export * from './tableField'
export * from './uenField'
export * from './utils'
export * from './yesNoField'

export type FormField =
  | AttachmentFieldBase
  | CheckboxFieldBase
  | DateFieldBase
  | DecimalFieldBase
  | DropdownFieldBase
  | CountryRegionFieldBase
  | EmailFieldBase
  | HomenoFieldBase
  | ImageFieldBase
  | LongTextFieldBase
  | MobileFieldBase
  | NricFieldBase
  | NumberFieldBase
  | RadioFieldBase
  | RatingFieldBase
  | SectionFieldBase
  | ShortTextFieldBase
  | StatementFieldBase
  | TableFieldBase
  | UenFieldBase
  | YesNoFieldBase

// These types are extended through using MyInfoableFieldBase
// And might possibly be myInfo fields if the attribute is set
export type MyInfoField = SetRequired<
  DateFieldBase | DropdownFieldBase | MobileFieldBase | ShortTextFieldBase,
  'myInfo'
>

export type FormFieldWithId<T extends FormField = FormField> =
  T extends TableFieldBase ? TableFieldDto<T> : T & { _id: string }

// MyInfo type that's seen by the public
// This means that the values might be pre-filled
export type MyInfoFormField<T extends FormField = FormField> =
  FormFieldWithId<T> & {
    fieldValue?: string
  }

export type MyInfoPrefilledFormField = SetRequired<
  MyInfoFormField,
  'fieldValue'
>

/**
 * Form field POJO with id
 */
export type FormFieldDto<T extends FormField = FormField> =
  | MyInfoFormField<T>
  | FormFieldWithId<T>

export type FieldCreateDto =
  | (FormField & { myInfo?: MyInfoField['myInfo'] })
  | MyInfoField
export type FieldUpdateDto = FormFieldWithId
