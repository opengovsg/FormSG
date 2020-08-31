import { ObjectId } from 'bson'
import HttpStatus from 'http-status-codes'
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
import * as vfnService from 'src/app/modules/verification/verification.service'

import expressHandler from '../../helpers/jest-express'

jest.mock('src/app/modules/verification/verification.service')
const mockVfnService = mocked(vfnService, true)
const noop = () => {}
const MOCK_FORM_ID = 'formId'
const MOCK_TRANSACTION_ID = 'transactionId'
const MOCK_FIELD_ID = 'fieldId'
const MOCK_ANSWER = 'answer'
const MOCK_OTP = 'otp'
const MOCK_DATA = 'data'
const mockRes = expressHandler.mockResponse()
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
      mockReq = { body: { formId: MOCK_FORM_ID } }
    })

    it('should correctly return transaction when parameters are valid', async () => {
      const returnValue = {
        transactionId: 'Bereft of life, it rests in peace',
        expireAt: new Date(),
      }
      mockVfnService.createTransaction.mockReturnValueOnce(
        Promise.resolve(returnValue),
      )
      await createTransaction(mockReq, mockRes, noop)
      expect(mockVfnService.createTransaction).toHaveBeenCalledWith(
        MOCK_FORM_ID,
      )
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.CREATED)
      expect(mockRes.json).toHaveBeenCalledWith(returnValue)
    })

    it('should correctly return 200 when transaction is not found', async () => {
      mockVfnService.createTransaction.mockReturnValueOnce(null)
      await createTransaction(mockReq, mockRes, noop)
      expect(mockVfnService.createTransaction).toHaveBeenCalledWith(
        MOCK_FORM_ID,
      )
      expect(mockRes.sendStatus).toHaveBeenCalledWith(HttpStatus.OK)
    })
  })

  describe('getTransactionMetadata', () => {
    let mockReq
    afterEach(() => jest.clearAllMocks())

    beforeAll(() => {
      mockReq = { params: { transactionId: MOCK_TRANSACTION_ID } }
    })

    it('should correctly return metadata when parameters are valid', async () => {
      // Coerce type
      const transaction = ('it' as unknown) as ReturnType<
        typeof mockVfnService.getTransactionMetadata
      >
      mockVfnService.getTransactionMetadata.mockReturnValueOnce(
        Promise.resolve(transaction),
      )
      await getTransactionMetadata(mockReq, mockRes, noop)
      expect(mockVfnService.getTransactionMetadata).toHaveBeenCalledWith(
        MOCK_TRANSACTION_ID,
      )
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.OK)
      expect(mockRes.json).toHaveBeenCalledWith(transaction)
    })

    it('should return 404 when service throws error', async () => {
      mockVfnService.getTransactionMetadata.mockImplementationOnce(() => {
        const error = new Error(notFoundError)
        error.name = notFoundError
        throw error
      })
      await getTransactionMetadata(mockReq, mockRes, noop)
      expect(mockVfnService.getTransactionMetadata).toHaveBeenCalledWith(
        MOCK_TRANSACTION_ID,
      )
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND)
      expect(mockRes.json).toHaveBeenCalledWith(notFoundError)
    })
  })

  describe('resetFieldInTransaction', () => {
    let mockReq
    afterEach(() => jest.clearAllMocks())

    beforeAll(() => {
      mockReq = {
        body: { fieldId: MOCK_FIELD_ID },
        params: { transactionId: MOCK_TRANSACTION_ID },
      }
    })

    it('should correctly call service when params are valid', async () => {
      const transaction = new Verification({ formId: new ObjectId() })
      mockVfnService.getTransaction.mockReturnValueOnce(
        Promise.resolve(transaction),
      )
      await resetFieldInTransaction(mockReq, mockRes, noop)
      expect(mockVfnService.getTransaction).toHaveBeenCalledWith(
        MOCK_TRANSACTION_ID,
      )
      expect(mockVfnService.resetFieldInTransaction).toHaveBeenCalledWith(
        transaction,
        MOCK_FIELD_ID,
      )
      expect(mockRes.sendStatus).toHaveBeenCalledWith(HttpStatus.OK)
    })

    it('should return 404 when service throws error', async () => {
      mockVfnService.getTransaction.mockImplementationOnce(() => {
        const error = new Error(notFoundError)
        error.name = notFoundError
        throw error
      })
      await resetFieldInTransaction(mockReq, mockRes, noop)
      expect(mockVfnService.getTransaction).toHaveBeenCalledWith(
        MOCK_TRANSACTION_ID,
      )
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND)
      expect(mockRes.json).toHaveBeenCalledWith(notFoundError)
    })
  })

  describe('getNewOtp', () => {
    let mockReq, transaction
    afterEach(() => jest.clearAllMocks())

    beforeAll(() => {
      mockReq = {
        body: { fieldId: MOCK_FIELD_ID, answer: MOCK_ANSWER },
        params: { transactionId: MOCK_TRANSACTION_ID },
      }
      transaction = new Verification({ formId: new ObjectId() })
      mockVfnService.getTransaction.mockReturnValue(
        Promise.resolve(transaction),
      )
    })

    it('should call service correctly when params are valid', async () => {
      await getNewOtp(mockReq, mockRes, noop)
      expect(mockVfnService.getTransaction).toHaveBeenCalledWith(
        MOCK_TRANSACTION_ID,
      )
      expect(mockVfnService.getNewOtp).toHaveBeenCalledWith(
        transaction,
        MOCK_FIELD_ID,
        MOCK_ANSWER,
      )
      expect(mockRes.sendStatus).toHaveBeenCalledWith(HttpStatus.CREATED)
    })

    it('should return 404 when service throws not found error', async () => {
      mockVfnService.getNewOtp.mockImplementationOnce(() => {
        const error = new Error(notFoundError)
        error.name = notFoundError
        throw error
      })
      await getNewOtp(mockReq, mockRes, noop)
      expect(mockVfnService.getTransaction).toHaveBeenCalledWith(
        MOCK_TRANSACTION_ID,
      )
      expect(mockVfnService.getNewOtp).toHaveBeenCalledWith(
        transaction,
        MOCK_FIELD_ID,
        MOCK_ANSWER,
      )
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND)
      expect(mockRes.json).toHaveBeenCalledWith(notFoundError)
    })

    it('should return 202 when service throws WaitForOtp error', async () => {
      mockVfnService.getNewOtp.mockImplementationOnce(() => {
        const error = new Error(waitOtpError)
        error.name = waitOtpError
        throw error
      })
      await getNewOtp(mockReq, mockRes, noop)
      expect(mockVfnService.getTransaction).toHaveBeenCalledWith(
        MOCK_TRANSACTION_ID,
      )
      expect(mockVfnService.getNewOtp).toHaveBeenCalledWith(
        transaction,
        MOCK_FIELD_ID,
        MOCK_ANSWER,
      )
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.ACCEPTED)
      expect(mockRes.json).toHaveBeenCalledWith(waitOtpError)
    })

    it('should return 400 when services throws OTP failed error', async () => {
      mockVfnService.getNewOtp.mockImplementationOnce(() => {
        const error = new Error(sendOtpError)
        error.name = sendOtpError
        throw error
      })
      await getNewOtp(mockReq, mockRes, noop)
      expect(mockVfnService.getTransaction).toHaveBeenCalledWith(
        MOCK_TRANSACTION_ID,
      )
      expect(mockVfnService.getNewOtp).toHaveBeenCalledWith(
        transaction,
        MOCK_FIELD_ID,
        MOCK_ANSWER,
      )
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST)
      expect(mockRes.json).toHaveBeenCalledWith(sendOtpError)
    })
  })

  describe('verifyOtp', () => {
    let mockReq, transaction

    afterEach(() => jest.clearAllMocks())

    beforeAll(() => {
      mockReq = {
        body: { fieldId: MOCK_FIELD_ID, otp: MOCK_OTP },
        params: { transactionId: MOCK_TRANSACTION_ID },
      }
      transaction = new Verification({ formId: new ObjectId() })
      mockVfnService.getTransaction.mockReturnValue(
        Promise.resolve(transaction),
      )
    })

    it('should call service correctly when params are valid', async () => {
      mockVfnService.verifyOtp.mockReturnValue(Promise.resolve(MOCK_DATA))
      await verifyOtp(mockReq, mockRes, noop)
      expect(mockVfnService.getTransaction).toHaveBeenCalledWith(
        MOCK_TRANSACTION_ID,
      )
      expect(mockVfnService.verifyOtp).toHaveBeenCalledWith(
        transaction,
        MOCK_FIELD_ID,
        MOCK_OTP,
      )
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.OK)
      expect(mockRes.json).toHaveBeenCalledWith(MOCK_DATA)
    })

    it('should return 422 when OTP is invalid', async () => {
      mockVfnService.verifyOtp.mockImplementationOnce(() => {
        const error = new Error(invalidOtpError)
        error.name = invalidOtpError
        throw error
      })
      await verifyOtp(mockReq, mockRes, noop)
      expect(mockVfnService.getTransaction).toHaveBeenCalledWith(
        MOCK_TRANSACTION_ID,
      )
      expect(mockVfnService.verifyOtp).toHaveBeenCalledWith(
        transaction,
        MOCK_FIELD_ID,
        MOCK_OTP,
      )
      expect(mockRes.status).toHaveBeenCalledWith(
        HttpStatus.UNPROCESSABLE_ENTITY,
      )
      expect(mockRes.json).toHaveBeenCalledWith(invalidOtpError)
    })
  })
})
