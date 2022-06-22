import { ValidateFieldError } from 'src/app/modules/submission/submission.errors'
import { validateField } from 'src/app/utils/field-validation'

import {
  generateDefaultField,
  generateNewSingleAnswerResponse,
} from 'tests/unit/backend/helpers/generate-form-data'

import { Country } from '../../../../../../shared/constants/countries'
import { BasicField } from '../../../../../../shared/types'

describe('Country validation', () => {
  it('should allow valid option', () => {
    const formField = generateDefaultField(BasicField.Country, {})
    const response = generateNewSingleAnswerResponse(BasicField.Country, {
      answer: Country.Singapore,
    })

    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow invalid option', () => {
    const formField = generateDefaultField(BasicField.Dropdown, {})
    const response = generateNewSingleAnswerResponse(BasicField.Dropdown, {
      answer: 'NOT A COUNTRY',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow empty answer when required', () => {
    const formField = generateDefaultField(BasicField.Country, {})
    const response = generateNewSingleAnswerResponse(BasicField.Country, {
      answer: '',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should allow empty answer when not required', () => {
    const formField = generateDefaultField(BasicField.Country, {
      required: false,
    })
    const response = generateNewSingleAnswerResponse(BasicField.Country, {
      answer: '',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should allow empty answer when it is required but not visible', () => {
    const formField = generateDefaultField(BasicField.Country, {})
    const response = generateNewSingleAnswerResponse(BasicField.Country, {
      answer: '',
      isVisible: false,
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow empty answer when it is required and visible', () => {
    const formField = generateDefaultField(BasicField.Country, {})
    const response = generateNewSingleAnswerResponse(BasicField.Country, {
      answer: '',
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow multiple answers', () => {
    const formField = generateDefaultField(BasicField.Country, {})
    const response = generateNewSingleAnswerResponse(BasicField.Country, {
      answer: [Country.Singapore, Country.Slovak_Republic] as unknown as string,
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Response has invalid shape'),
    )
  })
  it('should disallow responses submitted for hidden fields', () => {
    const formField = generateDefaultField(BasicField.Country, {})
    const response = generateNewSingleAnswerResponse(BasicField.Country, {
      answer: Country.Singapore,
      isVisible: false,
    })
    const validateResult = validateField('formId', formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Attempted to submit response on a hidden field'),
    )
  })
})
