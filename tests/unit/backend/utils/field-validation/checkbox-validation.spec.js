const validateField = require('../../../../../dist/backend/app/utils/field-validation')
  .default
describe('Checkbox validation', () => {
  const makeCheckboxField = (fieldId, fieldOptions, options) => {
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
    return checkbox
  }
  const makeCheckboxResponse = (fieldId, answerArray) => {
    const response = {
      _id: fieldId,
      fieldType: 'checkbox',
      answerArray,
      isVisible: true,
    }
    return response
  }

  const formId = '5dd3b0bd3fbe670012fdf23f'
  const fieldId = '5ad072e3d9a3d4000f2c77c8'
  describe('Required or optional', () => {
    it('should disallow empty submission if checkbox is required', () => {
      const fieldOptions = ['a', 'b', 'c']
      const formField = makeCheckboxField(fieldId, fieldOptions)
      const response = makeCheckboxResponse(fieldId, [])
      const testFunc = () => validateField(formId, formField, response)
      expect(testFunc).toThrow()
    })
    it('should allow empty submission if checkbox is optional', () => {
      const fieldOptions = ['a', 'b', 'c']
      const formField = makeCheckboxField(fieldId, fieldOptions, {
        required: false,
      })
      const response = makeCheckboxResponse(fieldId, [])
      const testFunc = () => validateField(formId, formField, response)
      expect(testFunc).not.toThrow()
    })
  })

  describe('Validation of field options', () => {
    it('should allow a valid option to be selected', () => {
      const fieldOptions = ['a', 'b', 'c']
      const formField = makeCheckboxField(fieldId, fieldOptions)
      const response = makeCheckboxResponse(fieldId, ['a'])
      const testFunc = () => validateField(formId, formField, response)
      expect(testFunc).not.toThrow()
    })
    it('should allow multiple valid options to be selected', () => {
      const fieldOptions = ['a', 'b', 'c']
      const formField = makeCheckboxField(fieldId, fieldOptions)
      const response = makeCheckboxResponse(fieldId, ['a', 'b'])
      const testFunc = () => validateField(formId, formField, response)
      expect(testFunc).not.toThrow()
    })
    it('should disallow answers not in fieldOptions', () => {
      const fieldOptions = ['a', 'b', 'c']
      const formField = makeCheckboxField(fieldId, fieldOptions)
      const response = makeCheckboxResponse(fieldId, ['a', 'notinoption'])
      const testFunc = () => validateField(formId, formField, response)
      expect(testFunc).toThrow()
    })
    it('should disallow duplicate answers', () => {
      const fieldOptions = ['a', 'b', 'c']
      const formField = makeCheckboxField(fieldId, fieldOptions)
      const response = makeCheckboxResponse(fieldId, ['a', 'b', 'a'])
      const testFunc = () => validateField(formId, formField, response)
      expect(testFunc).toThrow()
    })
    it('should allow self-configured others options in field options', () => {
      // This occurs when admins create their own checkboxes with options like ["Others: <please specify>"]
      const fieldOptions = ['a', 'b', 'c', 'Others: <please specify>']
      const formField = makeCheckboxField(fieldId, fieldOptions)
      const response = makeCheckboxResponse(fieldId, [
        'Others: <please specify>',
      ])
      const testFunc = () => validateField(formId, formField, response)
      expect(testFunc).not.toThrow()
    })
    it('should allow Others option to be submitted if field is configured for Others', () => {
      const fieldOptions = ['a', 'b', 'c']
      const formField = makeCheckboxField(fieldId, fieldOptions, {
        othersRadioButton: true,
      })
      const response = makeCheckboxResponse(fieldId, ['a', 'Others: xyz'])
      const testFunc = () => validateField(formId, formField, response)
      expect(testFunc).not.toThrow()
    })
    it('should disallow Others option to be submitted if field is not configured for Others', () => {
      const fieldOptions = ['a', 'b', 'c']
      const formField = makeCheckboxField(fieldId, fieldOptions, {
        othersRadioButton: false,
      })
      const response = makeCheckboxResponse(fieldId, ['a', 'Others: xyz'])
      const testFunc = () => validateField(formId, formField, response)
      expect(testFunc).toThrow()
    })
    it('should disallow Others option to be submitted with blank answer if field is configured for Others', () => {
      const fieldOptions = ['a', 'b', 'c']
      const formField = makeCheckboxField(fieldId, fieldOptions, {
        othersRadioButton: true,
      })
      const response = makeCheckboxResponse(fieldId, ['a', 'Others: '])
      const testFunc = () => validateField(formId, formField, response)
      expect(testFunc).toThrow()
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
      const testFunc = () => validateField(formId, formField, response)
      expect(testFunc).toThrow()
    })

    it('should disallow fewer answers than customMin if selection limits are configured', () => {
      const fieldOptions = ['a', 'b', 'c', 'd', 'e']
      const formField = makeCheckboxField(fieldId, fieldOptions, {
        validateByValue: true,
        ValidationOptions: { customMax: null, customMin: 2 },
      })
      const response = makeCheckboxResponse(fieldId, ['c'])
      const testFunc = () => validateField(formId, formField, response)
      expect(testFunc).toThrow()
    })

    it('should allow more answers than customMax if selection limits are not configured', () => {
      const fieldOptions = ['a', 'b', 'c', 'd', 'e']
      const formField = makeCheckboxField(fieldId, fieldOptions, {
        validateByValue: false,
        ValidationOptions: { customMax: 2, customMin: null },
      })
      const response = makeCheckboxResponse(fieldId, ['c', 'd', 'e'])
      const testFunc = () => validateField(formId, formField, response)
      expect(testFunc).not.toThrow()
    })

    it('should allow fewer answers than customMin if selection limits are not configured', () => {
      const fieldOptions = ['a', 'b', 'c', 'd', 'e']
      const formField = makeCheckboxField(fieldId, fieldOptions, {
        validateByValue: false,
        ValidationOptions: { customMax: null, customMin: 2 },
      })
      const response = makeCheckboxResponse(fieldId, ['c'])
      const testFunc = () => validateField(formId, formField, response)
      expect(testFunc).not.toThrow()
    })

    it('should disallow more answers than customMax, and fewer answers than customMin, if selection limits are configured', () => {
      const fieldOptions = ['a', 'b', 'c', 'd', 'e']
      const formField = makeCheckboxField(fieldId, fieldOptions, {
        validateByValue: true,
        ValidationOptions: { customMax: 4, customMin: 2 },
      })

      const validResponse = makeCheckboxResponse(fieldId, ['c', 'd', 'e'])
      const validTestFunc = () =>
        validateField(formId, formField, validResponse)
      expect(validTestFunc).not.toThrow()

      const moreAnswers = makeCheckboxResponse(fieldId, [
        'c',
        'd',
        'e',
        'a',
        'b',
      ])
      const moreAnswersTestFunc = () =>
        validateField(formId, formField, moreAnswers)
      expect(moreAnswersTestFunc).toThrow()

      const fewerAnswers = makeCheckboxResponse(fieldId, ['c'])
      const fewerAnswersTestFunc = () =>
        validateField(formId, formField, fewerAnswers)
      expect(fewerAnswersTestFunc).toThrow()
    })
  })
})
