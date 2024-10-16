import {
  generateAttachmentResponseV3,
  generateDefaultField,
  generateDefaultFieldV3,
  generateNewAttachmentResponse,
} from '__tests__/unit/backend/helpers/generate-form-data'
import { mongo as mongodb } from 'mongoose'

import { ValidateFieldError } from 'src/app/modules/submission/submission.errors'
import { validateField, validateFieldV3 } from 'src/app/utils/field-validation/'

import {
  AttachmentSize,
  BasicField,
  FormFieldDto,
} from '../../../../../../shared/types'

const { ObjectId } = mongodb

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

describe('Attachment validation V3', () => {
  const formId = new ObjectId().toHexString()

  describe('Required or optional', () => {
    it('should disallow submission with no attachment if it is required', () => {
      const formField = generateDefaultFieldV3(BasicField.Attachment, {
        attachmentSize: AttachmentSize.OneMb,
      }) as FormFieldDto
      const response = generateAttachmentResponseV3({
        content: undefined as unknown as Buffer,
        answer: 'Attachment answer',
        filename: 'Attachment filename',
        hasBeenScanned: false,
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

    it('should allow submission with attachment if it is required', () => {
      const formField = generateDefaultFieldV3(BasicField.Attachment, {
        attachmentSize: AttachmentSize.OneMb,
      })
      const response = generateAttachmentResponseV3({
        content: Buffer.alloc(1),
        answer: 'Attachment answer',
        filename: 'Attachment filename',
        hasBeenScanned: false,
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

    it('should allow submission with attachment if it is not required', () => {
      const formField = generateDefaultFieldV3(BasicField.Attachment, {
        attachmentSize: AttachmentSize.OneMb,
        required: false,
      })
      const response = generateAttachmentResponseV3({
        content: Buffer.alloc(1),
        answer: 'Attachment answer',
        filename: 'Attachment filename',
        hasBeenScanned: false,
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

    it('should allow submission with no attachment if it is not required', () => {
      const formField = generateDefaultFieldV3(BasicField.Attachment, {
        attachmentSize: AttachmentSize.OneMb,
        required: false,
      })
      const response = generateAttachmentResponseV3({
        answer: '',
        content: undefined as unknown as Buffer,
        filename: 'Attachment filename',
        hasBeenScanned: false,
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

    it('should disallow submission with no answer if it is required', () => {
      const formField = generateDefaultFieldV3(BasicField.Attachment, {
        attachmentSize: AttachmentSize.OneMb,
        required: true,
      })
      const response = generateAttachmentResponseV3({
        content: Buffer.alloc(1),
        answer: '',
        filename: 'Attachment filename',
        hasBeenScanned: false,
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

    it('should allow submission with no answer if it is not required', () => {
      const formField = generateDefaultFieldV3(BasicField.Attachment, {
        attachmentSize: AttachmentSize.OneMb,
        required: false,
      })
      const response = generateAttachmentResponseV3({
        content: Buffer.alloc(1),
        answer: '',
        filename: 'Attachment filename',
        hasBeenScanned: false,
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

    it('should disallow when it is not required but with answer and no attachment', () => {
      const formField = generateDefaultFieldV3(BasicField.Attachment, {
        attachmentSize: AttachmentSize.OneMb,
        required: false,
      })
      const response = generateAttachmentResponseV3({
        answer: 'some answer',
        content: undefined as unknown as Buffer,
        filename: 'Attachment filename',
        hasBeenScanned: false,
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
  })

  describe('Validation of attachment size', () => {
    it('should allow attachment with valid size', () => {
      const formField = generateDefaultFieldV3(BasicField.Attachment, {
        attachmentSize: AttachmentSize.OneMb,
      })
      const response = generateAttachmentResponseV3({
        content: Buffer.alloc(1),
        answer: 'Attachment answer',
        filename: 'Attachment filename',
        hasBeenScanned: false,
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

    it('should disallow attachment that exceeds size', () => {
      const formField = generateDefaultFieldV3(BasicField.Attachment, {
        attachmentSize: AttachmentSize.OneMb,
      })
      const response = generateAttachmentResponseV3({
        content: Buffer.alloc(2000000),
        answer: 'Attachment answer',
        filename: 'Attachment filename',
        hasBeenScanned: false,
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

    it('should respect the attachmentSize from formField', () => {
      const formField = generateDefaultFieldV3(BasicField.Attachment, {
        attachmentSize: AttachmentSize.ThreeMb,
      })
      const response = generateAttachmentResponseV3({
        content: Buffer.alloc(2000000),
        answer: 'Attachment answer',
        filename: 'Attachment filename',
        hasBeenScanned: false,
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

  describe('check for responses on hidden fields', () => {
    it('should disallow responses submitted for hidden fields when response contains file content', () => {
      const formField = generateDefaultFieldV3(BasicField.Attachment, {
        attachmentSize: AttachmentSize.ThreeMb,
      })
      const response = generateAttachmentResponseV3({
        content: Buffer.alloc(2000000),
        answer: '',
        filename: '',
        hasBeenScanned: false,
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

    it('should disallow responses submitted for hidden fields when response contains answer', () => {
      const formField = generateDefaultFieldV3(BasicField.Attachment, {
        attachmentSize: AttachmentSize.ThreeMb,
      })
      const response = generateAttachmentResponseV3({
        content: undefined as unknown as Buffer,
        answer: 'some answer',
        filename: '',
        hasBeenScanned: false,
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

    it('should disallow responses submitted for hidden fields when response contains filename', () => {
      const formField = generateDefaultFieldV3(BasicField.Attachment, {
        attachmentSize: AttachmentSize.ThreeMb,
      })
      const response = generateAttachmentResponseV3({
        content: undefined as unknown as Buffer,
        answer: '',
        filename: 'some filename',
        hasBeenScanned: false,
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
  })
})
