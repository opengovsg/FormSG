import mongoose from 'mongoose'

import getFormModel from 'src/app/models/form.server.model'
import getVerificationModel from 'src/app/models/verification.server.model'
import { createTransaction } from 'src/app/modules/verification/verification.service'
import { BasicFieldType, IUserSchema } from 'src/types'

import dbHandler from '../../helpers/jest-db'

const Form = getFormModel(mongoose)
const Verification = getVerificationModel(mongoose)
const MOCK_FORM_TITLE = 'Verification service tests'

describe('Verification service', () => {
  let user: IUserSchema
  beforeAll(async () => {
    await dbHandler.connect()
  })
  beforeEach(async () => {
    const preloadedDocuments = await dbHandler.insertFormCollectionReqs({})
    user = preloadedDocuments.user
  })
  afterEach(async () => await dbHandler.clearDatabase())
  afterAll(async () => await dbHandler.closeDatabase())

  describe('createTransaction', () => {
    test('should return null when form_fields does not exist', async () => {
      const testForm = new Form({
        admin: user,
        title: MOCK_FORM_TITLE,
      })
      await testForm.save()
      return expect(createTransaction(testForm._id)).resolves.toBe(null)
    })

    test('should return null when there are no verifiable fields', async () => {
      const testForm = new Form({
        form_fields: [{ fieldType: BasicFieldType.YesNo }],
        admin: user,
        title: MOCK_FORM_TITLE,
      })
      await testForm.save()
      return expect(createTransaction(testForm._id)).resolves.toBe(null)
    })

    test('should correctly save and return transaction', async () => {
      const testForm = new Form({
        form_fields: [{ fieldType: BasicFieldType.Email, isVerifiable: true }],
        admin: user,
        title: MOCK_FORM_TITLE,
      })
      await testForm.save()
      const returnedTransaction = await createTransaction(testForm._id)
      const foundTransaction = await Verification.findOne({
        formId: testForm._id,
      })
      expect(foundTransaction).toBeTruthy()
      expect(returnedTransaction).toEqual({
        transactionId: foundTransaction._id,
        expireAt: foundTransaction.expireAt,
      })
    })
  })
})
