import { CLIENT_RADIO_OTHERS_INPUT_VALUE } from '../constants/form'
import {
  AddressAttributes,
  BasicField,
  FieldResponse,
  FormFieldDto,
  LogicDto,
  MyInfoAttribute,
} from '../types'
import { getVisibleFieldIds } from './logic'
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
import { fieldResponsesV4ToLogicFieldResponseTransformer } from './v4-logic'
import { validateResponses } from './validate-responses'

export type FlattenedV1Response = FieldResponse & {
  isVisible?: true
  isUserVerified?: true
  myInfo?: { attr: MyInfoAttribute }
}

const pickBase = <F extends FormFieldDto>(
  field: F,
): { _id: string; fieldType: F['fieldType']; question: string } => ({
  _id: field._id,
  fieldType: field.fieldType,
  question: field.title,
})

const toRadioInput = (answer?: RadioAnswerV4): RadioAnswerInput | undefined => {
  if (answer === undefined) return undefined
  // NOTE: V4 drops the Others sentinel and puts the free text in `value`.
  // Restore the sentinel so the rule can rebuild the `Others: ` prefix.
  return answer.isOthersInput
    ? { value: CLIENT_RADIO_OTHERS_INPUT_VALUE, othersInput: answer.value }
    : { value: answer.value }
}

const toTableInput = (answer?: TableAnswerV4): TableAnswerInput | undefined => {
  if (answer === undefined) return undefined
  // RATIONALE: V4 keys rows by an opaque id and stores display order in `rowNum`.
  // Sort by `rowNum` before the rule sees the rows.
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

/**
 * RATIONALE: This is sent by visible and optional address fields that the respondent leaves empty in Storage mode webhooks.
 * Thus, we reconstruct the same value.
 */
const UNTOUCHED_ADDRESS_INPUT: AddressAnswerInput = {
  addressSubFields: {
    postalCode: '',
    blockNumber: '',
    streetName: '',
    buildingName: '',
    levelNumber: '',
    unitNumber: '',
  },
}

const toAddressInput = ({
  answer,
  isVisible,
}: {
  answer?: AddressAnswerV4
  isVisible: boolean
}): AddressAnswerInput | undefined => {
  if (answer === undefined) {
    return isVisible ? UNTOUCHED_ADDRESS_INPUT : undefined
  }
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
 * Builds the entry for one form field, before validation.
 */
const buildEntry = (
  field: FormFieldDto,
  answer: AnswerV4 | undefined,
  isVisible: boolean,
): FieldResponse | null => {
  switch (field.fieldType) {
    // NOTE: Statement and Image fields never carry an answer.
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
        // NOTE: computeTableAnswerValue also returns `question`, naming the
        // columns. It overrides the snapshot title.
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
        ...computeAddressAnswerValue(
          toAddressInput({ answer: answer as AddressAnswerV4, isVisible }),
        ),
      }
    case BasicField.Signature:
      return {
        ...pickBase(field),
        ...computeSignatureAnswerValue(answer as SignatureAnswerV4),
      }
    case BasicField.Children:
      // RATIONALE: Currently, no MRF form should have a Children field,
      // so support is out of scope.
      throw new Error(
        `Unsupported field type: ${field.fieldType} for field id: ${field._id}`,
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
      return {
        ...pickBase(field),
        ...computeSingleAnswerValue((answer as StringAnswerV4)?.value),
      }
    default:
      return throwUnsupportedFieldType(field)
  }
}

/**
 * Appends the keys the server attaches to a storage-mode response after
 * validation, in the same order (`ParsedResponsesObject`:146, :150, :153-155).
 *
 * RATIONALE: Appended here, not parsed. No zod schema declares
 * `isUserVerified`, so `.parse` would strip it. Declaring it on
 * `VerifiableResponseBase` would also place it before `fieldType`, breaking
 * byte parity with storage mode.
 *
 * NOTE: Both keys must come from the form-definition snapshot, never from
 * the submission, since the MRF response schema accepts a client-supplied
 * `myInfo: { attr }`, which cannot be trusted.
 */
const appendServerDerivedKeys = (
  response: FieldResponse,
  field: FormFieldDto,
): FlattenedV1Response => {
  const entry: FlattenedV1Response = response
  // WARNING: Reproduces a storage-mode quirk, not an intended part of the
  // contract.
  //
  // `encryptSubmission` skips `omitResponseKeys` for an attachment
  // response that carries content, so `isVisible` survives only on an
  // answered attachment (`encrypt-submission.middleware.ts`).
  //
  // Byte parity requires matching it. The better fix is stripping `isVisible` in
  // storage mode and removing this if clause — a separate, larger change.
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
 * Converts V4 responses and a form-definition snapshot into the same V1
 * entries a storage-mode form produces.
 */
export const flattenV4ToFormFields = ({
  v4Responses,
  formFields,
  formLogics,
}: {
  v4Responses: FieldResponsesV4Input
  formFields: FormFieldDto[]
  formLogics: LogicDto[]
}): FlattenedV1Response[] => {
  const visibleFieldIds = formLogics.length
    ? getVisibleFieldIds(
        fieldResponsesV4ToLogicFieldResponseTransformer(
          v4Responses,
          formFields,
        ),
        { form_fields: formFields, form_logics: formLogics },
      )
    : null
  const entries: FieldResponse[] = []
  const emittingFields: FormFieldDto[] = []
  for (const field of formFields) {
    const entry = buildEntry(
      field,
      v4Responses[field._id]?.answer,
      visibleFieldIds === null || visibleFieldIds.has(field._id),
    )
    if (entry === null) continue
    entries.push(entry)
    emittingFields.push(field)
  }
  return validateResponses(entries).map((response, index) =>
    appendServerDerivedKeys(response, emittingFields[index]),
  )
}
