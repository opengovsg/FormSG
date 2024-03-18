import { BasicField, FieldResponseV3 } from '../types'

const areArraysEqual = <T>(
  array1: T[],
  array2: T[],
  eq: (value1: T, value2: T) => boolean,
): boolean =>
  array1.length === array2.length &&
  array1.every((value1, i) => eq(value1, array2[i]))

export const areFieldResponseV3sEqual = (
  response1: FieldResponseV3,
  response2: FieldResponseV3,
): boolean => {
  if (response1.fieldType !== response2.fieldType) return false

  switch (response1.fieldType) {
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
      return response1.answer === response2.answer

    case BasicField.Attachment: {
      const response2Answer = response2.answer as typeof response1.answer
      return (
        response1.answer.answer === response2Answer.answer &&
        response1.answer.hasBeenScanned === response2Answer.hasBeenScanned
      )
    }
    case BasicField.Email:
    case BasicField.Mobile: {
      const response2Answer = response2.answer as typeof response1.answer
      return (
        response1.answer.value === response2Answer.value &&
        response1.answer.signature === response2Answer.signature
      )
    }
    case BasicField.Table: {
      const response2Answer = response2.answer as typeof response1.answer
      return areArraysEqual(
        response1.answer,
        response2Answer,
        (row1, row2) =>
          Object.keys(row1).length === Object.keys(row2).length &&
          Object.keys(row1).every(
            (columnId) => row1[columnId] === row2[columnId],
          ),
      )
    }
    case BasicField.Radio: {
      if ('value' in response1.answer) {
        const response2Answer = response2.answer as typeof response1.answer
        return response1.answer.value === response2Answer.value
      } else {
        const response2Answer = response2.answer as typeof response1.answer
        return response1.answer.othersInput === response2Answer.othersInput
      }
    }
    case BasicField.Checkbox: {
      const response2Answer = response2.answer as typeof response1.answer
      return (
        areArraysEqual(
          response1.answer.value,
          response2Answer.value,
          (value1, value2) => value1 === value2,
        ) && response1.answer.othersInput === response2Answer.othersInput
      )
    }
    case BasicField.Children: {
      const response2Answer = response2.answer as typeof response1.answer
      return (
        areArraysEqual(
          response1.answer.child,
          response2Answer.child,
          (child1, child2) =>
            areArraysEqual(
              child1,
              child2,
              (value1, value2) => value1 === value2,
            ),
        ) &&
        areArraysEqual(
          response1.answer.childFields,
          response2Answer.childFields,
          (attr1, attr2) => attr1 === attr2,
        )
      )
    }
    case BasicField.Section:
      return true
    default: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _: never = response1
      return false
    }
  }
}
