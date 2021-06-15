import { IAttachmentField, IAttachmentFieldSchema } from './attachmentField'
import { ICheckboxField, ICheckboxFieldSchema } from './checkboxField'
import { IDateField, IDateFieldSchema } from './dateField'
import { IDecimalField, IDecimalFieldSchema } from './decimalField'
import { IDropdownField, IDropdownFieldSchema } from './dropdownField'
import { IEmailField, IEmailFieldSchema } from './emailField'
import { IHomenoField, IHomenoFieldSchema } from './homeNoField'
import { IImageField, IImageFieldSchema } from './imageField'
import { ILongTextField, ILongTextFieldSchema } from './longTextField'
import { IMobileField, IMobileFieldSchema } from './mobileField'
import { INricField, INricFieldSchema } from './nricField'
import { INumberField, INumberFieldSchema } from './numberField'
import { IRadioField, IRadioFieldSchema } from './radioField'
import { IRatingField, IRatingFieldSchema } from './ratingField'
import { ISectionField, ISectionFieldSchema } from './sectionField'
import { IShortTextField, IShortTextFieldSchema } from './shortTextField'
import { IStatementField, IStatementFieldSchema } from './statementField'
import { ITableField, ITableFieldSchema } from './tableField'
import { IYesNoField, IYesNoFieldSchema } from './yesNoField'

export * from './fieldTypes'
export * from './baseField'
export * from './attachmentField'
export * from './checkboxField'
export * from './dateField'
export * from './decimalField'
export * from './dropdownField'
export * from './emailField'
export * from './homeNoField'
export * from './imageField'
export * from './longTextField'
export * from './mobileField'
export * from './myinfoField'
export * from './nricField'
export * from './numberField'
export * from './radioField'
export * from './ratingField'
export * from './sectionField'
export * from './shortTextField'
export * from './statementField'
export * from './tableField'
export * from './yesNoField'

export type FormFieldSchema =
  | IAttachmentFieldSchema
  | ICheckboxFieldSchema
  | IDateFieldSchema
  | IDecimalFieldSchema
  | IDropdownFieldSchema
  | IEmailFieldSchema
  | IHomenoFieldSchema
  | IImageFieldSchema
  | ILongTextFieldSchema
  | IMobileFieldSchema
  | INricFieldSchema
  | INumberFieldSchema
  | IRadioFieldSchema
  | IRatingFieldSchema
  | ISectionFieldSchema
  | IShortTextFieldSchema
  | IStatementFieldSchema
  | ITableFieldSchema
  | IYesNoFieldSchema

export type FormField =
  | IAttachmentField
  | ICheckboxField
  | IDateField
  | IDecimalField
  | IDropdownField
  | IEmailField
  | IHomenoField
  | IImageField
  | ILongTextField
  | IMobileField
  | INricField
  | INumberField
  | IRadioField
  | IRatingField
  | ISectionField
  | IShortTextField
  | IStatementField
  | ITableField
  | IYesNoField

/**
 * Form field POJO with id
 */
export type FormFieldWithId = FormField & { _id: string }
