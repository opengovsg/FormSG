import type { Document } from 'mongoose'
import type { ConditionalExcept, Merge } from 'type-fest'

import type { IAttachmentFieldSchema } from './attachmentField'
import type { ICheckboxFieldSchema } from './checkboxField'
import type { ICountryRegionFieldSchema } from './countryRegionField'
import type { IDateFieldSchema } from './dateField'
import type { IDecimalFieldSchema } from './decimalField'
import type { IDropdownFieldSchema } from './dropdownField'
import type { IEmailFieldSchema } from './emailField'
import type { IHomenoFieldSchema } from './homeNoField'
import type { IImageFieldSchema } from './imageField'
import type { ILongTextFieldSchema } from './longTextField'
import type { IMobileFieldSchema } from './mobileField'
import type { INricFieldSchema } from './nricField'
import type { INumberFieldSchema } from './numberField'
import type { IRadioFieldSchema } from './radioField'
import type { IRatingFieldSchema } from './ratingField'
import type { ISectionFieldSchema } from './sectionField'
import type { IShortTextFieldSchema } from './shortTextField'
import type { IStatementFieldSchema } from './statementField'
import type { ITableFieldSchema } from './tableField'
import type { IUenFieldSchema } from './uenField'
import type { IYesNoFieldSchema } from './yesNoField'

export * from './attachmentField'
export * from './baseField'
export * from './checkboxField'
export * from './dateField'
export * from './decimalField'
export * from './dropdownField'
export * from './countryRegionField'
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
export * from './uenField'
export * from './yesNoField'

export enum SPCPFieldTitle {
  SpNric = 'SingPass Validated NRIC',
  CpUid = 'CorpPass Validated UID',
  CpUen = 'CorpPass Validated UEN',
}

export enum SgidFieldTitle {
  SgidNric = 'sgID Validated NRIC',
}

export type FormFieldSchema =
  | IAttachmentFieldSchema
  | ICheckboxFieldSchema
  | IDateFieldSchema
  | IDecimalFieldSchema
  | IDropdownFieldSchema
  | ICountryRegionFieldSchema
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
  | IUenFieldSchema
  | IYesNoFieldSchema

/**
 * Helper type to only retain from FormFieldSchema the props required to create
 * a validator for that field.
 * I have created a monster.
 */
export type OmitUnusedValidatorProps<F extends FormFieldSchema> = Merge<
  Omit<
    // Remove all functions from the given field schema.
    // eslint-disable-next-line @typescript-eslint/ban-types
    ConditionalExcept<F, Function>,
    // Remove unused
    'disabled' | 'description' | keyof Document
  >,
  // Omitting keyof Document removes the _id prop, but it is still needed for
  // some validator functions.
  { _id?: F['_id'] }
>

export type FieldValidationSchema =
  | OmitUnusedValidatorProps<IAttachmentFieldSchema>
  | OmitUnusedValidatorProps<ICheckboxFieldSchema>
  | OmitUnusedValidatorProps<IDateFieldSchema>
  | OmitUnusedValidatorProps<IDecimalFieldSchema>
  | OmitUnusedValidatorProps<IDropdownFieldSchema>
  | OmitUnusedValidatorProps<ICountryRegionFieldSchema>
  | OmitUnusedValidatorProps<IEmailFieldSchema>
  | OmitUnusedValidatorProps<IHomenoFieldSchema>
  | OmitUnusedValidatorProps<IImageFieldSchema>
  | OmitUnusedValidatorProps<ILongTextFieldSchema>
  | OmitUnusedValidatorProps<IMobileFieldSchema>
  | OmitUnusedValidatorProps<INricFieldSchema>
  | OmitUnusedValidatorProps<INumberFieldSchema>
  | OmitUnusedValidatorProps<IRadioFieldSchema>
  | OmitUnusedValidatorProps<IRatingFieldSchema>
  | OmitUnusedValidatorProps<ISectionFieldSchema>
  | OmitUnusedValidatorProps<IShortTextFieldSchema>
  | OmitUnusedValidatorProps<IStatementFieldSchema>
  | OmitUnusedValidatorProps<ITableFieldSchema>
  | OmitUnusedValidatorProps<IUenFieldSchema>
  | OmitUnusedValidatorProps<IYesNoFieldSchema>
