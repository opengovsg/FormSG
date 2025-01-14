import { format, parse } from 'date-fns'
import { times } from 'lodash'

import { DATE_PARSE_FORMAT } from '~shared/constants/dates'
import {
  AttachmentFieldResponseV3,
  CheckboxFieldResponsesV3,
  ChildrenCompoundFieldResponsesV3,
  FieldResponseAnswerMapV3,
  RadioFieldResponsesV3,
  TableFieldResponsesV3,
  VerifiableFieldResponseV3,
  YesNoFieldResponseV3,
} from '~shared/types'
import { BasicField, FormFieldDto } from '~shared/types/field'
import {
  AttachmentResponse,
  CheckboxResponse,
  ChildBirthRecordsResponse,
  FieldResponse,
  HeaderResponse,
  RadioResponse,
  TableResponse,
  TableRow,
} from '~shared/types/response'
import { removeAt } from '~shared/utils/immutable-array-fns'

import { CHECKBOX_OTHERS_INPUT_VALUE } from '~templates/Field/Checkbox/constants'
import { RADIO_OTHERS_INPUT_VALUE } from '~templates/Field/Radio/constants'
import { createTableRow } from '~templates/Field/Table/utils/createRow'
import {
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
  SingleAnswerOutput,
  TableFieldSchema,
  TableFieldValues,
  VerifiableAnswerOutput,
  VerifiableFieldValues,
  YesNoFieldSchema,
  YesNoFieldValue,
} from '~templates/Field/types'

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
    answer: input?.value ?? '',
    signature: input?.signature,
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
  input?: YesNoFieldValue | YesNoFieldResponseV3,
): SingleAnswerOutput<YesNoFieldSchema> => {
  return {
    ...pickBaseOutputFromSchema(schema),
    answer: input ?? '',
  }
}

const transformToTableOutput = (
  schema: TableFieldSchema,
  input?: TableFieldValues | TableFieldResponsesV3,
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
  input?: CheckboxFieldValues | CheckboxFieldResponsesV3,
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
  input?: RadioFieldValues | RadioFieldResponsesV3,
): RadioResponse => {
  let answer = ''
  if (input !== undefined) {
    if ('value' in input) {
      // RadioFieldValues, or value response in V3
      answer = input.value
      if (answer === RADIO_OTHERS_INPUT_VALUE && 'othersInput' in input) {
        // Others is selected, so we need to use the input at othersInput for the answer instead.
        answer = `Others: ${input.othersInput}`
      }
    } else {
      // "Others" response in V3
      answer = input.othersInput
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

const transformToChildOutput = (
  schema: ChildrenCompoundFieldSchema,
  input?: ChildrenCompoundFieldValues | ChildrenCompoundFieldResponsesV3,
): ChildBirthRecordsResponse => {
  const noOfChildrenSubFields = schema.childrenSubFields?.length ?? 1
  let answerArray: string[][]
  if (input?.child) {
    answerArray = input.child
  } else {
    answerArray = [Array(noOfChildrenSubFields).fill('')]
  }
  return {
    ...pickBaseOutputFromSchema(schema),
    answerArray,
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
  }
}
