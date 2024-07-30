import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import expressHandler from '__tests__/unit/backend/helpers/jest-express'
import { ObjectId } from 'bson'
import { StatusCodes } from 'http-status-codes'
import moment from 'moment-timezone'
import mongoose from 'mongoose'
import { PaymentStatus } from 'shared/types'

import getPaymentModel from 'src/app/models/payment.server.model'

import * as PaymentsController from '../payments.controller'

const Payment = getPaymentModel(mongoose)
const MOCK_FORM_ID = new ObjectId().toHexString()

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest
      .fn()
      .mockResolvedValueOnce(true)
      .mockRejectedValueOnce(false),
  }),
}))

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
        targetAccountId: 'acct_MOCK_ACCOUNT_ID',
        pendingSubmissionId: new ObjectId(),
        amount: 12345,
        status: PaymentStatus.Succeeded,
        paymentIntentId: 'pi_MOCK_PAYMENT_INTENT',
        email: email,
        completedPayment: {
          receiptUrl: 'http://form.gov.sg',
          paymentDate: new Date(),
          submissionId: new ObjectId().toHexString(),
          transactionFee: 0,
        },
        gstEnabled: false,
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
    it('should return 200 and the latest payment record id if there are multiple successful payments', async () => {
      const email = 'formsg@tech.gov.sg'
      const now = moment().utc()

      // create 2 payments with different payment dates but same email
      const latestPayment = await Payment.create({
        formId: MOCK_FORM_ID,
        targetAccountId: 'acct_MOCK_ACCOUNT_ID',
        pendingSubmissionId: new ObjectId(),
        amount: 12345,
        status: PaymentStatus.Succeeded,
        paymentIntentId: 'pi_MOCK_PAYMENT_INTENT',
        email: email,
        completedPayment: {
          receiptUrl: 'http://form.gov.sg',
          paymentDate: now.toDate(),

          submissionId: new ObjectId().toHexString(),
          transactionFee: 0,
        },
        gstEnabled: false,
      })
      await Payment.create({
        formId: MOCK_FORM_ID,
        targetAccountId: 'acct_MOCK_ACCOUNT_ID',
        pendingSubmissionId: new ObjectId(),
        amount: 12345,
        status: PaymentStatus.Succeeded,
        paymentIntentId: 'pi_MOCK_PAYMENT_INTENT',
        email: email,
        completedPayment: {
          receiptUrl: 'http://form.gov.sg',
          paymentDate: now.subtract(1, 'hour').toDate(),

          submissionId: new ObjectId().toHexString(),
          transactionFee: 0,
        },
        gstEnabled: false,
      })

      const mockReq = expressHandler.mockRequest({
        params: { formId: MOCK_FORM_ID },
        body: { email },
      })

      const mockRes = expressHandler.mockResponse()

      await PaymentsController.handleGetPreviousPaymentId(
        mockReq,
        mockRes,
        jest.fn(),
      )
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.send).toHaveBeenCalledWith(latestPayment._id)
    })
    it('should return 404 if there are no successful payments made within the alst 30 days', async () => {
      const email = 'formsg@tech.gov.sg'

      await Payment.create({
        formId: MOCK_FORM_ID,
        targetAccountId: 'acct_MOCK_ACCOUNT_ID',
        pendingSubmissionId: new ObjectId(),
        amount: 12345,
        status: PaymentStatus.Succeeded,
        paymentIntentId: 'pi_MOCK_PAYMENT_INTENT',
        email: email,
        completedPayment: {
          receiptUrl: 'http://form.gov.sg',
          paymentDate: moment().subtract(31, 'days').toDate(),

          submissionId: new ObjectId().toHexString(),
          transactionFee: 0,
        },
        gstEnabled: false,
      })

      const mockReq = expressHandler.mockRequest({
        params: { formId: MOCK_FORM_ID },
        body: { email },
      })

      const mockRes = expressHandler.mockResponse()

      await PaymentsController.handleGetPreviousPaymentId(
        mockReq,
        mockRes,
        jest.fn(),
      )
      expect(mockRes.sendStatus).toHaveBeenCalledWith(404)
    })
    it('should return 404 if there are no previous payments by the specific email', async () => {
      const payment = await Payment.create({
        formId: MOCK_FORM_ID,
        targetAccountId: 'acct_MOCK_ACCOUNT_ID',
        pendingSubmissionId: new ObjectId(),
        amount: 12345,
        status: PaymentStatus.Succeeded,
        paymentIntentId: 'pi_MOCK_PAYMENT_INTENT',
        email: 'formsg@tech.gov.sg',
        completedPayment: {
          receiptUrl: 'http://form.gov.sg',

          submissionId: new ObjectId().toHexString(),
          paymentDate: moment().subtract(31, 'days').utc().toDate(),
          transactionFee: 0,
        },
        gstEnabled: false,
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
        targetAccountId: 'acct_MOCK_ACCOUNT_ID',
        pendingSubmissionId: new ObjectId(),
        amount: 12345,
        status: PaymentStatus.Succeeded,
        paymentIntentId: 'pi_MOCK_PAYMENT_INTENT',
        email: 'formsg@tech.gov.sg',
        completedPayment: {
          receiptUrl: 'http://form.gov.sg',

          submissionId: new ObjectId().toHexString(),
          paymentDate: moment().subtract(31, 'days').utc().toDate(),
          transactionFee: 0,
        },
        gstEnabled: false,
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
        targetAccountId: 'acct_MOCK_ACCOUNT_ID',
        pendingSubmissionId: new ObjectId(),
        amount: 12345,
        status: PaymentStatus.Succeeded,
        paymentIntentId: 'pi_MOCK_PAYMENT_INTENT',
        email: 'formsg@tech.gov.sg',
        completedPayment: {
          receiptUrl: 'http://form.gov.sg',

          submissionId: new ObjectId().toHexString(),
          paymentDate: moment().subtract(31, 'days').utc().toDate(),
          transactionFee: 0,
        },
        gstEnabled: false,
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
  describe('handleSendOnboardingEmail', () => {
    const MOCK_AGENCY_DOMAIN = 'test.gov.sg'
    const MOCK_VALID_EMAIL = `hello@${MOCK_AGENCY_DOMAIN}`

    beforeEach(async () => {
      await dbHandler.insertAgency({ mailDomain: MOCK_AGENCY_DOMAIN })
    })

    it('should return 200 if payment onboarding email is sent successfully', async () => {
      // Arrange
      // nodemailer is expected to resolve to true now
      const mockReq = expressHandler.mockRequest({
        body: { email: MOCK_VALID_EMAIL },
      })
      const mockRes = expressHandler.mockResponse()

      // Act
      await PaymentsController._handleSendOnboardingEmail(
        mockReq,
        mockRes,
        jest.fn(),
      )

      expect(mockRes.sendStatus).toHaveBeenCalledWith(StatusCodes.OK)
    })

    it('should return 403 if email domain is not whitelisted', async () => {
      // Arrange
      const mockReq = expressHandler.mockRequest({
        body: { email: 'jest-always-mocks@me.sad' },
      })
      const mockRes = expressHandler.mockResponse()

      // Act
      await PaymentsController._handleSendOnboardingEmail(
        mockReq,
        mockRes,
        jest.fn(),
      )

      expect(mockRes.sendStatus).toHaveBeenCalledWith(StatusCodes.FORBIDDEN)
    })

    it('should return 400 if sending of email fails', async () => {
      // Arrange
      // nodemailer is expected to reject with false now
      const mockReq = expressHandler.mockRequest({
        body: { email: MOCK_VALID_EMAIL },
      })
      const mockRes = expressHandler.mockResponse()

      // Act
      await PaymentsController._handleSendOnboardingEmail(
        mockReq,
        mockRes,
        jest.fn(),
      )

      expect(mockRes.sendStatus).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
    })

    it('should return 500 if database query fails', async () => {
      // Arrange
      const mockReq = expressHandler.mockRequest({
        body: { email: MOCK_VALID_EMAIL },
      })
      const mockRes = expressHandler.mockResponse()

      // close DB to mock server error
      await dbHandler.closeDatabase()

      // Act
      await PaymentsController._handleSendOnboardingEmail(
        mockReq,
        mockRes,
        jest.fn(),
      )

      expect(mockRes.sendStatus).toHaveBeenCalledWith(
        StatusCodes.INTERNAL_SERVER_ERROR,
      )

      // reconnect DB
      await dbHandler.connect()
    })
  })
})
