import _ from 'lodash'
import { BasicField, FieldResponseV3 } from '../types'

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
      const rAnswer = r.answer as typeof l.answer
      return (
        l.answer.answer === rAnswer.answer &&
        l.answer.hasBeenScanned === rAnswer.hasBeenScanned
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
