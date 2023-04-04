import { ObjectId } from 'bson'
import mongoose from 'mongoose'

import getPaymentModel from 'src/app/models/payment.server.model'

import dbHandler from 'tests/unit/backend/helpers/jest-db'

import * as PaymentsService from '../payments.service'

const Payment = getPaymentModel(mongoose)

describe('payments.service', () => {
  beforeEach(async () => {
    await dbHandler.connect()
    jest.clearAllMocks()
  })
  afterEach(async () => await dbHandler.closeDatabase())

  describe('findPaymentById', () => {
    beforeEach(async () => {
      await dbHandler.clearCollection(Payment.collection.name)
    })
    afterEach(() => jest.clearAllMocks())

    it('should return without error if payment id is found', async () => {
      // Arrange
      const expectedObjectId = new ObjectId()
      await Payment.create({
        _id: expectedObjectId,
        pendingSubmissionId: new ObjectId(),
        paymentIntentId: 'somePaymentIntentId',
        amount: 314159,
        email: 'someone@mail.com',
      })

      // Act
      const result = await PaymentsService.findPaymentById(
        expectedObjectId.toHexString(),
      )

      // Assert
      expect(result.isOk()).toBeTrue()
    })

    it('should return with error if payment id is not found', async () => {
      const result = await PaymentsService.findPaymentById(
        new ObjectId().toHexString(),
      )
      expect(result.isErr()).toBeTrue()
    })

    it('should return with error if mongodb is not ready', async () => {
      await dbHandler.closeDatabase()
      const result = await PaymentsService.findPaymentById(
        new ObjectId().toHexString(),
      )
      expect(result.isErr()).toBeTrue()
    })
  })
})
