import { ObjectId } from 'mongodb'

import { ValidateFieldError } from 'src/app/modules/submission/submission.errors'
import { validateField } from 'src/app/utils/field-validation/'
import { AttachmentSize, BasicField } from 'src/types'

import {
  generateDefaultField,
  generateNewAttachmentResponse,
} from 'tests/unit/backend/helpers/generate-form-data'

describe('Attachment validation', () => {
  const formId = new ObjectId().toHexString()

  describe('Required or optional', () => {
    it('should disallow submission with no attachment if it is required', () => {
      const formField = generateDefaultField(BasicField.Attachment, {
        attachmentSize: AttachmentSize.OneMb,
      })
      const response = generateNewAttachmentResponse({ content: undefined })
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should allow submission with attachment if it is required', () => {
      const formField = generateDefaultField(BasicField.Attachment, {
        attachmentSize: AttachmentSize.OneMb,
      })
      const response = generateNewAttachmentResponse({
        content: Buffer.alloc(1),
      })
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should allow submission with attachment if it is optional', () => {
      const formField = generateDefaultField(BasicField.Attachment, {
        attachmentSize: AttachmentSize.OneMb,
        required: false,
      })
      const response = generateNewAttachmentResponse({
        content: Buffer.alloc(1),
      })
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should allow submission with no attachment if it is not required', () => {
      const formField = generateDefaultField(BasicField.Attachment, {
        attachmentSize: AttachmentSize.OneMb,
        required: false,
      })
      const response = generateNewAttachmentResponse({
        content: undefined,
        answer: '',
      })
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should disallow submission with no answer if it is required', () => {
      const formField = generateDefaultField(BasicField.Attachment, {
        attachmentSize: AttachmentSize.OneMb,
        required: true,
      })
      const response = generateNewAttachmentResponse({
        content: Buffer.alloc(1),
        answer: '',
      })
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should allow submission with no answer if it is not required', () => {
      const formField = generateDefaultField(BasicField.Attachment, {
        attachmentSize: AttachmentSize.OneMb,
        required: false,
      })
      const response = generateNewAttachmentResponse({
        content: Buffer.alloc(1),
        answer: '',
      })
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should disallow when it is not required but with answer and no attachment', () => {
      const formField = generateDefaultField(BasicField.Attachment, {
        attachmentSize: AttachmentSize.OneMb,
        required: false,
      })
      const response = generateNewAttachmentResponse({
        answer: 'some answer',
        content: undefined,
      })
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })
  })

  describe('Validation of attachment size', () => {
    it('should allow attachment with valid size', () => {
      const formField = generateDefaultField(BasicField.Attachment, {
        attachmentSize: AttachmentSize.OneMb,
      })
      const response = generateNewAttachmentResponse({
        content: Buffer.alloc(1),
      })
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should disallow attachment that exceeds size', () => {
      const formField = generateDefaultField(BasicField.Attachment, {
        attachmentSize: AttachmentSize.OneMb,
      })
      const response = generateNewAttachmentResponse({
        content: Buffer.alloc(2000000),
      })
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should respect the attachmentSize from formField', () => {
      const formField = generateDefaultField(BasicField.Attachment, {
        attachmentSize: AttachmentSize.ThreeMb,
      })
      const response = generateNewAttachmentResponse({
        content: Buffer.alloc(2000000),
      })
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })
  })

  describe('check for responses on hidden fields', () => {
    it('should disallow responses submitted for hidden fields when response contains file content', () => {
      const formField = generateDefaultField(BasicField.Attachment, {
        attachmentSize: AttachmentSize.ThreeMb,
      })
      const response = generateNewAttachmentResponse({
        content: Buffer.alloc(2000000),
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
      const formField = generateDefaultField(BasicField.Attachment, {
        attachmentSize: AttachmentSize.ThreeMb,
      })
      const response = generateNewAttachmentResponse({
        content: undefined,
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
      const formField = generateDefaultField(BasicField.Attachment, {
        attachmentSize: AttachmentSize.ThreeMb,
      })
      const response = generateNewAttachmentResponse({
        content: undefined,
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
