import { format } from 'date-fns'
import { times } from 'lodash'

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
import { createTableRow } from '~templates/Field/Table/utils/createRow'
import {
  AttachmentFieldSchema,
  BaseFieldOutput,
  CheckboxFieldSchema,
  DateFieldSchema,
  EmailFieldSchema,
  MobileFieldSchema,
  RadioFieldSchema,
  SectionFieldSchema,
  SingleAnswerOutput,
  TableFieldSchema,
  VerifiableAnswerOutput,
  YesNoFieldSchema,
} from '~templates/Field/types'

import {
  validateAttachmentInput,
  validateCheckboxInput,
  validateDateInput,
  validateRadioInput,
  validateSingleAnswerInput,
  validateTableInput,
  validateVerifiableInput,
  validateYesNoInput,
} from './inputValidation'

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
  input: unknown,
): VerifiableAnswerOutput<F> => {
  if (
    input !== undefined &&
    (!validateVerifiableInput(input) ||
      (schema.isVerifiable && !input.signature))
  ) {
    throw new InputValidationError(schema._id, input)
  }
  return {
    ...pickBaseOutputFromSchema(schema),
    answer: input?.value ?? '',
    signature: input?.signature,
  }
}

const transformToSingleAnswerOutput = <F extends FormFieldDto>(
  schema: F,
  input: unknown,
): SingleAnswerOutput<F> => {
  if (input !== undefined && !validateSingleAnswerInput(input)) {
    throw new InputValidationError(schema._id, input)
  }
  return {
    ...pickBaseOutputFromSchema(schema),
    answer: input ?? '',
  }
}

const transformToYesNoOutput = (
  schema: YesNoFieldSchema,
  input: unknown,
): SingleAnswerOutput<YesNoFieldSchema> => {
  if (input !== undefined && !validateYesNoInput(input)) {
    throw new InputValidationError(schema._id, input)
  }
  return {
    ...pickBaseOutputFromSchema(schema),
    answer: input ?? '',
  }
}

const transformToDateOutput = (
  schema: DateFieldSchema,
  input: unknown,
): SingleAnswerOutput<DateFieldSchema> => {
  if (input !== undefined && !validateDateInput(input)) {
    throw new InputValidationError(schema._id, input)
  }
  // Convert ISO8601 "yyyy-mm-dd" format to "DD MMM YYYY" format.
  // Above date validation ensures original format is valid, and `new Date()` will be a valid date.
  const formattedDate = input ? format(new Date(input), 'dd MMM yyyy') : ''

  return {
    ...pickBaseOutputFromSchema(schema),
    answer: formattedDate,
  }
}

const transformToTableOutput = (
  schema: TableFieldSchema,
  input: unknown,
): TableResponse => {
  // Set default input if undefined.
  input = input ?? times(schema.minimumRows, () => createTableRow(schema))
  if (!validateTableInput(input)) {
    throw new InputValidationError(schema._id, input)
  }
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
  input: unknown,
): AttachmentResponse => {
  if (input !== undefined && !validateAttachmentInput(input)) {
    throw new InputValidationError(schema._id, input)
  }
  return {
    ...pickBaseOutputFromSchema(schema),
    answer: input?.name ?? '',
  }
}

const transformToCheckboxOutput = (
  schema: CheckboxFieldSchema,
  input: unknown,
): CheckboxResponse => {
  if (input !== undefined && !validateCheckboxInput(input)) {
    throw new InputValidationError(schema._id, input)
  }

  let answerArray: string[] = []
  if (input !== undefined && input.value) {
    const othersIndex = input.value.findIndex(
      (v) => v === CHECKBOX_OTHERS_INPUT_VALUE,
    )
    // Others is checked, so we need to add the input at othersInput to the answer array
    if (othersIndex !== -1) {
      answerArray = removeAt(input.value, othersIndex)
      answerArray.push(`Others: ${input.othersInput}`)
    } else {
      answerArray = input.value
    }
  }
  return {
    ...pickBaseOutputFromSchema(schema),
    answerArray,
  }
}

const transformToRadioOutput = (
  schema: RadioFieldSchema,
  input: unknown,
): RadioResponse => {
  if (input !== undefined && !validateRadioInput(input)) {
    throw new InputValidationError(schema._id, input)
  }

  let answer = ''
  if (input !== undefined) {
    answer = input.value
    const isOthersInput = answer === RADIO_OTHERS_INPUT_VALUE
    // Others is selected, so we need to use the input at othersInput for the answer instead.
    if (isOthersInput) {
      answer = `Others: ${input.othersInput}`
    }
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
  input: unknown,
): FieldResponse | undefined => {
  switch (field.fieldType) {
    case BasicField.Section:
      return transformToSectionOutput(field)
    case BasicField.Checkbox:
      return transformToCheckboxOutput(field, input)
    case BasicField.Radio:
      return transformToRadioOutput(field, input)
    case BasicField.Table:
      return transformToTableOutput(field, input)
    case BasicField.Email:
    case BasicField.Mobile:
      return transformToVerifiableOutput(field, input)
    case BasicField.Attachment:
      return transformToAttachmentOutput(field, input)
    case BasicField.Date:
      return transformToDateOutput(field, input)
    case BasicField.YesNo:
      return transformToYesNoOutput(field, input)
    case BasicField.Number:
    case BasicField.Decimal:
    case BasicField.ShortText:
    case BasicField.LongText:
    case BasicField.HomeNo:
    case BasicField.Dropdown:
    case BasicField.Rating:
    case BasicField.Nric:
    case BasicField.Uen:
      return transformToSingleAnswerOutput(field, input)
    case BasicField.Statement:
    case BasicField.Image:
      // No output needed.
      return undefined
  }
}
