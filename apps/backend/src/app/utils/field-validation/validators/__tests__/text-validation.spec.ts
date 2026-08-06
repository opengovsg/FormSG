import {
  generateDefaultField,
  generateDefaultFieldV4,
  generateNewSingleAnswerResponse,
} from '__tests__/unit/backend/helpers/generate-form-data'
import { BasicField, TextSelectedValidation } from 'formsg-shared/types'

import {
  ValidateFieldError,
  ValidateFieldErrorV4,
} from 'src/app/modules/submission/submission.errors'
import { validateField, validateFieldV4 } from 'src/app/utils/field-validation'
import { ParsedClearFormFieldResponseV4 } from 'src/types/api'

describe('Text validation', () => {
  describe('Short text', () => {
    it('should disallow empty submissions if field is required', () => {
      const formField = generateDefaultField(BasicField.ShortText)
      const response = generateNewSingleAnswerResponse(BasicField.ShortText, {
        answer: '',
      })

      const validateResult = validateField('formId', formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should allow empty submissions if field is optional', () => {
      const formField = generateDefaultField(BasicField.ShortText, {
        required: false,
      })
      const response = generateNewSingleAnswerResponse(BasicField.ShortText, {
        answer: '',
      })
      const validateResult = validateField('formId', formField, response)
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should allow any number of characters in submission if selectedValidation is not set', () => {
      const formField = generateDefaultField(BasicField.ShortText)
      const response = generateNewSingleAnswerResponse(BasicField.ShortText, {
        answer: 'hello world',
      })
      const validateResult = validateField('formId', formField, response)
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should disallow whitespace answer if field is required', () => {
      const formField = generateDefaultField(BasicField.ShortText)
      const response = generateNewSingleAnswerResponse(BasicField.ShortText, {
        answer: ' ',
      })
      const validateResult = validateField('formId', formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should disallow fewer characters than customVal if selectedValidation is Exact', () => {
      const formField = generateDefaultField(BasicField.ShortText, {
        ValidationOptions: {
          selectedValidation: TextSelectedValidation.Exact,
          customVal: 10,
        },
      })
      const response = generateNewSingleAnswerResponse(BasicField.ShortText, {
        answer: 'fewer',
      })
      const validateResult = validateField('formId', formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should disallow more characters than customVal if selectedValidation is Exact', () => {
      const formField = generateDefaultField(BasicField.ShortText, {
        ValidationOptions: {
          selectedValidation: TextSelectedValidation.Exact,
          customVal: 10,
        },
      })
      const response = generateNewSingleAnswerResponse(BasicField.ShortText, {
        answer: 'more than 10 chars',
      })

      const validateResult = validateField('formId', formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should disallow fewer characters than customVal if selectedValidation is Minimum', () => {
      const formField = generateDefaultField(BasicField.ShortText, {
        ValidationOptions: {
          selectedValidation: TextSelectedValidation.Minimum,
          customVal: 10,
        },
      })
      const response = generateNewSingleAnswerResponse(BasicField.ShortText, {
        answer: 'fewer',
      })
      const validateResult = validateField('formId', formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should disallow more characters than customVal if selectedValidation is Maximum', () => {
      const formField = generateDefaultField(BasicField.ShortText, {
        ValidationOptions: {
          selectedValidation: TextSelectedValidation.Maximum,
          customVal: 10,
        },
      })
      const response = generateNewSingleAnswerResponse(BasicField.ShortText, {
        answer: 'more than 10 chars',
      })
      const validateResult = validateField('formId', formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })
    it('should disallow responses submitted for hidden fields', () => {
      const formField = generateDefaultField(BasicField.ShortText, {
        ValidationOptions: {
          selectedValidation: null,
          customVal: null,
        },
      })
      const response = generateNewSingleAnswerResponse(BasicField.ShortText, {
        answer: 'fewer',
        isVisible: false,
      })
      const validateResult = validateField('formId', formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError(
          'Attempted to submit response on a hidden field',
        ),
      )
    })
  })

  describe('Long text', () => {
    it('should disallow empty submissions if field is required', () => {
      const formField = generateDefaultField(BasicField.LongText, {
        ValidationOptions: {
          selectedValidation: null,
          customVal: null,
        },
      })
      const response = generateNewSingleAnswerResponse(BasicField.LongText, {
        answer: '',
      })
      const validateResult = validateField('formId', formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should allow empty submissions if field is optional', () => {
      const formField = generateDefaultField(BasicField.LongText, {
        ValidationOptions: {
          selectedValidation: null,
          customVal: null,
        },
        required: false,
      })
      const response = generateNewSingleAnswerResponse(BasicField.LongText, {
        answer: '',
      })
      const validateResult = validateField('formId', formField, response)
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should allow a valid submission if selectedValidation is not set', () => {
      const formField = generateDefaultField(BasicField.LongText, {
        ValidationOptions: {
          selectedValidation: null,
          customVal: null,
        },
      })
      const response = generateNewSingleAnswerResponse(BasicField.LongText, {
        answer: 'valid',
      })
      const validateResult = validateField('formId', formField, response)
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should disallow whitespace answer if field is required', () => {
      const formField = generateDefaultField(BasicField.LongText, {
        ValidationOptions: {
          selectedValidation: null,
          customVal: null,
        },
      })
      const response = generateNewSingleAnswerResponse(BasicField.LongText, {
        answer: ' ',
      })
      const validateResult = validateField('formId', formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should disallow fewer characters than customVal if selectedValidation is Exact', () => {
      const formField = generateDefaultField(BasicField.LongText, {
        ValidationOptions: {
          selectedValidation: TextSelectedValidation.Exact,
          customVal: 10,
        },
      })
      const response = generateNewSingleAnswerResponse(BasicField.LongText, {
        answer: 'less',
      })
      const validateResult = validateField('formId', formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should disallow more characters than customVal if selectedValidation is Exact', () => {
      const formField = generateDefaultField(BasicField.LongText, {
        ValidationOptions: {
          selectedValidation: TextSelectedValidation.Exact,
          customVal: 10,
        },
      })
      const response = generateNewSingleAnswerResponse(BasicField.LongText, {
        answer: 'more than 10 chars',
      })
      const validateResult = validateField('formId', formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should disallow fewer characters than customVal if selectedValidation is Minimum', () => {
      const formField = generateDefaultField(BasicField.LongText, {
        ValidationOptions: {
          selectedValidation: TextSelectedValidation.Minimum,
          customVal: 10,
        },
      })
      const response = generateNewSingleAnswerResponse(BasicField.LongText, {
        answer: 'fewer',
      })
      const validateResult = validateField('formId', formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should disallow more characters than customVal if selectedValidation is Maximum', () => {
      const formField = generateDefaultField(BasicField.LongText, {
        ValidationOptions: {
          selectedValidation: TextSelectedValidation.Maximum,
          customVal: 10,
        },
      })
      const response = generateNewSingleAnswerResponse(BasicField.LongText, {
        answer: 'more than 10 chars',
      })
      const validateResult = validateField('formId', formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })
    it('should disallow responses submitted for hidden fields', () => {
      const formField = generateDefaultField(BasicField.LongText, {
        ValidationOptions: {
          selectedValidation: null,
          customVal: null,
        },
      })
      const response = generateNewSingleAnswerResponse(BasicField.LongText, {
        answer: 'some answer',
        isVisible: false,
      })
      response.isVisible = false
      const validateResult = validateField('formId', formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError(
          'Attempted to submit response on a hidden field',
        ),
      )
    })
  })
})

describe('Text validation V4', () => {
  const makeTextResponseV4 = (
    fieldType: BasicField.ShortText | BasicField.LongText,
    answer: string,
  ): ParsedClearFormFieldResponseV4 =>
    ({
      fieldType,
      question: 'Text',
      answer: { value: answer },
      provenance: {},
    }) as ParsedClearFormFieldResponseV4

  describe('Short text', () => {
    it('should allow valid short text answer when not required', () => {
      const formField = generateDefaultFieldV4(BasicField.ShortText, {
        required: false,
      })
      const response = makeTextResponseV4(BasicField.ShortText, 'dim sum')
      const validateResult = validateFieldV4({
        formId: 'formId',
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should disallow empty submissions if field is required', () => {
      const formField = generateDefaultFieldV4(BasicField.ShortText, {
        required: true,
      })
      const response = makeTextResponseV4(BasicField.ShortText, '')

      const validateResult = validateFieldV4({
        formId: 'formId',
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldErrorV4('Invalid answer submitted'),
      )
    })

    it('should allow empty submissions if field is not required', () => {
      const formField = generateDefaultFieldV4(BasicField.ShortText, {
        required: false,
      })
      const response = makeTextResponseV4(BasicField.ShortText, '')
      const validateResult = validateFieldV4({
        formId: 'formId',
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should allow any number of characters in submission if selectedValidation is not set', () => {
      const formField = generateDefaultFieldV4(BasicField.ShortText)
      const response = makeTextResponseV4(BasicField.ShortText, 'dim sum')
      const validateResult = validateFieldV4({
        formId: 'formId',
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should disallow whitespace answer if field is required', () => {
      const formField = generateDefaultFieldV4(BasicField.ShortText)
      const response = makeTextResponseV4(BasicField.ShortText, ' ')
      const validateResult = validateFieldV4({
        formId: 'formId',
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldErrorV4('Invalid answer submitted'),
      )
    })

    it('should disallow fewer characters than customVal if selectedValidation is Exact', () => {
      const formField = generateDefaultFieldV4(BasicField.ShortText, {
        ValidationOptions: {
          selectedValidation: TextSelectedValidation.Exact,
          customVal: 10,
        },
      })
      const response = makeTextResponseV4(BasicField.ShortText, 'fewer')
      const validateResult = validateFieldV4({
        formId: 'formId',
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldErrorV4('Invalid answer submitted'),
      )
    })

    it('should disallow more characters than customVal if selectedValidation is Exact', () => {
      const formField = generateDefaultFieldV4(BasicField.ShortText, {
        ValidationOptions: {
          selectedValidation: TextSelectedValidation.Exact,
          customVal: 10,
        },
      })
      const response = makeTextResponseV4(
        BasicField.ShortText,
        'more than 10 chars',
      )

      const validateResult = validateFieldV4({
        formId: 'formId',
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldErrorV4('Invalid answer submitted'),
      )
    })

    it('should disallow fewer characters than customVal if selectedValidation is Minimum', () => {
      const formField = generateDefaultFieldV4(BasicField.ShortText, {
        ValidationOptions: {
          selectedValidation: TextSelectedValidation.Minimum,
          customVal: 10,
        },
      })
      const response = makeTextResponseV4(BasicField.ShortText, 'fewer')
      const validateResult = validateFieldV4({
        formId: 'formId',
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldErrorV4('Invalid answer submitted'),
      )
    })

    it('should allow more characters than customVal if selectedValidation is Minimum', () => {
      const formField = generateDefaultFieldV4(BasicField.ShortText, {
        ValidationOptions: {
          selectedValidation: TextSelectedValidation.Minimum,
          customVal: 10,
        },
      })
      const response = makeTextResponseV4(
        BasicField.ShortText,
        'more than 10 chars',
      )
      const validateResult = validateFieldV4({
        formId: 'formId',
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should disallow more characters than customVal if selectedValidation is Maximum', () => {
      const formField = generateDefaultFieldV4(BasicField.ShortText, {
        ValidationOptions: {
          selectedValidation: TextSelectedValidation.Maximum,
          customVal: 10,
        },
      })
      const response = makeTextResponseV4(
        BasicField.ShortText,
        'more than 10 chars',
      )
      const validateResult = validateFieldV4({
        formId: 'formId',
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldErrorV4('Invalid answer submitted'),
      )
    })

    it('should allow less characters than customVal if selectedValidation is Maximum', () => {
      const formField = generateDefaultFieldV4(BasicField.ShortText, {
        ValidationOptions: {
          selectedValidation: TextSelectedValidation.Maximum,
          customVal: 10,
        },
      })
      const response = makeTextResponseV4(BasicField.ShortText, 'mapo tofu')
      const validateResult = validateFieldV4({
        formId: 'formId',
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should disallow responses submitted for hidden fields', () => {
      const formField = generateDefaultFieldV4(BasicField.ShortText, {
        ValidationOptions: {
          selectedValidation: null,
          customVal: null,
        },
      })
      const response = makeTextResponseV4(BasicField.ShortText, 'dim sum')
      const validateResult = validateFieldV4({
        formId: 'formId',
        formField,
        response,
        isVisible: false,
      })
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldErrorV4(
          'Attempted to submit response on a hidden field',
        ),
      )
    })
  })

  describe('Long text', () => {
    it('should allow valid long text answer when not required', () => {
      const formField = generateDefaultFieldV4(BasicField.LongText, {
        required: false,
        ValidationOptions: {
          selectedValidation: null,
          customVal: null,
        },
      })
      const response = makeTextResponseV4(BasicField.LongText, 'dim sum')
      const validateResult = validateFieldV4({
        formId: 'formId',
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should disallow empty submissions if field is required', () => {
      const formField = generateDefaultFieldV4(BasicField.LongText, {
        required: true,
        ValidationOptions: {
          selectedValidation: null,
          customVal: null,
        },
      })
      const response = makeTextResponseV4(BasicField.LongText, '')

      const validateResult = validateFieldV4({
        formId: 'formId',
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldErrorV4('Invalid answer submitted'),
      )
    })

    it('should allow empty submissions if field is not required', () => {
      const formField = generateDefaultFieldV4(BasicField.LongText, {
        required: false,
        ValidationOptions: {
          selectedValidation: null,
          customVal: null,
        },
      })
      const response = makeTextResponseV4(BasicField.LongText, '')
      const validateResult = validateFieldV4({
        formId: 'formId',
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should allow any number of characters in submission if selectedValidation is not set', () => {
      const formField = generateDefaultFieldV4(BasicField.LongText, {
        ValidationOptions: {
          selectedValidation: null,
          customVal: null,
        },
      })
      const response = makeTextResponseV4(BasicField.LongText, 'dim sum')
      const validateResult = validateFieldV4({
        formId: 'formId',
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should disallow whitespace answer if field is required', () => {
      const formField = generateDefaultFieldV4(BasicField.LongText, {
        ValidationOptions: {
          selectedValidation: null,
          customVal: null,
        },
      })
      const response = makeTextResponseV4(BasicField.LongText, ' ')
      const validateResult = validateFieldV4({
        formId: 'formId',
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldErrorV4('Invalid answer submitted'),
      )
    })

    it('should disallow fewer characters than customVal if selectedValidation is Exact', () => {
      const formField = generateDefaultFieldV4(BasicField.LongText, {
        ValidationOptions: {
          selectedValidation: TextSelectedValidation.Exact,
          customVal: 10,
        },
      })
      const response = makeTextResponseV4(BasicField.LongText, 'fewer')
      const validateResult = validateFieldV4({
        formId: 'formId',
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldErrorV4('Invalid answer submitted'),
      )
    })

    it('should disallow more characters than customVal if selectedValidation is Exact', () => {
      const formField = generateDefaultFieldV4(BasicField.LongText, {
        ValidationOptions: {
          selectedValidation: TextSelectedValidation.Exact,
          customVal: 10,
        },
      })
      const response = makeTextResponseV4(
        BasicField.LongText,
        'more than 10 chars',
      )

      const validateResult = validateFieldV4({
        formId: 'formId',
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldErrorV4('Invalid answer submitted'),
      )
    })

    it('should disallow fewer characters than customVal if selectedValidation is Minimum', () => {
      const formField = generateDefaultFieldV4(BasicField.LongText, {
        ValidationOptions: {
          selectedValidation: TextSelectedValidation.Minimum,
          customVal: 10,
        },
      })
      const response = makeTextResponseV4(BasicField.LongText, 'fewer')
      const validateResult = validateFieldV4({
        formId: 'formId',
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldErrorV4('Invalid answer submitted'),
      )
    })

    it('should allow more characters than customVal if selectedValidation is Minimum', () => {
      const formField = generateDefaultFieldV4(BasicField.LongText, {
        ValidationOptions: {
          selectedValidation: TextSelectedValidation.Minimum,
          customVal: 10,
        },
      })
      const response = makeTextResponseV4(
        BasicField.LongText,
        'more than 10 chars',
      )
      const validateResult = validateFieldV4({
        formId: 'formId',
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should disallow more characters than customVal if selectedValidation is Maximum', () => {
      const formField = generateDefaultFieldV4(BasicField.LongText, {
        ValidationOptions: {
          selectedValidation: TextSelectedValidation.Maximum,
          customVal: 10,
        },
      })
      const response = makeTextResponseV4(
        BasicField.LongText,
        'more than 10 chars',
      )
      const validateResult = validateFieldV4({
        formId: 'formId',
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldErrorV4('Invalid answer submitted'),
      )
    })

    it('should allow less characters than customVal if selectedValidation is Maximum', () => {
      const formField = generateDefaultFieldV4(BasicField.LongText, {
        ValidationOptions: {
          selectedValidation: TextSelectedValidation.Maximum,
          customVal: 10,
        },
      })
      const response = makeTextResponseV4(BasicField.LongText, 'mapo tofu')
      const validateResult = validateFieldV4({
        formId: 'formId',
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should disallow responses submitted for hidden fields', () => {
      const formField = generateDefaultFieldV4(BasicField.LongText, {
        ValidationOptions: {
          selectedValidation: null,
          customVal: null,
        },
      })
      const response = makeTextResponseV4(BasicField.LongText, 'dim sum')
      const validateResult = validateFieldV4({
        formId: 'formId',
        formField,
        response,
        isVisible: false,
      })
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldErrorV4(
          'Attempted to submit response on a hidden field',
        ),
      )
    })
  })
})
