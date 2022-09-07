import { ObjectId } from 'bson'
import { merge, omit, pick } from 'lodash'
import mongoose from 'mongoose'

import { UpdateFieldData } from 'src/types'

import { generateDefaultField } from 'tests/unit/backend/helpers/generate-form-data'
import dbHandler from 'tests/unit/backend/helpers/jest-db'

import { BasicField } from '../../../../../shared/types'
import getVerificationModel from '../verification.model'

import {
  generateFieldParams,
  VFN_DEFAULTS,
  VFN_PARAMS,
} from './verification.test.helpers'

const VerificationModel = getVerificationModel(mongoose)

describe('Verification Model', () => {
  beforeAll(async () => await dbHandler.connect())
  afterEach(async () => {
    await dbHandler.clearDatabase()
    jest.clearAllMocks()
  })
  afterAll(async () => await dbHandler.closeDatabase())

  describe('Schema', () => {
    it('should save successfully with defaults when params are not given', async () => {
      const verification = new VerificationModel(VFN_PARAMS)
      const verificationSaved = await verification.save()
      expect(verificationSaved._id).toBeDefined()
      expect(verificationSaved.expireAt).toBeInstanceOf(Date)
      const actualSavedFields = omit(verificationSaved.toObject(), [
        '_id',
        'expireAt',
        '__v',
      ])
      const expectedSavedFields = merge({}, VFN_DEFAULTS, VFN_PARAMS)
      expect(actualSavedFields).toEqual(expectedSavedFields)
    })

    it('should save successfully when expireAt is specified', async () => {
      const params = merge({}, VFN_PARAMS, { expireAt: new Date() })
      const verification = new VerificationModel(params)
      const verificationSaved = await verification.save()
      expect(verificationSaved._id).toBeDefined()
      const actualSavedFields = omit(verificationSaved.toObject(), [
        '_id',
        '__v',
      ])
      const expectedSavedFields = merge({}, VFN_DEFAULTS, params)
      expect(actualSavedFields).toEqual(expectedSavedFields)
    })

    it('should save successfully with defaults when field keys are not specified', async () => {
      const vfnParams = merge({}, VFN_PARAMS, {
        fields: [generateFieldParams(), generateFieldParams()],
      })
      const verification = new VerificationModel(vfnParams)
      const verificationSaved = await verification.save()
      expect(verificationSaved._id).toBeDefined()
      const actualSavedFields = omit(verificationSaved.toObject(), [
        '_id',
        'expireAt',
        '__v',
      ])
      const expectedSavedFields = merge({}, VFN_DEFAULTS, VFN_PARAMS, vfnParams)
      expect(actualSavedFields).toEqual(expectedSavedFields)
    })

    it('should save successfully when field keys are specified', async () => {
      const field = {
        ...generateFieldParams(),
        signedData: 'signedData',
        hashedOtp: 'hashedOtp',
        hashCreatedAt: new Date(),
        hashRetries: 5,
        otpRequests: 6,
      }
      const vfnParams = merge({}, VFN_PARAMS, { fields: [field] })
      const verification = new VerificationModel(vfnParams)
      const verificationSaved = await verification.save()
      expect(verificationSaved._id).toBeDefined()
      const actualSavedFields = omit(verificationSaved.toObject(), [
        '_id',
        'expireAt',
        '__v',
      ])
      const expectedSavedFields = merge({}, VFN_DEFAULTS, VFN_PARAMS, vfnParams)
      expect(actualSavedFields).toEqual(expectedSavedFields)
    })

    it('should not save when field IDs are identical', async () => {
      const field = generateFieldParams()
      const vfnParams = merge({}, VFN_PARAMS, {
        fields: [field, field],
      })
      const verification = new VerificationModel(vfnParams)
      await expect(verification.save()).rejects.toThrow(
        'No duplicate field ids allowed for the same transaction',
      )
    })
  })

  describe('Methods', () => {
    describe('getPublicView', () => {
      it('should only return non-sensitive fields', async () => {
        const transaction = await VerificationModel.create(VFN_PARAMS)

        const result = transaction.getPublicView()

        expect(result.expireAt).toBeInstanceOf(Date)
        expect(String(result.formId)).toBe(VFN_PARAMS.formId.toHexString())
        expect(mongoose.Types.ObjectId.isValid(result._id)).toBe(true)
      })
    })

    describe('getField', () => {
      it('should return the field with the given ID', async () => {
        const field1 = generateFieldParams()
        const field2 = generateFieldParams()
        const transaction = await VerificationModel.create({
          ...VFN_PARAMS,
          fields: [field1, field2],
        })

        const result = transaction.getField(field1._id)!.toJSON()

        expect(omit(result, '_id')).toEqual(omit(field1, '_id'))
        expect(String(result._id)).toEqual(field1._id)
      })

      it('should return undefined when the fieldId does not exist', async () => {
        const field1 = generateFieldParams()
        const field2 = generateFieldParams()
        const transaction = await VerificationModel.create({
          ...VFN_PARAMS,
          fields: [field1, field2],
        })

        expect(
          transaction.getField(new ObjectId().toHexString()),
        ).toBeUndefined()
      })
    })
  })

  describe('Statics', () => {
    describe('getPublicViewById', () => {
      it('should only return non-sensitive fields', async () => {
        const verification = new VerificationModel(VFN_PARAMS)
        const verificationSaved = await verification.save()
        expect(verificationSaved._id).toBeDefined()
        const actual = await VerificationModel.getPublicViewById(
          verificationSaved._id,
        )
        const expected = pick(verificationSaved, ['formId', 'expireAt', '_id'])
        expect(actual).toEqual(expected)
      })

      it('should return null when transaction does not exist', async () => {
        const actual = await VerificationModel.getPublicViewById(
          new ObjectId().toHexString(),
        )
        expect(actual).toBeNull()
      })
    })

    describe('createTransactionFromForm', () => {
      describe('Email mode forms', () => {
        it('should return null when there are no verifiable fields', async () => {
          const { form } = await dbHandler.insertEmailForm({
            formOptions: {
              form_fields: [
                generateDefaultField(BasicField.ShortText),
                generateDefaultField(BasicField.Number),
                // Email and mobile fields, but with isVerifiable undefined
                generateDefaultField(BasicField.Email),
                generateDefaultField(BasicField.Mobile),
              ],
            },
          })

          const result = await VerificationModel.createTransactionFromForm(form)

          expect(result).toBeNull()
        })

        it('should create transaction correctly when there is one verifiable field', async () => {
          const verifiableField = generateDefaultField(BasicField.Email, {
            isVerifiable: true,
          })
          const { form } = await dbHandler.insertEmailForm({
            formOptions: {
              form_fields: [
                generateDefaultField(BasicField.ShortText),
                verifiableField,
              ],
            },
          })

          const result = await VerificationModel.createTransactionFromForm(form)

          expect(result).toBeTruthy()
          expect(result!.formId).toEqual(form._id)
          expect(result!.fields[0]._id).toEqual(verifiableField._id)
          expect(result!.fields[0].fieldType).toEqual(verifiableField.fieldType)
        })

        it('should create transaction correctly when there are multiple verifiable fields', async () => {
          const verifiableField1 = generateDefaultField(BasicField.Email, {
            isVerifiable: true,
          })
          const verifiableField2 = generateDefaultField(BasicField.Mobile, {
            isVerifiable: true,
          })
          const { form } = await dbHandler.insertEmailForm({
            formOptions: {
              form_fields: [
                generateDefaultField(BasicField.ShortText),
                verifiableField1,
                verifiableField2,
              ],
            },
          })

          const result = await VerificationModel.createTransactionFromForm(form)

          expect(result).toBeTruthy()
          expect(result!.formId).toEqual(form._id)
          expect(result!.fields[0]._id).toEqual(verifiableField1._id)
          expect(result!.fields[0].fieldType).toEqual(
            verifiableField1.fieldType,
          )
          expect(result!.fields[1]._id).toEqual(verifiableField2._id)
          expect(result!.fields[1].fieldType).toEqual(
            verifiableField2.fieldType,
          )
        })
      })

      describe('Storage mode forms', () => {
        it('should return null when there are no verifiable fields', async () => {
          const { form } = await dbHandler.insertEncryptForm({
            formOptions: {
              form_fields: [
                generateDefaultField(BasicField.ShortText),
                generateDefaultField(BasicField.Number),
                // Email and mobile fields, but with isVerifiable undefined
                generateDefaultField(BasicField.Email),
                generateDefaultField(BasicField.Mobile),
              ],
            },
          })

          const result = await VerificationModel.createTransactionFromForm(form)

          expect(result).toBeNull()
        })

        it('should create transaction correctly when there is one verifiable field', async () => {
          const verifiableField = generateDefaultField(BasicField.Email, {
            isVerifiable: true,
          })
          const { form } = await dbHandler.insertEncryptForm({
            formOptions: {
              form_fields: [
                generateDefaultField(BasicField.ShortText),
                verifiableField,
              ],
            },
          })

          const result = await VerificationModel.createTransactionFromForm(form)

          expect(result).toBeTruthy()
          expect(result!.formId).toEqual(form._id)
          expect(result!.fields[0]._id).toEqual(verifiableField._id)
          expect(result!.fields[0].fieldType).toEqual(verifiableField.fieldType)
        })

        it('should create transaction correctly when there are multiple verifiable fields', async () => {
          const verifiableField1 = generateDefaultField(BasicField.Email, {
            isVerifiable: true,
          })
          const verifiableField2 = generateDefaultField(BasicField.Mobile, {
            isVerifiable: true,
          })
          const { form } = await dbHandler.insertEncryptForm({
            formOptions: {
              form_fields: [
                generateDefaultField(BasicField.ShortText),
                verifiableField1,
                verifiableField2,
              ],
            },
          })

          const result = await VerificationModel.createTransactionFromForm(form)

          expect(result).toBeTruthy()
          expect(result!.formId).toEqual(form._id)
          expect(result!.fields[0]._id).toEqual(verifiableField1._id)
          expect(result!.fields[0].fieldType).toEqual(
            verifiableField1.fieldType,
          )
          expect(result!.fields[1]._id).toEqual(verifiableField2._id)
          expect(result!.fields[1].fieldType).toEqual(
            verifiableField2.fieldType,
          )
        })
      })
    })

    describe('incrementFieldRetries', () => {
      it('should increment retries for the field and return the new document', async () => {
        const field = {
          ...generateFieldParams(),
          signedData: 'mockSignedData',
          hashedOtp: 'mockHashedOtp',
          hashCreatedAt: new Date(),
        }
        const transaction = await VerificationModel.create({
          ...VFN_PARAMS,
          fields: [field],
        })

        const result = await VerificationModel.incrementFieldRetries(
          String(transaction._id),
          String(field._id),
        )

        expect(result!.fields[0].hashRetries).toEqual(field.hashRetries + 1)
        expect(result!.fields[0].signedData).toEqual(field.signedData)
        expect(result!.fields[0].hashedOtp).toEqual(field.hashedOtp)
        expect(result!.fields[0].hashCreatedAt).toEqual(field.hashCreatedAt)
        expect(result!.formId).toEqual(transaction.formId)
      })

      it('should increment retries only for the given field ID', async () => {
        const field1 = generateFieldParams()
        const field2 = generateFieldParams()
        const transaction = await VerificationModel.create({
          ...VFN_PARAMS,
          fields: [field1, field2],
        })

        const result = await VerificationModel.incrementFieldRetries(
          String(transaction._id),
          String(field1._id),
        )

        // field1 should be incremented
        expect(result!.fields[0].hashRetries).toEqual(field1.hashRetries + 1)
        expect(result!.fields[0].signedData).toEqual(field1.signedData)
        expect(result!.fields[0].hashedOtp).toEqual(field1.hashedOtp)
        expect(result!.fields[0].hashCreatedAt).toEqual(field1.hashCreatedAt)

        // field2 should be unchanged
        expect(result!.fields[1].hashRetries).toEqual(field2.hashRetries)
        expect(result!.fields[1].signedData).toEqual(field2.signedData)
        expect(result!.fields[1].hashedOtp).toEqual(field2.hashedOtp)
        expect(result!.fields[1].hashCreatedAt).toEqual(field2.hashCreatedAt)

        expect(result!.formId).toEqual(transaction.formId)
      })

      it('should return null when the transaction ID is not found', async () => {
        const result = await VerificationModel.incrementFieldRetries(
          new ObjectId().toHexString(),
          new ObjectId().toHexString(),
        )

        expect(result).toBeNull()
      })
    })

    describe('resetField', () => {
      it('should reset the field and return the new document', async () => {
        const field = {
          ...generateFieldParams(),
          signedData: 'mockSignedData',
          hashedOtp: 'mockHashedOtp',
          hashCreatedAt: new Date(),
        }
        const transaction = await VerificationModel.create({
          ...VFN_PARAMS,
          fields: [field],
        })

        const result = await VerificationModel.resetField(
          String(transaction._id),
          String(field._id),
        )

        expect(result!.fields[0].hashRetries).toEqual(0)
        expect(result!.fields[0].signedData).toBeNull()
        expect(result!.fields[0].hashedOtp).toBeNull()
        expect(result!.fields[0].hashCreatedAt).toBeNull()
        expect(result!.formId).toEqual(transaction.formId)
      })

      it('should reset only the given field ID', async () => {
        const field1 = {
          ...generateFieldParams(),
          signedData: 'mockSignedData',
          hashedOtp: 'mockHashedOtp',
          hashCreatedAt: new Date(),
        }
        const field2 = {
          ...generateFieldParams(),
          signedData: 'mockSignedData2',
          hashedOtp: 'mockHashedOtp2',
          hashCreatedAt: new Date(),
        }
        const transaction = await VerificationModel.create({
          ...VFN_PARAMS,
          fields: [field1, field2],
        })

        const result = await VerificationModel.resetField(
          String(transaction._id),
          String(field1._id),
        )

        // field1 should be reset
        expect(result!.fields[0].hashRetries).toEqual(0)
        expect(result!.fields[0].signedData).toBeNull()
        expect(result!.fields[0].hashedOtp).toBeNull()
        expect(result!.fields[0].hashCreatedAt).toBeNull()

        // field2 should be unchanged
        expect(result!.fields[1].hashRetries).toEqual(field2.hashRetries)
        expect(result!.fields[1].signedData).toEqual(field2.signedData)
        expect(result!.fields[1].hashedOtp).toEqual(field2.hashedOtp)
        expect(result!.fields[1].hashCreatedAt).toEqual(field2.hashCreatedAt)

        expect(result!.formId).toEqual(transaction.formId)
      })

      it('should return null when the transaction ID is not found', async () => {
        const result = await VerificationModel.resetField(
          new ObjectId().toHexString(),
          new ObjectId().toHexString(),
        )

        expect(result).toBeNull()
      })
    })

    describe('updateHashForField', () => {
      it('should update the field and return the new document', async () => {
        const field = {
          ...generateFieldParams(),
          signedData: 'mockSignedData',
          hashedOtp: 'mockHashedOtp',
          hashCreatedAt: new Date(),
          hashRetries: 3,
          otpRequests: 3,
        }
        const transaction = await VerificationModel.create({
          ...VFN_PARAMS,
          fields: [field],
        })
        const updateParams: UpdateFieldData = {
          fieldId: field._id,
          transactionId: transaction._id,
          hashedOtp: 'updatedHashedOtp',
          signedData: 'updatedSignedData',
        }

        const result = await VerificationModel.updateHashForField(updateParams)

        expect(result!.fields[0].hashRetries).toEqual(0)
        expect(result!.fields[0].hashCreatedAt).toBeInstanceOf(Date)
        // Date should be updated, hence should not be the same
        expect(result!.fields[0].hashCreatedAt).not.toEqual(field.hashCreatedAt)
        expect(result!.fields[0].signedData).toEqual(updateParams.signedData)
        expect(result!.fields[0].hashedOtp).toEqual(updateParams.hashedOtp)
        expect(result!.fields[0].otpRequests).toEqual(field.otpRequests + 1)

        expect(result!.formId).toEqual(transaction.formId)
      })

      it('should update only the given field ID', async () => {
        const field1 = {
          ...generateFieldParams(),
          signedData: 'mockSignedData',
          hashedOtp: 'mockHashedOtp',
          hashCreatedAt: new Date(),
          hashRetries: 3,
          otpRequests: 1,
        }
        const field2 = {
          ...generateFieldParams(),
          signedData: 'mockSignedData2',
          hashedOtp: 'mockHashedOtp2',
          hashCreatedAt: new Date(),
          hashRetries: 2,
          otpRequests: 3,
        }
        const transaction = await VerificationModel.create({
          ...VFN_PARAMS,
          fields: [field1, field2],
        })
        const updateParams: UpdateFieldData = {
          fieldId: field1._id,
          transactionId: transaction._id,
          hashedOtp: 'updatedHashedOtp',
          signedData: 'updatedSignedData',
        }

        const result = await VerificationModel.updateHashForField(updateParams)

        expect(result!.fields[0].hashRetries).toEqual(0)
        expect(result!.fields[0].hashCreatedAt).toBeInstanceOf(Date)
        // Date should be updated, hence should not be the same
        expect(result!.fields[0].hashCreatedAt).not.toEqual(
          field1.hashCreatedAt,
        )
        expect(result!.fields[0].signedData).toEqual(updateParams.signedData)
        expect(result!.fields[0].hashedOtp).toEqual(updateParams.hashedOtp)
        expect(result!.fields[0].otpRequests).toEqual(field1.otpRequests + 1)

        // field2 should remain completely unchanged
        expect(result!.fields[1].hashRetries).toEqual(field2.hashRetries)
        expect(result!.fields[1].signedData).toEqual(field2.signedData)
        expect(result!.fields[1].hashedOtp).toEqual(field2.hashedOtp)
        expect(result!.fields[1].hashCreatedAt).toEqual(field2.hashCreatedAt)
        expect(result!.fields[1].otpRequests).toEqual(field2.otpRequests)

        expect(result!.formId).toEqual(transaction.formId)
      })

      it('should return null when the transaction ID is not found', async () => {
        const result = await VerificationModel.updateHashForField({
          fieldId: new ObjectId().toHexString(),
          transactionId: new ObjectId().toHexString(),
          hashedOtp: 'mockHashedOtp',
          signedData: 'mockSignedData',
        })

        expect(result).toBeNull()
      })
    })
  })
})
