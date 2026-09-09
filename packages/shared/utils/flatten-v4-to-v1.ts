import { CLIENT_RADIO_OTHERS_INPUT_VALUE } from '../constants/form'
import {
  AddressAttributes,
  BasicField,
  FieldResponse,
  FormFieldDto,
  MyInfoAttribute,
} from '../types'

import {
  AddressAnswerInput,
  computeAddressAnswerValue,
  computeAttachmentAnswerValue,
  computeCheckboxAnswerValue,
  computeDateAnswerValue,
  computeRadioAnswerValue,
  computeSectionAnswerValue,
  computeSignatureAnswerValue,
  computeSingleAnswerValue,
  computeTableAnswerValue,
  computeVerifiableAnswerValue,
  computeYesNoAnswerValue,
  RadioAnswerInput,
  TableAnswerInput,
  throwUnsupportedFieldType,
} from './response-value-rules'
import {
  AddressAnswerV4,
  AnswerV4,
  AttachmentAnswerV4,
  CheckboxAnswerV4,
  FieldResponsesV4Input,
  RadioAnswerV4,
  SignatureAnswerV4,
  StringAnswerV4,
  TableAnswerV4,
  VerifiableAnswerV4,
} from './v4-answer'
import { validateResponses } from './validate-responses'

/**
 * A V1 response entry as it appears on the wire, including the server-derived
 * keys that no zod response schema declares and which are therefore appended
 * after validation rather than parsed by it.
 */
export type FlattenedV1Response = FieldResponse & {
  isVisible?: true
  isUserVerified?: true
  myInfo?: { attr: MyInfoAttribute }
}

/** `_id`, `fieldType` and the snapshot's question, before the answer keys. */
const pickBase = <F extends FormFieldDto>(
  field: F,
): { _id: string; fieldType: F['fieldType']; question: string } => ({
  _id: field._id,
  fieldType: field.fieldType,
  question: field.title,
})

/**
 * The V4 answer, adapted into the plain input each shared value rule takes.
 * These adapters are the only V4-specific code in the flatten; every byte of
 * every answer is computed by `response-value-rules`.
 */

const toRadioInput = (answer?: RadioAnswerV4): RadioAnswerInput | undefined => {
  if (answer === undefined) return undefined
  // V4 flattens the Others sentinel away and carries the free-text answer in
  // `value`; the rule re-derives the `Others: ` prefix from the sentinel.
  return answer.isOthersInput
    ? { value: CLIENT_RADIO_OTHERS_INPUT_VALUE, othersInput: answer.value }
    : { value: answer.value }
}

const toTableInput = (answer?: TableAnswerV4): TableAnswerInput | undefined => {
  if (answer === undefined) return undefined
  // V4 keys rows by an opaque row id and carries the display order in
  // `rowNum`, so the rows have to be re-ordered before the rule sees them.
  return Object.values(answer)
    .sort((a, b) => a.rowNum - b.rowNum)
    .map((row) => {
      const cells: Record<string, string | undefined> = {}
      for (const [columnId, cell] of Object.entries(row.value)) {
        cells[columnId] = typeof cell === 'string' ? cell : String(cell)
      }
      return cells
    })
}

const toAddressInput = (
  answer?: AddressAnswerV4,
): AddressAnswerInput | undefined => {
  if (answer === undefined) return undefined
  const addressSubFields: AddressAttributes = {
    postalCode: answer.postalCode.value,
    blockNumber: answer.blockNumber.value,
    streetName: answer.streetName.value,
    buildingName: answer.buildingName.value,
    levelNumber: answer.levelNumber.value,
    unitNumber: answer.unitNumber.value,
  }
  return { addressSubFields }
}

/**
 * The entry for one form field, before validation.
 *
 * `answer` is `undefined` when the respondent left the field alone, and the
 * same rule handles both cases — the empty entry is what each rule returns for
 * no input, so there is no parallel empty-value synthesizer to keep in step.
 *
 * `question` always comes from the form-definition snapshot. The V4 submission
 * row carries none (the MRF middleware strips it), and a caller-supplied one
 * is respondent data, so it is ignored even when present.
 *
 * Returns `null` for the field types that produce no entry at all.
 */
const buildEntry = (
  field: FormFieldDto,
  answer: AnswerV4 | undefined,
): FieldResponse | null => {
  switch (field.fieldType) {
    // Neither carries an answer, answered or not.
    case BasicField.Statement:
    case BasicField.Image:
      return null
    case BasicField.Section:
      return { ...pickBase(field), ...computeSectionAnswerValue() }
    case BasicField.Email:
    case BasicField.Mobile:
      return {
        ...pickBase(field),
        ...computeVerifiableAnswerValue(answer as VerifiableAnswerV4),
      }
    case BasicField.Date:
      return {
        ...pickBase(field),
        ...computeDateAnswerValue((answer as StringAnswerV4)?.value),
      }
    case BasicField.YesNo:
      return {
        ...pickBase(field),
        ...computeYesNoAnswerValue((answer as StringAnswerV4)?.value),
      }
    case BasicField.Attachment:
      return {
        ...pickBase(field),
        ...computeAttachmentAnswerValue((answer as AttachmentAnswerV4)?.value),
      }
    case BasicField.Checkbox:
      return {
        ...pickBase(field),
        ...computeCheckboxAnswerValue(answer as CheckboxAnswerV4),
      }
    case BasicField.Radio:
      return {
        ...pickBase(field),
        ...computeRadioAnswerValue(toRadioInput(answer as RadioAnswerV4)),
      }
    case BasicField.Table:
      return {
        ...pickBase(field),
        // The rule also returns a `question` naming the columns, overriding
        // the snapshot title.
        ...computeTableAnswerValue({
          title: field.title,
          columns: field.columns,
          minimumRows: field.minimumRows,
          input: toTableInput(answer as TableAnswerV4),
        }),
      }
    case BasicField.Address:
      return {
        ...pickBase(field),
        ...computeAddressAnswerValue(toAddressInput(answer as AddressAnswerV4)),
      }
    case BasicField.Signature:
      return {
        ...pickBase(field),
        ...computeSignatureAnswerValue(answer as SignatureAnswerV4),
      }
    case BasicField.Children:
      // Decided: no MRF form should have a Children field, so support is out
      // of scope and stays out. Throwing is the point — the previous
      // passthrough turned a Children answer into a blank column in the admin
      // CSV with no error at all.
      throw new Error(`Unsupported field type: ${BasicField.Children}`)
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
      return {
        ...pickBase(field),
        ...computeSingleAnswerValue((answer as StringAnswerV4)?.value),
      }
    default:
      // Every `BasicField` member above is classified, so `field` is `never`
      // here. Adding a member to the enum breaks this line until it is.
      return throwUnsupportedFieldType(field)
  }
}

/**
 * The keys the server attaches to a storage-mode response *after* it has been
 * validated, in the order it attaches them (`ParsedResponsesObject`:146, :150,
 * then :153-155).
 *
 * They are appended here rather than parsed, because no shared zod response
 * schema declares `isUserVerified` at all — `.parse` would strip it — and
 * declaring it on `VerifiableResponseBase` would place it before `fieldType`,
 * validating correctly while still failing byte parity.
 *
 * Both are read from the form-definition snapshot and never from the
 * respondent's data: the MRF response schema accepts a client-supplied
 * `myInfo: { attr }` and it is not trustworthy.
 */
const appendServerDerivedKeys = (
  response: FieldResponse,
  field: FormFieldDto,
): FlattenedV1Response => {
  const entry: FlattenedV1Response = response
  // Reproducing a storage-mode wart, not an intended part of the contract.
  // `encryptSubmission` routes an attachment response that carries content
  // around `omitResponseKeys` entirely, so only the non-attachment branch
  // strips `isVisible` and an answered attachment reaches the consumer with
  // it still attached (`encrypt-submission.middleware.ts:482-492`). Byte
  // parity is the contract, so the flatten emits it too. Fixing storage mode
  // to strip it and dropping this is the better end state, and a larger,
  // separately-reviewable change.
  if (response.fieldType === BasicField.Attachment && response.answer) {
    entry.isVisible = true
  }
  if ('isVerifiable' in field && field.isVerifiable) {
    entry.isUserVerified = true
  }
  if ('myInfo' in field && field.myInfo?.attr) {
    entry.myInfo = { attr: field.myInfo.attr }
  }
  return entry
}

/**
 * Turns V4 responses plus a form-definition snapshot into the V1 entries a
 * storage-mode form produces from the same answers — the same array, in the
 * same order, with the same keys in the same order and the same values.
 *
 * The flatten owns ordering, empty-entry synthesis and question injection, and
 * no per-field-type value logic: every answer byte comes from
 * `response-value-rules`, and `validateResponses` is the last step of value and
 * shape normalisation. Its per-type zod `.parse` is what makes the key set and
 * key order structurally identical to storage mode's rather than merely
 * test-identical — a verifiable field's `signature` sorting ahead of `_id`, and
 * Address putting `question` before `fieldType`, both fall out of it for free.
 *
 * Entries are emitted for the fields in the snapshot and for nothing else. A
 * `v4Responses` key with no matching form field is dropped: storage mode's
 * `encryptedContent` holds one entry per form field, and verified content
 * (SPCP/sgID) is concatenated by the caller afterwards, as the storage-mode
 * admin path already does.
 */
export const flattenV4ToFormFields = ({
  v4Responses,
  formFields,
}: {
  v4Responses: FieldResponsesV4Input
  formFields: FormFieldDto[]
}): FlattenedV1Response[] => {
  const entries: FieldResponse[] = []
  // The snapshot field behind each emitted entry, positionally — the source of
  // the server-derived keys appended once validation is done.
  const emittingFields: FormFieldDto[] = []
  for (const field of formFields) {
    const entry = buildEntry(field, v4Responses[field._id]?.answer)
    if (entry === null) continue
    entries.push(entry)
    emittingFields.push(field)
  }
  return validateResponses(entries).map((response, index) =>
    appendServerDerivedKeys(response, emittingFields[index]),
  )
}
