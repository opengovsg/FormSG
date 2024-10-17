import {
  generateDefaultField,
  generateDefaultFieldV3,
  generateGenericStringAnswerResponseV3,
  generateNewSingleAnswerResponse,
} from '__tests__/unit/backend/helpers/generate-form-data'

import { ValidateFieldError } from 'src/app/modules/submission/submission.errors'
import { validateField, validateFieldV3 } from 'src/app/utils/field-validation'

import { CountryRegion } from '../../../../../../shared/constants/countryRegion'
import { BasicField } from '../../../../../../shared/types'

// We want users to see the country/region options in title-case but we also need the data in the backend to remain in upper-case.
// As such, in handleSubmitForm, which runs before validation, we change the title-case country/region value into upper-case.
const simulateTransformationsHandleSubmitForm = (
  countryRegion: CountryRegion,
) => (countryRegion as string).toUpperCase()

describe('Country/region validation', () => {
  it('should allow valid option', () => {
    const formField = generateDefaultField(BasicField.CountryRegion, {})
    const response = generateNewSingleAnswerResponse(BasicField.CountryRegion, {
      answer: simulateTransformationsHandleSubmitForm(CountryRegion.Singapore),
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow invalid option', () => {
    const formField = generateDefaultField(BasicField.CountryRegion, {})
    const response = generateNewSingleAnswerResponse(BasicField.CountryRegion, {
      answer: 'NOT A COUNTRY/REGION',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow empty answer when required', () => {
    const formField = generateDefaultField(BasicField.CountryRegion, {})
    const response = generateNewSingleAnswerResponse(BasicField.CountryRegion, {
      answer: '',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should allow empty answer when not required', () => {
    const formField = generateDefaultField(BasicField.CountryRegion, {
      required: false,
    })
    const response = generateNewSingleAnswerResponse(BasicField.CountryRegion, {
      answer: '',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow empty answer when it is required but not visible', () => {
    const formField = generateDefaultField(BasicField.CountryRegion, {})
    const response = generateNewSingleAnswerResponse(BasicField.CountryRegion, {
      answer: '',
      isVisible: false,
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow empty answer when it is required and visible', () => {
    const formField = generateDefaultField(BasicField.CountryRegion, {})
    const response = generateNewSingleAnswerResponse(BasicField.CountryRegion, {
      answer: '',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow multiple answers', () => {
    const formField = generateDefaultField(BasicField.CountryRegion, {})
    const response = generateNewSingleAnswerResponse(BasicField.CountryRegion, {
      answer: [
        simulateTransformationsHandleSubmitForm(CountryRegion.Singapore),
        simulateTransformationsHandleSubmitForm(CountryRegion.Slovak_Republic),
      ] as unknown as string,
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Response has invalid shape'),
    )
  })
  it('should disallow responses submitted for hidden fields', () => {
    const formField = generateDefaultField(BasicField.CountryRegion, {})
    const response = generateNewSingleAnswerResponse(BasicField.CountryRegion, {
      answer: simulateTransformationsHandleSubmitForm(CountryRegion.Singapore),
      isVisible: false,
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Attempted to submit response on a hidden field'),
    )
  })
})

describe('Country/region validation V3', () => {
  it('should allow valid option', () => {
    const formField = generateDefaultFieldV3(BasicField.CountryRegion, {})
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.CountryRegion,
      answer: simulateTransformationsHandleSubmitForm(CountryRegion.Singapore),
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

  it('should disallow invalid option', () => {
    const formField = generateDefaultFieldV3(BasicField.CountryRegion, {})
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.CountryRegion,
      answer: 'NOT A COUNTRY/REGION',
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

  it('should disallow empty answer when required', () => {
    const formField = generateDefaultFieldV3(BasicField.CountryRegion, {
      required: true,
    })
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.CountryRegion,
      answer: '',
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

  it('should allow empty answer when not required', () => {
    const formField = generateDefaultFieldV3(BasicField.CountryRegion, {
      required: false,
    })
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.CountryRegion,
      answer: '',
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

  it('should allow empty answer when it is required but not visible', () => {
    const formField = generateDefaultFieldV3(BasicField.CountryRegion, {
      required: true,
    })
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.CountryRegion,
      answer: '',
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

  it('should disallow empty answer when it is required and visible', () => {
    const formField = generateDefaultFieldV3(BasicField.CountryRegion, {
      required: true,
    })
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.CountryRegion,
      answer: '',
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

  it('should disallow multiple answers', () => {
    const formField = generateDefaultFieldV3(BasicField.CountryRegion, {})
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.CountryRegion,
      answer: [
        simulateTransformationsHandleSubmitForm(CountryRegion.Singapore),
        simulateTransformationsHandleSubmitForm(CountryRegion.Slovak_Republic),
      ] as unknown as string,
    })
    const validateResult = validateFieldV3({
      formId: 'formId',
      formField,
      response,
      isVisible: true,
    })
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Response has invalid shape'),
    )
  })

  it('should disallow responses submitted for hidden fields', () => {
    const formField = generateDefaultFieldV3(BasicField.CountryRegion, {
      required: true,
    })
    const response = generateGenericStringAnswerResponseV3({
      fieldType: BasicField.CountryRegion,
      answer: simulateTransformationsHandleSubmitForm(CountryRegion.Singapore),
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
})
