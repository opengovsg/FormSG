import { ObjectId } from 'bson'
import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import mongoose from 'mongoose'
import { err, errAsync, ok, okAsync } from 'neverthrow'
import { FormAuthType } from 'shared/types'
import { WAIT_FOR_OTP_SECONDS } from 'shared/utils/verification'
import { mocked } from 'ts-jest/utils'

import { MyInfoService } from 'src/app/modules/myinfo/myinfo.service'
import * as MyInfoUtils from 'src/app/modules/myinfo/myinfo.util'
import { MailSendError } from 'src/app/services/mail/mail.errors'
import {
  InvalidNumberError,
  SmsSendError,
} from 'src/app/services/sms/sms.errors'
import { HashingError } from 'src/app/utils/hash'
import * as OtpUtils from 'src/app/utils/otp'
import { IFormSchema, IPopulatedForm, IVerificationSchema } from 'src/types'

import dbHandler from 'tests/unit/backend/helpers/jest-db'

import expressHandler from '../../../../../tests/unit/backend/helpers/jest-express'
import { DatabaseError, MalformedParametersError } from '../../core/core.errors'
import { FormNotFoundError } from '../../form/form.errors'
import * as FormService from '../../form/form.service'
import {
  MOCK_MYINFO_JWT,
  MOCK_MYINFO_LOGIN_COOKIE,
} from '../../myinfo/__tests__/myinfo.test.constants'
import {
  MyInfoInvalidLoginCookieError,
  MyInfoMissingLoginCookieError,
} from '../../myinfo/myinfo.errors'
import {
  SgidInvalidJwtError,
  SgidMissingJwtError,
} from '../../sgid/sgid.errors'
import { SgidService } from '../../sgid/sgid.service'
import {
  MOCK_JWT,
  MOCK_JWT_PAYLOAD,
} from '../../spcp/__tests__/spcp.test.constants'
import { InvalidJwtError, MissingJwtError } from '../../spcp/spcp.errors'
import { CpOidcServiceClass } from '../../spcp/spcp.oidc.service/spcp.oidc.service.cp'
import { SpOidcServiceClass } from '../../spcp/spcp.oidc.service/spcp.oidc.service.sp'
import * as VerificationController from '../verification.controller'
import {
  FieldNotFoundInTransactionError,
  MissingHashDataError,
  NonVerifiedFieldTypeError,
  OtpExpiredError,
  OtpRetryExceededError,
  SmsLimitExceededError,
  TransactionExpiredError,
  TransactionNotFoundError,
  WaitForOtpError,
  WrongOtpError,
} from '../verification.errors'
import getVerificationModel from '../verification.model'
import * as VerificationService from '../verification.service'

import {
  generateFieldParams,
  MOCK_HASHED_OTP,
  MOCK_SIGNED_DATA,
} from './verification.test.helpers'

const VerificationModel = getVerificationModel(mongoose)

jest.mock('../verification.service')
const MockVerificationService = mocked(VerificationService, true)
jest.mock('src/app/utils/otp')
const MockOtpUtils = mocked(OtpUtils, true)
jest.mock('../../form/form.service')
const MockFormService = mocked(FormService, true)
jest.mock('../../spcp/spcp.oidc.service/spcp.oidc.service.sp')
const MockSpOidcServiceClass = mocked(SpOidcServiceClass, true)
jest.mock('../../spcp/spcp.oidc.service/spcp.oidc.service.cp')
const MockCpOidcServiceClass = mocked(CpOidcServiceClass, true)
jest.mock('../../myinfo/myinfo.util')
const MockMyInfoUtil = mocked(MyInfoUtils, true)
jest.mock('../../myinfo/myinfo.service')
const MockMyInfoService = mocked(MyInfoService, true)
jest.mock('../../sgid/sgid.service')
const MockSgidService = mocked(SgidService, true)

const mockSpOidcServiceClass = mocked(
  MockSpOidcServiceClass.mock.instances[0],
  true,
)
const mockCpOidcServiceClass = mocked(
  MockCpOidcServiceClass.mock.instances[0],
  true,
)

describe('Verification controller', () => {
  const MOCK_FORM_ID = new ObjectId().toHexString()
  const MOCK_TRANSACTION_ID = new ObjectId().toHexString()
  const MOCK_FIELD_ID = new ObjectId().toHexString()
  const MOCK_ANSWER = 'answer'
  const MOCK_OTP = 'otp'
  let mockTransaction: IVerificationSchema
  let mockRes: Response
  const EXPECTED_PARAMS_FOR_SENDING_OTP = {
    transactionId: MOCK_TRANSACTION_ID,
    fieldId: MOCK_FIELD_ID,
    otp: MOCK_OTP,
    hashedOtp: MOCK_HASHED_OTP,
    recipient: MOCK_ANSWER,
    senderIp: 'MOCK_IP',
  }

  beforeAll(async () => {
    await dbHandler.connect()
    mockTransaction = await VerificationModel.create({
      _id: MOCK_TRANSACTION_ID,
      formId: MOCK_FORM_ID,
      expireAt: new Date(),
      fields: [],
    })
  })

  beforeEach(async () => {
    mockRes = expressHandler.mockResponse()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  afterAll(async () => {
    // mockTransaction is reused throughout the tests
    await dbHandler.clearDatabase()
    await dbHandler.closeDatabase()
  })

  describe('handleCreateTransaction', () => {
    const MOCK_REQ = expressHandler.mockRequest<
      never,
      { formId: string },
      never
    >({
      body: { formId: MOCK_FORM_ID },
    })

    it('should return transaction when parameters are valid', async () => {
      MockVerificationService.createTransaction.mockReturnValueOnce(
        okAsync(mockTransaction),
      )

      await VerificationController.handleCreateTransaction(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      expect(MockVerificationService.createTransaction).toHaveBeenCalledWith(
        MOCK_FORM_ID,
      )
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.CREATED)
      expect(mockRes.json).toHaveBeenCalledWith({
        transactionId: mockTransaction._id,
        expireAt: mockTransaction.expireAt,
      })
    })

    it('should return 200 with empty object when transaction is not created', async () => {
      MockVerificationService.createTransaction.mockReturnValueOnce(
        okAsync(null),
      )
      await VerificationController.handleCreateTransaction(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )
      expect(MockVerificationService.createTransaction).toHaveBeenCalledWith(
        MOCK_FORM_ID,
      )
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.OK)
      expect(mockRes.json).toHaveBeenCalledWith({})
    })

    it('should return 404 when form is not found', async () => {
      MockVerificationService.createTransaction.mockReturnValueOnce(
        errAsync(new FormNotFoundError()),
      )

      await VerificationController.handleCreateTransaction(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      expect(MockVerificationService.createTransaction).toHaveBeenCalledWith(
        MOCK_FORM_ID,
      )
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: expect.any(String),
      })
    })

    it('should return 500 when database error occurs', async () => {
      MockVerificationService.createTransaction.mockReturnValueOnce(
        errAsync(new DatabaseError()),
      )

      await VerificationController.handleCreateTransaction(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      expect(MockVerificationService.createTransaction).toHaveBeenCalledWith(
        MOCK_FORM_ID,
      )
      expect(mockRes.status).toHaveBeenCalledWith(
        StatusCodes.INTERNAL_SERVER_ERROR,
      )
      expect(mockRes.json).toHaveBeenCalledWith({
        message: expect.any(String),
      })
    })
  })

  describe('handleCreateVerificationTransaction', () => {
    const MOCK_REQ = expressHandler.mockRequest({
      params: { formId: MOCK_FORM_ID },
    })

    it('should return transaction when parameters are valid', async () => {
      MockVerificationService.createTransaction.mockReturnValueOnce(
        okAsync(mockTransaction),
      )

      await VerificationController.handleCreateVerificationTransaction(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      expect(MockVerificationService.createTransaction).toHaveBeenCalledWith(
        MOCK_FORM_ID,
      )
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.CREATED)
      expect(mockRes.json).toHaveBeenCalledWith({
        transactionId: mockTransaction._id,
        expireAt: mockTransaction.expireAt,
      })
    })

    it('should return 200 with empty object when transaction is not created', async () => {
      MockVerificationService.createTransaction.mockReturnValueOnce(
        okAsync(null),
      )
      await VerificationController.handleCreateVerificationTransaction(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )
      expect(MockVerificationService.createTransaction).toHaveBeenCalledWith(
        MOCK_FORM_ID,
      )
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.OK)
      expect(mockRes.json).toHaveBeenCalledWith({})
    })

    it('should return 404 when form is not found', async () => {
      MockVerificationService.createTransaction.mockReturnValueOnce(
        errAsync(new FormNotFoundError()),
      )

      await VerificationController.handleCreateVerificationTransaction(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      expect(MockVerificationService.createTransaction).toHaveBeenCalledWith(
        MOCK_FORM_ID,
      )
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: expect.any(String),
      })
    })

    it('should return 500 when database error occurs', async () => {
      MockVerificationService.createTransaction.mockReturnValueOnce(
        errAsync(new DatabaseError()),
      )

      await VerificationController.handleCreateVerificationTransaction(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      expect(MockVerificationService.createTransaction).toHaveBeenCalledWith(
        MOCK_FORM_ID,
      )
      expect(mockRes.status).toHaveBeenCalledWith(
        StatusCodes.INTERNAL_SERVER_ERROR,
      )
      expect(mockRes.json).toHaveBeenCalledWith({
        message: expect.any(String),
      })
    })
  })

  describe('handleResetField', () => {
    const MOCK_REQ = expressHandler.mockRequest({
      body: { fieldId: MOCK_FIELD_ID },
      params: { transactionId: MOCK_TRANSACTION_ID },
    })

    it('should correctly call service when params are valid', async () => {
      MockVerificationService.resetFieldForTransaction.mockReturnValueOnce(
        okAsync(mockTransaction),
      )

      await VerificationController.handleResetField(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      expect(
        MockVerificationService.resetFieldForTransaction,
      ).toHaveBeenCalledWith(MOCK_TRANSACTION_ID, MOCK_FIELD_ID)
      expect(mockRes.sendStatus).toHaveBeenCalledWith(StatusCodes.OK)
    })

    it('should return 404 when transaction is not found', async () => {
      MockVerificationService.resetFieldForTransaction.mockReturnValueOnce(
        errAsync(new TransactionNotFoundError()),
      )

      await VerificationController.handleResetField(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      expect(
        MockVerificationService.resetFieldForTransaction,
      ).toHaveBeenCalledWith(MOCK_TRANSACTION_ID, MOCK_FIELD_ID)
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: expect.any(String),
      })
    })

    it('should return 404 when field is not found', async () => {
      MockVerificationService.resetFieldForTransaction.mockReturnValueOnce(
        errAsync(new FieldNotFoundInTransactionError()),
      )

      await VerificationController.handleResetField(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      expect(
        MockVerificationService.resetFieldForTransaction,
      ).toHaveBeenCalledWith(MOCK_TRANSACTION_ID, MOCK_FIELD_ID)
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: expect.any(String),
      })
    })

    it('should return 400 when transaction has expired', async () => {
      MockVerificationService.resetFieldForTransaction.mockReturnValueOnce(
        errAsync(new TransactionExpiredError()),
      )

      await VerificationController.handleResetField(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      expect(
        MockVerificationService.resetFieldForTransaction,
      ).toHaveBeenCalledWith(MOCK_TRANSACTION_ID, MOCK_FIELD_ID)
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: expect.any(String),
      })
    })

    it('should return 500 when database error occurs', async () => {
      MockVerificationService.resetFieldForTransaction.mockReturnValueOnce(
        errAsync(new DatabaseError()),
      )

      await VerificationController.handleResetField(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      expect(
        MockVerificationService.resetFieldForTransaction,
      ).toHaveBeenCalledWith(MOCK_TRANSACTION_ID, MOCK_FIELD_ID)
      expect(mockRes.status).toHaveBeenCalledWith(
        StatusCodes.INTERNAL_SERVER_ERROR,
      )
      expect(mockRes.json).toHaveBeenCalledWith({
        message: expect.any(String),
      })
    })
  })

  describe('handleGetOtp', () => {
    const MOCK_REQ = expressHandler.mockRequest({
      body: { fieldId: MOCK_FIELD_ID, answer: MOCK_ANSWER },
      params: { transactionId: MOCK_TRANSACTION_ID },
    })

    beforeEach(() => {
      MockOtpUtils.generateOtpWithHash.mockReturnValue(
        okAsync({
          otp: MOCK_OTP,
          hashedOtp: MOCK_HASHED_OTP,
        }),
      )
      MockVerificationService.sendNewOtp.mockReturnValue(
        okAsync(mockTransaction),
      )
    })

    it('should call service correctly when params are valid', async () => {
      await VerificationController.handleGetOtp(MOCK_REQ, mockRes, jest.fn())

      expect(MockOtpUtils.generateOtpWithHash).toHaveBeenCalled()
      expect(MockVerificationService.sendNewOtp).toHaveBeenCalledWith(
        EXPECTED_PARAMS_FOR_SENDING_OTP,
      )
      expect(mockRes.sendStatus).toHaveBeenCalledWith(StatusCodes.CREATED)
    })

    it('should return 404 when transaction is not found', async () => {
      MockVerificationService.sendNewOtp.mockReturnValueOnce(
        errAsync(new TransactionNotFoundError()),
      )

      await VerificationController.handleGetOtp(MOCK_REQ, mockRes, jest.fn())

      expect(MockOtpUtils.generateOtpWithHash).toHaveBeenCalled()
      expect(MockVerificationService.sendNewOtp).toHaveBeenCalledWith(
        EXPECTED_PARAMS_FOR_SENDING_OTP,
      )
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND)
      expect(mockRes.json).toHaveBeenCalledWith({ message: expect.any(String) })
    })

    it('should return 400 when transaction has expired', async () => {
      MockVerificationService.sendNewOtp.mockReturnValueOnce(
        errAsync(new TransactionExpiredError()),
      )

      await VerificationController.handleGetOtp(MOCK_REQ, mockRes, jest.fn())

      expect(MockOtpUtils.generateOtpWithHash).toHaveBeenCalled()
      expect(MockVerificationService.sendNewOtp).toHaveBeenCalledWith(
        EXPECTED_PARAMS_FOR_SENDING_OTP,
      )
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
      expect(mockRes.json).toHaveBeenCalledWith({ message: expect.any(String) })
    })

    it('should return 404 when field ID is not found', async () => {
      MockVerificationService.sendNewOtp.mockReturnValueOnce(
        errAsync(new FieldNotFoundInTransactionError()),
      )

      await VerificationController.handleGetOtp(MOCK_REQ, mockRes, jest.fn())

      expect(MockOtpUtils.generateOtpWithHash).toHaveBeenCalled()
      expect(MockVerificationService.sendNewOtp).toHaveBeenCalledWith(
        EXPECTED_PARAMS_FOR_SENDING_OTP,
      )
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND)
      expect(mockRes.json).toHaveBeenCalledWith({ message: expect.any(String) })
    })

    it('should return 500 when error occurs while hashing', async () => {
      MockOtpUtils.generateOtpWithHash.mockReturnValueOnce(
        errAsync(new HashingError()),
      )

      await VerificationController.handleGetOtp(MOCK_REQ, mockRes, jest.fn())

      expect(MockOtpUtils.generateOtpWithHash).toHaveBeenCalled()
      expect(MockVerificationService.sendNewOtp).not.toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(
        StatusCodes.INTERNAL_SERVER_ERROR,
      )
      expect(mockRes.json).toHaveBeenCalledWith({ message: expect.any(String) })
    })

    it('should return 422 when OTP waiting time has not elapsed', async () => {
      MockVerificationService.sendNewOtp.mockReturnValueOnce(
        errAsync(new WaitForOtpError()),
      )

      await VerificationController.handleGetOtp(MOCK_REQ, mockRes, jest.fn())

      expect(MockOtpUtils.generateOtpWithHash).toHaveBeenCalled()
      expect(MockVerificationService.sendNewOtp).toHaveBeenCalledWith(
        EXPECTED_PARAMS_FOR_SENDING_OTP,
      )
      expect(mockRes.status).toHaveBeenCalledWith(
        StatusCodes.UNPROCESSABLE_ENTITY,
      )
      expect(mockRes.json).toHaveBeenCalledWith({ message: expect.any(String) })
    })

    it('should return 400 when form SMS parameters are malformed', async () => {
      MockVerificationService.sendNewOtp.mockReturnValueOnce(
        errAsync(new MalformedParametersError('')),
      )

      await VerificationController.handleGetOtp(MOCK_REQ, mockRes, jest.fn())

      expect(MockOtpUtils.generateOtpWithHash).toHaveBeenCalled()
      expect(MockVerificationService.sendNewOtp).toHaveBeenCalledWith(
        EXPECTED_PARAMS_FOR_SENDING_OTP,
      )
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
      expect(mockRes.json).toHaveBeenCalledWith({ message: expect.any(String) })
    })

    it('should return 400 when SMS sending errors', async () => {
      MockVerificationService.sendNewOtp.mockReturnValueOnce(
        errAsync(new SmsSendError()),
      )

      await VerificationController.handleGetOtp(MOCK_REQ, mockRes, jest.fn())

      expect(MockOtpUtils.generateOtpWithHash).toHaveBeenCalled()
      expect(MockVerificationService.sendNewOtp).toHaveBeenCalledWith(
        EXPECTED_PARAMS_FOR_SENDING_OTP,
      )
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
      expect(mockRes.json).toHaveBeenCalledWith({ message: expect.any(String) })
    })

    it('should return 400 when phone number is invalid', async () => {
      MockVerificationService.sendNewOtp.mockReturnValueOnce(
        errAsync(new InvalidNumberError()),
      )

      await VerificationController.handleGetOtp(MOCK_REQ, mockRes, jest.fn())

      expect(MockOtpUtils.generateOtpWithHash).toHaveBeenCalled()
      expect(MockVerificationService.sendNewOtp).toHaveBeenCalledWith(
        EXPECTED_PARAMS_FOR_SENDING_OTP,
      )
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
      expect(mockRes.json).toHaveBeenCalledWith({ message: expect.any(String) })
    })

    it('should return 400 when email sending errors', async () => {
      MockVerificationService.sendNewOtp.mockReturnValueOnce(
        errAsync(new MailSendError()),
      )

      await VerificationController.handleGetOtp(MOCK_REQ, mockRes, jest.fn())

      expect(MockOtpUtils.generateOtpWithHash).toHaveBeenCalled()
      expect(MockVerificationService.sendNewOtp).toHaveBeenCalledWith(
        EXPECTED_PARAMS_FOR_SENDING_OTP,
      )
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
      expect(mockRes.json).toHaveBeenCalledWith({ message: expect.any(String) })
    })

    it('should return 400 when field type is not verifiable', async () => {
      MockVerificationService.sendNewOtp.mockReturnValueOnce(
        errAsync(new NonVerifiedFieldTypeError('')),
      )

      await VerificationController.handleGetOtp(MOCK_REQ, mockRes, jest.fn())

      expect(MockOtpUtils.generateOtpWithHash).toHaveBeenCalled()
      expect(MockVerificationService.sendNewOtp).toHaveBeenCalledWith(
        EXPECTED_PARAMS_FOR_SENDING_OTP,
      )
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
      expect(mockRes.json).toHaveBeenCalledWith({ message: expect.any(String) })
    })

    it('should return 500 when database error occurs', async () => {
      MockVerificationService.sendNewOtp.mockReturnValueOnce(
        errAsync(new DatabaseError()),
      )

      await VerificationController.handleGetOtp(MOCK_REQ, mockRes, jest.fn())

      expect(MockOtpUtils.generateOtpWithHash).toHaveBeenCalled()
      expect(MockVerificationService.sendNewOtp).toHaveBeenCalledWith(
        EXPECTED_PARAMS_FOR_SENDING_OTP,
      )
      expect(mockRes.status).toHaveBeenCalledWith(
        StatusCodes.INTERNAL_SERVER_ERROR,
      )
      expect(mockRes.json).toHaveBeenCalledWith({ message: expect.any(String) })
    })
  })

  describe('_handleGenerateOtp', () => {
    const MOCK_REQ = expressHandler.mockRequest({
      body: { answer: MOCK_ANSWER },
      params: {
        formId: MOCK_FORM_ID,
        transactionId: MOCK_TRANSACTION_ID,
        fieldId: MOCK_FIELD_ID,
      },
    })
    const MOCK_FORM = {
      admin: {
        _id: new ObjectId(),
      },
      title: 'i am a form',
      _id: new ObjectId(),
      permissionList: [{ email: 'former@forms.sg' }],
    } as IPopulatedForm

    const MOCK_SP_FORM = {
      ...MOCK_FORM,
      authType: FormAuthType.SP,
    } as IPopulatedForm
    const MOCK_CP_FORM = {
      ...MOCK_FORM,
      authType: FormAuthType.CP,
    } as IPopulatedForm
    const MOCK_SGID_FORM = {
      ...MOCK_FORM,
      authType: FormAuthType.SGID,
    } as IPopulatedForm
    const MOCK_MYINFO_FORM = {
      ...MOCK_FORM,
      authType: FormAuthType.MyInfo,
    } as IPopulatedForm

    beforeEach(async () => {
      MockFormService.retrieveFullFormById.mockReturnValue(okAsync(MOCK_FORM))

      MockOtpUtils.generateOtpWithHash.mockReturnValue(
        okAsync({
          otp: MOCK_OTP,
          hashedOtp: MOCK_HASHED_OTP,
        }),
      )
      MockVerificationService.sendNewOtp.mockReturnValue(
        okAsync(mockTransaction),
      )
      MockVerificationService.shouldGenerateMobileOtp.mockReturnValue(
        okAsync(true),
      )
    })

    it('should return 201 when params are valid and form has no SPCP/MyInfo authentication required', async () => {
      // Arrange
      MockVerificationService.disableVerifiedFieldsIfRequired.mockReturnValueOnce(
        okAsync(true),
      )

      // Act
      await VerificationController._handleGenerateOtp(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
        MOCK_FORM_ID,
      )
      expect(mockSpOidcServiceClass.extractJwt).not.toHaveBeenCalled()
      expect(mockCpOidcServiceClass.extractJwt).not.toHaveBeenCalled()
      expect(mockSpOidcServiceClass.extractJwtPayload).not.toHaveBeenCalled()
      expect(mockCpOidcServiceClass.extractJwtPayload).not.toHaveBeenCalled()

      expect(MockSgidService.extractSgidJwtPayload).not.toHaveBeenCalled()
      expect(MockMyInfoUtil.extractMyInfoLoginJwt).not.toHaveBeenCalled()
      expect(MockMyInfoService.verifyLoginJwt).not.toHaveBeenCalled()
      expect(MockOtpUtils.generateOtpWithHash).toHaveBeenCalled()
      expect(MockVerificationService.sendNewOtp).toHaveBeenCalledWith(
        EXPECTED_PARAMS_FOR_SENDING_OTP,
      )
      expect(
        MockVerificationService.disableVerifiedFieldsIfRequired,
      ).toHaveBeenCalledWith(
        MOCK_FORM,
        mockTransaction,
        MOCK_REQ.params.fieldId,
      )
      expect(mockRes.sendStatus).toHaveBeenCalledWith(StatusCodes.CREATED)
    })

    it('should return 201 when Singpass authentication is enabled and jwt token is valid', async () => {
      // Arrange
      const MOCK_SP_SESSION = {
        userName: MOCK_JWT_PAYLOAD.userName,
        exp: 1000000000,
        iat: 100000000,
        rememberMe: false,
      }

      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        okAsync(MOCK_SP_FORM),
      )

      mockSpOidcServiceClass.extractJwt.mockReturnValueOnce(ok(MOCK_JWT))
      mockSpOidcServiceClass.extractJwtPayload.mockReturnValueOnce(
        okAsync(MOCK_SP_SESSION),
      )
      MockVerificationService.disableVerifiedFieldsIfRequired.mockReturnValueOnce(
        okAsync(true),
      )

      // Act
      await VerificationController._handleGenerateOtp(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
        MOCK_FORM_ID,
      )
      expect(mockSpOidcServiceClass.extractJwt).toHaveBeenCalledWith(
        MOCK_REQ.cookies,
      )
      expect(mockSpOidcServiceClass.extractJwtPayload).toHaveBeenCalledWith(
        MOCK_JWT,
      )
      expect(MockOtpUtils.generateOtpWithHash).toHaveBeenCalled()
      expect(MockVerificationService.sendNewOtp).toHaveBeenCalledWith(
        EXPECTED_PARAMS_FOR_SENDING_OTP,
      )
      expect(
        MockVerificationService.disableVerifiedFieldsIfRequired,
      ).toHaveBeenCalledWith(
        MOCK_SP_FORM,
        mockTransaction,
        MOCK_REQ.params.fieldId,
      )
      expect(mockRes.sendStatus).toHaveBeenCalledWith(StatusCodes.CREATED)
    })

    it('should return 201 when Corpass authentication is enabled and jwt token is valid', async () => {
      // Arrange
      const MOCK_CP_SESSION = {
        userName: MOCK_JWT_PAYLOAD.userName,
        userInfo: MOCK_JWT_PAYLOAD.userInfo,
        exp: 1000000000,
        iat: 100000000,
        rememberMe: false,
      }

      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        okAsync(MOCK_CP_FORM),
      )
      MockVerificationService.disableVerifiedFieldsIfRequired.mockReturnValueOnce(
        okAsync(true),
      )

      mockCpOidcServiceClass.extractJwt.mockReturnValueOnce(ok(MOCK_JWT))
      mockCpOidcServiceClass.extractJwtPayload.mockReturnValueOnce(
        okAsync(MOCK_CP_SESSION),
      )

      // Act
      await VerificationController._handleGenerateOtp(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
        MOCK_FORM_ID,
      )
      expect(mockCpOidcServiceClass.extractJwt).toHaveBeenCalledWith(
        MOCK_REQ.cookies,
      )
      expect(mockCpOidcServiceClass.extractJwtPayload).toHaveBeenCalledWith(
        MOCK_JWT,
      )
      expect(MockOtpUtils.generateOtpWithHash).toHaveBeenCalled()
      expect(MockVerificationService.sendNewOtp).toHaveBeenCalledWith(
        EXPECTED_PARAMS_FOR_SENDING_OTP,
      )
      expect(
        MockVerificationService.disableVerifiedFieldsIfRequired,
      ).toHaveBeenCalledWith(
        MOCK_CP_FORM,
        mockTransaction,
        MOCK_REQ.params.fieldId,
      )
      expect(mockRes.sendStatus).toHaveBeenCalledWith(StatusCodes.CREATED)
    })

    it('should return 201 when SGID authentication is enabled and sgid jwt token is valid', async () => {
      // Arrange
      const MOCK_VALID_SGID_PAYLOAD = { userName: MOCK_JWT_PAYLOAD.userName }
      const MOCK_SGID_REQ = expressHandler.mockRequest({
        body: { answer: MOCK_ANSWER },
        params: {
          formId: MOCK_FORM_ID,
          transactionId: MOCK_TRANSACTION_ID,
          fieldId: MOCK_FIELD_ID,
        },
      })
      MOCK_SGID_REQ.cookies = { jwtSgid: {} }

      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        okAsync(MOCK_SGID_FORM),
      )
      MockVerificationService.disableVerifiedFieldsIfRequired.mockReturnValueOnce(
        okAsync(true),
      )
      MockSgidService.extractSgidJwtPayload.mockReturnValueOnce(
        ok(MOCK_VALID_SGID_PAYLOAD),
      )

      // Act
      await VerificationController._handleGenerateOtp(
        MOCK_SGID_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
        MOCK_FORM_ID,
      )
      expect(MockSgidService.extractSgidJwtPayload).toHaveBeenCalledWith(
        MOCK_SGID_REQ.cookies.jwtSgid,
      )
      expect(MockOtpUtils.generateOtpWithHash).toHaveBeenCalled()
      expect(MockVerificationService.sendNewOtp).toHaveBeenCalledWith(
        EXPECTED_PARAMS_FOR_SENDING_OTP,
      )
      expect(
        MockVerificationService.disableVerifiedFieldsIfRequired,
      ).toHaveBeenCalledWith(
        MOCK_SGID_FORM,
        mockTransaction,
        MOCK_REQ.params.fieldId,
      )
      expect(mockRes.sendStatus).toHaveBeenCalledWith(StatusCodes.CREATED)
    })

    it('should return 201 when MyInfo authentication is enabled and MyInfo cookie is valid', async () => {
      // Arrange
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        okAsync(MOCK_MYINFO_FORM),
      )
      MockMyInfoUtil.extractMyInfoLoginJwt.mockReturnValueOnce(
        ok(MOCK_MYINFO_JWT),
      )
      MockMyInfoService.verifyLoginJwt.mockReturnValueOnce(
        ok(MOCK_MYINFO_LOGIN_COOKIE),
      )
      MockVerificationService.disableVerifiedFieldsIfRequired.mockReturnValueOnce(
        okAsync(true),
      )

      // Act
      await VerificationController._handleGenerateOtp(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
        MOCK_FORM_ID,
      )
      expect(MockMyInfoUtil.extractMyInfoLoginJwt).toHaveBeenCalledWith(
        MOCK_REQ.cookies,
      )
      expect(MockMyInfoService.verifyLoginJwt).toHaveBeenCalledWith(
        MOCK_MYINFO_JWT,
      )
      expect(MockOtpUtils.generateOtpWithHash).toHaveBeenCalled()
      expect(MockVerificationService.sendNewOtp).toHaveBeenCalledWith(
        EXPECTED_PARAMS_FOR_SENDING_OTP,
      )
      expect(
        MockVerificationService.disableVerifiedFieldsIfRequired,
      ).toHaveBeenCalledWith(
        MOCK_MYINFO_FORM,
        mockTransaction,
        MOCK_REQ.params.fieldId,
      )
      expect(mockRes.sendStatus).toHaveBeenCalledWith(StatusCodes.CREATED)
    })

    it('should return 400 when form SMS parameters are malformed', async () => {
      // Arrange
      MockVerificationService.sendNewOtp.mockReturnValueOnce(
        errAsync(new MalformedParametersError('')),
      )
      const expectedResponse = {
        message: 'Sorry, something went wrong. Please refresh and try again.',
      }

      // Act
      await VerificationController._handleGenerateOtp(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
        MOCK_FORM_ID,
      )
      expect(MockOtpUtils.generateOtpWithHash).toHaveBeenCalled()
      expect(MockVerificationService.sendNewOtp).toHaveBeenCalledWith(
        EXPECTED_PARAMS_FOR_SENDING_OTP,
      )
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
      expect(mockRes.json).toHaveBeenCalledWith(expectedResponse)
    })

    it('should return 400 when transaction has expired', async () => {
      // Arrange
      MockVerificationService.sendNewOtp.mockReturnValueOnce(
        errAsync(new TransactionExpiredError("don't eat expired food")),
      )
      const expectedResponse = {
        message: 'Your session has expired, please refresh and try again.',
      }

      // Act
      await VerificationController._handleGenerateOtp(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
        MOCK_FORM_ID,
      )
      expect(MockOtpUtils.generateOtpWithHash).toHaveBeenCalled()
      expect(MockVerificationService.sendNewOtp).toHaveBeenCalledWith(
        EXPECTED_PARAMS_FOR_SENDING_OTP,
      )
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
      expect(mockRes.json).toHaveBeenCalledWith(expectedResponse)
    })

    it('should return 400 when SMS sending errors', async () => {
      // Arrange
      MockVerificationService.sendNewOtp.mockReturnValueOnce(
        errAsync(new SmsSendError()),
      )
      const expectedResponse = {
        message: 'Sorry, something went wrong. Please refresh and try again.',
      }

      // Act
      await VerificationController._handleGenerateOtp(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
        MOCK_FORM_ID,
      )
      expect(MockOtpUtils.generateOtpWithHash).toHaveBeenCalled()
      expect(MockVerificationService.sendNewOtp).toHaveBeenCalledWith(
        EXPECTED_PARAMS_FOR_SENDING_OTP,
      )
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
      expect(mockRes.json).toHaveBeenCalledWith(expectedResponse)
    })

    it('should return 400 when email sending errors', async () => {
      // Arrange
      MockVerificationService.sendNewOtp.mockReturnValueOnce(
        errAsync(new MailSendError()),
      )
      const expectedResponse = {
        message:
          'Sorry, we were unable to send the email out at this time. Please ensure that the email entered is correct. If this problem persists, please refresh and try again later.',
      }

      // Act
      await VerificationController._handleGenerateOtp(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
        MOCK_FORM_ID,
      )
      expect(MockOtpUtils.generateOtpWithHash).toHaveBeenCalled()
      expect(MockVerificationService.sendNewOtp).toHaveBeenCalledWith(
        EXPECTED_PARAMS_FOR_SENDING_OTP,
      )
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
      expect(mockRes.json).toHaveBeenCalledWith(expectedResponse)
    })

    it('should return 400 when phone number is invalid', async () => {
      // Arrange
      MockVerificationService.sendNewOtp.mockReturnValueOnce(
        errAsync(new InvalidNumberError()),
      )
      const expectedResponse = {
        message:
          'This phone number does not seem to be valid. Please try again with a valid phone number.',
      }

      // Act
      await VerificationController._handleGenerateOtp(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
        MOCK_FORM_ID,
      )
      expect(MockOtpUtils.generateOtpWithHash).toHaveBeenCalled()
      expect(MockVerificationService.sendNewOtp).toHaveBeenCalledWith(
        EXPECTED_PARAMS_FOR_SENDING_OTP,
      )
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
      expect(mockRes.json).toHaveBeenCalledWith(expectedResponse)
    })

    it('should return 400 when sms limit has been exceeded and the form is not onboarded', async () => {
      // Arrange
      MockVerificationService.sendNewOtp.mockReturnValueOnce(
        errAsync(new SmsLimitExceededError()),
      )
      const expected = {
        message:
          'Sorry, this form is outdated. Please refresh your browser to get the latest version of the form',
      }

      // Act
      await VerificationController._handleGenerateOtp(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith(expected)
    })

    it('should return 400 when field type is not verifiable', async () => {
      // Arrange
      MockVerificationService.sendNewOtp.mockReturnValueOnce(
        errAsync(new NonVerifiedFieldTypeError('')),
      )
      const expectedResponse = {
        message: 'Sorry, something went wrong. Please refresh and try again.',
      }

      // Act
      await VerificationController._handleGenerateOtp(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
        MOCK_FORM_ID,
      )
      expect(MockOtpUtils.generateOtpWithHash).toHaveBeenCalled()
      expect(MockVerificationService.sendNewOtp).toHaveBeenCalledWith(
        EXPECTED_PARAMS_FOR_SENDING_OTP,
      )
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
      expect(mockRes.json).toHaveBeenCalledWith(expectedResponse)
    })

    it('should return 400 when Singpass authentication is enabled but jwt token is missing in session', async () => {
      // Arrange
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        okAsync(MOCK_SP_FORM),
      )

      mockSpOidcServiceClass.extractJwt.mockReturnValueOnce(
        err(new MissingJwtError()),
      )
      const expectedResponse = {
        message: 'Sorry, something went wrong. Please refresh and try again.',
      }

      // Act
      await VerificationController._handleGenerateOtp(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
        MOCK_FORM_ID,
      )
      expect(mockSpOidcServiceClass.extractJwt).toHaveBeenCalledWith(
        MOCK_REQ.cookies,
      )
      expect(mockSpOidcServiceClass.extractJwtPayload).not.toHaveBeenCalled()
      expect(MockOtpUtils.generateOtpWithHash).not.toHaveBeenCalled()
      expect(MockVerificationService.sendNewOtp).not.toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
      expect(mockRes.json).toHaveBeenCalledWith(expectedResponse)
    })

    it('should return 400 when Singpass authentication is enabled but jwt token is invalid', async () => {
      // Arrange
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        okAsync(MOCK_SP_FORM),
      )

      mockSpOidcServiceClass.extractJwt.mockReturnValueOnce(ok(MOCK_JWT))
      mockSpOidcServiceClass.extractJwtPayload.mockReturnValueOnce(
        errAsync(new InvalidJwtError()),
      )
      const expectedResponse = {
        message: 'Sorry, something went wrong. Please refresh and try again.',
      }

      // Act
      await VerificationController._handleGenerateOtp(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
        MOCK_FORM_ID,
      )
      expect(mockSpOidcServiceClass.extractJwt).toHaveBeenCalledWith(
        MOCK_REQ.cookies,
      )
      expect(mockSpOidcServiceClass.extractJwtPayload).toHaveBeenCalledWith(
        MOCK_JWT,
      )
      expect(MockOtpUtils.generateOtpWithHash).not.toHaveBeenCalled()
      expect(MockVerificationService.sendNewOtp).not.toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
      expect(mockRes.json).toHaveBeenCalledWith(expectedResponse)
    })

    it('should return 400 when Corpass authentication is enabled but jwt token is missing in session', async () => {
      // Arrange
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        okAsync(MOCK_CP_FORM),
      )

      mockCpOidcServiceClass.extractJwt.mockReturnValueOnce(
        err(new MissingJwtError()),
      )
      const expectedResponse = {
        message: 'Sorry, something went wrong. Please refresh and try again.',
      }

      // Act
      await VerificationController._handleGenerateOtp(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
        MOCK_FORM_ID,
      )
      expect(mockCpOidcServiceClass.extractJwt).toHaveBeenCalledWith(
        MOCK_REQ.cookies,
      )
      expect(MockOtpUtils.generateOtpWithHash).not.toHaveBeenCalled()
      expect(MockVerificationService.sendNewOtp).not.toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
      expect(mockRes.json).toHaveBeenCalledWith(expectedResponse)
    })

    it('should return 400 when Corpass authentication is enabled but jwt token is invalid', async () => {
      // Arrange
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        okAsync(MOCK_CP_FORM),
      )

      mockCpOidcServiceClass.extractJwt.mockReturnValueOnce(ok(MOCK_JWT))
      mockCpOidcServiceClass.extractJwtPayload.mockReturnValueOnce(
        errAsync(new InvalidJwtError()),
      )
      const expectedResponse = {
        message: 'Sorry, something went wrong. Please refresh and try again.',
      }

      // Act
      await VerificationController._handleGenerateOtp(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
        MOCK_FORM_ID,
      )
      expect(mockCpOidcServiceClass.extractJwt).toHaveBeenCalledWith(
        MOCK_REQ.cookies,
      )
      expect(mockCpOidcServiceClass.extractJwtPayload).toHaveBeenCalledWith(
        MOCK_JWT,
      )
      expect(MockOtpUtils.generateOtpWithHash).not.toHaveBeenCalled()
      expect(MockVerificationService.sendNewOtp).not.toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
      expect(mockRes.json).toHaveBeenCalledWith(expectedResponse)
    })

    it('should return 400 when SGID authentication is enabled but jwt token is missing in session', async () => {
      // Arrange
      const MOCK_SGID_REQ = expressHandler.mockRequest({
        body: { answer: MOCK_ANSWER },
        params: {
          formId: MOCK_FORM_ID,
          transactionId: MOCK_TRANSACTION_ID,
          fieldId: MOCK_FIELD_ID,
        },
      })
      MOCK_SGID_REQ.cookies = {}
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        okAsync(MOCK_SGID_FORM),
      )
      MockSgidService.extractSgidJwtPayload.mockReturnValueOnce(
        err(new SgidMissingJwtError()),
      )
      const expectedResponse = {
        message: 'Sorry, something went wrong. Please refresh and try again.',
      }

      // Act
      await VerificationController._handleGenerateOtp(
        MOCK_SGID_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
        MOCK_FORM_ID,
      )
      expect(MockSgidService.extractSgidJwtPayload).toHaveBeenCalledWith(
        MOCK_SGID_REQ.cookies.jwtSgid,
      )
      expect(MockOtpUtils.generateOtpWithHash).not.toHaveBeenCalled()
      expect(MockVerificationService.sendNewOtp).not.toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
      expect(mockRes.json).toHaveBeenCalledWith(expectedResponse)
    })

    it('should return 400 when SGID authentication is enabled but jwt token is invalid', async () => {
      // Arrange
      const MOCK_SGID_REQ = expressHandler.mockRequest({
        body: { answer: MOCK_ANSWER },
        params: {
          formId: MOCK_FORM_ID,
          transactionId: MOCK_TRANSACTION_ID,
          fieldId: MOCK_FIELD_ID,
        },
      })
      MOCK_SGID_REQ.cookies = {}
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        okAsync(MOCK_SGID_FORM),
      )
      MockSgidService.extractSgidJwtPayload.mockReturnValueOnce(
        err(new SgidInvalidJwtError()),
      )
      const expectedResponse = {
        message: 'Sorry, something went wrong. Please refresh and try again.',
      }

      // Act
      await VerificationController._handleGenerateOtp(
        MOCK_SGID_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
        MOCK_FORM_ID,
      )
      expect(MockSgidService.extractSgidJwtPayload).toHaveBeenCalledWith(
        MOCK_SGID_REQ.cookies.jwt,
      )
      expect(MockOtpUtils.generateOtpWithHash).not.toHaveBeenCalled()
      expect(MockVerificationService.sendNewOtp).not.toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
      expect(mockRes.json).toHaveBeenCalledWith(expectedResponse)
    })

    it('should return 400 when MyInfo authentication is enabled but MyInfo cookie is missing in session', async () => {
      // Arrange
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        okAsync(MOCK_MYINFO_FORM),
      )
      MockMyInfoUtil.extractMyInfoLoginJwt.mockReturnValueOnce(
        err(new MyInfoMissingLoginCookieError()),
      )
      const expectedResponse = {
        message: 'Sorry, something went wrong. Please refresh and try again.',
      }

      // Act
      await VerificationController._handleGenerateOtp(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
        MOCK_FORM_ID,
      )
      expect(MockMyInfoUtil.extractMyInfoLoginJwt).toHaveBeenCalledWith(
        MOCK_REQ.cookies,
      )
      expect(MockMyInfoService.verifyLoginJwt).not.toHaveBeenCalled()
      expect(MockOtpUtils.generateOtpWithHash).not.toHaveBeenCalled()
      expect(MockVerificationService.sendNewOtp).not.toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
      expect(mockRes.json).toHaveBeenCalledWith(expectedResponse)
    })

    it('should return 400 when MyInfo authentication is enabled but MyInfo cookie is malformed', async () => {
      // Arrange
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        okAsync(MOCK_MYINFO_FORM),
      )
      MockMyInfoUtil.extractMyInfoLoginJwt.mockReturnValueOnce(
        ok(MOCK_MYINFO_JWT),
      )
      MockMyInfoService.verifyLoginJwt.mockReturnValueOnce(
        err(new MyInfoInvalidLoginCookieError()),
      )
      const expectedResponse = {
        message: 'Sorry, something went wrong. Please refresh and try again.',
      }

      // Act
      await VerificationController._handleGenerateOtp(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
        MOCK_FORM_ID,
      )
      expect(MockMyInfoUtil.extractMyInfoLoginJwt).toHaveBeenCalledWith(
        MOCK_REQ.cookies,
      )
      expect(MockMyInfoService.verifyLoginJwt).toHaveBeenCalledWith(
        MOCK_MYINFO_JWT,
      )
      expect(MockOtpUtils.generateOtpWithHash).not.toHaveBeenCalled()
      expect(MockVerificationService.sendNewOtp).not.toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
      expect(mockRes.json).toHaveBeenCalledWith(expectedResponse)
    })

    it('should return 404 when form is not found', async () => {
      // Arrange
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        errAsync(new FormNotFoundError()),
      )
      const expectedResponse = {
        message: 'Sorry, something went wrong. Please refresh and try again.',
      }

      // Act
      await VerificationController._handleGenerateOtp(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
        MOCK_FORM_ID,
      )
      expect(MockOtpUtils.generateOtpWithHash).not.toHaveBeenCalled()
      expect(MockVerificationService.sendNewOtp).not.toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND)
      expect(mockRes.json).toHaveBeenCalledWith(expectedResponse)
    })

    it('should return 404 when transaction is not found', async () => {
      // Arrange
      MockVerificationService.sendNewOtp.mockReturnValueOnce(
        errAsync(new TransactionNotFoundError('wad')),
      )
      const expectedResponse = {
        message: 'Sorry, something went wrong. Please refresh and try again.',
      }

      // Act
      await VerificationController._handleGenerateOtp(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
        MOCK_FORM_ID,
      )
      expect(MockOtpUtils.generateOtpWithHash).toHaveBeenCalled()
      expect(MockVerificationService.sendNewOtp).toHaveBeenCalledWith(
        EXPECTED_PARAMS_FOR_SENDING_OTP,
      )
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND)
      expect(mockRes.json).toHaveBeenCalledWith(expectedResponse)
    })

    it('should return 404 when field ID is not found', async () => {
      // Arrange
      MockVerificationService.sendNewOtp.mockReturnValueOnce(
        errAsync(new FieldNotFoundInTransactionError()),
      )
      const expectedResponse = {
        message: 'Sorry, something went wrong. Please refresh and try again.',
      }

      // Act
      await VerificationController._handleGenerateOtp(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
        MOCK_FORM_ID,
      )
      expect(MockOtpUtils.generateOtpWithHash).toHaveBeenCalled()
      expect(MockVerificationService.sendNewOtp).toHaveBeenCalledWith(
        EXPECTED_PARAMS_FOR_SENDING_OTP,
      )
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND)
      expect(mockRes.json).toHaveBeenCalledWith(expectedResponse)
    })

    it('should return 422 when OTP waiting time has not elapsed', async () => {
      // Arrange
      MockVerificationService.sendNewOtp.mockReturnValueOnce(
        errAsync(new WaitForOtpError()),
      )
      const expectedResponse = {
        message: `You must wait for ${WAIT_FOR_OTP_SECONDS} seconds between each OTP request.`,
      }

      // Act
      await VerificationController._handleGenerateOtp(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
        MOCK_FORM_ID,
      )
      expect(MockOtpUtils.generateOtpWithHash).toHaveBeenCalled()
      expect(MockVerificationService.sendNewOtp).toHaveBeenCalledWith(
        EXPECTED_PARAMS_FOR_SENDING_OTP,
      )
      expect(mockRes.status).toHaveBeenCalledWith(
        StatusCodes.UNPROCESSABLE_ENTITY,
      )
      expect(mockRes.json).toHaveBeenCalledWith(expectedResponse)
    })

    it('should return 500 when error occurs while hashing', async () => {
      // Arrange
      MockOtpUtils.generateOtpWithHash.mockReturnValueOnce(
        errAsync(new HashingError()),
      )

      // Act
      await VerificationController._handleGenerateOtp(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
        MOCK_FORM_ID,
      )
      expect(MockOtpUtils.generateOtpWithHash).toHaveBeenCalled()
      expect(MockVerificationService.sendNewOtp).not.toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(
        StatusCodes.INTERNAL_SERVER_ERROR,
      )
      expect(mockRes.json).toHaveBeenCalledWith({ message: expect.any(String) })
    })

    it('should return 500 when database error occurs', async () => {
      // Arrange
      MockVerificationService.sendNewOtp.mockReturnValueOnce(
        errAsync(new DatabaseError()),
      )
      const expectedResponse = {
        message: 'Sorry, something went wrong. Please refresh and try again.',
      }

      // Act
      await VerificationController._handleGenerateOtp(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
        MOCK_FORM_ID,
      )
      expect(MockOtpUtils.generateOtpWithHash).toHaveBeenCalled()
      expect(MockVerificationService.sendNewOtp).toHaveBeenCalledWith(
        EXPECTED_PARAMS_FOR_SENDING_OTP,
      )
      expect(mockRes.status).toHaveBeenCalledWith(
        StatusCodes.INTERNAL_SERVER_ERROR,
      )
      expect(mockRes.json).toHaveBeenCalledWith(expectedResponse)
    })
  })

  describe('handleVerifyOtp', () => {
    let mockReq: Request<
      { transactionId: string },
      string | { message: string },
      { otp: string; fieldId: string }
    >
    let verifyOtpTransaction: IVerificationSchema
    let verifyOtpTransactionId: string
    let otpFieldId: string

    beforeEach(async () => {
      MockVerificationService.verifyOtp.mockReturnValue(
        okAsync(MOCK_SIGNED_DATA),
      )
      verifyOtpTransaction = await VerificationModel.create({
        formId: new ObjectId().toHexString(),
        fields: [
          generateFieldParams({
            signedData: MOCK_SIGNED_DATA,
            hashRetries: 0,
            hashedOtp: MOCK_HASHED_OTP,
            hashCreatedAt: new Date(),
          }),
        ],
      })
      verifyOtpTransactionId = verifyOtpTransaction._id
      otpFieldId = verifyOtpTransaction.fields[0]._id!
      mockReq = expressHandler.mockRequest({
        body: { fieldId: otpFieldId, otp: MOCK_OTP },
        params: { transactionId: verifyOtpTransactionId },
      })
    })

    it('should call service correctly when params are valid', async () => {
      await VerificationController.handleVerifyOtp(mockReq, mockRes, jest.fn())

      expect(MockVerificationService.verifyOtp).toHaveBeenCalledWith(
        verifyOtpTransactionId,
        otpFieldId,
        MOCK_OTP,
      )
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.OK)
      expect(mockRes.json).toHaveBeenCalledWith(MOCK_SIGNED_DATA)
    })

    it('should return 404 when transaction is not found', async () => {
      MockVerificationService.verifyOtp.mockReturnValueOnce(
        errAsync(new TransactionNotFoundError()),
      )

      await VerificationController.handleVerifyOtp(mockReq, mockRes, jest.fn())

      expect(MockVerificationService.verifyOtp).toHaveBeenCalledWith(
        verifyOtpTransactionId,
        otpFieldId,
        MOCK_OTP,
      )
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND)
      expect(mockRes.json).toHaveBeenCalledWith({ message: expect.any(String) })
    })

    it('should return 400 when transaction is expired', async () => {
      MockVerificationService.verifyOtp.mockReturnValueOnce(
        errAsync(new TransactionExpiredError()),
      )

      await VerificationController.handleVerifyOtp(mockReq, mockRes, jest.fn())

      expect(MockVerificationService.verifyOtp).toHaveBeenCalledWith(
        verifyOtpTransactionId,
        otpFieldId,
        MOCK_OTP,
      )
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
      expect(mockRes.json).toHaveBeenCalledWith({ message: expect.any(String) })
    })

    it('should return 404 when field is not found in transaction', async () => {
      MockVerificationService.verifyOtp.mockReturnValueOnce(
        errAsync(new FieldNotFoundInTransactionError()),
      )

      await VerificationController.handleVerifyOtp(mockReq, mockRes, jest.fn())

      expect(MockVerificationService.verifyOtp).toHaveBeenCalledWith(
        verifyOtpTransactionId,
        otpFieldId,
        MOCK_OTP,
      )
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND)
      expect(mockRes.json).toHaveBeenCalledWith({ message: expect.any(String) })
    })

    it('should return 400 when hash data is not found', async () => {
      MockVerificationService.verifyOtp.mockReturnValueOnce(
        errAsync(new MissingHashDataError()),
      )

      await VerificationController.handleVerifyOtp(mockReq, mockRes, jest.fn())

      expect(MockVerificationService.verifyOtp).toHaveBeenCalledWith(
        verifyOtpTransactionId,
        otpFieldId,
        MOCK_OTP,
      )
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
      expect(mockRes.json).toHaveBeenCalledWith({ message: expect.any(String) })
    })

    it('should return 422 when OTP is expired', async () => {
      MockVerificationService.verifyOtp.mockReturnValueOnce(
        errAsync(new OtpExpiredError()),
      )

      await VerificationController.handleVerifyOtp(mockReq, mockRes, jest.fn())

      expect(MockVerificationService.verifyOtp).toHaveBeenCalledWith(
        verifyOtpTransactionId,
        otpFieldId,
        MOCK_OTP,
      )
      expect(mockRes.status).toHaveBeenCalledWith(
        StatusCodes.UNPROCESSABLE_ENTITY,
      )
      expect(mockRes.json).toHaveBeenCalledWith({ message: expect.any(String) })
    })

    it('should return 422 when OTP max retries are exceeded', async () => {
      MockVerificationService.verifyOtp.mockReturnValueOnce(
        errAsync(new OtpRetryExceededError()),
      )

      await VerificationController.handleVerifyOtp(mockReq, mockRes, jest.fn())

      expect(MockVerificationService.verifyOtp).toHaveBeenCalledWith(
        verifyOtpTransactionId,
        otpFieldId,
        MOCK_OTP,
      )
      expect(mockRes.status).toHaveBeenCalledWith(
        StatusCodes.UNPROCESSABLE_ENTITY,
      )
      expect(mockRes.json).toHaveBeenCalledWith({ message: expect.any(String) })
    })

    it('should return 422 when OTP is wrong', async () => {
      MockVerificationService.verifyOtp.mockReturnValueOnce(
        errAsync(new WrongOtpError()),
      )

      await VerificationController.handleVerifyOtp(mockReq, mockRes, jest.fn())

      expect(MockVerificationService.verifyOtp).toHaveBeenCalledWith(
        verifyOtpTransactionId,
        otpFieldId,
        MOCK_OTP,
      )
      expect(mockRes.status).toHaveBeenCalledWith(
        StatusCodes.UNPROCESSABLE_ENTITY,
      )
      expect(mockRes.json).toHaveBeenCalledWith({ message: expect.any(String) })
    })

    it('should return 500 when error occurs while hashing OTP', async () => {
      MockVerificationService.verifyOtp.mockReturnValueOnce(
        errAsync(new HashingError()),
      )

      await VerificationController.handleVerifyOtp(mockReq, mockRes, jest.fn())

      expect(MockVerificationService.verifyOtp).toHaveBeenCalledWith(
        verifyOtpTransactionId,
        otpFieldId,
        MOCK_OTP,
      )
      expect(mockRes.status).toHaveBeenCalledWith(
        StatusCodes.INTERNAL_SERVER_ERROR,
      )
      expect(mockRes.json).toHaveBeenCalledWith({ message: expect.any(String) })
    })

    it('should return 500 when database error occurs', async () => {
      MockVerificationService.verifyOtp.mockReturnValueOnce(
        errAsync(new DatabaseError()),
      )

      await VerificationController.handleVerifyOtp(mockReq, mockRes, jest.fn())

      expect(MockVerificationService.verifyOtp).toHaveBeenCalledWith(
        verifyOtpTransactionId,
        otpFieldId,
        MOCK_OTP,
      )
      expect(mockRes.status).toHaveBeenCalledWith(
        StatusCodes.INTERNAL_SERVER_ERROR,
      )
      expect(mockRes.json).toHaveBeenCalledWith({ message: expect.any(String) })
    })
  })

  describe('handleResetFieldVerification', () => {
    const MOCK_REQ = expressHandler.mockRequest({
      params: {
        transactionId: MOCK_TRANSACTION_ID,
        fieldId: MOCK_FIELD_ID,
        formId: MOCK_FORM_ID,
      },
    })

    beforeEach(() =>
      MockFormService.retrieveFormById.mockReturnValue(
        okAsync({} as IFormSchema),
      ),
    )

    it('should correctly call service when params are valid', async () => {
      // Arrange
      MockVerificationService.resetFieldForTransaction.mockReturnValueOnce(
        okAsync(mockTransaction),
      )

      // Act
      await VerificationController.handleResetFieldVerification(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(MockFormService.retrieveFormById).toHaveBeenCalledWith(
        MOCK_FORM_ID,
      )
      expect(
        MockVerificationService.resetFieldForTransaction,
      ).toHaveBeenCalledWith(MOCK_TRANSACTION_ID, MOCK_FIELD_ID)
      expect(mockRes.sendStatus).toHaveBeenCalledWith(StatusCodes.NO_CONTENT)
    })

    it('should return 400 when transaction has expired', async () => {
      // Arrange
      MockVerificationService.resetFieldForTransaction.mockReturnValueOnce(
        errAsync(new TransactionExpiredError()),
      )

      // Act
      await VerificationController.handleResetFieldVerification(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(MockFormService.retrieveFormById).toHaveBeenCalledWith(
        MOCK_FORM_ID,
      )
      expect(
        MockVerificationService.resetFieldForTransaction,
      ).toHaveBeenCalledWith(MOCK_TRANSACTION_ID, MOCK_FIELD_ID)
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: expect.any(String),
      })
    })

    it('should return 404 when form is not found', async () => {
      // Arrange
      MockFormService.retrieveFormById.mockReturnValue(
        errAsync(new FormNotFoundError()),
      )

      // Act
      await VerificationController.handleResetFieldVerification(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(MockFormService.retrieveFormById).toHaveBeenCalledWith(
        MOCK_FORM_ID,
      )
      expect(
        MockVerificationService.resetFieldForTransaction,
      ).not.toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: expect.any(String),
      })
    })

    it('should return 404 when transaction is not found', async () => {
      // Arrange
      MockVerificationService.resetFieldForTransaction.mockReturnValueOnce(
        errAsync(new TransactionNotFoundError()),
      )

      // Act
      await VerificationController.handleResetFieldVerification(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(MockFormService.retrieveFormById).toHaveBeenCalledWith(
        MOCK_FORM_ID,
      )
      expect(
        MockVerificationService.resetFieldForTransaction,
      ).toHaveBeenCalledWith(MOCK_TRANSACTION_ID, MOCK_FIELD_ID)
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: expect.any(String),
      })
    })

    it('should return 404 when field is not found', async () => {
      // Arrange
      MockVerificationService.resetFieldForTransaction.mockReturnValueOnce(
        errAsync(new FieldNotFoundInTransactionError()),
      )

      // Act
      await VerificationController.handleResetFieldVerification(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(MockFormService.retrieveFormById).toHaveBeenCalledWith(
        MOCK_FORM_ID,
      )
      expect(
        MockVerificationService.resetFieldForTransaction,
      ).toHaveBeenCalledWith(MOCK_TRANSACTION_ID, MOCK_FIELD_ID)
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: expect.any(String),
      })
    })

    it('should return 500 when database error occurs', async () => {
      // Arrange
      MockVerificationService.resetFieldForTransaction.mockReturnValueOnce(
        errAsync(new DatabaseError()),
      )

      // Act
      await VerificationController.handleResetFieldVerification(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(
        MockVerificationService.resetFieldForTransaction,
      ).toHaveBeenCalledWith(MOCK_TRANSACTION_ID, MOCK_FIELD_ID)
      expect(mockRes.status).toHaveBeenCalledWith(
        StatusCodes.INTERNAL_SERVER_ERROR,
      )
      expect(mockRes.json).toHaveBeenCalledWith({
        message: expect.any(String),
      })
    })
  })

  describe('_handleOtpVerification', () => {
    const MOCK_REQ = expressHandler.mockRequest({
      params: {
        transactionId: MOCK_TRANSACTION_ID,
        fieldId: MOCK_FIELD_ID,
        formId: MOCK_FORM_ID,
      },
      body: {
        otp: MOCK_OTP,
      },
    })

    beforeEach(() =>
      MockFormService.retrieveFormById.mockReturnValue(
        okAsync({} as IFormSchema),
      ),
    )

    it('should correctly call service when params are valid', async () => {
      // Arrange
      MockVerificationService.verifyOtp.mockReturnValueOnce(
        okAsync(MOCK_SIGNED_DATA),
      )

      // Act
      await VerificationController._handleOtpVerification(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(MockFormService.retrieveFormById).toHaveBeenCalledWith(
        MOCK_FORM_ID,
      )
      expect(MockVerificationService.verifyOtp).toHaveBeenCalledWith(
        MOCK_TRANSACTION_ID,
        MOCK_FIELD_ID,
        MOCK_OTP,
      )
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.OK)
      expect(mockRes.json).toHaveBeenCalledWith(MOCK_SIGNED_DATA)
    })

    it('should return 400 when the transaction is expired', async () => {
      // Arrange
      MockVerificationService.verifyOtp.mockReturnValueOnce(
        errAsync(new TransactionExpiredError()),
      )
      const expectedResponse = {
        message: 'Your session has expired, please refresh and try again.',
      }

      // Act
      await VerificationController._handleOtpVerification(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(MockFormService.retrieveFormById).toHaveBeenCalledWith(
        MOCK_FORM_ID,
      )
      expect(MockVerificationService.verifyOtp).toHaveBeenCalledWith(
        MOCK_TRANSACTION_ID,
        MOCK_FIELD_ID,
        MOCK_OTP,
      )
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
      expect(mockRes.json).toHaveBeenCalledWith(expectedResponse)
    })

    it('should return 400 when the hash data could not be found', async () => {
      // Arrange
      MockVerificationService.verifyOtp.mockReturnValueOnce(
        errAsync(new MissingHashDataError()),
      )
      const expectedResponse = {
        message: 'Sorry, something went wrong. Please refresh and try again.',
      }

      // Act
      await VerificationController._handleOtpVerification(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(MockFormService.retrieveFormById).toHaveBeenCalledWith(
        MOCK_FORM_ID,
      )
      expect(MockVerificationService.verifyOtp).toHaveBeenCalledWith(
        MOCK_TRANSACTION_ID,
        MOCK_FIELD_ID,
        MOCK_OTP,
      )
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
      expect(mockRes.json).toHaveBeenCalledWith(expectedResponse)
    })

    it('should return 404 when the form could not be found', async () => {
      // Arrange
      MockFormService.retrieveFormById.mockReturnValueOnce(
        errAsync(new FormNotFoundError()),
      )
      const expectedResponse = {
        message: 'Sorry, something went wrong. Please refresh and try again.',
      }

      // Act
      await VerificationController._handleOtpVerification(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(MockFormService.retrieveFormById).toHaveBeenCalledWith(
        MOCK_FORM_ID,
      )
      expect(MockVerificationService.verifyOtp).not.toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND)
      expect(mockRes.json).toHaveBeenCalledWith(expectedResponse)
    })

    it('should return 404 when the transaction could not be found', async () => {
      // Arrange
      MockVerificationService.verifyOtp.mockReturnValueOnce(
        errAsync(new TransactionNotFoundError()),
      )
      const expectedResponse = {
        message: 'Sorry, something went wrong. Please refresh and try again.',
      }

      // Act
      await VerificationController._handleOtpVerification(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(MockFormService.retrieveFormById).toHaveBeenCalledWith(
        MOCK_FORM_ID,
      )
      expect(MockVerificationService.verifyOtp).toHaveBeenCalledWith(
        MOCK_TRANSACTION_ID,
        MOCK_FIELD_ID,
        MOCK_OTP,
      )
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND)
      expect(mockRes.json).toHaveBeenCalledWith(expectedResponse)
    })

    it('should return 404 when the field could not be found for the specified transaction', async () => {
      // Arrange
      MockVerificationService.verifyOtp.mockReturnValueOnce(
        errAsync(new FieldNotFoundInTransactionError()),
      )
      const expectedResponse = {
        message: 'Sorry, something went wrong. Please refresh and try again.',
      }

      // Act
      await VerificationController._handleOtpVerification(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(MockFormService.retrieveFormById).toHaveBeenCalledWith(
        MOCK_FORM_ID,
      )
      expect(MockVerificationService.verifyOtp).toHaveBeenCalledWith(
        MOCK_TRANSACTION_ID,
        MOCK_FIELD_ID,
        MOCK_OTP,
      )
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND)
      expect(mockRes.json).toHaveBeenCalledWith(expectedResponse)
    })

    it('should return 422 when the otp has expired', async () => {
      // Arrange
      MockVerificationService.verifyOtp.mockReturnValueOnce(
        errAsync(new OtpExpiredError()),
      )
      const expectedResponse = {
        message: 'Your OTP has expired, please request for a new one.',
      }

      // Act
      await VerificationController._handleOtpVerification(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(MockFormService.retrieveFormById).toHaveBeenCalledWith(
        MOCK_FORM_ID,
      )
      expect(MockVerificationService.verifyOtp).toHaveBeenCalledWith(
        MOCK_TRANSACTION_ID,
        MOCK_FIELD_ID,
        MOCK_OTP,
      )
      expect(mockRes.status).toHaveBeenCalledWith(
        StatusCodes.UNPROCESSABLE_ENTITY,
      )
      expect(mockRes.json).toHaveBeenCalledWith(expectedResponse)
    })

    it('should return 422 when the user has exceeded the number of retries for otp', async () => {
      // Arrange
      MockVerificationService.verifyOtp.mockReturnValueOnce(
        errAsync(new OtpRetryExceededError()),
      )
      const expectedResponse = {
        message:
          'You have entered too many invalid OTPs. Please request for a new OTP and try again.',
      }

      // Act
      await VerificationController._handleOtpVerification(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(MockFormService.retrieveFormById).toHaveBeenCalledWith(
        MOCK_FORM_ID,
      )
      expect(MockVerificationService.verifyOtp).toHaveBeenCalledWith(
        MOCK_TRANSACTION_ID,
        MOCK_FIELD_ID,
        MOCK_OTP,
      )
      expect(mockRes.status).toHaveBeenCalledWith(
        StatusCodes.UNPROCESSABLE_ENTITY,
      )
      expect(mockRes.json).toHaveBeenCalledWith(expectedResponse)
    })

    it('should return 422 when the otp submitted is wrong', async () => {
      // Arrange
      MockVerificationService.verifyOtp.mockReturnValueOnce(
        errAsync(new WrongOtpError()),
      )
      const expectedResponse = {
        message: 'Wrong OTP.',
      }

      // Act
      await VerificationController._handleOtpVerification(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(MockFormService.retrieveFormById).toHaveBeenCalledWith(
        MOCK_FORM_ID,
      )
      expect(MockVerificationService.verifyOtp).toHaveBeenCalledWith(
        MOCK_TRANSACTION_ID,
        MOCK_FIELD_ID,
        MOCK_OTP,
      )
      expect(mockRes.status).toHaveBeenCalledWith(
        StatusCodes.UNPROCESSABLE_ENTITY,
      )
      expect(mockRes.json).toHaveBeenCalledWith(expectedResponse)
    })

    it('should return 500 when an error occurred while hashing the otp', async () => {
      // Arrange
      MockVerificationService.verifyOtp.mockReturnValueOnce(
        errAsync(new HashingError()),
      )
      const expectedResponse = {
        message: 'Sorry, something went wrong. Please refresh and try again.',
      }

      // Act
      await VerificationController._handleOtpVerification(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(MockFormService.retrieveFormById).toHaveBeenCalledWith(
        MOCK_FORM_ID,
      )
      expect(MockVerificationService.verifyOtp).toHaveBeenCalledWith(
        MOCK_TRANSACTION_ID,
        MOCK_FIELD_ID,
        MOCK_OTP,
      )
      expect(mockRes.status).toHaveBeenCalledWith(
        StatusCodes.INTERNAL_SERVER_ERROR,
      )
      expect(mockRes.json).toHaveBeenCalledWith(expectedResponse)
    })

    it('should return 500 when a database error occurs', async () => {
      // Arrange
      MockVerificationService.verifyOtp.mockReturnValueOnce(
        errAsync(new DatabaseError()),
      )
      const expectedResponse = {
        message: 'Sorry, something went wrong. Please refresh and try again.',
      }

      // Act
      await VerificationController._handleOtpVerification(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(MockFormService.retrieveFormById).toHaveBeenCalledWith(
        MOCK_FORM_ID,
      )
      expect(MockVerificationService.verifyOtp).toHaveBeenCalledWith(
        MOCK_TRANSACTION_ID,
        MOCK_FIELD_ID,
        MOCK_OTP,
      )
      expect(mockRes.status).toHaveBeenCalledWith(
        StatusCodes.INTERNAL_SERVER_ERROR,
      )
      expect(mockRes.json).toHaveBeenCalledWith(expectedResponse)
    })
  })
})
