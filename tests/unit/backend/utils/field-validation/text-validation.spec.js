const {
  validateField,
} = require('../../../../../dist/backend/app/utils/field-validation')
const {
  ValidateFieldError,
} = require('../../../../../dist/backend/app/modules/submission/submission.errors')
describe('Text validation', () => {
  const makeTextField = (fieldType) => (
    fieldId,
    validationOptions,
    options,
  ) => {
    return {
      _id: fieldId,
      fieldType,
      required: true,
      ValidationOptions: {
        customMax: null,
        customMin: null,
        customVal: null,
        selectedValidation: null,
        ...validationOptions,
      },
      ...options,
    }
  }

  const makeTextResponse = (fieldType) => (fieldId, answer) => {
    const response = {
      _id: fieldId,
      fieldType,
      answer,
      isVisible: true,
    }
    return response
  }

  describe('Short text', () => {
    const makeShortTextField = makeTextField('textfield')
    const makeShortTextResponse = makeTextResponse('textfield')
    const formId = '5dd3b0bd3fbe670012fdf23f'
    const fieldId = '5ad072e3d9a3d4000f2c77c8'

    it('should disallow empty submissions if field is required', () => {
      const formField = makeShortTextField(fieldId)
      const response = makeShortTextResponse(fieldId, '')
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should allow empty submissions if field is optional', () => {
      const formField = makeShortTextField(fieldId, {}, { required: false })
      const response = makeShortTextResponse(fieldId, '')
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should allow any number of characters in submission if selectedValidation is not set', () => {
      const formField = makeShortTextField(fieldId)
      const response = makeShortTextResponse(fieldId, 'hello world')
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should disallow whitespace answer if field is required', () => {
      const isLogic = false
      const formField = makeShortTextField(fieldId, {}, { required: true })
      const response = makeShortTextResponse(fieldId, ' ')
      const validateResult = validateField(formId, formField, response, isLogic)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should disallow fewer characters than customMin if selectedValidation is Exact', () => {
      const formField = makeShortTextField(fieldId, {
        customMin: 10,
        selectedValidation: 'Exact',
      })
      const response = makeShortTextResponse(fieldId, 'fewer')
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should disallow more characters than customMin if selectedValidation is Exact', () => {
      const formField = makeShortTextField(fieldId, {
        customMin: 10,
        selectedValidation: 'Exact',
      })
      const response = makeShortTextResponse(fieldId, 'many more characters')
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should disallow fewer characters than customMax if selectedValidation is Exact', () => {
      const formField = makeShortTextField(fieldId, {
        customMax: 10,
        selectedValidation: 'Exact',
      })
      const response = makeShortTextResponse(fieldId, 'fewer')
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should disallow more characters than customMax if selectedValidation is Exact', () => {
      const formField = makeShortTextField(fieldId, {
        customMin: 10,
        selectedValidation: 'Exact',
      })
      const response = makeShortTextResponse(fieldId, 'many more characters')
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should disallow fewer characters than customMin if selectedValidation is Minimum', () => {
      const formField = makeShortTextField(fieldId, {
        customMin: 10,
        selectedValidation: 'Minimum',
      })
      const response = makeShortTextResponse(fieldId, 'a')
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should disallow more characters than customMax if selectedValidation is Maximum', () => {
      const formField = makeShortTextField(fieldId, {
        customMax: 10,
        selectedValidation: 'Maximum',
      })
      const response = makeShortTextResponse(fieldId, 'many more characters')
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })
  })

  describe('Long text', () => {
    const makeLongTextField = makeTextField('textarea')
    const makeLongTextResponse = makeTextResponse('textarea')
    const formId = '5dd3b0bd3fbe670012fdf23f'
    const fieldId = '5ad072e3d9a3d4000f2c77c8'

    it('should disallow empty submissions if field is required', () => {
      const formField = makeLongTextField(fieldId)
      const response = makeLongTextResponse(fieldId, '')
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should allow empty submissions if field is optional', () => {
      const formField = makeLongTextField(fieldId, {}, { required: false })
      const response = makeLongTextResponse(fieldId, '')
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should allow a valid submission if selectedValidation is not set', () => {
      const formField = makeLongTextField(fieldId)
      const response = makeLongTextResponse(fieldId, 'hello world')
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should disallow whitespace answer if field is required', () => {
      const isLogic = false
      const formField = makeLongTextField(fieldId, {}, { required: true })
      const response = makeLongTextResponse(fieldId, '   ')
      const validateResult = validateField(formId, formField, response, isLogic)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should disallow fewer characters than customMin if selectedValidation is Exact', () => {
      const formField = makeLongTextField(fieldId, {
        customMin: 10,
        selectedValidation: 'Exact',
      })
      const response = makeLongTextResponse(fieldId, 'fewer')
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should disallow more characters than customMin if selectedValidation is Exact', () => {
      const formField = makeLongTextField(fieldId, {
        customMin: 10,
        selectedValidation: 'Exact',
      })
      const response = makeLongTextResponse(fieldId, 'many more characters')
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should disallow fewer characters than customMax if selectedValidation is Exact', () => {
      const formField = makeLongTextField(fieldId, {
        customMax: 10,
        selectedValidation: 'Exact',
      })
      const response = makeLongTextResponse(fieldId, 'fewer')
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should disallow more characters than customMax if selectedValidation is Exact', () => {
      const formField = makeLongTextField(fieldId, {
        customMax: 10,
        selectedValidation: 'Exact',
      })
      const response = makeLongTextResponse(fieldId, 'many more characters')
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should disallow fewer characters than customMin if selectedValidation is Minimum', () => {
      const formField = makeLongTextField(fieldId, {
        customMin: 10,
        selectedValidation: 'Minimum',
      })
      const response = makeLongTextResponse(fieldId, 'a')
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should disallow more characters than customMax if selectedValidation is Maximum', () => {
      const formField = makeLongTextField(fieldId, {
        customMax: 10,
        selectedValidation: 'Maximum',
      })
      const response = makeLongTextResponse(fieldId, 'many more characters')
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })
  })
})
