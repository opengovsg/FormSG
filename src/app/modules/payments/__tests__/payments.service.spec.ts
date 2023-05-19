import { ObjectId } from 'bson'
import mongoose from 'mongoose'
import { PaymentStatus } from 'shared/types'

import getPaymentModel from 'src/app/models/payment.server.model'

import dbHandler from 'tests/unit/backend/helpers/jest-db'

import * as PaymentsService from '../payments.service'

const Payment = getPaymentModel(mongoose)
const MOCK_FORM_ID = new ObjectId().toHexString()

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
        formId: MOCK_FORM_ID,
        targetAccountId: 'acct_MOCK_ACCOUNT_ID',
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

  describe('findLatestSuccessfulPaymentByEmailAndFormId', () => {
    const expectedObjectId = new ObjectId()
    const email = 'someone@mail.com'

    beforeEach(async () => {
      await dbHandler.clearCollection(Payment.collection.name)
      await Payment.create({
        _id: expectedObjectId,
        formId: MOCK_FORM_ID,
        targetAccountId: 'acct_MOCK_ACCOUNT_ID',
        pendingSubmissionId: new ObjectId(),
        paymentIntentId: 'somePaymentIntentId',
        amount: 314159,
        email: email,
        status: PaymentStatus.Succeeded,
      })
    })
    afterEach(() => jest.clearAllMocks())

    it('should return without error if payment document is found', async () => {
      // Act
      const result =
        await PaymentsService.findLatestSuccessfulPaymentByEmailAndFormId(
          email,
          MOCK_FORM_ID,
        )

      // Assert
      expect(result.isOk()).toBeTrue()
    })

    it('should return the latest payment based on id creation', async () => {
      const latestId = new ObjectId()
      // create the latest payment object
      await Payment.create({
        _id: latestId,
        formId: MOCK_FORM_ID,
        targetAccountId: 'acct_MOCK_ACCOUNT_ID',
        pendingSubmissionId: new ObjectId(),
        paymentIntentId: 'somePaymentIntentId',
        amount: 314159,
        email: email,
        status: PaymentStatus.Succeeded,
      })
      const result =
        await PaymentsService.findLatestSuccessfulPaymentByEmailAndFormId(
          email,
          MOCK_FORM_ID,
        )

      // Assert latest payment document
      result.map((payment) => {
        expect(payment.id).toEqual(latestId.toHexString())
      })

      // Assert
      expect(result.isOk()).toBeTrue()
    })

    it('should return with error if email is not found in any payment document', async () => {
      const missingEmail = 'missing@missing.com'
      const result =
        await PaymentsService.findLatestSuccessfulPaymentByEmailAndFormId(
          missingEmail,
          MOCK_FORM_ID,
        )
      expect(result.isErr()).toBeTrue()
    })

    it('should return with error if formId is not found in any payment document', async () => {
      const missingFormId = new ObjectId().toHexString()
      const result =
        await PaymentsService.findLatestSuccessfulPaymentByEmailAndFormId(
          email,
          missingFormId,
        )
      expect(result.isErr()).toBeTrue()
    })

    it('should return with error if there is no successful payments for the email and formId', async () => {
      const newEmail = 'new@new.com'
      const newFormId = new ObjectId().toHexString()
      const newId = new ObjectId()
      await Payment.create({
        _id: newId,
        formId: newFormId,
        targetAccountId: 'acct_MOCK_ACCOUNT_ID',
        pendingSubmissionId: new ObjectId(),
        paymentIntentId: 'somePaymentIntentId',
        amount: 314159,
        email: newEmail,
        status: PaymentStatus.Pending,
      })
      const result =
        await PaymentsService.findLatestSuccessfulPaymentByEmailAndFormId(
          newEmail,
          newFormId,
        )
      expect(result.isErr()).toBeTrue()
    })

    it('should return with error if mongodb is not ready', async () => {
      await dbHandler.closeDatabase()
      const result =
        await PaymentsService.findLatestSuccessfulPaymentByEmailAndFormId(
          email,
          MOCK_FORM_ID,
        )
      expect(result.isErr()).toBeTrue()
    })
  })
})
