const {
  validateField,
} = require('../../../../../dist/backend/app/utils/field-validation')

describe('Attachment validation', () => {
  const makeField = (fieldId, size, options) => {
    const attachment = {
      _id: fieldId,
      fieldType: 'attachment',
      attachmentSize: size,
      required: true,
      ...options,
    }
    return attachment
  }

  const makeResponse = (fieldId, buffer, options) => {
    const response = {
      _id: fieldId,
      fieldType: 'attachment',
      answer: 'file.jpg',
      filename: 'file.jpg',
      content: buffer,
      isVisible: true,
      ...options,
    }
    return response
  }

  const formId = '5dd3b0bd3fbe670012fdf23f'
  const fieldId = '5ad072e3d9a3d4000f2c77c8'

  describe('Required or optional', () => {
    it('should disallow submission with no attachment if it is required', () => {
      const formField = makeField(fieldId, '1')
      const response = makeResponse(fieldId, undefined)
      const testFunc = () => validateField(formId, formField, response)
      expect(testFunc).toThrow()
    })

    it('should allow submission with no attachment if it is not required', () => {
      const formField = makeField(fieldId, '1', { required: false })
      const response = makeResponse(fieldId, undefined, { answer: '' })
      const testFunc = () => validateField(formId, formField, response)
      expect(testFunc).not.toThrow()
    })

    it('should disallow submission with no answer if it is required', () => {
      const formField = makeField(fieldId, '1')
      const response = makeResponse(fieldId, Buffer.alloc(1), { answer: '' })
      const testFunc = () => validateField(formId, formField, response)
      expect(testFunc).toThrow()
    })

    it('should allow submission with no answer if it is not required', () => {
      const formField = makeField(fieldId, '1', { required: false })
      const response = makeResponse(fieldId, Buffer.alloc(1), { answer: '' })
      const testFunc = () => validateField(formId, formField, response)
      expect(testFunc).not.toThrow()
    })

    it('should disallow when it is not required but with answer and no attachment', () => {
      const formField = makeField(fieldId, '1', { required: false })
      const response = makeResponse(fieldId, undefined)
      const testFunc = () => validateField(formId, formField, response)
      expect(testFunc).toThrow()
    })
  })

  describe('Validation of attachment size', () => {
    it('should allow attachment with valid size', () => {
      const formField = makeField(fieldId, '1')
      const response = makeResponse(fieldId, Buffer.alloc(1))
      const testFunc = () => validateField(formId, formField, response)
      expect(testFunc).not.toThrow()
    })

    it('should disallow attachment that exceeds size', () => {
      const formField = makeField(fieldId, '1')
      const response = makeResponse(fieldId, Buffer.alloc(2000000))
      const testFunc = () => validateField(formId, formField, response)
      expect(testFunc).toThrow()
    })

    it('should respect the attachmentSize from formField', () => {
      const formField = makeField(fieldId, '3')
      const response = makeResponse(fieldId, Buffer.alloc(2000000))
      const testFunc = () => validateField(formId, formField, response)
      expect(testFunc).not.toThrow()
    })
  })
})
