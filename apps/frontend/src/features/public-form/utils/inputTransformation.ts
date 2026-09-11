import {
  AddressCompoundFieldResponseV3,
  AttachmentFieldResponseV3,
  CheckboxFieldResponsesV3,
  ChildrenCompoundFieldResponsesV3,
  FieldResponseAnswerMapV3,
  RadioFieldResponsesV3,
  SignatureFieldResponseV3,
  TableFieldResponsesV3,
  VerifiableFieldResponseV3,
  YesNoFieldResponseV3,
} from 'formsg-shared/types'
import { BasicField, FormFieldDto } from 'formsg-shared/types/field'
import {
  AddressResponse,
  AttachmentResponse,
  CheckboxResponse,
  ChildBirthRecordsResponse,
  FieldResponse,
  HeaderResponse,
  RadioResponse,
  SignatureResponse,
  TableResponse,
} from 'formsg-shared/types/response'
import {
  computeAddressAnswerValue,
  computeAttachmentAnswerValue,
  computeCheckboxAnswerValue,
  computeChildrenAnswerValue,
  computeDateAnswerValue,
  computeRadioAnswerValue,
  computeSectionAnswerValue,
  computeSignatureAnswerValue,
  computeSingleAnswerValue,
  computeTableAnswerValue,
  computeVerifiableAnswerValue,
  computeYesNoAnswerValue,
  throwUnsupportedFieldType,
} from 'formsg-shared/utils/response-value-rules'

import {
  AddressCompoundFieldSchema,
  AddressCompoundFieldValues,
  AttachmentFieldSchema,
  BaseFieldOutput,
  CheckboxFieldSchema,
  CheckboxFieldValues,
  ChildrenCompoundFieldSchema,
  ChildrenCompoundFieldValues,
  DateFieldSchema,
  EmailFieldSchema,
  FormFieldValue,
  MobileFieldSchema,
  RadioFieldSchema,
  RadioFieldValues,
  SectionFieldSchema,
  SignatureFieldSchema,
  SignatureFieldValues,
  SingleAnswerOutput,
  TableFieldSchema,
  TableFieldValues,
  VerifiableAnswerOutput,
  VerifiableFieldValues,
  YesNoFieldSchema,
  YesNoFieldValue,
} from '~templates/Field/types'

/**
 * The frontend half of the storage-mode V1 producer: it reads the field schema
 * and the react-hook-form input, then hands the plain values to the shared
 * per-field-type value rules in `formsg-shared/utils/response-value-rules`.
 *
 * No answer value is computed here. The rules are shared because the backend's
 * V4-to-V1 flatten has to produce byte-identical entries; a second copy of the
 * trim, the date reformat, the table question composition or the checkbox
 * Others repositioning would drift.
 */

export const pickBaseOutputFromSchema = <F extends FormFieldDto>(
  schema: F,
): BaseFieldOutput<F> => {
  return {
    _id: schema._id,
    fieldType: schema.fieldType,
    question: schema.title,
  }
}

const transformToVerifiableOutput = <
  F extends EmailFieldSchema | MobileFieldSchema,
>(
  schema: F,
  input?: VerifiableFieldValues | VerifiableFieldResponseV3,
): VerifiableAnswerOutput<F> => {
  return {
    ...pickBaseOutputFromSchema(schema),
    ...computeVerifiableAnswerValue(input),
  }
}

const transformToSingleAnswerOutput = <F extends FormFieldDto>(
  schema: F,
  input?: string,
): SingleAnswerOutput<F> => {
  return {
    ...pickBaseOutputFromSchema(schema),
    ...computeSingleAnswerValue(input),
  }
}

const transformToDateOutput = (
  schema: DateFieldSchema,
  input?: string,
): SingleAnswerOutput<DateFieldSchema> => {
  return {
    ...pickBaseOutputFromSchema(schema),
    ...computeDateAnswerValue(input),
  }
}

const transformToYesNoOutput = (
  schema: YesNoFieldSchema,
  input?: YesNoFieldValue | YesNoFieldResponseV3,
): SingleAnswerOutput<YesNoFieldSchema> => {
  return {
    ...pickBaseOutputFromSchema(schema),
    ...computeYesNoAnswerValue(input),
  }
}

const transformToTableOutput = (
  schema: TableFieldSchema,
  input?: TableFieldValues | TableFieldResponsesV3,
): TableResponse => {
  return {
    ...pickBaseOutputFromSchema(schema),
    // The table rule also returns `question`, overriding the schema title with
    // one that names the columns.
    ...computeTableAnswerValue({
      title: schema.title,
      columns: schema.columns,
      minimumRows: schema.minimumRows,
      input,
    }),
  }
}

const transformToAttachmentOutput = (
  schema: AttachmentFieldSchema,
  input?: File,
): AttachmentResponse => {
  return {
    ...pickBaseOutputFromSchema(schema),
    ...computeAttachmentAnswerValue(input?.name),
  }
}

const transformToCheckboxOutput = (
  schema: CheckboxFieldSchema,
  input?: CheckboxFieldValues | CheckboxFieldResponsesV3,
): CheckboxResponse => {
  return {
    ...pickBaseOutputFromSchema(schema),
    ...computeCheckboxAnswerValue(input),
  }
}

const transformToRadioOutput = (
  schema: RadioFieldSchema,
  input?: RadioFieldValues | RadioFieldResponsesV3,
): RadioResponse => {
  return {
    ...pickBaseOutputFromSchema(schema),
    ...computeRadioAnswerValue(input),
  }
}

const transformToSectionOutput = (
  schema: SectionFieldSchema,
): HeaderResponse => {
  return {
    ...pickBaseOutputFromSchema(schema),
    ...computeSectionAnswerValue(),
  }
}

const transformToSignatureOutput = (
  schema: SignatureFieldSchema,
  input?: SignatureFieldValues | SignatureFieldResponseV3,
): SignatureResponse => {
  return {
    ...pickBaseOutputFromSchema(schema),
    ...computeSignatureAnswerValue(input),
  }
}

const transformToChildOutput = (
  schema: ChildrenCompoundFieldSchema,
  input?: ChildrenCompoundFieldValues | ChildrenCompoundFieldResponsesV3,
): ChildBirthRecordsResponse => {
  return {
    ...pickBaseOutputFromSchema(schema),
    ...computeChildrenAnswerValue({
      numberOfSubFields: schema.childrenSubFields?.length,
      input,
    }),
  }
}

const transformToAddressOutput = (
  schema: AddressCompoundFieldSchema,
  input?: AddressCompoundFieldValues | AddressCompoundFieldResponseV3,
): AddressResponse => {
  return {
    ...pickBaseOutputFromSchema(schema),
    ...computeAddressAnswerValue(input),
  }
}

type FormFieldValueOrFieldResponseAnswerV3<T extends BasicField> =
  | FormFieldValue<T>
  | FieldResponseAnswerMapV3<T>

/**
 * Transforms form inputs to their desire output shapes for sending to the server
 * @param field schema to retrieve base field info
 * @param input the input corresponding to the field in the form
 * @returns If field type does not need an output, `null` is returned. Otherwise returns the transformed output.
 */
export const transformInputsToOutputs = (
  field: FormFieldDto,
  input?: Exclude<
    FormFieldValue | FieldResponseAnswerMapV3,
    AttachmentFieldResponseV3
  >,
): FieldResponse | null => {
  switch (field.fieldType) {
    case BasicField.Section:
      return transformToSectionOutput(field)
    case BasicField.Checkbox:
      return transformToCheckboxOutput(
        field,
        input as FormFieldValueOrFieldResponseAnswerV3<typeof field.fieldType>,
      )
    case BasicField.Radio:
      return transformToRadioOutput(
        field,
        input as FormFieldValueOrFieldResponseAnswerV3<typeof field.fieldType>,
      )
    case BasicField.Table:
      return transformToTableOutput(
        field,
        input as FormFieldValueOrFieldResponseAnswerV3<typeof field.fieldType>,
      )
    case BasicField.Email:
    case BasicField.Mobile:
      return transformToVerifiableOutput(
        field,
        input as FormFieldValueOrFieldResponseAnswerV3<typeof field.fieldType>,
      )
    case BasicField.Attachment:
      return transformToAttachmentOutput(
        field,
        input as FormFieldValue<typeof field.fieldType>,
      )
    case BasicField.Date:
      return transformToDateOutput(
        field,
        input as FormFieldValueOrFieldResponseAnswerV3<typeof field.fieldType>,
      )
    case BasicField.YesNo:
      return transformToYesNoOutput(
        field,
        input as FormFieldValueOrFieldResponseAnswerV3<typeof field.fieldType>,
      )
    case BasicField.Number:
    case BasicField.Decimal:
    case BasicField.ShortText:
    case BasicField.LongText:
    case BasicField.HomeNo:
    case BasicField.Dropdown:
    case BasicField.CountryRegion:
    case BasicField.Rating:
    case BasicField.Nric:
    case BasicField.Uen:
      return transformToSingleAnswerOutput(
        field,
        input as FormFieldValueOrFieldResponseAnswerV3<typeof field.fieldType>,
      )
    case BasicField.Statement:
    case BasicField.Image:
      // No output needed.
      return null
    case BasicField.Children:
      return transformToChildOutput(
        field,
        input as FormFieldValueOrFieldResponseAnswerV3<typeof field.fieldType>,
      )
    case BasicField.Address:
      return transformToAddressOutput(
        field,
        input as FormFieldValueOrFieldResponseAnswerV3<typeof field.fieldType>,
      )
    case BasicField.Signature:
      return transformToSignatureOutput(
        field,
        input as FormFieldValueOrFieldResponseAnswerV3<typeof field.fieldType>,
      )
    default:
      return throwUnsupportedFieldType(field)
  }
}
