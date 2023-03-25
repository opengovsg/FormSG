import { ValidateFieldError } from 'src/app/modules/submission/submission.errors'
import { validateField } from 'src/app/utils/field-validation'

import {
  generateDefaultField,
  generateNewSingleAnswerResponse,
} from 'tests/unit/backend/helpers/generate-form-data'

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
    const formField = generateDefaultField(BasicField.Dropdown, {})
    const response = generateNewSingleAnswerResponse(BasicField.Dropdown, {
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
