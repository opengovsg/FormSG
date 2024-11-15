import {
  generateDefaultField,
  generateDefaultFieldV3,
  generateNewSingleAnswerResponse,
  generateVerifiableAnswerResponseV3,
} from '__tests__/unit/backend/helpers/generate-form-data'

import formsgSdk from 'src/app/config/formsg-sdk'
import { ValidateFieldError } from 'src/app/modules/submission/submission.errors'
import { validateField, validateFieldV3 } from 'src/app/utils/field-validation'

import { BasicField } from '../../../../../../shared/types'

type VerificationMock = {
  authenticate: () => boolean
}

describe('Mobile number validation tests', () => {
  beforeEach(() => {
    jest
      .spyOn(
        formsgSdk.verification as unknown as VerificationMock,
        'authenticate',
      )
      .mockImplementation(() => true)
  })

  it('should allow empty answer for required logic field that is not visible', () => {
    const formField = generateDefaultField(BasicField.Mobile)
    const response = generateNewSingleAnswerResponse(BasicField.Mobile, {
      answer: '',
      isVisible: false,
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow empty answer for optional field', () => {
    const formField = generateDefaultField(BasicField.Mobile, {
      required: false,
    })
    const response = generateNewSingleAnswerResponse(BasicField.Mobile, {
      answer: '',
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should not allow empty answer for required field', () => {
    const formField = generateDefaultField(BasicField.Mobile)
    const response = generateNewSingleAnswerResponse(BasicField.Mobile, {
      answer: '',
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should allow valid mobile numbers for mobile fieldType', () => {
    const formField = generateDefaultField(BasicField.Mobile)
    const response = generateNewSingleAnswerResponse(BasicField.Mobile, {
      answer: '+6598765432',
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow mobile numbers without "+" prefix', () => {
    const formField = generateDefaultField(BasicField.Mobile)
    const response = generateNewSingleAnswerResponse(BasicField.Mobile, {
      answer: '6598765432',
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow home numbers on mobile fieldType', () => {
    const formField = generateDefaultField(BasicField.Mobile)
    const response = generateNewSingleAnswerResponse(BasicField.Mobile, {
      answer: '+6565656565',
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow international numbers when field does not allow for it', () => {
    const formField = generateDefaultField(BasicField.Mobile)
    const response = generateNewSingleAnswerResponse(BasicField.Mobile, {
      answer: '+447851315617',
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should allow international numbers when field allows for it', () => {
    const formField = generateDefaultField(BasicField.Mobile, {
      allowIntlNumbers: true,
    })
    const response = generateNewSingleAnswerResponse(BasicField.Mobile, {
      answer: '+447851315617',
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })
  it('should disallow responses submitted for hidden fields', () => {
    const formField = generateDefaultField(BasicField.Mobile, {
      allowIntlNumbers: true,
    })
    const response = generateNewSingleAnswerResponse(BasicField.Mobile, {
      answer: '+447851315617',
      isVisible: false,
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Attempted to submit response on a hidden field'),
    )
  })

  describe('signature validation', () => {
    it('should allow mobile numbers if isVerifiable is true and signature is present and valid', () => {
      const formField = generateDefaultField(BasicField.Mobile, {
        isVerifiable: true,
      })
      const response = generateNewSingleAnswerResponse(BasicField.Mobile, {
        answer: '+6598765432',
        signature: 'some signature',
      })

      const validateResult = validateField('formId', formField, response)
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should reject mobile numbers if isVerifiable is true but there is no signature present', () => {
      const formField = generateDefaultField(BasicField.Mobile, {
        isVerifiable: true,
      })
      const response = generateNewSingleAnswerResponse(BasicField.Mobile, {
        answer: '',
      })

      const validateResult = validateField('formId', formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should reject mobile numbers if isVerifiable is true and signature is present but invalid', () => {
      jest
        .spyOn(
          formsgSdk.verification as unknown as VerificationMock,
          'authenticate',
        )
        .mockImplementation(() => false)

      const formField = generateDefaultField(BasicField.Mobile, {
        isVerifiable: true,
      })
      const response = generateNewSingleAnswerResponse(BasicField.Mobile, {
        answer: '',
        signature: 'some invalid signature',
      })

      const validateResult = validateField('formId', formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })
  })
})

describe('Mobile number validation tests V3', () => {
  beforeEach(() => {
    jest
      .spyOn(
        formsgSdk.verification as unknown as VerificationMock,
        'authenticate',
      )
      .mockImplementation(() => true)
  })

  it('should allow empty answer for required logic field that is not visible', () => {
    const formField = generateDefaultFieldV3(BasicField.Mobile)
    const response = generateVerifiableAnswerResponseV3({
      fieldType: BasicField.Mobile,
      answer: {
        value: '',
      },
    })

    const validateResult = validateFieldV3({
      formId: 'formId',
      formField,
      response,
      isVisible: false,
    })
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow empty answer for not required field', () => {
    const formField = generateDefaultFieldV3(BasicField.Mobile, {
      required: false,
    })
    const response = generateVerifiableAnswerResponseV3({
      fieldType: BasicField.Mobile,
      answer: {
        value: '',
      },
    })

    const validateResult = validateFieldV3({
      formId: 'formId',
      formField,
      response,
      isVisible: true,
    })
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should not allow empty answer for required field', () => {
    const formField = generateDefaultFieldV3(BasicField.Mobile)
    const response = generateVerifiableAnswerResponseV3({
      fieldType: BasicField.Mobile,
      answer: {
        value: '',
      },
    })

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

  it('should allow valid mobile numbers for mobile fieldType', () => {
    const formField = generateDefaultFieldV3(BasicField.Mobile)
    const response = generateVerifiableAnswerResponseV3({
      fieldType: BasicField.Mobile,
      answer: {
        value: '+6598765432',
      },
    })

    const validateResult = validateFieldV3({
      formId: 'formId',
      formField,
      response,
      isVisible: true,
    })
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow mobile numbers without "+" prefix', () => {
    const formField = generateDefaultFieldV3(BasicField.Mobile)
    const response = generateVerifiableAnswerResponseV3({
      fieldType: BasicField.Mobile,
      answer: {
        value: '6598765432',
      },
    })

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

  it('should disallow home numbers on mobile fieldType', () => {
    const formField = generateDefaultFieldV3(BasicField.Mobile)
    const response = generateVerifiableAnswerResponseV3({
      fieldType: BasicField.Mobile,
      answer: {
        value: '+6565656565',
      },
    })

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

  it('should disallow international numbers when field does not allow for it', () => {
    const formField = generateDefaultFieldV3(BasicField.Mobile, {
      allowIntlNumbers: false,
    })
    const response = generateVerifiableAnswerResponseV3({
      fieldType: BasicField.Mobile,
      answer: {
        value: '+447851315617',
      },
    })

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

  it('should allow international numbers when field allows for it', () => {
    const formField = generateDefaultFieldV3(BasicField.Mobile, {
      allowIntlNumbers: true,
    })
    const response = generateVerifiableAnswerResponseV3({
      fieldType: BasicField.Mobile,
      answer: {
        value: '+447851315617',
      },
    })

    const validateResult = validateFieldV3({
      formId: 'formId',
      formField,
      response,
      isVisible: true,
    })
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow responses submitted for hidden fields', () => {
    const formField = generateDefaultFieldV3(BasicField.Mobile, {
      allowIntlNumbers: true,
    })
    const response = generateVerifiableAnswerResponseV3({
      fieldType: BasicField.Mobile,
      answer: {
        value: '+447851315617',
      },
    })

    const validateResult = validateFieldV3({
      formId: 'formId',
      formField,
      response,
      isVisible: false,
    })
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Attempted to submit response on a hidden field'),
    )
  })

  describe('signature validation', () => {
    it('should allow mobile numbers if isVerifiable is true and signature is present and valid', () => {
      const formField = generateDefaultFieldV3(BasicField.Mobile, {
        isVerifiable: true,
      })
      const response = generateVerifiableAnswerResponseV3({
        fieldType: BasicField.Mobile,
        answer: {
          value: '+6598765432',
          signature: 'some signature',
        },
      })

      const validateResult = validateFieldV3({
        formId: 'formId',
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should reject mobile numbers if isVerifiable is true but there is no signature present', () => {
      const formField = generateDefaultFieldV3(BasicField.Mobile, {
        isVerifiable: true,
      })
      const response = generateVerifiableAnswerResponseV3({
        fieldType: BasicField.Mobile,
        answer: {
          value: '+6598765432',
          signature: '',
        },
      })

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

    it('should reject mobile numbers if isVerifiable is true and signature is present but invalid', () => {
      jest
        .spyOn(
          formsgSdk.verification as unknown as VerificationMock,
          'authenticate',
        )
        .mockImplementation(() => false)

      const formField = generateDefaultFieldV3(BasicField.Mobile, {
        isVerifiable: true,
      })
      const response = generateVerifiableAnswerResponseV3({
        fieldType: BasicField.Mobile,
        answer: {
          value: '+6598765432',
          signature: 'some invalid signature',
        },
      })

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
  })
})
