import {
  generateDefaultField,
  generateDefaultFieldV4,
  generateNewAddressResponse,
} from '__tests__/unit/backend/helpers/generate-form-data'
import { AddressAnswerV4 } from '@opengovsg/formsg-sdk'
import { AddressAttributes, BasicField } from 'formsg-shared/types'
import { mongo as mongodb } from 'mongoose'

import {
  ValidateFieldError,
  ValidateFieldErrorV4,
} from 'src/app/modules/submission/submission.errors'
import { validateField, validateFieldV4 } from 'src/app/utils/field-validation'
import { ParsedClearFormFieldResponseV4 } from 'src/types/api'

const { ObjectId } = mongodb

describe('Address validation', () => {
  const formId = new ObjectId().toHexString()
  describe('Required or optional', () => {
    it('should disallow empty submission if address is required', () => {
      const addressSubFields = {
        postalCode: '',
        blockNumber: '',
        streetName: '',
        buildingName: '',
        levelNumber: '',
        unitNumber: '',
      }
      const formField = generateDefaultField(BasicField.Address, {
        addressSubFields,
      })
      const response = generateNewAddressResponse({
        answerArray: ['', '', '', '', '', ''],
      })
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should allow empty submission if address is optional', () => {
      const addressSubFields = {
        postalCode: '',
        blockNumber: '',
        streetName: '',
        buildingName: '',
        levelNumber: '',
        unitNumber: '',
      }
      const formField = generateDefaultField(BasicField.Address, {
        required: false,
        addressSubFields,
      })
      const response = generateNewAddressResponse({
        answerArray: ['', '', '', '', '', ''],
      })
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should disallow submission if address is optional, only level number is populated', () => {
      const addressSubFields = {
        postalCode: '',
        blockNumber: '',
        streetName: '',
        buildingName: '',
        levelNumber: '1',
        unitNumber: '',
      }
      const formField = generateDefaultField(BasicField.Address, {
        required: false,
        addressSubFields,
      })
      const response = generateNewAddressResponse({
        answerArray: ['', '', '', '', '1', ''],
      })
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })
  })

  describe('Validation of field options', () => {
    it('should disallow responses submitted for hidden fields', () => {
      const addressSubFields = {
        postalCode: '650161',
        blockNumber: '161',
        streetName: 'BUKIT BATOK STREET 11',
        buildingName: '',
        levelNumber: '1',
        unitNumber: '1',
      }
      const formField = generateDefaultField(BasicField.Address, {
        addressSubFields,
      })
      const response = generateNewAddressResponse({
        answerArray: ['161', 'BUKIT BATOK STREET 11', '', '1', '1', '650161'],
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
    it('should disallow responses with invalid local postal codes', () => {
      const addressSubFields = {
        postalCode: '650161a',
        blockNumber: '161',
        streetName: 'BUKIT BATOK STREET 11',
        buildingName: '',
        levelNumber: '1',
        unitNumber: '1',
      }
      const formField = generateDefaultField(BasicField.Address, {
        addressSubFields,
      })
      const response = generateNewAddressResponse({
        answerArray: ['161', 'BUKIT BATOK STREET 11', '', '1', '1', '650161a'],
      })
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })
    it('should disallow responses with invalid block numbers', () => {
      const addressSubFields = {
        postalCode: '650161',
        blockNumber: '161@',
        streetName: 'BUKIT BATOK STREET 11',
        buildingName: '',
        levelNumber: '1',
        unitNumber: '1',
      }
      const formField = generateDefaultField(BasicField.Address, {
        addressSubFields,
      })
      const response = generateNewAddressResponse({
        answerArray: ['161@', 'BUKIT BATOK STREET 11', '', '1', '1', '650161'],
      })
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })
  })
})

describe('Address field validation V4', () => {
  const formId = new ObjectId().toHexString()

  const makeAddressResponseV4 = (
    addressSubFields: AddressAttributes,
  ): ParsedClearFormFieldResponseV4 =>
    ({
      fieldType: BasicField.Address,
      question: 'Address',
      answer: {
        postalCode: { value: addressSubFields.postalCode },
        blockNumber: { value: addressSubFields.blockNumber },
        streetName: { value: addressSubFields.streetName },
        buildingName: { value: addressSubFields.buildingName },
        levelNumber: { value: addressSubFields.levelNumber },
        unitNumber: { value: addressSubFields.unitNumber },
      } satisfies AddressAnswerV4,
      provenance: {},
    }) as ParsedClearFormFieldResponseV4

  it('should disallow responses submitted for hidden fields', () => {
    const addressSubFields = {
      postalCode: '650161',
      blockNumber: '161',
      streetName: 'BUKIT BATOK STREET 11',
      buildingName: '',
      levelNumber: '1',
      unitNumber: '1',
    }
    const formField = generateDefaultFieldV4(BasicField.Address, {
      addressSubFields,
    })
    const response = makeAddressResponseV4(addressSubFields)

    const validateResult = validateFieldV4({
      formId,
      formField,
      response,
      isVisible: false,
    })
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldErrorV4(
        'Attempted to submit response on a hidden field',
      ),
    )
  })

  it('should disallow empty submission if address field is required', () => {
    const addressSubFields = {
      postalCode: '',
      blockNumber: '',
      streetName: '',
      buildingName: '',
      levelNumber: '',
      unitNumber: '',
    }
    const formField = generateDefaultFieldV4(BasicField.Address, {
      addressSubFields,
    })
    const response = makeAddressResponseV4(addressSubFields)

    const validateResult = validateFieldV4({
      formId,
      formField,
      response,
      isVisible: true,
    })
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldErrorV4('Invalid answer submitted'),
    )
  })

  it('should allow empty submission if address is optional', () => {
    const addressSubFields = {
      postalCode: '',
      blockNumber: '',
      streetName: '',
      buildingName: '',
      levelNumber: '',
      unitNumber: '',
    }
    const formField = generateDefaultFieldV4(BasicField.Address, {
      required: false,
      addressSubFields,
    })
    const response = makeAddressResponseV4(addressSubFields)

    const validateResult = validateFieldV4({
      formId,
      formField,
      response,
      isVisible: true,
    })
    expect(validateResult.isOk()).toBe(true)
    expect(validateResult._unsafeUnwrap()).toEqual(true)
  })

  it('should disallow submission if address is optional, only level number is populated', () => {
    const addressSubFields = {
      postalCode: '',
      blockNumber: '',
      streetName: '',
      buildingName: '',
      levelNumber: '1',
      unitNumber: '',
    }
    const formField = generateDefaultFieldV4(BasicField.Address, {
      required: false,
      addressSubFields,
    })
    const response = makeAddressResponseV4(addressSubFields)

    const validateResult = validateFieldV4({
      formId,
      formField,
      response,
      isVisible: true,
    })
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldErrorV4('Invalid answer submitted'),
    )
  })
})
