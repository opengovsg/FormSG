import { IAttachmentField } from './attachmentField'
import { ICheckboxField } from './checkboxField'
import { IDateField } from './dateField'
import { IDecimalField } from './decimalField'
import { IDropdownField } from './dropdownField'
import { IEmailField } from './emailField'
import { IHomenoField } from './homeNoField'
import { IImageField } from './imageField'
import { ILongTextField } from './longTextField'
import { IMobileField } from './mobileField'
import { INricField } from './nricField'
import { INumberField } from './numberField'
import { IRadioField } from './radioField'
import { IRatingField } from './ratingField'
import { ISectionField } from './sectionField'
import { IShortTextField } from './shortTextField'
import { IStatementField } from './statementField'
import { ITableField } from './tableField'
import { IYesNoField } from './yesNoField'

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
export * from './tableField'
export * from './yesNoField'

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
