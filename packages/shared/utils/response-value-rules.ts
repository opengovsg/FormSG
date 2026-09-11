import { format, parse } from 'date-fns'
import { times } from 'lodash'

import { DATE_PARSE_FORMAT } from '../constants/dates'
import {
  CLIENT_CHECKBOX_OTHERS_INPUT_VALUE,
  CLIENT_RADIO_OTHERS_INPUT_VALUE,
} from '../constants/form'
import { AddressAttributes, SignatureVectorArray } from '../types/field'
import { TableRow } from '../types/response'

import { removeAt } from './immutable-array-fns'
import { convertToSignatureStringOutput } from './signature'

/**
 * The per-field-type rules that decide what a V1 response entry's answer keys
 * contain. Storage mode has always applied these in the browser; the backend's
 * V4-to-V1 flatten needs the identical rules, so they live here rather than in
 * either producer.
 *
 * Each rule is pure and takes only plain values — a title, a column-id list, an
 * answer string. Nothing here knows about a form field *schema*: reading a
 * schema is the caller's job, which is what keeps this module free of both the
 * frontend's field-schema layer and the SDK.
 *
 * Each rule returns just the answer-bearing keys of the entry. Callers spread
 * them onto the entry's `_id` / `question` / `fieldType` base. The one
 * exception is the table rule, which also returns a `question`, because
 * composing the column titles into the question text is itself a value rule.
 */

export type SingleAnswerValueOutput = { answer: string }
export type VerifiableAnswerValueOutput = {
  answer: string
  signature: string | undefined
}
export type SectionAnswerValueOutput = { answer: string; isHeader: true }
export type StringArrayAnswerValueOutput = { answerArray: string[] }
export type SignatureAnswerValueOutput = { answerArray: [string, string] }
export type ChildrenAnswerValueOutput = { answerArray: string[][] }
export type TableAnswerValueOutput = {
  answerArray: TableRow[]
  question: string
}

export type VerifiableAnswerInput = {
  value?: string
  signature?: string
}

export type CheckboxAnswerInput = {
  /**
   * `false` is a react-hook-form artifact of a checkbox group that never fired
   * a change event; it means nothing is selected.
   */
  value?: string[] | false
  othersInput?: string
}

export type RadioAnswerInput =
  | { value: string; othersInput?: string }
  /** The V3 wire shape for an Others-only answer. */
  | { othersInput: string }

export type TableColumnMeta = { _id: string; title: string }
export type TableAnswerInput = Record<string, string | undefined>[]

export type ChildrenAnswerInput = { child?: string[][] }

export type AddressAnswerInput = { addressSubFields: AddressAttributes }

export type SignatureAnswerInput = {
  type: string
  value: SignatureVectorArray
}

/** Trimmed. Every generic string-answer field type goes through here. */
export const computeSingleAnswerValue = (
  input?: string,
): SingleAnswerValueOutput => ({
  answer: input?.trim() ?? '',
})

/**
 * Reformatted from the `DATE_PARSE_FORMAT` the input carries (`dd/MM/yyyy`) to
 * the human-readable `dd MMM yyyy` that lands on the wire. Not trimmed.
 */
export const computeDateAnswerValue = (
  input?: string,
): SingleAnswerValueOutput => ({
  answer: input
    ? format(parse(input, DATE_PARSE_FORMAT, new Date()), 'dd MMM yyyy')
    : '',
})

/** Not trimmed — Yes/No is a closed set of literals. */
export const computeYesNoAnswerValue = (
  input?: string,
): SingleAnswerValueOutput => ({
  answer: input ?? '',
})

/**
 * `signature` is deliberately emitted as a present key even when undefined, so
 * the entry's key *set* does not depend on whether the respondent verified.
 * `JSON.stringify` drops it, which is why the delivered bytes and
 * `Object.keys` disagree on a verifiable field.
 */
export const computeVerifiableAnswerValue = (
  input?: VerifiableAnswerInput,
): VerifiableAnswerValueOutput => ({
  answer: input?.value ?? '',
  signature: input?.signature,
})

/** The filename, never the file contents. */
export const computeAttachmentAnswerValue = (
  filename?: string,
): SingleAnswerValueOutput => ({
  answer: filename ?? '',
})

export const computeSectionAnswerValue = (): SectionAnswerValueOutput => ({
  answer: '',
  isHeader: true,
})

/**
 * The Others entry is removed from wherever it was selected and pushed to the
 * END of the array, so a form's option order is not preserved around it.
 */
export const computeCheckboxAnswerValue = (
  input?: CheckboxAnswerInput,
): StringArrayAnswerValueOutput => {
  let answerArray: string[] = []
  if (input !== undefined && input.value) {
    const othersIndex = input.value.findIndex(
      (v) => v === CLIENT_CHECKBOX_OTHERS_INPUT_VALUE,
    )
    if (othersIndex !== -1) {
      answerArray = removeAt(input.value, othersIndex)
      answerArray.push(`Others: ${input.othersInput}`)
    } else {
      answerArray = input.value
    }
  }
  return { answerArray }
}

export const computeRadioAnswerValue = (
  input?: RadioAnswerInput,
): SingleAnswerValueOutput => {
  let answer = ''
  if (input !== undefined) {
    if ('value' in input) {
      answer = input.value
      if (
        answer === CLIENT_RADIO_OTHERS_INPUT_VALUE &&
        'othersInput' in input
      ) {
        answer = `Others: ${input.othersInput}`
      }
    } else {
      answer = input.othersInput
    }
  }
  return { answer }
}

/**
 * Trims every cell, orders cells by the form's column order rather than the
 * input's key order, synthesises `minimumRows` blank rows when the respondent
 * left the table alone, and composes the column titles into the question text.
 *
 * `columns` is a plain `{ _id, title }` list rather than a table field schema,
 * which is what lets the blank-row synthesis live here instead of depending on
 * the frontend's `createTableRow`.
 */
export const computeTableAnswerValue = ({
  title,
  columns,
  minimumRows,
  input,
}: {
  title: string
  columns: readonly TableColumnMeta[]
  /**
   * `''` is the form-builder's "no minimum" sentinel, carried through by the
   * shared table field schema; it means the same as absent.
   */
  minimumRows?: number | ''
  input?: TableAnswerInput
}): TableAnswerValueOutput => {
  const orderedColumnIds = columns.map((col) => col._id)
  const populatedInput =
    input ??
    times(minimumRows || 0, () =>
      orderedColumnIds.reduce<Record<string, string>>((acc, colId) => {
        acc[colId] = ''
        return acc
      }, {}),
    )
  const answerArray = populatedInput.map(
    (rowResponse) =>
      orderedColumnIds.map(
        (colId) => rowResponse[colId]?.trim() ?? '',
      ) as TableRow,
  )
  return {
    answerArray,
    question: `${title} (${columns.map((col) => col.title).join(', ')})`,
  }
}

export const computeSignatureAnswerValue = (
  input?: SignatureAnswerInput,
): SignatureAnswerValueOutput => {
  let answerArray: [string, string] = ['', '']
  if (input && input.value.length > 0) {
    answerArray = [input.type, convertToSignatureStringOutput(input.value)]
  }
  return { answerArray }
}

/**
 * With no answer, emits one blank child row wide enough for the field's
 * sub-fields — defaulting to a single sub-field when the count is unknown.
 */
export const computeChildrenAnswerValue = ({
  numberOfSubFields,
  input,
}: {
  numberOfSubFields?: number
  input?: ChildrenAnswerInput
}): ChildrenAnswerValueOutput => ({
  answerArray: input?.child ?? [Array(numberOfSubFields ?? 1).fill('')],
})

/** Postal code moves to the end of the array. */
export const computeAddressAnswerValue = (
  input?: AddressAnswerInput,
): StringArrayAnswerValueOutput => {
  if (input === undefined) return { answerArray: [] }
  const {
    postalCode,
    blockNumber,
    streetName,
    buildingName,
    levelNumber,
    unitNumber,
  } = input.addressSubFields
  return {
    answerArray: [
      blockNumber,
      streetName,
      buildingName,
      levelNumber,
      unitNumber,
      postalCode,
    ],
  }
}

/**
 * The exhaustive-switch escape hatch: a field type nobody has classified must
 * fail loudly rather than be silently dropped from a submission.
 *
 * Takes `never`, so a new `BasicField` member breaks compilation at every
 * producer that switches over field types.
 */
export const throwUnsupportedFieldType = (fieldType: never): never => {
  throw new Error(`Unsupported field type: ${fieldType}`)
}
