import _ from 'lodash'

import { BasicField, FieldResponseV3 } from '../../../shared/types'
import { ParsedClearAttachmentResponseV3 } from '../../types/api'

export const isFieldResponseV3Equal = (
  l: FieldResponseV3,
  r: FieldResponseV3,
): boolean => {
  if (l.fieldType !== r.fieldType) return false

  switch (l.fieldType) {
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
    case BasicField.CountryRegion:
    case BasicField.YesNo:
    case BasicField.Email:
    case BasicField.Mobile:
    case BasicField.Table:
    case BasicField.Radio:
    case BasicField.Checkbox:
    case BasicField.Children:
      return _.isEqual(l.answer, r.answer)
    case BasicField.Attachment: {
      const lAnswer = l.answer as ParsedClearAttachmentResponseV3['answer']
      const rAnswer = r.answer as ParsedClearAttachmentResponseV3['answer']

      const lMd5 = lAnswer.md5Hash
      const rMd5 = rAnswer.md5Hash

      return (
        !lMd5 || !rMd5 || lMd5 === rMd5
        // TODO: FRM-1839 + FRM-1590 Skip scanning if attachment has already been scanned
        // && l.answer.hasBeenScanned === rAnswer.hasBeenScanned
      )
    }
    case BasicField.Section:
      return true
    default: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _: never = l
      return false
    }
  }
}
