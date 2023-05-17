import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import expressHandler from '__tests__/unit/backend/helpers/jest-express'
import { ObjectId } from 'bson'
import mongoose from 'mongoose'
import { PaymentStatus } from 'shared/types'

import getPaymentModel from 'src/app/models/payment.server.model'

import * as PaymentsController from '../payments.controller'

const Payment = getPaymentModel(mongoose)
const MOCK_FORM_ID = new ObjectId().toHexString()

describe('payments.controller', () => {
  beforeAll(async () => await dbHandler.connect())
  afterAll(async () => await dbHandler.closeDatabase())
  beforeEach(() => jest.clearAllMocks())
  describe('handleGetPreviousPayment', () => {
    beforeEach(async () => {
      await dbHandler.clearCollection(Payment.collection.name)
    })
    it('should return a payment document if there is a previous payment', async () => {
      const email = 'formsg@tech.gov.sg'
      const payment = await Payment.create({
        formId: MOCK_FORM_ID,
        target_account_id: 'acct_MOCK_ACCOUNT_ID',
        pendingSubmissionId: new ObjectId(),
        amount: 12345,
        status: PaymentStatus.Succeeded,
        paymentIntentId: 'pi_MOCK_PAYMENT_INTENT',
        email: email,
        completedPayment: {
          receiptUrl: 'http://form.gov.sg',
        },
      })

      const mockReq = expressHandler.mockRequest({
        params: { formId: payment.formId },
        body: { email },
      })

      const mockRes = expressHandler.mockResponse()

      // Act
      await PaymentsController.handleGetPreviousPaymentId(
        mockReq,
        mockRes,
        jest.fn(),
      )
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.send).toHaveBeenCalledOnce()
    })
    it('should return 404 if there are no previous payments by the specific email', async () => {
      const payment = await Payment.create({
        formId: MOCK_FORM_ID,
        target_account_id: 'acct_MOCK_ACCOUNT_ID',
        pendingSubmissionId: new ObjectId(),
        amount: 12345,
        status: PaymentStatus.Succeeded,
        paymentIntentId: 'pi_MOCK_PAYMENT_INTENT',
        email: 'formsg@tech.gov.sg',
        completedPayment: {
          receiptUrl: 'http://form.gov.sg',
        },
      })

      const mockReq = expressHandler.mockRequest({
        params: { formId: payment.formId },
        body: { email: 'another@email.com' },
      })

      const mockRes = expressHandler.mockResponse()

      // Act
      await PaymentsController.handleGetPreviousPaymentId(
        mockReq,
        mockRes,
        jest.fn(),
      )
      expect(mockRes.sendStatus).toHaveBeenCalledWith(404)
    })
    it('should return 404 if there are no previous payments by the email in the specific formId', async () => {
      const payment = await Payment.create({
        formId: MOCK_FORM_ID,
        target_account_id: 'acct_MOCK_ACCOUNT_ID',
        pendingSubmissionId: new ObjectId(),
        amount: 12345,
        status: PaymentStatus.Succeeded,
        paymentIntentId: 'pi_MOCK_PAYMENT_INTENT',
        email: 'formsg@tech.gov.sg',
        completedPayment: {
          receiptUrl: 'http://form.gov.sg',
        },
      })

      const mockReq = expressHandler.mockRequest({
        params: { formId: new ObjectId().toHexString() },
        body: { email: payment.email },
      })

      const mockRes = expressHandler.mockResponse()

      // Act
      await PaymentsController.handleGetPreviousPaymentId(
        mockReq,
        mockRes,
        jest.fn(),
      )
      expect(mockRes.sendStatus).toHaveBeenCalledWith(404)
    })
    it('should return 500 if there is an internal server error', async () => {
      const payment = await Payment.create({
        formId: MOCK_FORM_ID,
        target_account_id: 'acct_MOCK_ACCOUNT_ID',
        pendingSubmissionId: new ObjectId(),
        amount: 12345,
        status: PaymentStatus.Succeeded,
        paymentIntentId: 'pi_MOCK_PAYMENT_INTENT',
        email: 'formsg@tech.gov.sg',
        completedPayment: {
          receiptUrl: 'http://form.gov.sg',
        },
      })

      const mockReq = expressHandler.mockRequest({
        params: { formId: new ObjectId().toHexString() },
        body: { email: payment.email },
      })

      const mockRes = expressHandler.mockResponse()

      // close DB to mock server error
      await dbHandler.closeDatabase()
      // Act
      await PaymentsController.handleGetPreviousPaymentId(
        mockReq,
        mockRes,
        jest.fn(),
      )
      expect(mockRes.sendStatus).toHaveBeenCalledWith(500)
      // reconnect DB
      await dbHandler.connect()
    })
  })
})
