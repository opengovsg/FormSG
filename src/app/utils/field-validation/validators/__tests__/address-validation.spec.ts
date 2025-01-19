import {
  generateDefaultField,
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
        answerArray: [
          'postalCode_',
          'blockNumber_',
          'streetName_',
          'buildingName_',
          'levelNumber_',
          'unitNumber_',
        ],
      })
      const validateResult = validateField(formId, formField, response)
      // expect(validateResult.isErr()).toBe(true)
      // expect(validateResult._unsafeUnwrapErr()).toEqual(
      //   new ValidateFieldError('Invalid answer submitted'),
      // )
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
        answerArray: [
          'postalCode_',
          'blockNumber_',
          'streetName_',
          'buildingName_',
          'levelNumber_',
          'unitNumber_',
        ],
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
        levelNumber: '',
        unitNumber: '1',
      }
      const formField = generateDefaultField(BasicField.Address, {
        required: false,
        addressSubFields,
      })
      const response = generateNewAddressResponse({
        answerArray: [
          'postalCode_',
          'blockNumber_',
          'streetName_',
          'buildingName_',
          'levelNumber_1',
          'unitNumber_',
        ],
      })
      const validateResult = validateField(formId, formField, response)
      // expect(validateResult.isErr()).toBe(true)
      // expect(validateResult._unsafeUnwrapErr()).toEqual(
      //   new ValidateFieldError('Invalid answer submitted'),
      // )
    })
  })

  describe('Validation of field options', () => {
    it('should disallow responses submitted for hidden fields', () => {})
    it('should disallow responses with invalid local postal codes', () => {})
    it('should disallow responses with invalid block numbers', () => {})
    it('should disallow responses with invalid street name with commas', () => {})
  })

  describe('Address field validation tests V3', () => {})
})
