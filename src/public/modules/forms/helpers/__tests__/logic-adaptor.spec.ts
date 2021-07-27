import { ObjectId } from 'bson-ext'
import { omit } from 'lodash'

import { IClientFieldSchema } from '../../../../../shared/util/logic'
import {
  BasicField,
  ICheckboxFieldSchema,
  IFormDocument,
} from '../../../../../types'
import { adaptSubmissionForLogicModule } from '../logic-adaptor'

describe('adaptSubmissionForLogic', () => {
  describe('Checkbox with others option', () => {
    const OPTIONS = ['Option 1', 'Option 2', 'Option 3']
    const CHECKBOX_FIELD = {
      _id: new ObjectId(),
      fieldOptions: OPTIONS,
      othersRadioButton: true,
      fieldType: BasicField.Checkbox,
    } as ICheckboxFieldSchema
    it('should correctly convert frontend checkbox response without others selected to its logic representation', () => {
      // Arrange
      const checkboxResponse = {
        _id: String(CHECKBOX_FIELD._id),
        fieldValue: [true, false, true, false],
        fieldType: BasicField.Checkbox,
      } as IClientFieldSchema
      const submission = [checkboxResponse]
      const form = { form_fields: [CHECKBOX_FIELD] } as IFormDocument

      const expected = [
        {
          ...omit(checkboxResponse, ['fieldValue']),
          fieldValue: {
            options: [OPTIONS[0], OPTIONS[2]],
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
    it('should correctly convert frontend checkbox response with others selected to its logic representation', () => {
      // Arrange
      const checkboxResponse = {
        _id: String(CHECKBOX_FIELD._id),
        fieldValue: [true, false, true, true],
        fieldType: BasicField.Checkbox,
      } as IClientFieldSchema
      const submission = [checkboxResponse]
      const form = { form_fields: [CHECKBOX_FIELD] } as IFormDocument

      const expected = [
        {
          ...omit(checkboxResponse, ['fieldValue']),
          fieldValue: {
            options: [OPTIONS[0], OPTIONS[2]],
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
  describe('Frontend Checkbox value without others option', () => {
    const OPTIONS = ['Option 1', 'Option 2', 'Option 3']
    const CHECKBOX_FIELD = {
      _id: new ObjectId(),
      fieldOptions: OPTIONS,
      othersRadioButton: false,
      fieldType: BasicField.Checkbox,
    } as ICheckboxFieldSchema
    it('should correctly convert frontend checkbox response without others selected to its logic representation', () => {
      // Arrange
      const checkboxResponse = {
        _id: String(CHECKBOX_FIELD._id),
        fieldValue: [true, false, true, false],
        fieldType: BasicField.Checkbox,
      } as IClientFieldSchema
      const submission = [checkboxResponse]
      const form = { form_fields: [CHECKBOX_FIELD] } as IFormDocument

      const expected = [
        {
          ...omit(checkboxResponse, ['fieldValue']),
          fieldValue: {
            options: [OPTIONS[0], OPTIONS[2]],
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
