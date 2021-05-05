import { IAttachmentFieldSchema } from './attachmentField'
import { ICheckboxFieldSchema } from './checkboxField'
import { IDateFieldSchema } from './dateField'
import { IDecimalFieldSchema } from './decimalField'
import { IDropdownFieldSchema } from './dropdownField'
import { IEmailFieldSchema } from './emailField'
import { IHomenoFieldSchema } from './homeNoField'
import { IImageFieldSchema } from './imageField'
import { ILongTextFieldSchema } from './longTextField'
import { IMobileFieldSchema } from './mobileField'
import { INricFieldSchema } from './nricField'
import { INumberFieldSchema } from './numberField'
import { IRadioFieldSchema } from './radioField'
import { IRatingFieldSchema } from './ratingField'
import { ISectionFieldSchema } from './sectionField'
import { IShortTextFieldSchema } from './shortTextField'
import { IStatementFieldSchema } from './statementField'
import { ITableFieldSchema } from './tableField'
import { IYesNoFieldSchema } from './yesNoField'

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
export * from './nricField'
export * from './numberField'
export * from './radioField'
export * from './ratingField'
export * from './sectionField'
export * from './shortTextField'
export * from './statementField'
export {IColumnSchema, ITableField, ITableFieldSchema} from './tableField'
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

