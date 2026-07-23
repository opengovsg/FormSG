import type {
  AddressAnswerV4,
  AttachmentAnswerV4,
  CheckboxAnswerV4,
  FieldResponseV4,
  RadioAnswerV4,
  SignatureAnswerV4,
  StringAnswerV4,
  TableAnswerV4,
  VerifiableAnswerV4,
} from '@opengovsg/formsg-sdk'
import { ADDRESS_SUBFIELD_KEYS } from '@opengovsg/formsg-sdk'

import { CLIENT_RADIO_OTHERS_INPUT_VALUE } from 'formsg-shared/constants'
import { CountryRegion } from 'formsg-shared/constants/countryRegion'
import { BasicField, FormFieldDto } from 'formsg-shared/types'

import bufferToFile from '~utils/bufferToFile'
import {
  AddressCompoundFieldValues,
  FormFieldValue,
  TableRowFieldValue,
} from '~templates/Field'

/**
 * Retrieves the filled value for a field from the previous step response for
 * MRF. Previous responses are served in V4 shape (the FE's working format);
 * this is the inverse of createResponsesV4's input → V4 answer mapping.
 * @param field The field to extract the value for
 * @param previousFieldResponse The previous field response (V4)
 * @param previousAttachmentFieldResponseFileBuffer The previous attachment field response file buffer (will only exist if the field is an attachment field)
 * @returns The filled value for the field
 */
export const extractMrfPreviousStepResponseValue = (
  field: FormFieldDto,
  previousFieldResponse?: Pick<FieldResponseV4, 'fieldType' | 'answer'>,
  previousAttachmentFieldResponseFileBuffer?: Uint8Array<ArrayBuffer>,
): FormFieldValue | undefined => {
  if (!previousFieldResponse) return

  switch (field.fieldType) {
    case BasicField.Number:
    case BasicField.Decimal:
    case BasicField.ShortText:
    case BasicField.LongText:
    case BasicField.HomeNo:
    case BasicField.Dropdown:
    case BasicField.Rating:
    case BasicField.Nric:
    case BasicField.Uen:
    case BasicField.Date:
    case BasicField.YesNo: {
      const answer = previousFieldResponse.answer as StringAnswerV4
      return answer.value as FormFieldValue<typeof field.fieldType>
    }
    case BasicField.CountryRegion: {
      // Stored answers may be uppercased (legacy V3 processing); match
      // case-insensitively against the enum values used as inputs.
      const answer = previousFieldResponse.answer as StringAnswerV4
      const selected = Object.values(CountryRegion).find(
        (option) => option.toUpperCase() === answer.value?.toUpperCase(),
      )
      return selected
    }
    case BasicField.Email:
    case BasicField.Mobile: {
      // VerifiableAnswerV4 has the same shape as VerifiableFieldValues
      return previousFieldResponse.answer as VerifiableAnswerV4
    }
    case BasicField.Attachment: {
      const answer = previousFieldResponse.answer as AttachmentAnswerV4
      const fileData = previousAttachmentFieldResponseFileBuffer
      if (fileData) {
        return bufferToFile(fileData, answer.value)
      }
      return
    }
    case BasicField.Radio: {
      const answer = previousFieldResponse.answer as RadioAnswerV4
      if (answer.isOthersInput) {
        return {
          value: CLIENT_RADIO_OTHERS_INPUT_VALUE,
          othersInput: answer.value,
        }
      }
      return { value: answer.value }
    }
    case BasicField.Checkbox: {
      // CheckboxAnswerV4 has the same shape as CheckboxFieldValues; the
      // others sentinel is carried inside the value array.
      return previousFieldResponse.answer as CheckboxAnswerV4
    }
    case BasicField.Table: {
      const answer = previousFieldResponse.answer as TableAnswerV4
      return Object.values(answer)
        .sort((a, b) => a.rowNum - b.rowNum)
        .map((row) => {
          const rowValue: TableRowFieldValue = {}
          for (const [columnId, value] of Object.entries(row.value)) {
            rowValue[columnId] = String(value)
          }
          return rowValue
        })
    }
    case BasicField.Address: {
      const answer = previousFieldResponse.answer as AddressAnswerV4
      const addressSubFields =
        {} as AddressCompoundFieldValues['addressSubFields']
      for (const key of ADDRESS_SUBFIELD_KEYS) {
        addressSubFields[key] = answer[key]?.value ?? ''
      }
      return { addressSubFields }
    }
    case BasicField.Signature: {
      const answer = previousFieldResponse.answer as SignatureAnswerV4
      return { type: 'draw', value: answer.value }
    }
    case BasicField.Children:
    case BasicField.Section:
    case BasicField.Image:
    case BasicField.Statement:
      // Children is unsupported for MRF; the rest carry no input value.
      return
    default: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _: never = field
      return
    }
  }
}
