import { Merge } from 'type-fest'

import {
  PAYMENT_CONTACT_FIELD_ID,
  PAYMENT_PRODUCT_FIELD_ID,
  PAYMENT_VARIABLE_INPUT_AMOUNT_FIELD_ID,
} from '~shared/constants'
import {
  ProductItemInput,
  SingleAnswerResponse,
  VerifiableResponseBase,
} from '~shared/types'
import {
  AttachmentFieldBase,
  BasicField,
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
  MyInfoChildAttributes,
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
import { ChildrenCompoundFieldBase } from '~shared/types/field/childrenCompoundField'

import { FormFieldWithQuestionNo } from '~features/form/types'

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
// Type for react-hook-form's FieldValues generic.
export type FormFieldValues = Record<
  FormFieldDto['_id'],
  FormFieldValue<FormFieldDto['fieldType']>
> & {
  [PAYMENT_CONTACT_FIELD_ID]?: { value: string }
  [PAYMENT_VARIABLE_INPUT_AMOUNT_FIELD_ID]?: string
  [PAYMENT_PRODUCT_FIELD_ID]?: ProductItemInput[]
}

export type AttachmentFieldInput = FieldInput<File | null>
export type CheckboxFieldInputs = FieldInput<CheckboxFieldValues>
export type RadioFieldInputs = FieldInput<RadioFieldValues>
export type TableFieldInputs = FieldInput<TableFieldValues>
export type YesNoFieldInput = FieldInput<YesNoFieldValue>
export type SingleAnswerFieldInput = FieldInput<SingleAnswerValue>
export type VerifiableFieldInput = FieldInput<VerifiableFieldValues>
export type ChildrenCompoundFieldInputs =
  FieldInput<ChildrenCompoundFieldValues>

export type FormFieldValue<F extends BasicField = BasicField> = F extends
  | BasicField.Number
  | BasicField.Decimal
  | BasicField.ShortText
  | BasicField.LongText
  | BasicField.HomeNo
  | BasicField.Dropdown
  | BasicField.Rating
  | BasicField.Nric
  | BasicField.Uen
  | BasicField.Date
  | BasicField.CountryRegion
  ? SingleAnswerValue
  : F extends BasicField.YesNo
    ? YesNoFieldValue
    : F extends BasicField.Attachment
      ? File
      : F extends BasicField.Email | BasicField.Mobile
        ? VerifiableFieldValues
        : F extends BasicField.Table
          ? TableFieldValues
          : F extends BasicField.Radio
            ? RadioFieldValues
            : F extends BasicField.Checkbox
              ? CheckboxFieldValues
              : F extends BasicField.Children
                ? ChildrenCompoundFieldValues
                : never

// Input values, what each field contains
export type SingleAnswerValue = string
export type MultiAnswerValue = string[]
export type YesNoFieldValue = 'Yes' | 'No'
export type VerifiableFieldValues = {
  signature?: string
  value: string
}
export type CheckboxFieldValues = {
  // Can be `false` if no changes were triggered on checkbox field.
  // Artifact of react-hook-form not knowing whether checkbox is an array or not.
  // Unable to use `{schema}.value.{index}` since value is a nested field value.
  value: string[] | false
  othersInput?: string
}
export type RadioFieldValues = {
  value: string
  othersInput?: string
}
export type TableRowFieldValue = {
  [columnId: string]: string
}
export type TableFieldValues = TableRowFieldValue[]

export type SingleAnswerOutput<F extends FormFieldDto> =
  SingleAnswerResponse & {
    fieldType: F['fieldType']
  }
export type VerifiableAnswerOutput<F extends FormFieldDto> = Merge<
  SingleAnswerOutput<F>,
  VerifiableResponseBase
>

export type ChildrenCompoundFieldValues = {
  // Each subarray represents one child value
  // e.g.
  // child : [['NAME', 'T12345678Z', 'VACCINATED'], ... ]
  // childFields: [name, bc number, vaxx status]
  child: string[][]
  // Array of attribute names
  childFields: MyInfoChildAttributes[]
}

// Various schemas used by different fields
export type SectionFieldSchema = FormFieldWithId<SectionFieldBase>
export type ParagraphFieldSchema = FormFieldWithId<StatementFieldBase>
export type ImageFieldSchema = FormFieldWithId<ImageFieldBase>

// With question number
export type AttachmentFieldSchema = FormFieldWithQuestionNo<AttachmentFieldBase>
export type CheckboxFieldSchema = FormFieldWithQuestionNo<CheckboxFieldBase>
export type DateFieldSchema = FormFieldWithQuestionNo<DateFieldBase>
export type DecimalFieldSchema = FormFieldWithQuestionNo<DecimalFieldBase>
export type DropdownFieldSchema = FormFieldWithQuestionNo<DropdownFieldBase>
export type EmailFieldSchema = FormFieldWithQuestionNo<EmailFieldBase>
export type HomeNoFieldSchema = FormFieldWithQuestionNo<HomenoFieldBase>
export type LongTextFieldSchema = FormFieldWithQuestionNo<LongTextFieldBase>
export type MobileFieldSchema = FormFieldWithQuestionNo<MobileFieldBase>
export type NricFieldSchema = FormFieldWithQuestionNo<NricFieldBase>
export type NumberFieldSchema = FormFieldWithQuestionNo<NumberFieldBase>
export type RadioFieldSchema = FormFieldWithQuestionNo<RadioFieldBase>
export type RatingFieldSchema = FormFieldWithQuestionNo<RatingFieldBase>
export type ShortTextFieldSchema = FormFieldWithQuestionNo<ShortTextFieldBase>
export type TableFieldSchema = FormFieldWithQuestionNo<TableFieldBase>
export type UenFieldSchema = FormFieldWithQuestionNo<UenFieldBase>
export type YesNoFieldSchema = FormFieldWithQuestionNo<YesNoFieldBase>
export type ChildrenCompoundFieldSchema =
  FormFieldWithQuestionNo<ChildrenCompoundFieldBase>
