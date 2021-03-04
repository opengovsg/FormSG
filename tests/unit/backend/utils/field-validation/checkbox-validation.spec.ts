import { ValidateFieldError } from 'src/app/modules/submission/submission.errors'
import { ProcessedCheckboxResponse } from 'src/app/modules/submission/submission.types'
import { validateField } from 'src/app/utils/field-validation'
import { CheckboxValidationOptions, IFieldSchema } from 'src/types'

type MakeCheckboxFieldOptions = {
  required?: boolean
  othersRadioButton?: boolean
  validateByValue?: boolean
  ValidationOptions?: CheckboxValidationOptions
}
describe('Checkbox validation', () => {
  const makeCheckboxField = (
    fieldId: string,
    fieldOptions: string[],
    options?: MakeCheckboxFieldOptions,
  ) => {
    const checkbox = {
      _id: fieldId,
      fieldType: 'checkbox',
      required: true,
      fieldOptions,
      othersRadioButton: false,
      validateByValue: false,
      ValidationOptions: {
        customMin: null,
        customMax: null,
      },
      ...options,
    }
    return (checkbox as unknown) as IFieldSchema
  }
  const makeCheckboxResponse = (fieldId: string, answerArray: string[]) => {
    const response = {
      _id: fieldId,
      fieldType: 'checkbox',
      answerArray,
      isVisible: true,
    }
    return (response as unknown) as ProcessedCheckboxResponse
  }

  const formId = '5dd3b0bd3fbe670012fdf23f'
  const fieldId = '5ad072e3d9a3d4000f2c77c8'
  describe('Required or optional', () => {
    it('should disallow empty submission if checkbox is required', () => {
      const fieldOptions = ['a', 'b', 'c']
      const formField = makeCheckboxField(fieldId, fieldOptions)
      const response = makeCheckboxResponse(fieldId, [])
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should allow empty submission if checkbox is optional', () => {
      const fieldOptions = ['a', 'b', 'c']
      const formField = makeCheckboxField(fieldId, fieldOptions, {
        required: false,
      })
      const response = makeCheckboxResponse(fieldId, [])
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })
  })

  describe('Validation of field options', () => {
    it('should allow a valid option to be selected', () => {
      const fieldOptions = ['a', 'b', 'c']
      const formField = makeCheckboxField(fieldId, fieldOptions)
      const response = makeCheckboxResponse(fieldId, ['a'])
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should allow multiple valid options to be selected', () => {
      const fieldOptions = ['a', 'b', 'c']
      const formField = makeCheckboxField(fieldId, fieldOptions)
      const response = makeCheckboxResponse(fieldId, ['a', 'b'])
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should disallow answers not in fieldOptions', () => {
      const fieldOptions = ['a', 'b', 'c']
      const formField = makeCheckboxField(fieldId, fieldOptions)
      const response = makeCheckboxResponse(fieldId, ['a', 'notinoption'])
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should disallow duplicate answers', () => {
      const fieldOptions = ['a', 'b', 'c']
      const formField = makeCheckboxField(fieldId, fieldOptions)
      const response = makeCheckboxResponse(fieldId, ['a', 'b', 'a'])
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should allow self-configured others options in field options', () => {
      // This occurs when admins create their own checkboxes with options like ["Others: <please specify>"]
      const fieldOptions = ['a', 'b', 'c', 'Others: <please specify>']
      const formField = makeCheckboxField(fieldId, fieldOptions)
      const response = makeCheckboxResponse(fieldId, [
        'Others: <please specify>',
      ])
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should allow Others option to be submitted if field is configured for Others', () => {
      const fieldOptions = ['a', 'b', 'c']
      const formField = makeCheckboxField(fieldId, fieldOptions, {
        othersRadioButton: true,
      })
      const response = makeCheckboxResponse(fieldId, ['a', 'Others: xyz'])
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should disallow Others option to be submitted if field is not configured for Others', () => {
      const fieldOptions = ['a', 'b', 'c']
      const formField = makeCheckboxField(fieldId, fieldOptions, {
        othersRadioButton: false,
      })
      const response = makeCheckboxResponse(fieldId, ['a', 'Others: xyz'])
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should disallow Others option to be submitted with blank answer if field is configured for Others', () => {
      const fieldOptions = ['a', 'b', 'c']
      const formField = makeCheckboxField(fieldId, fieldOptions, {
        othersRadioButton: true,
      })
      const response = makeCheckboxResponse(fieldId, ['a', 'Others: '])
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should allow submission without Others option even if field is configured for Others', () => {
      const fieldOptions = ['a', 'b', 'c']
      const formField = makeCheckboxField(fieldId, fieldOptions, {
        othersRadioButton: true,
      })
      const response = makeCheckboxResponse(fieldId, ['a'])
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })
  })

  describe('Selection limits', () => {
    it('should disallow more answers than customMax if selection limits are configured', () => {
      const fieldOptions = ['a', 'b', 'c', 'd', 'e']
      const formField = makeCheckboxField(fieldId, fieldOptions, {
        validateByValue: true,
        ValidationOptions: { customMax: 2, customMin: null },
      })
      const response = makeCheckboxResponse(fieldId, ['c', 'd', 'e'])
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should disallow fewer answers than customMin if selection limits are configured', () => {
      const fieldOptions = ['a', 'b', 'c', 'd', 'e']
      const formField = makeCheckboxField(fieldId, fieldOptions, {
        validateByValue: true,
        ValidationOptions: { customMax: null, customMin: 2 },
      })
      const response = makeCheckboxResponse(fieldId, ['c'])
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should allow more answers than customMax if selection limits are not configured', () => {
      const fieldOptions = ['a', 'b', 'c', 'd', 'e']
      const formField = makeCheckboxField(fieldId, fieldOptions, {
        validateByValue: false,
        ValidationOptions: { customMax: 2, customMin: null },
      })
      const response = makeCheckboxResponse(fieldId, ['c', 'd', 'e'])
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should allow fewer answers than customMin if selection limits are not configured', () => {
      const fieldOptions = ['a', 'b', 'c', 'd', 'e']
      const formField = makeCheckboxField(fieldId, fieldOptions, {
        validateByValue: false,
        ValidationOptions: { customMax: null, customMin: 2 },
      })
      const response = makeCheckboxResponse(fieldId, ['c'])
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should disallow more answers than customMax, and fewer answers than customMin, if selection limits are configured', () => {
      const fieldOptions = ['a', 'b', 'c', 'd', 'e']
      const formField = makeCheckboxField(fieldId, fieldOptions, {
        validateByValue: true,
        ValidationOptions: { customMax: 4, customMin: 2 },
      })

      const validResponse = makeCheckboxResponse(fieldId, ['c', 'd', 'e'])
      const validateResult = validateField(formId, formField, validResponse)
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)

      const moreAnswers = makeCheckboxResponse(fieldId, [
        'c',
        'd',
        'e',
        'a',
        'b',
      ])

      const validateMoreAnswersResult = validateField(
        formId,
        formField,
        moreAnswers,
      )
      expect(validateMoreAnswersResult.isErr()).toBe(true)
      expect(validateMoreAnswersResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )

      const fewerAnswers = makeCheckboxResponse(fieldId, ['c'])

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
  it('should disallow responses submitted for hidden fields', () => {
    const fieldOptions = ['a', 'b', 'c']
    const formField = makeCheckboxField(fieldId, fieldOptions)
    const response = makeCheckboxResponse(fieldId, ['a'])
    response.isVisible = false
    const validateResult = validateField(formId, formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Attempted to submit response on a hidden field'),
    )
  })
})
