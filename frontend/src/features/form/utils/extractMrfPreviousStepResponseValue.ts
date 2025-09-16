import { CLIENT_RADIO_OTHERS_INPUT_VALUE } from '~shared/constants'
import { CountryRegion } from '~shared/constants/countryRegion'
import {
  AttachmentFieldResponseV3,
  BasicField,
  FieldResponseV3,
  FormFieldDto,
} from '~shared/types'

import bufferToFile from '~utils/bufferToFile'
import { FormFieldValue, RadioFieldValues } from '~templates/Field'

/**
 * Retrieves the filled value for a field from the previous step response for MRF.
 * @param field The field to extract the value for
 * @param previousFieldResponse The previous field response
 * @param previousAttachmentFieldResponseFileBuffer The previous attachment field response file buffer (will only exist if the field is an attachment field)
 * @returns The filled value for the field
 */
export const extractMrfPreviousStepResponseValue = (
  field: FormFieldDto,
  previousFieldResponse?: FieldResponseV3,
  previousAttachmentFieldResponseFileBuffer?: ArrayBuffer,
): FormFieldValue | undefined => {
  if (previousFieldResponse) {
    if (previousFieldResponse) {
      switch (field.fieldType) {
        case BasicField.CountryRegion: {
          const selected = Object.values(CountryRegion).find(
            (option) => option.toUpperCase() === previousFieldResponse.answer,
          )
          if (selected) {
            return selected
          }
          return
        }
        case BasicField.Attachment: {
          const attachmentData =
            previousFieldResponse.answer as AttachmentFieldResponseV3
          const fileName = attachmentData.answer
          const fileData = previousAttachmentFieldResponseFileBuffer
          if (fileData) {
            return bufferToFile(fileData, fileName)
          }
          return
        }
        case BasicField.Radio: {
          const radioAnswer = previousFieldResponse.answer as RadioFieldValues
          if (radioAnswer.othersInput && !radioAnswer.value) {
            radioAnswer.value = CLIENT_RADIO_OTHERS_INPUT_VALUE
          }
          return radioAnswer
        }
        default:
          return previousFieldResponse.answer as FormFieldValue
      }
    }
  }
}
