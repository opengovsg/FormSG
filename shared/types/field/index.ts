import { AttachmentFieldBase } from './attachmentField'
import { CheckboxFieldBase } from './checkboxField'
import { DateFieldBase } from './dateField'
import { DecimalFieldBase } from './decimalField'
import { DropdownFieldBase } from './dropdownField'
import { EmailFieldBase } from './emailField'
import { HomenoFieldBase } from './homeNoField'
import { ImageFieldBase } from './imageField'
import { LongTextFieldBase } from './longTextField'
import { MobileFieldBase } from './mobileField'
import { NricFieldBase } from './nricField'
import { NumberFieldBase } from './numberField'
import { RadioFieldBase } from './radioField'
import { RatingFieldBase } from './ratingField'
import { SectionFieldBase } from './sectionField'
import { ShortTextFieldBase } from './shortTextField'
import { StatementFieldBase } from './statementField'
import { TableFieldBase, TableFieldDto } from './tableField'
import { UenFieldBase } from './uenField'
import { YesNoFieldBase } from './yesNoField'

export * from './attachmentField'
export * from './base'
export * from './checkboxField'
export * from './dateField'
export * from './decimalField'
export * from './dropdownField'
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

export type FormFieldWithId<T extends FormField = FormField> =
  T extends TableFieldBase
    ? TableFieldDto
    : T & {
        _id: string
      }

export type MyInfoFormField<T extends FormField = FormField> =
  FormFieldWithId<T> & {
    fieldValue?: string
  }

/**
 * Form field POJO with id
 */
export type FormFieldDto<T extends FormField = FormField> =
  | MyInfoFormField<T>
  | FormFieldWithId<T>

export type FieldCreateDto = FormField
export type FieldUpdateDto = FormFieldWithId
