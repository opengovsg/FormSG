import { ObjectId } from 'bson'
import { Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import mongoose from 'mongoose'
import { errAsync, okAsync } from 'neverthrow'
import { mocked } from 'ts-jest/utils'

import { IVerificationSchema } from 'src/types'

import dbHandler from 'tests/unit/backend/helpers/jest-db'

import expressHandler from '../../../../../tests/unit/backend/helpers/jest-express'
import { DatabaseError } from '../../core/core.errors'
import * as VerificationController from '../verification.controller'
import { TransactionNotFoundError } from '../verification.errors'
import { VerificationFactory } from '../verification.factory'
import getVerificationModel from '../verification.model'

const VerificationModel = getVerificationModel(mongoose)

jest.mock('../verification.factory')
const MockVerificationFactory = mocked(VerificationFactory, true)

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {}
const MOCK_FORM_ID = new ObjectId().toHexString()
const MOCK_TRANSACTION_ID = new ObjectId().toHexString()

describe('Verification controller', () => {
  let mockTransaction: IVerificationSchema
  let mockRes: Response

  beforeAll(async () => {
    await dbHandler.connect()
    mockTransaction = await VerificationModel.create({
      _id: MOCK_TRANSACTION_ID,
      formId: MOCK_FORM_ID,
      expireAt: new Date(),
      fields: [],
    })
  })

  beforeEach(() => {
    mockRes = expressHandler.mockResponse()
  })

  afterEach(() => jest.resetAllMocks())

  afterAll(async () => {
    // mockTransaction is reused throughout the tests
    await dbHandler.clearDatabase()
    await dbHandler.closeDatabase()
  })

  describe('handleGetTransactionMetadata', () => {
    const MOCK_REQ = expressHandler.mockRequest({
      params: { transactionId: MOCK_TRANSACTION_ID },
    })

    it('should return metadata when parameters are valid', async () => {
      const transactionPublicView = mockTransaction.getPublicView()
      MockVerificationFactory.getTransactionMetadata.mockReturnValueOnce(
        okAsync(transactionPublicView),
      )

      await VerificationController.handleGetTransactionMetadata(
        MOCK_REQ,
        mockRes,
        noop,
      )

      expect(
        MockVerificationFactory.getTransactionMetadata,
      ).toHaveBeenCalledWith(MOCK_TRANSACTION_ID)
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.OK)
      expect(mockRes.json).toHaveBeenCalledWith(transactionPublicView)
    })

    it('should return 404 when transaction is not found', async () => {
      MockVerificationFactory.getTransactionMetadata.mockReturnValueOnce(
        errAsync(new TransactionNotFoundError()),
      )

      await VerificationController.handleGetTransactionMetadata(
        MOCK_REQ,
        mockRes,
        noop,
      )

      expect(
        MockVerificationFactory.getTransactionMetadata,
      ).toHaveBeenCalledWith(MOCK_TRANSACTION_ID)
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: expect.any(String),
      })
    })

    it('should return 500 when database error occurs', async () => {
      MockVerificationFactory.getTransactionMetadata.mockReturnValueOnce(
        errAsync(new DatabaseError()),
      )

      await VerificationController.handleGetTransactionMetadata(
        MOCK_REQ,
        mockRes,
        noop,
      )

      expect(
        MockVerificationFactory.getTransactionMetadata,
      ).toHaveBeenCalledWith(MOCK_TRANSACTION_ID)
      expect(mockRes.status).toHaveBeenCalledWith(
        StatusCodes.INTERNAL_SERVER_ERROR,
      )
      expect(mockRes.json).toHaveBeenCalledWith({
        message: expect.any(String),
      })
    })
  })
})
