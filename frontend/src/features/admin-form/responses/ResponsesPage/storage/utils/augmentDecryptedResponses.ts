import type {
  EncryptedAttachmentRecords,
  FormField,
} from '@opengovsg/formsg-sdk/dist/types'

import { BasicField } from '~shared/types'

import { NON_RESPONSE_FIELD_SET } from '~features/form/constants'

export type AugmentedDecryptedResponse = FormField & {
  questionNumber?: number
  downloadUrl?: string
}

type AugmentedFieldAccumulator = {
  fields: AugmentedDecryptedResponse[]
  nonResponseFieldsCount: number
}

const isBasicField = (test: string): test is BasicField => {
  return Object.values(BasicField).indexOf(test as BasicField) !== -1
}

export const augmentDecryptedResponses = (
  formFields: FormField[],
  attachmentMetadata: EncryptedAttachmentRecords,
): AugmentedDecryptedResponse[] => {
  const { fields } = formFields.reduce<AugmentedFieldAccumulator>(
    (acc, field, index) => {
      if (!isBasicField(field.fieldType)) return acc

      const fieldToAdd: AugmentedFieldAccumulator['fields'][number] = field

      if (NON_RESPONSE_FIELD_SET.has(field.fieldType)) {
        acc.nonResponseFieldsCount += 1
      } else {
        fieldToAdd.questionNumber = index + 1 - acc.nonResponseFieldsCount
      }

      if (attachmentMetadata[field._id]) {
        fieldToAdd.downloadUrl = attachmentMetadata[field._id]
      }

      acc.fields.push(fieldToAdd)
      return acc
    },
    { fields: [], nonResponseFieldsCount: 0 },
  )

  return fields
}
