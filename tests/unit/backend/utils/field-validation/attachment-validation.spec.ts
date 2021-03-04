import { ObjectId } from 'mongodb'

import { ValidateFieldError } from 'src/app/modules/submission/submission.errors'
import { ProcessedAttachmentResponse } from 'src/app/modules/submission/submission.types'
import { validateField } from 'src/app/utils/field-validation/'
import { BasicField, IAttachmentFieldSchema, IField } from 'src/types'

import {
  generateDefaultField,
  generateNewAttachmentResponse,
} from '../../helpers/generate-form-data'

describe('Attachment validation', () => {
  const makeField = (
    fieldId: string,
    attachmentSize: string,
    customParams?: Partial<IField>,
  ): IAttachmentFieldSchema => {
    return {
      ...generateDefaultField(BasicField.Attachment, customParams),
      _id: fieldId,
      attachmentSize,
    } as IAttachmentFieldSchema
  }

  const makeResponse = (
    fieldId: string,
    content: Buffer | undefined,
    customParams?: Partial<ProcessedAttachmentResponse>,
  ): ProcessedAttachmentResponse => {
    return {
      ...generateNewAttachmentResponse(customParams),
      _id: fieldId,
      content,
    } as ProcessedAttachmentResponse
  }

  const formId = new ObjectId().toHexString()
  const fieldId = new ObjectId().toHexString()

  describe('Required or optional', () => {
    it('should disallow submission with no attachment if it is required', () => {
      const formField = makeField(fieldId, '1')
      const response = makeResponse(fieldId, undefined)
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should allow submission with no attachment if it is not required', () => {
      const formField = makeField(fieldId, '1', { required: false })
      const response = makeResponse(fieldId, undefined, { answer: '' })
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should disallow submission with no answer if it is required', () => {
      const formField = makeField(fieldId, '1')
      const response = makeResponse(fieldId, Buffer.alloc(1), { answer: '' })
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should allow submission with no answer if it is not required', () => {
      const formField = makeField(fieldId, '1', { required: false })
      const response = makeResponse(fieldId, Buffer.alloc(1), { answer: '' })
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should disallow when it is not required but with answer and no attachment', () => {
      const formField = makeField(fieldId, '1', { required: false })
      const response = makeResponse(fieldId, undefined)
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })
  })

  describe('Validation of attachment size', () => {
    it('should allow attachment with valid size', () => {
      const formField = makeField(fieldId, '1')
      const response = makeResponse(fieldId, Buffer.alloc(1))
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should disallow attachment that exceeds size', () => {
      const formField = makeField(fieldId, '1')
      const response = makeResponse(fieldId, Buffer.alloc(2000000))
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should respect the attachmentSize from formField', () => {
      const formField = makeField(fieldId, '3')
      const response = makeResponse(fieldId, Buffer.alloc(2000000))
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })
  })

  describe('check for responses on hidden fields', () => {
    it('should disallow responses submitted for hidden fields when response contains file content', () => {
      const formField = makeField(fieldId, '3')
      const response = makeResponse(fieldId, Buffer.alloc(2000000), {
        answer: '',
        filename: '',
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

    it('should disallow responses submitted for hidden fields when response contains answer', () => {
      const formField = makeField(fieldId, '3')
      const response = makeResponse(fieldId, undefined, {
        answer: 'some answer',
        filename: '',
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

    it('should disallow responses submitted for hidden fields when response contains filename', () => {
      const formField = makeField(fieldId, '3')
      const response = makeResponse(fieldId, undefined, {
        answer: '',
        filename: 'some filename',
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
  })
})
