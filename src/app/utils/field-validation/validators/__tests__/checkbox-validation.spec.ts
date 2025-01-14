import {
  generateCheckboxResponseV3,
  generateDefaultField,
  generateDefaultFieldV3,
  generateNewCheckboxResponse,
} from '__tests__/unit/backend/helpers/generate-form-data'
import { mongo as mongodb } from 'mongoose'

import { ValidateFieldError } from 'src/app/modules/submission/submission.errors'
import { validateField, validateFieldV3 } from 'src/app/utils/field-validation'

import { CLIENT_CHECKBOX_OTHERS_INPUT_VALUE } from '../../../../../../shared/constants'
import { BasicField } from '../../../../../../shared/types'

const { ObjectId } = mongodb

describe('Checkbox validation', () => {
  const formId = new ObjectId().toHexString()
  describe('Required or optional', () => {
    it('should disallow empty submission if checkbox is required', () => {
      const fieldOptions = ['a', 'b', 'c']
      const formField = generateDefaultField(BasicField.Checkbox, {
        fieldOptions,
      })
      const response = generateNewCheckboxResponse({ answerArray: [] })
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should allow empty submission if checkbox is optional', () => {
      const fieldOptions = ['a', 'b', 'c']
      const formField = generateDefaultField(BasicField.Checkbox, {
        fieldOptions,
        required: false,
      })
      const response = generateNewCheckboxResponse({ answerArray: [] })
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })
  })

  describe('Validation of field options', () => {
    it('should disallow responses submitted for hidden fields', () => {
      const fieldOptions = ['a', 'b', 'c']
      const formField = generateDefaultField(BasicField.Checkbox, {
        fieldOptions,
      })
      const response = generateNewCheckboxResponse({
        answerArray: ['a'],
      })
      response.isVisible = false
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError(
          'Attempted to submit response on a hidden field',
        ),
      )
    })

    it('should allow a valid option to be selected', () => {
      const fieldOptions = ['a', 'b', 'c']
      const formField = generateDefaultField(BasicField.Checkbox, {
        fieldOptions,
      })
      const response = generateNewCheckboxResponse({ answerArray: ['a'] })
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should allow multiple valid options to be selected', () => {
      const fieldOptions = ['a', 'b', 'c']
      const formField = generateDefaultField(BasicField.Checkbox, {
        fieldOptions,
      })
      const response = generateNewCheckboxResponse({ answerArray: ['a', 'b'] })
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should disallow answers not in fieldOptions', () => {
      const fieldOptions = ['a', 'b', 'c']
      const formField = generateDefaultField(BasicField.Checkbox, {
        fieldOptions,
      })
      const response = generateNewCheckboxResponse({
        answerArray: ['a', 'notinoption'],
      })
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should disallow duplicate answers', () => {
      const fieldOptions = ['a', 'b', 'c']
      const formField = generateDefaultField(BasicField.Checkbox, {
        fieldOptions,
      })
      const response = generateNewCheckboxResponse({
        answerArray: ['a', 'b', 'a'],
      })
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should allow self-configured others options in field options', () => {
      // This occurs when admins create their own checkboxes with options like ["Others: <please specify>"]
      const fieldOptions = ['a', 'b', 'c', 'Others: <please specify>']
      const formField = generateDefaultField(BasicField.Checkbox, {
        fieldOptions,
      })
      const response = generateNewCheckboxResponse({
        answerArray: ['Others: <please specify>'],
      })
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should allow Others option to be submitted if field is configured for Others', () => {
      const fieldOptions = ['a', 'b', 'c']
      const formField = generateDefaultField(BasicField.Checkbox, {
        fieldOptions,
        othersRadioButton: true,
      })
      const response = generateNewCheckboxResponse({
        answerArray: ['a', 'Others: xyz'],
      })
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should disallow Others option to be submitted if field is not configured for Others', () => {
      const fieldOptions = ['a', 'b', 'c']
      const formField = generateDefaultField(BasicField.Checkbox, {
        fieldOptions,
        othersRadioButton: false,
      })
      const response = generateNewCheckboxResponse({
        answerArray: ['a', 'Others: xyz'],
      })
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should disallow multiple Others option to be submitted if field is configured for Others', () => {
      const fieldOptions = ['a', 'b', 'c']
      const formField = generateDefaultField(BasicField.Checkbox, {
        fieldOptions,
        othersRadioButton: true,
      })
      const response = generateNewCheckboxResponse({
        answerArray: ['a', 'Others: xyz', 'Others: abc'],
      })
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should disallow Others option to be submitted with blank answer if field is configured for Others', () => {
      const fieldOptions = ['a', 'b', 'c']
      const formField = generateDefaultField(BasicField.Checkbox, {
        fieldOptions,
        othersRadioButton: true,
      })
      const response = generateNewCheckboxResponse({
        answerArray: ['a', 'Others: '],
      })
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should allow submission without Others option even if field is configured for Others', () => {
      const fieldOptions = ['a', 'b', 'c']
      const formField = generateDefaultField(BasicField.Checkbox, {
        fieldOptions,
        othersRadioButton: true,
      })
      const response = generateNewCheckboxResponse({
        answerArray: ['a'],
      })
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })
  })

  describe('Selection limits', () => {
    it('should disallow more answers than customMax if selection limits are configured', () => {
      const fieldOptions = ['a', 'b', 'c', 'd', 'e']
      const formField = generateDefaultField(BasicField.Checkbox, {
        fieldOptions,
        validateByValue: true,
        ValidationOptions: { customMax: 2, customMin: null },
      })
      const response = generateNewCheckboxResponse({
        answerArray: ['c', 'd', 'e'],
      })
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should disallow fewer answers than customMin if selection limits are configured', () => {
      const fieldOptions = ['a', 'b', 'c', 'd', 'e']
      const formField = generateDefaultField(BasicField.Checkbox, {
        fieldOptions,
        validateByValue: true,
        ValidationOptions: { customMax: null, customMin: 2 },
      })
      const response = generateNewCheckboxResponse({
        answerArray: ['c'],
      })
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should allow more answers than customMax if selection limits are not configured', () => {
      const fieldOptions = ['a', 'b', 'c', 'd', 'e']
      const formField = generateDefaultField(BasicField.Checkbox, {
        fieldOptions,
        validateByValue: false,
        ValidationOptions: { customMax: 2, customMin: null },
      })
      const response = generateNewCheckboxResponse({
        answerArray: ['c', 'd', 'e'],
      })
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should allow fewer answers than customMin if selection limits are not configured', () => {
      const fieldOptions = ['a', 'b', 'c', 'd', 'e']
      const formField = generateDefaultField(BasicField.Checkbox, {
        fieldOptions,
        validateByValue: false,
        ValidationOptions: { customMax: null, customMin: 2 },
      })
      const response = generateNewCheckboxResponse({
        answerArray: ['c'],
      })
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should disallow more answers than customMax, and fewer answers than customMin, if selection limits are configured', () => {
      const fieldOptions = ['a', 'b', 'c', 'd', 'e']
      const formField = generateDefaultField(BasicField.Checkbox, {
        fieldOptions,
        validateByValue: true,
        ValidationOptions: { customMax: 4, customMin: 2 },
      })
      const validResponse = generateNewCheckboxResponse({
        answerArray: ['c', 'd', 'e'],
      })
      const validateResult = validateField(formId, formField, validResponse)
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)

      const moreAnswers = generateNewCheckboxResponse({
        answerArray: ['c', 'd', 'e', 'a', 'b'],
      })
      const validateMoreAnswersResult = validateField(
        formId,
        formField,
        moreAnswers,
      )
      expect(validateMoreAnswersResult.isErr()).toBe(true)
      expect(validateMoreAnswersResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )

      const fewerAnswers = generateNewCheckboxResponse({
        answerArray: ['c'],
      })

      const validateFewerAnswersResult = validateField(
        formId,
        formField,
        fewerAnswers,
      )
      expect(validateFewerAnswersResult.isErr()).toBe(true)
      expect(validateFewerAnswersResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })
  })
})

describe('Checkbox validation V3', () => {
  const formId = new ObjectId().toHexString()
  describe('Required or optional', () => {
    it('should disallow empty submission if checkbox is required', () => {
      const fieldOptions = ['a', 'b', 'c']
      const formField = generateDefaultFieldV3(BasicField.Checkbox, {
        fieldOptions,
      })
      const response = generateCheckboxResponseV3({ value: [] })
      const validateResult = validateFieldV3({
        formId,
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should allow empty submission if checkbox is optional', () => {
      const fieldOptions = ['a', 'b', 'c']
      const formField = generateDefaultFieldV3(BasicField.Checkbox, {
        fieldOptions,
        required: false,
      })
      const response = generateCheckboxResponseV3({ value: [] })
      const validateResult = validateFieldV3({
        formId,
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })
  })

  describe('Validation of field options', () => {
    it('should disallow responses submitted for hidden fields', () => {
      const fieldOptions = ['a', 'b', 'c']
      const formField = generateDefaultFieldV3(BasicField.Checkbox, {
        fieldOptions,
        required: true,
      })
      const response = generateCheckboxResponseV3({
        value: ['a'],
      })
      const validateResult = validateFieldV3({
        formId,
        formField,
        response,
        isVisible: false,
      })
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError(
          'Attempted to submit response on a hidden field',
        ),
      )
    })

    it('should allow a valid option to be selected', () => {
      const fieldOptions = ['a', 'b', 'c']
      const formField = generateDefaultFieldV3(BasicField.Checkbox, {
        fieldOptions,
      })
      const response = generateCheckboxResponseV3({ value: ['a'] })
      const validateResult = validateFieldV3({
        formId,
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should allow multiple valid options to be selected', () => {
      const fieldOptions = ['a', 'b', 'c']
      const formField = generateDefaultFieldV3(BasicField.Checkbox, {
        fieldOptions,
      })
      const response = generateCheckboxResponseV3({ value: ['a', 'b'] })
      const validateResult = validateFieldV3({
        formId,
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should disallow answers not in fieldOptions', () => {
      const fieldOptions = ['a', 'b', 'c']
      const formField = generateDefaultFieldV3(BasicField.Checkbox, {
        fieldOptions,
      })
      const response = generateCheckboxResponseV3({
        value: ['a', 'notinoption'],
      })
      const validateResult = validateFieldV3({
        formId,
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should disallow duplicate answers', () => {
      const fieldOptions = ['a', 'b', 'c']
      const formField = generateDefaultFieldV3(BasicField.Checkbox, {
        fieldOptions,
      })
      const response = generateCheckboxResponseV3({
        value: ['a', 'b', 'a'],
      })
      const validateResult = validateFieldV3({
        formId,
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should allow self-configured others options in field options', () => {
      const fieldOptions = ['a', 'b', 'c', 'Others: <please specify>']
      const formField = generateDefaultFieldV3(BasicField.Checkbox, {
        fieldOptions,
      })
      const response = generateCheckboxResponseV3({
        value: ['Others: <please specify>'],
      })
      const validateResult = validateFieldV3({
        formId,
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should allow Others option to be submitted if field is configured for Others', () => {
      const fieldOptions = ['a', 'b', 'c']
      const formField = generateDefaultFieldV3(BasicField.Checkbox, {
        fieldOptions,
        othersRadioButton: true,
      })
      const response = generateCheckboxResponseV3({
        value: ['a', CLIENT_CHECKBOX_OTHERS_INPUT_VALUE],
        othersInput: 'Others: xyz',
      })
      const validateResult = validateFieldV3({
        formId,
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should disallow Others option to be submitted if field is configured for Others but othersInput is undefined', () => {
      const fieldOptions = ['a', 'b', 'c']
      const formField = generateDefaultFieldV3(BasicField.Checkbox, {
        fieldOptions,
        othersRadioButton: true,
      })
      const response = generateCheckboxResponseV3({
        value: ['a', CLIENT_CHECKBOX_OTHERS_INPUT_VALUE],
      })
      const validateResult = validateFieldV3({
        formId,
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should disallow Others option to be submitted if field is not configured for Others', () => {
      const fieldOptions = ['a', 'b', 'c']
      const formField = generateDefaultFieldV3(BasicField.Checkbox, {
        fieldOptions,
        othersRadioButton: false,
      })
      const response = generateCheckboxResponseV3({
        value: ['a', CLIENT_CHECKBOX_OTHERS_INPUT_VALUE],
        othersInput: 'Others: xyz',
      })
      const validateResult = validateFieldV3({
        formId,
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should allow Others option to be submitted with admin defined Others: if field is configured for Others', () => {
      const fieldOptions = ['a', 'b', 'c', 'Others: xyz']
      const formField = generateDefaultFieldV3(BasicField.Checkbox, {
        fieldOptions,
        othersRadioButton: true,
      })
      const response = generateCheckboxResponseV3({
        value: ['a', 'Others: xyz', CLIENT_CHECKBOX_OTHERS_INPUT_VALUE],
        othersInput: 'Others: abc',
      })
      const validateResult = validateFieldV3({
        formId,
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should disallow Others option to be submitted with empty string answer if field is configured for Others', () => {
      const fieldOptions = ['a', 'b', 'c']
      const formField = generateDefaultFieldV3(BasicField.Checkbox, {
        fieldOptions,
        othersRadioButton: true,
      })
      const response = generateCheckboxResponseV3({
        value: ['a', CLIENT_CHECKBOX_OTHERS_INPUT_VALUE],
        othersInput: '',
      })
      const validateResult = validateFieldV3({
        formId,
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should disallow Others option to be submitted with whitespace answer if field is configured for Others', () => {
      const fieldOptions = ['a', 'b', 'c']
      const formField = generateDefaultFieldV3(BasicField.Checkbox, {
        fieldOptions,
        othersRadioButton: true,
      })
      const response = generateCheckboxResponseV3({
        value: ['a', CLIENT_CHECKBOX_OTHERS_INPUT_VALUE],
        othersInput: ' ',
      })
      const validateResult = validateFieldV3({
        formId,
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should disallow multiple CLIENT_CHECKBOX_OTHERS_INPUT_VALUE to be submitted if field is configured for Others', () => {
      const fieldOptions = ['a', 'b', 'c']
      const formField = generateDefaultFieldV3(BasicField.Checkbox, {
        fieldOptions,
        othersRadioButton: true,
      })
      const response = generateCheckboxResponseV3({
        value: [
          CLIENT_CHECKBOX_OTHERS_INPUT_VALUE,
          'a',
          CLIENT_CHECKBOX_OTHERS_INPUT_VALUE,
        ],
        othersInput: 'b',
      })
      const validateResult = validateFieldV3({
        formId,
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should disallow admin defined Others: and othersInput option which causes string collision to be submitted if field is configured for Others', () => {
      const fieldOptions = ['a', 'b', 'c']
      const formField = generateDefaultFieldV3(BasicField.Checkbox, {
        fieldOptions,
        othersRadioButton: true,
      })
      const response = generateCheckboxResponseV3({
        value: [CLIENT_CHECKBOX_OTHERS_INPUT_VALUE, 'a', 'Others: xyz'],
        othersInput: 'xyz',
      })
      const validateResult = validateFieldV3({
        formId,
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should allow submission without Others option even if field is configured for Others', () => {
      const fieldOptions = ['a', 'b', 'c']
      const formField = generateDefaultFieldV3(BasicField.Checkbox, {
        fieldOptions,
        othersRadioButton: true,
      })
      const response = generateCheckboxResponseV3({
        value: ['a'],
      })
      const validateResult = validateFieldV3({
        formId,
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })
  })

  describe('Selection limits', () => {
    it('should disallow more answers than customMax if selection limits are configured', () => {
      const fieldOptions = ['a', 'b', 'c', 'd', 'e']
      const formField = generateDefaultFieldV3(BasicField.Checkbox, {
        fieldOptions,
        validateByValue: true,
        ValidationOptions: { customMax: 2, customMin: null },
      })
      const response = generateCheckboxResponseV3({
        value: ['c', 'd', 'e'],
      })
      const validateResult = validateFieldV3({
        formId,
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should disallow more answers than customMax if selection limits are configured including others', () => {
      const fieldOptions = ['a', 'b', 'c', 'd', 'e']
      const formField = generateDefaultFieldV3(BasicField.Checkbox, {
        fieldOptions,
        validateByValue: true,
        othersRadioButton: true,
        ValidationOptions: { customMax: 2, customMin: null },
      })
      const response = generateCheckboxResponseV3({
        value: ['c', 'd', CLIENT_CHECKBOX_OTHERS_INPUT_VALUE],
        othersInput: 'others',
      })
      const validateResult = validateFieldV3({
        formId,
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should allow less than or equal answers than customMax if selection limits are configured including others', () => {
      const fieldOptions = ['a', 'b', 'c', 'd', 'e']
      const formField = generateDefaultFieldV3(BasicField.Checkbox, {
        fieldOptions,
        validateByValue: true,
        othersRadioButton: true,
        ValidationOptions: { customMax: 2, customMin: null },
      })
      const response = generateCheckboxResponseV3({
        value: ['c', CLIENT_CHECKBOX_OTHERS_INPUT_VALUE],
        othersInput: 'others',
      })
      const validateResult = validateFieldV3({
        formId,
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should disallow fewer answers than customMin if selection limits are configured', () => {
      const fieldOptions = ['a', 'b', 'c', 'd', 'e']
      const formField = generateDefaultFieldV3(BasicField.Checkbox, {
        fieldOptions,
        validateByValue: true,
        ValidationOptions: { customMax: null, customMin: 2 },
      })
      const response = generateCheckboxResponseV3({
        value: ['c'],
      })
      const validateResult = validateFieldV3({
        formId,
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should allow more or equal answers than customMin if selection limits are configured', () => {
      const fieldOptions = ['a', 'b', 'c', 'd', 'e']
      const formField = generateDefaultFieldV3(BasicField.Checkbox, {
        fieldOptions,
        validateByValue: true,
        ValidationOptions: { customMax: null, customMin: 2 },
      })
      const response = generateCheckboxResponseV3({
        value: ['c', 'b'],
      })
      const validateResult = validateFieldV3({
        formId,
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should allow more or equal answers than customMin if selection limits are configured including others', () => {
      const fieldOptions = ['a', 'b', 'c', 'd', 'e']
      const formField = generateDefaultFieldV3(BasicField.Checkbox, {
        fieldOptions,
        validateByValue: true,
        othersRadioButton: true,
        ValidationOptions: { customMax: null, customMin: 2 },
      })
      const response = generateCheckboxResponseV3({
        value: ['c', CLIENT_CHECKBOX_OTHERS_INPUT_VALUE],
        othersInput: 'others',
      })
      const validateResult = validateFieldV3({
        formId,
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should allow more answers than customMax if selection limits are not configured', () => {
      const fieldOptions = ['a', 'b', 'c', 'd', 'e']
      const formField = generateDefaultFieldV3(BasicField.Checkbox, {
        fieldOptions,
        validateByValue: false,
        ValidationOptions: { customMax: 2, customMin: null },
      })
      const response = generateCheckboxResponseV3({
        value: ['c', 'd', 'e'],
      })
      const validateResult = validateFieldV3({
        formId,
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should allow fewer answers than customMin if selection limits are not configured', () => {
      const fieldOptions = ['a', 'b', 'c', 'd', 'e']
      const formField = generateDefaultFieldV3(BasicField.Checkbox, {
        fieldOptions,
        validateByValue: false,
        ValidationOptions: { customMax: null, customMin: 2 },
      })
      const response = generateCheckboxResponseV3({
        value: ['c'],
      })
      const validateResult = validateFieldV3({
        formId,
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should disallow more answers than customMax, and fewer answers than customMin, if selection limits are configured', () => {
      const fieldOptions = ['a', 'b', 'c', 'd', 'e']
      const formField = generateDefaultFieldV3(BasicField.Checkbox, {
        fieldOptions,
        validateByValue: true,
        ValidationOptions: { customMax: 4, customMin: 2 },
      })
      const validResponse = generateCheckboxResponseV3({
        value: ['c', 'd', 'e'],
      })
      const validateResult = validateFieldV3({
        formId,
        formField,
        response: validResponse,
        isVisible: true,
      })
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)

      const moreAnswers = generateCheckboxResponseV3({
        value: ['c', 'd', 'e', 'a', 'b'],
      })
      const validateMoreAnswersResult = validateFieldV3({
        formId,
        formField,
        response: moreAnswers,
        isVisible: true,
      })
      expect(validateMoreAnswersResult.isErr()).toBe(true)
      expect(validateMoreAnswersResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )

      const fewerAnswers = generateCheckboxResponseV3({
        value: ['c'],
      })
      const validateFewerAnswersResult = validateFieldV3({
        formId,
        formField,
        response: fewerAnswers,
        isVisible: true,
      })
      expect(validateFewerAnswersResult.isErr()).toBe(true)
      expect(validateFewerAnswersResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })
  })
})
