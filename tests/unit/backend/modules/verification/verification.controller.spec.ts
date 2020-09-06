import { ObjectId } from 'bson'
import { StatusCodes } from 'http-status-codes'
import mongoose from 'mongoose'
import { mocked } from 'ts-jest/utils'

import getVerificationModel from 'src/app/models/verification.server.model'
import {
  createTransaction,
  getNewOtp,
  getTransactionMetadata,
  resetFieldInTransaction,
  verifyOtp,
} from 'src/app/modules/verification/verification.controller'
import * as VfnService from 'src/app/modules/verification/verification.service'

import expressHandler from '../../helpers/jest-express'

jest.mock('src/app/modules/verification/verification.service')
const MockVfnService = mocked(VfnService, true)
const noop = () => {}
const MOCK_FORM_ID = 'formId'
const MOCK_TRANSACTION_ID = 'transactionId'
const MOCK_FIELD_ID = 'fieldId'
const MOCK_ANSWER = 'answer'
const MOCK_OTP = 'otp'
const MOCK_DATA = 'data'
const MOCK_RES = expressHandler.mockResponse()
const Verification = getVerificationModel(mongoose)
const notFoundError = 'TRANSACTION_NOT_FOUND'
const waitOtpError = 'WAIT_FOR_OTP'
const sendOtpError = 'SEND_OTP_FAILED'
const invalidOtpError = 'INVALID_OTP'

describe('Verification controller', () => {
  describe('createTransaction', () => {
    let mockReq
    afterEach(() => jest.clearAllMocks())

    beforeAll(() => {
      mockReq = expressHandler.mockRequest({ body: { formId: MOCK_FORM_ID } })
    })

    it('should correctly return transaction when parameters are valid', async () => {
      const returnValue = {
        transactionId: 'Bereft of life, it rests in peace',
        expireAt: new Date(),
      }
      MockVfnService.createTransaction.mockReturnValueOnce(
        Promise.resolve(returnValue),
      )
      await createTransaction(mockReq, MOCK_RES, noop)
      expect(MockVfnService.createTransaction).toHaveBeenCalledWith(
        MOCK_FORM_ID,
      )
      expect(MOCK_RES.status).toHaveBeenCalledWith(StatusCodes.CREATED)
      expect(MOCK_RES.json).toHaveBeenCalledWith(returnValue)
    })

    it('should correctly return 200 when transaction is not found', async () => {
      MockVfnService.createTransaction.mockReturnValueOnce(null)
      await createTransaction(mockReq, MOCK_RES, noop)
      expect(MockVfnService.createTransaction).toHaveBeenCalledWith(
        MOCK_FORM_ID,
      )
      expect(MOCK_RES.sendStatus).toHaveBeenCalledWith(StatusCodes.OK)
    })
  })

  describe('getTransactionMetadata', () => {
    let mockReq
    afterEach(() => jest.clearAllMocks())

    beforeAll(() => {
      mockReq = expressHandler.mockRequest({
        body: {},
        params: { transactionId: MOCK_TRANSACTION_ID },
      })
    })

    it('should correctly return metadata when parameters are valid', async () => {
      // Coerce type
      const transaction = ('it' as unknown) as ReturnType<
        typeof MockVfnService.getTransactionMetadata
      >
      MockVfnService.getTransactionMetadata.mockReturnValueOnce(
        Promise.resolve(transaction),
      )
      await getTransactionMetadata(mockReq, MOCK_RES, noop)
      expect(MockVfnService.getTransactionMetadata).toHaveBeenCalledWith(
        MOCK_TRANSACTION_ID,
      )
      expect(MOCK_RES.status).toHaveBeenCalledWith(StatusCodes.OK)
      expect(MOCK_RES.json).toHaveBeenCalledWith(transaction)
    })

    it('should return 404 when service throws error', async () => {
      MockVfnService.getTransactionMetadata.mockImplementationOnce(() => {
        const error = new Error(notFoundError)
        error.name = notFoundError
        throw error
      })
      await getTransactionMetadata(mockReq, MOCK_RES, noop)
      expect(MockVfnService.getTransactionMetadata).toHaveBeenCalledWith(
        MOCK_TRANSACTION_ID,
      )
      expect(MOCK_RES.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND)
      expect(MOCK_RES.json).toHaveBeenCalledWith(notFoundError)
    })
  })

  describe('resetFieldInTransaction', () => {
    let mockReq
    afterEach(() => jest.clearAllMocks())

    beforeAll(() => {
      mockReq = expressHandler.mockRequest({
        body: { fieldId: MOCK_FIELD_ID },
        params: { transactionId: MOCK_TRANSACTION_ID },
      })
    })

    it('should correctly call service when params are valid', async () => {
      const transaction = new Verification({ formId: new ObjectId() })
      MockVfnService.getTransaction.mockReturnValueOnce(
        Promise.resolve(transaction),
      )
      await resetFieldInTransaction(mockReq, MOCK_RES, noop)
      expect(MockVfnService.getTransaction).toHaveBeenCalledWith(
        MOCK_TRANSACTION_ID,
      )
      expect(MockVfnService.resetFieldInTransaction).toHaveBeenCalledWith(
        transaction,
        MOCK_FIELD_ID,
      )
      expect(MOCK_RES.sendStatus).toHaveBeenCalledWith(StatusCodes.OK)
    })

    it('should return 404 when service throws error', async () => {
      MockVfnService.getTransaction.mockImplementationOnce(() => {
        const error = new Error(notFoundError)
        error.name = notFoundError
        throw error
      })
      await resetFieldInTransaction(mockReq, MOCK_RES, noop)
      expect(MockVfnService.getTransaction).toHaveBeenCalledWith(
        MOCK_TRANSACTION_ID,
      )
      expect(MOCK_RES.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND)
      expect(MOCK_RES.json).toHaveBeenCalledWith(notFoundError)
    })
  })

  describe('getNewOtp', () => {
    let mockReq, transaction
    afterEach(() => jest.clearAllMocks())

    beforeAll(() => {
      mockReq = expressHandler.mockRequest({
        body: { fieldId: MOCK_FIELD_ID, answer: MOCK_ANSWER },
        params: { transactionId: MOCK_TRANSACTION_ID },
      })
      transaction = new Verification({ formId: new ObjectId() })
      MockVfnService.getTransaction.mockReturnValue(
        Promise.resolve(transaction),
      )
    })

    it('should call service correctly when params are valid', async () => {
      await getNewOtp(mockReq, MOCK_RES, noop)
      expect(MockVfnService.getTransaction).toHaveBeenCalledWith(
        MOCK_TRANSACTION_ID,
      )
      expect(MockVfnService.getNewOtp).toHaveBeenCalledWith(
        transaction,
        MOCK_FIELD_ID,
        MOCK_ANSWER,
      )
      expect(MOCK_RES.sendStatus).toHaveBeenCalledWith(StatusCodes.CREATED)
    })

    it('should return 404 when service throws not found error', async () => {
      MockVfnService.getNewOtp.mockImplementationOnce(() => {
        const error = new Error(notFoundError)
        error.name = notFoundError
        throw error
      })
      await getNewOtp(mockReq, MOCK_RES, noop)
      expect(MockVfnService.getTransaction).toHaveBeenCalledWith(
        MOCK_TRANSACTION_ID,
      )
      expect(MockVfnService.getNewOtp).toHaveBeenCalledWith(
        transaction,
        MOCK_FIELD_ID,
        MOCK_ANSWER,
      )
      expect(MOCK_RES.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND)
      expect(MOCK_RES.json).toHaveBeenCalledWith(notFoundError)
    })

    it('should return 202 when service throws WaitForOtp error', async () => {
      MockVfnService.getNewOtp.mockImplementationOnce(() => {
        const error = new Error(waitOtpError)
        error.name = waitOtpError
        throw error
      })
      await getNewOtp(mockReq, MOCK_RES, noop)
      expect(MockVfnService.getTransaction).toHaveBeenCalledWith(
        MOCK_TRANSACTION_ID,
      )
      expect(MockVfnService.getNewOtp).toHaveBeenCalledWith(
        transaction,
        MOCK_FIELD_ID,
        MOCK_ANSWER,
      )
      expect(MOCK_RES.status).toHaveBeenCalledWith(StatusCodes.ACCEPTED)
      expect(MOCK_RES.json).toHaveBeenCalledWith(waitOtpError)
    })

    it('should return 400 when services throws OTP failed error', async () => {
      MockVfnService.getNewOtp.mockImplementationOnce(() => {
        const error = new Error(sendOtpError)
        error.name = sendOtpError
        throw error
      })
      await getNewOtp(mockReq, MOCK_RES, noop)
      expect(MockVfnService.getTransaction).toHaveBeenCalledWith(
        MOCK_TRANSACTION_ID,
      )
      expect(MockVfnService.getNewOtp).toHaveBeenCalledWith(
        transaction,
        MOCK_FIELD_ID,
        MOCK_ANSWER,
      )
      expect(MOCK_RES.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
      expect(MOCK_RES.json).toHaveBeenCalledWith(sendOtpError)
    })
  })

  describe('verifyOtp', () => {
    let mockReq, transaction

    afterEach(() => jest.clearAllMocks())

    beforeAll(() => {
      mockReq = expressHandler.mockRequest({
        body: { fieldId: MOCK_FIELD_ID, otp: MOCK_OTP },
        params: { transactionId: MOCK_TRANSACTION_ID },
      })
      transaction = new Verification({ formId: new ObjectId() })
      MockVfnService.getTransaction.mockReturnValue(
        Promise.resolve(transaction),
      )
    })

    it('should call service correctly when params are valid', async () => {
      MockVfnService.verifyOtp.mockReturnValue(Promise.resolve(MOCK_DATA))
      await verifyOtp(mockReq, MOCK_RES, noop)
      expect(MockVfnService.getTransaction).toHaveBeenCalledWith(
        MOCK_TRANSACTION_ID,
      )
      expect(MockVfnService.verifyOtp).toHaveBeenCalledWith(
        transaction,
        MOCK_FIELD_ID,
        MOCK_OTP,
      )
      expect(MOCK_RES.status).toHaveBeenCalledWith(StatusCodes.OK)
      expect(MOCK_RES.json).toHaveBeenCalledWith(MOCK_DATA)
    })

    it('should return 422 when OTP is invalid', async () => {
      MockVfnService.verifyOtp.mockImplementationOnce(() => {
        const error = new Error(invalidOtpError)
        error.name = invalidOtpError
        throw error
      })
      await verifyOtp(mockReq, MOCK_RES, noop)
      expect(MockVfnService.getTransaction).toHaveBeenCalledWith(
        MOCK_TRANSACTION_ID,
      )
      expect(MockVfnService.verifyOtp).toHaveBeenCalledWith(
        transaction,
        MOCK_FIELD_ID,
        MOCK_OTP,
      )
      expect(MOCK_RES.status).toHaveBeenCalledWith(
        StatusCodes.UNPROCESSABLE_ENTITY,
      )
      expect(MOCK_RES.json).toHaveBeenCalledWith(invalidOtpError)
    })
  })
})
