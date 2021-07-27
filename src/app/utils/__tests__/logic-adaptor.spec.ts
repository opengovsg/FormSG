import { ObjectId } from 'bson-ext'
import { omit } from 'lodash'

import {
  BasicField,
  FieldResponse,
  ICheckboxFieldSchema,
  IFormDocument,
} from '../../../types'
import { adaptSubmissionForLogicModule } from '../logic-adaptor'

describe('adaptSubmissionForLogicModule', () => {
  describe('Checkbox with others option', () => {
    const OPTIONS = ['Option 1', 'Others: this is a user-defined option']
    const OTHERS_RESPONSE = 'Others: this is a user input'
    const CHECKBOX_FIELD = {
      _id: new ObjectId(),
      fieldOptions: OPTIONS,
      othersRadioButton: true,
      fieldType: BasicField.Checkbox,
    } as ICheckboxFieldSchema
    it('should correctly convert backend checkbox response without others selected to its logic representation', () => {
      // Arrange
      const checkboxResponse = {
        _id: String(CHECKBOX_FIELD._id),
        answerArray: [OPTIONS[0], OPTIONS[1]],
        fieldType: BasicField.Checkbox,
      } as FieldResponse
      const submission = [checkboxResponse]
      const form = { form_fields: [CHECKBOX_FIELD] } as IFormDocument

      const expected = [
        {
          ...omit(checkboxResponse, ['answerArray']),
          answerArray: {
            options: [OPTIONS[0], OPTIONS[1]],
            others: false,
          },
        },
      ]

      // Act
      const transformedSubmission = adaptSubmissionForLogicModule(
        submission,
        form,
      )

      // Assert
      expect(transformedSubmission).toEqual(expected)
    })
    it('should correctly convert backend checkbox response with others selected to its logic representation', () => {
      // Arrange
      const checkboxResponse = {
        _id: String(CHECKBOX_FIELD._id),
        answerArray: [OPTIONS[0], OPTIONS[1], OTHERS_RESPONSE],
        fieldType: BasicField.Checkbox,
      } as FieldResponse
      const submission = [checkboxResponse]
      const form = { form_fields: [CHECKBOX_FIELD] } as IFormDocument

      const expected = [
        {
          ...omit(checkboxResponse, ['answerArray']),
          answerArray: {
            options: [OPTIONS[0], OPTIONS[1]],
            others: true,
          },
        },
      ]

      // Act
      const transformedSubmission = adaptSubmissionForLogicModule(
        submission,
        form,
      )

      // Assert
      expect(transformedSubmission).toEqual(expected)
    })
  })
  describe('Checkbox without others option', () => {
    const OPTIONS = ['Option 1', 'Others: this is a user-defined option']
    const CHECKBOX_FIELD = {
      _id: new ObjectId(),
      fieldOptions: OPTIONS,
      othersRadioButton: false,
      fieldType: BasicField.Checkbox,
    } as ICheckboxFieldSchema
    it('should correctly convert backend checkbox response without others selected to its logic representation', () => {
      // Arrange
      const checkboxResponse = {
        _id: String(CHECKBOX_FIELD._id),
        answerArray: [OPTIONS[0], OPTIONS[1]],
        fieldType: BasicField.Checkbox,
      } as FieldResponse
      const submission = [checkboxResponse]
      const form = { form_fields: [CHECKBOX_FIELD] } as IFormDocument

      const expected = [
        {
          ...omit(checkboxResponse, ['answerArray']),
          answerArray: {
            options: [OPTIONS[0], OPTIONS[1]],
            others: false,
          },
        },
      ]

      // Act
      const transformedSubmission = adaptSubmissionForLogicModule(
        submission,
        form,
      )

      // Assert
      expect(transformedSubmission).toEqual(expected)
    })
  })
})
