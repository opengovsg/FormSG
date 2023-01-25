import { format, parse } from 'date-fns'
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
import { DATE_PARSE_FORMAT } from '~templates/Field/Date/DateField'
import { RADIO_OTHERS_INPUT_VALUE } from '~templates/Field/Radio/RadioField'
import { createTableRow } from '~templates/Field/Table/utils/createRow'
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
  YesNoFieldSchema,
  YesNoFieldValue,
} from '~templates/Field/types'

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
  input?: VerifiableFieldValues,
): VerifiableAnswerOutput<F> => {
  return {
    ...pickBaseOutputFromSchema(schema),
    answer: input?.value ?? '',
    signature: input?.signature,
  }
}

const transformToCountryRegionOutput = <F extends FormFieldDto>(
  schema: F,
  input?: string,
): SingleAnswerOutput<F> => {
  const singleAnswerOutput = transformToSingleAnswerOutput(schema, input)
  return {
    ...singleAnswerOutput,
    answer: singleAnswerOutput.answer.toUpperCase(),
  }
}

const transformToSingleAnswerOutput = <F extends FormFieldDto>(
  schema: F,
  input?: string,
): SingleAnswerOutput<F> => {
  return {
    ...pickBaseOutputFromSchema(schema),
    answer: input?.trim() ?? '',
  }
}

const transformToDateOutput = (
  schema: DateFieldSchema,
  input?: string,
): SingleAnswerOutput<DateFieldSchema> => {
  return {
    ...pickBaseOutputFromSchema(schema),
    // Convert input format to "DD MMM YYYY" format (if input exists).
    answer: input
      ? format(parse(input, DATE_PARSE_FORMAT, new Date()), 'dd MMM yyyy')
      : '',
  }
}

const transformToYesNoOutput = (
  schema: YesNoFieldSchema,
  input?: YesNoFieldValue,
): SingleAnswerOutput<YesNoFieldSchema> => {
  return {
    ...pickBaseOutputFromSchema(schema),
    answer: input ?? '',
  }
}

const transformToTableOutput = (
  schema: TableFieldSchema,
  input?: TableFieldValues,
): TableResponse => {
  // Build table shape
  // Set default input if undefined.
  const populatedInput =
    input ?? times(schema.minimumRows || 0, () => createTableRow(schema))
  const orderedColumnIds = schema.columns.map((col) => col._id)
  const answerArray = populatedInput.map(
    (rowResponse) =>
      orderedColumnIds.map(
        (colId) => rowResponse[colId]?.trim() ?? '',
      ) as TableRow,
  )
  return {
    ...pickBaseOutputFromSchema(schema),
    answerArray,
    // override schema question title to include column titles as well.
    question: `${schema.title} (${schema.columns
      .map((col) => col.title)
      .join(', ')})`,
  }
}

const transformToAttachmentOutput = (
  schema: AttachmentFieldSchema,
  input?: File,
): AttachmentResponse => {
  return {
    ...pickBaseOutputFromSchema(schema),
    answer: input?.name ?? '',
  }
}

const transformToCheckboxOutput = (
  schema: CheckboxFieldSchema,
  input: CheckboxFieldValues,
): CheckboxResponse => {
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
  input: RadioFieldValues,
): RadioResponse => {
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
 * @returns If field type does not need an output, `null` is returned. Otherwise returns the transformed output.
 */
export const transformInputsToOutputs = (
  field: FormFieldDto,
  input: FormFieldValue,
): FieldResponse | null => {
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
    case BasicField.YesNo:
      return transformToYesNoOutput(
        field,
        input as FormFieldValue<typeof field.fieldType>,
      )
    case BasicField.CountryRegion:
      return transformToCountryRegionOutput(
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
      return transformToSingleAnswerOutput(
        field,
        input as FormFieldValue<typeof field.fieldType>,
      )
    case BasicField.Statement:
    case BasicField.Image:
      // No output needed.
      return null
  }
}
