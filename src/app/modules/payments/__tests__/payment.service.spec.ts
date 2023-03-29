import { ObjectId } from 'bson'
import mongoose from 'mongoose'

import getPaymentModel from 'src/app/models/payment.server.model'

import dbHandler from 'tests/unit/backend/helpers/jest-db'

import { findPaymentByPaymentIntentId } from '../payments.service'

const Payment = getPaymentModel(mongoose)
describe('payments.service', () => {
  beforeAll(async () => await dbHandler.connect())
  afterAll(async () => await dbHandler.closeDatabase())
  beforeEach(() => jest.clearAllMocks())

  describe('findPaymentByPaymentIntentId', () => {
    beforeEach(async () => {
      await dbHandler.clearCollection(Payment.collection.name)
    })
    afterEach(() => jest.clearAllMocks())
    it('should return with error if payment intent is not found', async () => {
      const result = await findPaymentByPaymentIntentId(
        new ObjectId().toHexString(),
      )
      expect(result.isErr()).toBeTrue()
    })

    it('should return with error if mongodb is not ready', async () => {
      await dbHandler.closeDatabase()
      const result = await findPaymentByPaymentIntentId(
        new ObjectId().toHexString(),
      )
      expect(result.isErr()).toBeTrue()
    })
  })
})
