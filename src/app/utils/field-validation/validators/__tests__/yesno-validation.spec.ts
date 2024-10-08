import {
  generateDefaultField,
  generateNewSingleAnswerResponse,
  generateYesNoAnswerResponseV3,
} from '__tests__/unit/backend/helpers/generate-form-data'

import { ValidateFieldError } from 'src/app/modules/submission/submission.errors'
import { validateField, validateFieldV3 } from 'src/app/utils/field-validation'

import {
  BasicField,
  YesNoFieldResponseV3,
  YesNoResponseV3,
} from '../../../../../../shared/types'

describe('Yes/No field validation', () => {
  it('should allow yes', () => {
    const formField = generateDefaultField(BasicField.YesNo)
    const response = generateNewSingleAnswerResponse(BasicField.YesNo, {
      answer: 'Yes',
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow no', () => {
    const formField = generateDefaultField(BasicField.YesNo)
    const response = generateNewSingleAnswerResponse(BasicField.YesNo, {
      answer: 'No',
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow empty string when not required', () => {
    const formField = generateDefaultField(BasicField.YesNo, {
      required: false,
    })
    const response = generateNewSingleAnswerResponse(BasicField.YesNo, {
      answer: '',
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow empty string when required', () => {
    const formField = generateDefaultField(BasicField.YesNo, {
      required: true,
    })
    const response = generateNewSingleAnswerResponse(BasicField.YesNo, {
      answer: '',
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow invalid input', () => {
    const formField = generateDefaultField(BasicField.YesNo)
    const response = generateNewSingleAnswerResponse(BasicField.YesNo, {
      answer: 'Some answer',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow responses submitted for hidden fields', () => {
    const formField = generateDefaultField(BasicField.YesNo)
    const response = generateNewSingleAnswerResponse(BasicField.YesNo, {
      answer: 'No',
      isVisible: false,
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Attempted to submit response on a hidden field'),
    )
  })

  describe('Yes/No field validation V3', () => {
    it('should allow Yes', () => {
      const formField = generateDefaultField(BasicField.YesNo)
      const response = generateYesNoAnswerResponseV3('Yes')

      const validateResult = validateFieldV3({
        formId: 'formId',
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should allow No', () => {
      const formField = generateDefaultField(BasicField.YesNo)
      const response = generateYesNoAnswerResponseV3('No')

      const validateResult = validateFieldV3({
        formId: 'formId',
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should allow empty string when not required', () => {
      const formField = generateDefaultField(BasicField.YesNo, {
        required: false,
      })
      const response = generateYesNoAnswerResponseV3(
        '' as unknown as YesNoFieldResponseV3,
      )

      const validateResult = validateFieldV3({
        formId: 'formId',
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should disallow empty string when required', () => {
      const formField = generateDefaultField(BasicField.YesNo, {
        required: true,
      })
      const response = generateYesNoAnswerResponseV3(
        '' as unknown as YesNoFieldResponseV3,
      )

      const validateResult = validateFieldV3({
        formId: 'formId',
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should disallow invalid input', () => {
      const formField = generateDefaultField(BasicField.YesNo, {
        required: true,
      })
      const response = generateYesNoAnswerResponseV3(
        'Some answer' as unknown as YesNoFieldResponseV3,
      )
      const validateResult = validateFieldV3({
        formId: 'formId',
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should perform validation and disallow invalid field even when not required', () => {
      const formField = generateDefaultField(BasicField.YesNo, {
        required: false,
      })
      const response = generateYesNoAnswerResponseV3(
        'Some answer' as unknown as YesNoFieldResponseV3,
      )
      const validateResult = validateFieldV3({
        formId: 'formId',
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should disallow responses submitted for hidden fields', () => {
      const formField = generateDefaultField(BasicField.YesNo)
      const response = generateYesNoAnswerResponseV3('No')

      const validateResult = validateFieldV3({
        formId: 'formId',
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
  })
})
