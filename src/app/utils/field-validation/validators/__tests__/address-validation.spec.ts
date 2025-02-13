import {
  generateAddressResponseV3,
  generateDefaultField,
  generateDefaultFieldV3,
  generateNewAddressResponse,
} from '__tests__/unit/backend/helpers/generate-form-data'
import { mongo as mongodb } from 'mongoose'
import { BasicField } from 'shared/types'

import { ValidateFieldError } from 'src/app/modules/submission/submission.errors'
import { validateField, validateFieldV3 } from 'src/app/utils/field-validation'

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

  describe('Address field validation tests V3', () => {
    it('should disallow responses submitted for hidden fields', () => {
      const addressSubFields = {
        postalCode: '650161',
        blockNumber: '161',
        streetName: 'BUKIT BATOK STREET 11',
        buildingName: '',
        levelNumber: '1',
        unitNumber: '1',
      }
      const formField = generateDefaultFieldV3(BasicField.Address, {
        addressSubFields,
      })
      const response = generateAddressResponseV3({
        addressSubFields: {
          postalCode: '650161',
          blockNumber: '161',
          streetName: 'BUKIT BATOK STREET 11',
          buildingName: '',
          levelNumber: '1',
          unitNumber: '1',
        },
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

    it('should disallow empty submission if address field is required', () => {
      const addressSubFields = {
        postalCode: '',
        blockNumber: '',
        streetName: '',
        buildingName: '',
        levelNumber: '',
        unitNumber: '',
      }
      const formField = generateDefaultFieldV3(BasicField.Address, {
        addressSubFields,
      })
      const response = generateAddressResponseV3({
        addressSubFields: addressSubFields,
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

    it('should allow empty submission if address is optional', () => {
      const addressSubFields = {
        postalCode: '',
        blockNumber: '',
        streetName: '',
        buildingName: '',
        levelNumber: '',
        unitNumber: '',
      }
      const formField = generateDefaultFieldV3(BasicField.Address, {
        required: false,
        addressSubFields,
      })
      const response = generateAddressResponseV3({
        addressSubFields: addressSubFields,
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

    it('should disallow submission if address is optional, only level number is populated', () => {
      const addressSubFields = {
        postalCode: '',
        blockNumber: '',
        streetName: '',
        buildingName: '',
        levelNumber: '1',
        unitNumber: '',
      }
      const formField = generateDefaultFieldV3(BasicField.Address, {
        required: false,
        addressSubFields,
      })
      const response = generateAddressResponseV3({
        addressSubFields: {
          postalCode: '',
          blockNumber: '',
          streetName: '',
          buildingName: '',
          levelNumber: '1',
          unitNumber: '',
        },
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
})
