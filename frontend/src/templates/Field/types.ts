import { Merge } from 'type-fest'

import {
  AttachmentFieldBase,
  CheckboxFieldBase,
  DateFieldBase,
  DecimalFieldBase,
  DropdownFieldBase,
  EmailFieldBase,
  FormFieldDto,
  FormFieldWithId,
  HomenoFieldBase,
  ImageFieldBase,
  LongTextFieldBase,
  MobileFieldBase,
  NricFieldBase,
  NumberFieldBase,
  RadioFieldBase,
  RatingFieldBase,
  SectionFieldBase,
  ShortTextFieldBase,
  StatementFieldBase,
  TableFieldBase,
  UenFieldBase,
  YesNoFieldBase,
} from '~shared/types/field'
import {
  SingleAnswerResponse,
  VerifiableResponseBase,
} from '~shared/types/response'

// Form field types to be composed by various fields
export type BaseFieldOutput<FF extends FormFieldDto> = {
  _id: FF['_id']
  fieldType: FF['fieldType']
  question: FF['title']
}

// Inputs to pass to react-hook-form for better type checking
export type FieldInput<Input> = {
  [schemaId: string]: Input
}

export type AttachmentFieldInput = FieldInput<File>
export type CheckboxFieldInputs = FieldInput<CheckboxFieldValues>
export type RadioFieldInputs = FieldInput<RadioFieldValues>
export type TableFieldInputs = FieldInput<TableFieldValues>
export type YesNoFieldInput = FieldInput<YesNoFieldValue>
export type SingleAnswerFieldInput = FieldInput<SingleAnswerValue>
export type VerifiableFieldInput = FieldInput<VerifiableFieldValues>

// Input values, what each field contains
export type SingleAnswerValue = string
export type MultiAnswerValue = string[]
export type YesNoFieldValue = 'Yes' | 'No'
export type VerifiableFieldValues = {
  signature?: string
  value: string
}
export type CheckboxFieldValues = {
  value: string[]
  othersInput?: string
}
export type RadioFieldValues = {
  value: string
  othersInput?: string
}
export type TableRowValues = {
  [columnId: string]: string
}
export type TableFieldValues = TableRowValues[]

export type SingleAnswerOutput<F extends FormFieldDto> =
  SingleAnswerResponse & {
    fieldType: F['fieldType']
  }
export type VerifiableAnswerOutput<F extends FormFieldDto> = Merge<
  SingleAnswerOutput<F>,
  VerifiableResponseBase
>

// Various schemas used by different fields
export type AttachmentFieldSchema = FormFieldWithId<AttachmentFieldBase>
export type CheckboxFieldSchema = FormFieldWithId<CheckboxFieldBase>
export type DateFieldSchema = FormFieldWithId<DateFieldBase>
export type DecimalFieldSchema = FormFieldWithId<DecimalFieldBase>
export type DropdownFieldSchema = FormFieldWithId<DropdownFieldBase>
export type EmailFieldSchema = FormFieldWithId<EmailFieldBase>
export type HomeNoFieldSchema = FormFieldWithId<HomenoFieldBase>
export type ImageFieldSchema = FormFieldWithId<ImageFieldBase>
export type LongTextFieldSchema = FormFieldWithId<LongTextFieldBase>
export type MobileFieldSchema = FormFieldWithId<MobileFieldBase>
export type NricFieldSchema = FormFieldWithId<NricFieldBase>
export type NumberFieldSchema = FormFieldWithId<NumberFieldBase>
export type ParagraphFieldSchema = FormFieldWithId<StatementFieldBase>
export type RadioFieldSchema = FormFieldWithId<RadioFieldBase>
export type RatingFieldSchema = FormFieldWithId<RatingFieldBase>
export type SectionFieldSchema = FormFieldWithId<SectionFieldBase>
export type ShortTextFieldSchema = FormFieldWithId<ShortTextFieldBase>
export type TableFieldSchema = FormFieldWithId<TableFieldBase>
export type UenFieldSchema = FormFieldWithId<UenFieldBase>
export type YesNoFieldSchema = FormFieldWithId<YesNoFieldBase>
