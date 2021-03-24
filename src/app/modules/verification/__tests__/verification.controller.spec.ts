import { ObjectId } from 'bson'
import mongoose from 'mongoose'
import { mocked } from 'ts-jest/utils'

import expressHandler from 'tests/unit/backend/helpers/jest-express'

import { verifyOtp } from '../verification.controller'
import getVerificationModel from '../verification.model'
import * as VfnService from '../verification.service'

jest.mock('../verification.service')
const MockVfnService = mocked(VfnService, true)
// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {}
const MOCK_TRANSACTION_ID = 'transactionId'
const MOCK_FIELD_ID = 'fieldId'
const MOCK_OTP = 'otp'
const MOCK_DATA = 'data'
const MOCK_RES = expressHandler.mockResponse()
const Verification = getVerificationModel(mongoose)
const invalidOtpError = 'INVALID_OTP'

describe('Verification controller', () => {
  describe('verifyOtp', () => {
    const MOCK_REQ = expressHandler.mockRequest({
      body: { fieldId: MOCK_FIELD_ID, otp: MOCK_OTP },
      params: { transactionId: MOCK_TRANSACTION_ID },
    })
    const MOCK_TRANSACTION = new Verification({ formId: new ObjectId() })

    afterEach(() => jest.clearAllMocks())

    beforeAll(() => {
      MockVfnService.getTransaction.mockReturnValue(
        Promise.resolve(MOCK_TRANSACTION),
      )
    })

    it('should call service correctly when params are valid', async () => {
      MockVfnService.verifyOtp.mockReturnValue(Promise.resolve(MOCK_DATA))
      await verifyOtp(MOCK_REQ, MOCK_RES, noop)
      expect(MockVfnService.getTransaction).toHaveBeenCalledWith(
        MOCK_TRANSACTION_ID,
      )
      expect(MockVfnService.verifyOtp).toHaveBeenCalledWith(
        MOCK_TRANSACTION,
        MOCK_FIELD_ID,
        MOCK_OTP,
      )
      expect(MOCK_RES.status).toHaveBeenCalledWith(200)
      expect(MOCK_RES.json).toHaveBeenCalledWith(MOCK_DATA)
    })

    it('should return 422 when OTP is invalid', async () => {
      MockVfnService.verifyOtp.mockImplementationOnce(() => {
        const error = new Error(invalidOtpError)
        error.name = invalidOtpError
        throw error
      })
      await verifyOtp(MOCK_REQ, MOCK_RES, noop)
      expect(MockVfnService.getTransaction).toHaveBeenCalledWith(
        MOCK_TRANSACTION_ID,
      )
      expect(MockVfnService.verifyOtp).toHaveBeenCalledWith(
        MOCK_TRANSACTION,
        MOCK_FIELD_ID,
        MOCK_OTP,
      )
      expect(MOCK_RES.status).toHaveBeenCalledWith(422)
      expect(MOCK_RES.json).toHaveBeenCalledWith(invalidOtpError)
    })
  })
})
