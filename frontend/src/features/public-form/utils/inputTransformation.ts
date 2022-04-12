import { format } from 'date-fns'

import { BasicField, FormFieldDto } from '~shared/types/field'
import {
  AttachmentResponse,
  CheckboxResponse,
  FieldResponse,
  HeaderResponse,
  RadioResponse,
  TableResponse,
  TableRow,
} from '~shared/types/response'
import { removeAt } from '~shared/utils/immutable-array-fns'

import { CHECKBOX_OTHERS_INPUT_VALUE } from '~templates/Field/Checkbox/CheckboxField'
import { RADIO_OTHERS_INPUT_VALUE } from '~templates/Field/Radio/RadioField'
import {
  AttachmentFieldSchema,
  BaseFieldOutput,
  CheckboxFieldSchema,
  CheckboxFieldValues,
  DateFieldSchema,
  EmailFieldSchema,
  FormFieldValue,
  MobileFieldSchema,
  RadioFieldSchema,
  RadioFieldValues,
  SectionFieldSchema,
  SingleAnswerOutput,
  TableFieldSchema,
  TableFieldValues,
  VerifiableAnswerOutput,
  VerifiableFieldValues,
} from '~templates/Field/types'

export class InputValidationError extends Error {
  constructor(schemaId: string, input: unknown) {
    super(`${schemaId}: 'Invalid input: ${JSON.stringify(input)}'`)
    this.name = 'InputValidationError'
  }
}

const pickBaseOutputFromSchema = <F extends FormFieldDto>(
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
  input: VerifiableFieldValues,
): VerifiableAnswerOutput<F> => {
  return {
    ...pickBaseOutputFromSchema(schema),
    answer: input.value,
    signature: input.signature,
  }
}

const transformToSingleAnswerOutput = <F extends FormFieldDto>(
  schema: F,
  input: string,
): SingleAnswerOutput<F> => {
  return {
    ...pickBaseOutputFromSchema(schema),
    answer: input,
  }
}

const transformToDateOutput = (
  schema: DateFieldSchema,
  input: string,
): SingleAnswerOutput<DateFieldSchema> => {
  // Convert ISO8601 "yyyy-mm-dd" format to "DD MMM YYYY" format.
  // Above date validation ensures original format is valid, and `new Date()` will be a valid date.
  const formattedDate = format(new Date(input), 'dd MMM yyyy')

  return {
    ...pickBaseOutputFromSchema(schema),
    answer: formattedDate,
  }
}

const transformToTableOutput = (
  schema: TableFieldSchema,
  input: TableFieldValues,
): TableResponse => {
  // Build table shape
  const orderedColumnIds = schema.columns.map((col) => col._id)
  const answerArray = input.map(
    (rowResponse) =>
      orderedColumnIds.map((colId) => rowResponse[colId] ?? '') as TableRow,
  )
  return {
    ...pickBaseOutputFromSchema(schema),
    answerArray,
  }
}

const transformToAttachmentOutput = (
  schema: AttachmentFieldSchema,
  input: File,
): AttachmentResponse => {
  return {
    ...pickBaseOutputFromSchema(schema),
    answer: input.name,
  }
}

const transformToCheckboxOutput = (
  schema: CheckboxFieldSchema,
  input: CheckboxFieldValues,
): CheckboxResponse => {
  const othersIndex = input.value.findIndex(
    (v) => v === CHECKBOX_OTHERS_INPUT_VALUE,
  )
  let answerArray = []
  // Others is checked, so we need to add the input at othersInput to the answer array
  if (othersIndex !== -1) {
    answerArray = removeAt(input.value, othersIndex)
    answerArray.push(`Others: ${input.othersInput}`)
  } else {
    answerArray = input.value
  }
  return {
    ...pickBaseOutputFromSchema(schema),
    answerArray,
  }
}

const transformToRadioOutput = (
  schema: RadioFieldSchema,
  input: RadioFieldValues,
): RadioResponse => {
  let answer = input.value
  const isOthersInput = answer === RADIO_OTHERS_INPUT_VALUE
  // Others is selected, so we need to use the input at othersInput for the answer instead.
  if (isOthersInput) {
    answer = `Others: ${input.othersInput}`
  }
  return {
    ...pickBaseOutputFromSchema(schema),
    answer,
  }
}

const transformToSectionOutput = (
  schema: SectionFieldSchema,
): HeaderResponse => {
  return {
    ...pickBaseOutputFromSchema(schema),
    answer: '',
    isHeader: true,
  }
}

/**
 * Transforms form inputs to their desire output shapes for sending to the server
 * @param field schema to retrieve base field info
 * @param input the input corresponding to the field in the form
 * @returns If field type does not need an output, `undefined` is returned. Otherwise returns the transformed output.
 * @throws `InputValidationError` if the input is invalid
 */
export const transformInputsToOutputs = (
  field: FormFieldDto,
  input: FormFieldValue,
): FieldResponse | undefined => {
  switch (field.fieldType) {
    case BasicField.Section:
      return transformToSectionOutput(field)
    case BasicField.Checkbox:
      return transformToCheckboxOutput(
        field,
        input as FormFieldValue<typeof field.fieldType>,
      )
    case BasicField.Radio:
      return transformToRadioOutput(
        field,
        input as FormFieldValue<typeof field.fieldType>,
      )
    case BasicField.Table:
      return transformToTableOutput(
        field,
        input as FormFieldValue<typeof field.fieldType>,
      )
    case BasicField.Email:
    case BasicField.Mobile:
      return transformToVerifiableOutput(
        field,
        input as FormFieldValue<typeof field.fieldType>,
      )
    case BasicField.Attachment:
      return transformToAttachmentOutput(
        field,
        input as FormFieldValue<typeof field.fieldType>,
      )
    case BasicField.Date:
      return transformToDateOutput(
        field,
        input as FormFieldValue<typeof field.fieldType>,
      )
    case BasicField.Number:
    case BasicField.Decimal:
    case BasicField.ShortText:
    case BasicField.LongText:
    case BasicField.HomeNo:
    case BasicField.Dropdown:
    case BasicField.Rating:
    case BasicField.Nric:
    case BasicField.Uen:
    case BasicField.YesNo:
      return transformToSingleAnswerOutput(
        field,
        input as FormFieldValue<typeof field.fieldType>,
      )
    case BasicField.Statement:
    case BasicField.Image:
      // No output needed.
      return undefined
  }
}
