/* eslint-disable import/first */
import getMockLogger from '__tests__/unit/backend/helpers/jest-logger'
import { ObjectId } from 'bson'
import { addHours, subHours, subMinutes, subSeconds } from 'date-fns'
import mongoose from 'mongoose'
import { errAsync, okAsync } from 'neverthrow'

// These need to be mocked first before the rest of the test
import * as LoggerModule from 'src/app/config/logger'

const mockLogger = getMockLogger()
jest.mock('src/app/config/logger')
const MockLoggerModule = jest.mocked(LoggerModule)
MockLoggerModule.createLoggerWithLabel.mockReturnValue(mockLogger)

import { generateDefaultField } from '__tests__/unit/backend/helpers/generate-form-data'
import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import { PAYMENT_CONTACT_FIELD_ID } from 'shared/constants'

import { smsConfig } from 'src/app/config/features/sms.config'
import formsgSdk from 'src/app/config/formsg-sdk'
import * as FormService from 'src/app/modules/form/form.service'
import {
  MissingHashDataError,
  OtpExpiredError,
  OtpRequestCountExceededError,
  OtpRequestError,
  OtpRetryExceededError,
  WrongOtpError,
} from 'src/app/modules/verification/verification.errors'
import {
  MailGenerationError,
  MailSendError,
} from 'src/app/services/mail/mail.errors'
import MailService from 'src/app/services/mail/mail.service'
import { SmsSendError } from 'src/app/services/sms/sms.errors'
import { SmsFactory } from 'src/app/services/sms/sms.factory'
import * as SmsService from 'src/app/services/sms/sms.service'
import * as HashUtils from 'src/app/utils/hash'
import {
  IFormSchema,
  IPopulatedForm,
  IVerificationSchema,
  UpdateFieldData,
} from 'src/types'

import { BasicField } from '../../../../../shared/types'
import { SMS_WARNING_TIERS } from '../../../../../shared/utils/verification'
import { DatabaseError } from '../../core/core.errors'
import * as AdminFormService from '../../form/admin-form/admin-form.service'
import { FormNotFoundError } from '../../form/form.errors'
import * as FormUtils from '../../form/form.utils'
import {
  FieldNotFoundInTransactionError,
  TransactionExpiredError,
  TransactionNotFoundError,
  WaitForOtpError,
} from '../verification.errors'
import getVerificationModel from '../verification.model'
import * as VerificationService from '../verification.service'
import {
  ResetFieldForTransactionParams,
  SendOtpParams,
  VerifyOtpParams,
} from '../verification.types'

import {
  generateFieldParams,
  generatePaymentContactFieldParams,
  MOCK_EMAIL_RECIPIENT,
  MOCK_HASHED_OTP,
  MOCK_INTL_RECIPIENT,
  MOCK_LOCAL_RECIPIENT,
  MOCK_OTP,
  MOCK_OTP_PREFIX,
  MOCK_SENDER_IP,
  MOCK_SIGNED_DATA,
} from './verification.test.helpers'

const VerificationModel = getVerificationModel(mongoose)

// Set up mocks
jest.mock('src/app/config/formsg-sdk')
const MockFormsgSdk = jest.mocked(formsgSdk)
jest.mock('src/app/services/sms/sms.factory')
const MockSmsFactory = jest.mocked(SmsFactory)
jest.mock('src/app/services/mail/mail.service')
const MockMailService = jest.mocked(MailService)
jest.mock('src/app/modules/form/form.service')
const MockFormService = jest.mocked(FormService)
jest.mock('src/app/utils/hash')
const MockHashUtils = jest.mocked(HashUtils)

describe('Verification service', () => {
  const mockFieldIdObj = new ObjectId()
  const mockFieldId = mockFieldIdObj.toHexString()
  const mockField = { ...generateFieldParams(), _id: mockFieldId }
  const mockPaymentContactField = {
    ...generatePaymentContactFieldParams(),
    _id: PAYMENT_CONTACT_FIELD_ID,
  }
  const mockTransactionId = new ObjectId().toHexString()
  const mockFormId = new ObjectId().toHexString()
  let mockTransaction: IVerificationSchema

  beforeAll(async () => await dbHandler.connect())
  beforeEach(async () => {
    mockTransaction = await VerificationModel.create({
      _id: mockTransactionId,
      formId: mockFormId,
      fields: [mockField],
      paymentField: mockPaymentContactField,
      // Expire 1 hour in future
      expireAt: addHours(new Date(), 1),
    })
  })
  afterEach(async () => {
    await dbHandler.clearDatabase()
    jest.resetAllMocks()
  })

  afterAll(async () => await dbHandler.closeDatabase())

  describe('createTransaction', () => {
    const mockForm = {
      _id: new ObjectId(),
      title: 'mockForm',
      form_fields: [],
    } as unknown as IFormSchema
    let createTransactionFromFormSpy: jest.SpyInstance<
      Promise<IVerificationSchema | null>,
      [form: IFormSchema]
    >

    beforeEach(() => {
      MockFormService.retrieveFormById.mockReturnValue(okAsync(mockForm))
      createTransactionFromFormSpy = jest
        .spyOn(VerificationModel, 'createTransactionFromForm')
        .mockResolvedValue(mockTransaction)
    })

    it('should call VerificationModel.createTransactionFromForm when form is retrieved successfully', async () => {
      const result = await VerificationService.createTransaction(mockForm._id)

      expect(MockFormService.retrieveFormById).toHaveBeenCalledWith(
        mockForm._id,
      )
      expect(createTransactionFromFormSpy).toHaveBeenCalledWith(mockForm)
      expect(result._unsafeUnwrap()).toEqual(mockTransaction)
    })

    it('should forward the error returned when form cannot be retrieved', async () => {
      MockFormService.retrieveFormById.mockReturnValueOnce(
        errAsync(new FormNotFoundError()),
      )

      const result = await VerificationService.createTransaction(mockForm._id)

      expect(MockFormService.retrieveFormById).toHaveBeenCalledWith(
        mockForm._id,
      )
      expect(createTransactionFromFormSpy).not.toHaveBeenCalled()
      expect(result._unsafeUnwrapErr()).toEqual(new FormNotFoundError())
    })

    it('should return DatabaseError when error occurs while creating transaction', async () => {
      createTransactionFromFormSpy.mockRejectedValueOnce('rejected')

      const result = await VerificationService.createTransaction(mockForm._id)

      expect(MockFormService.retrieveFormById).toHaveBeenCalledWith(
        mockForm._id,
      )
      expect(createTransactionFromFormSpy).toHaveBeenCalledWith(mockForm)
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(DatabaseError)
    })
  })

  describe('resetFieldForTransaction', () => {
    let resetFieldSpy: jest.SpyInstance<
      Promise<IVerificationSchema | null>,
      [transactionId: string, isPayment: boolean, fieldId: string]
    >

    const mockResetFieldForTransactionValidInputs: ResetFieldForTransactionParams =
      {
        transactionId: mockTransactionId,
        fieldId: mockFieldId,
      }

    beforeEach(() => {
      resetFieldSpy = jest
        .spyOn(VerificationModel, 'resetField')
        .mockResolvedValue(mockTransaction)
    })

    it('should call VerificationModel.resetField when transaction and field IDs are valid', async () => {
      const result = await VerificationService.resetFieldForTransaction(
        mockResetFieldForTransactionValidInputs,
      )

      expect(resetFieldSpy).toHaveBeenCalledWith(
        mockTransactionId,
        false,
        mockFieldId,
      )
      expect(result._unsafeUnwrap()).toEqual(mockTransaction)
    })

    it('should return TransactionNotFoundError when transaction ID does not exist', async () => {
      const result = await VerificationService.resetFieldForTransaction({
        ...mockResetFieldForTransactionValidInputs,
        transactionId: new ObjectId().toHexString(),
      })

      expect(resetFieldSpy).not.toHaveBeenCalled()
      expect(result._unsafeUnwrapErr()).toEqual(new TransactionNotFoundError())
    })

    it('should return TransactionExpiredError when transaction has expired', async () => {
      const expiredTransaction = await VerificationModel.create({
        formId: mockFormId,
        // Expire 25 hours ago
        expireAt: subHours(new Date(), 25),
      })

      const result = await VerificationService.resetFieldForTransaction({
        ...mockResetFieldForTransactionValidInputs,
        transactionId: expiredTransaction._id,
      })

      expect(resetFieldSpy).not.toHaveBeenCalled()
      expect(result._unsafeUnwrapErr()).toEqual(new TransactionExpiredError())
    })

    it('should return FieldNotFoundInTransactionError when field ID does not exist', async () => {
      const result = await VerificationService.resetFieldForTransaction({
        ...mockResetFieldForTransactionValidInputs,
        fieldId: new ObjectId().toHexString(),
      })

      expect(resetFieldSpy).not.toHaveBeenCalled()
      expect(result._unsafeUnwrapErr()).toEqual(
        new FieldNotFoundInTransactionError(),
      )
    })

    it('should return TransactionNotFoundError when database update returns null', async () => {
      resetFieldSpy.mockResolvedValueOnce(null)

      const result = await VerificationService.resetFieldForTransaction(
        mockResetFieldForTransactionValidInputs,
      )

      expect(resetFieldSpy).toHaveBeenCalledWith(
        mockTransactionId,
        false,
        mockFieldId,
      )
      expect(result._unsafeUnwrapErr()).toEqual(new TransactionNotFoundError())
    })

    it('should return DatabaseError when database update errors', async () => {
      resetFieldSpy.mockRejectedValueOnce('rejected')

      const result = await VerificationService.resetFieldForTransaction(
        mockResetFieldForTransactionValidInputs,
      )

      expect(resetFieldSpy).toHaveBeenCalledWith(
        mockTransactionId,
        false,
        mockFieldId,
      )
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(DatabaseError)
    })
  })

  describe('sendNewOtp', () => {
    const mockForm = {
      _id: new ObjectId(),
      title: 'mockForm',
      form_fields: [
        generateDefaultField(BasicField.Mobile, {
          isVerifiable: true,
          _id: mockFieldIdObj as unknown as string,
        }),
      ],
      msgSrvcName: 'abc',
    } as unknown as IFormSchema

    let updateHashSpy: jest.SpyInstance<
      Promise<IVerificationSchema | null>,
      [updateData: UpdateFieldData]
    >

    let mockTransactionSuccessful: IVerificationSchema

    describe('form field', () => {
      const mockSendNewFormOtpValidInput: SendOtpParams = {
        transactionId: mockTransactionId,
        fieldId: mockFieldId,
        hashedOtp: MOCK_HASHED_OTP,
        otp: MOCK_OTP,
        recipient: MOCK_LOCAL_RECIPIENT,
        senderIp: MOCK_SENDER_IP,
        otpPrefix: MOCK_OTP_PREFIX,
      }

      beforeEach(async () => {
        MockSmsFactory.sendVerificationOtp.mockReturnValue(okAsync(true))
        MockMailService.sendVerificationOtp.mockReturnValue(okAsync(true))
        MockFormsgSdk.verification.generateSignature.mockReturnValue(
          MOCK_SIGNED_DATA,
        )

        mockTransactionSuccessful = JSON.parse(JSON.stringify(mockTransaction))
        mockTransactionSuccessful.fields[0].signedData = MOCK_SIGNED_DATA
        mockTransactionSuccessful.fields[0].hashedOtp = MOCK_HASHED_OTP
        mockTransactionSuccessful.fields[0].otpRequests = 1

        updateHashSpy = jest
          .spyOn(VerificationModel, 'updateHashForField')
          .mockResolvedValue(mockTransactionSuccessful)
        MockFormService.retrieveFormById.mockReturnValue(okAsync(mockForm))
      })

      it('should send OTP and update hashes when parameters are valid', async () => {
        const result = await VerificationService.sendNewOtp(
          mockSendNewFormOtpValidInput,
        )

        // Default mock params has fieldType: 'mobile'
        expect(MockSmsFactory.sendVerificationOtp).toHaveBeenCalledWith(
          MOCK_LOCAL_RECIPIENT,
          MOCK_OTP,
          MOCK_OTP_PREFIX,
          mockTransaction.formId,
          MOCK_SENDER_IP,
        )
        expect(
          MockFormsgSdk.verification.generateSignature,
        ).toHaveBeenCalledWith({
          transactionId: mockTransactionId,
          formId: mockTransaction.formId,
          fieldId: mockFieldId,
          answer: MOCK_LOCAL_RECIPIENT,
        })
        expect(result._unsafeUnwrap()).toEqual(mockTransactionSuccessful)
      })

      it('should return TransactionNotFoundError when transaction ID does not exist', async () => {
        const result = await VerificationService.sendNewOtp({
          ...mockSendNewFormOtpValidInput,
          // non-existent transaction ID
          transactionId: new ObjectId().toHexString(),
        })

        expect(MockMailService.sendVerificationOtp).not.toHaveBeenCalled()
        expect(MockSmsFactory.sendVerificationOtp).not.toHaveBeenCalled()
        expect(
          MockFormsgSdk.verification.generateSignature,
        ).not.toHaveBeenCalled()
        expect(updateHashSpy).not.toHaveBeenCalled()
        expect(result._unsafeUnwrapErr()).toEqual(
          new TransactionNotFoundError(),
        )
      })

      it('should forward TransactionExpiredError from form service', async () => {
        MockFormService.retrieveFormById.mockReturnValueOnce(
          errAsync(new TransactionExpiredError()),
        )

        const expiredTransaction = await VerificationModel.create({
          formId: mockFormId,
          // Expire 25 hours ago
          expireAt: subHours(new Date(), 25),
        })

        const result = await VerificationService.sendNewOtp({
          ...mockSendNewFormOtpValidInput,
          transactionId: expiredTransaction._id,
        })

        expect(MockMailService.sendVerificationOtp).not.toHaveBeenCalled()
        expect(MockSmsFactory.sendVerificationOtp).not.toHaveBeenCalled()
        expect(
          MockFormsgSdk.verification.generateSignature,
        ).not.toHaveBeenCalled()
        expect(updateHashSpy).not.toHaveBeenCalled()
        expect(result._unsafeUnwrapErr()).toEqual(new TransactionExpiredError())
      })

      it('should forward FieldNotFoundInTransactionError from form service', async () => {
        MockFormService.retrieveFormById.mockReturnValueOnce(
          errAsync(new FieldNotFoundInTransactionError()),
        )

        const result = await VerificationService.sendNewOtp({
          ...mockSendNewFormOtpValidInput,
          // ObjectId which does not exist in mockTransaction
          fieldId: new ObjectId().toHexString(),
        })

        expect(MockMailService.sendVerificationOtp).not.toHaveBeenCalled()
        expect(MockSmsFactory.sendVerificationOtp).not.toHaveBeenCalled()
        expect(
          MockFormsgSdk.verification.generateSignature,
        ).not.toHaveBeenCalled()
        expect(updateHashSpy).not.toHaveBeenCalled()
        expect(result._unsafeUnwrapErr()).toEqual(
          new FieldNotFoundInTransactionError(),
        )
      })

      it('should return WaitForOtpError when OTP waiting time has not elapsed', async () => {
        const expiredOtpField = generateFieldParams({
          // Hash created 5 seconds ago
          hashCreatedAt: subSeconds(new Date(), 5),
        })
        const expiredOtpTransaction = await VerificationModel.create({
          formId: mockFormId,
          // Expire 1 hour in future
          expireAt: addHours(new Date(), 1),
          fields: [expiredOtpField],
        })
        const expiredOtpInput = {
          ...mockSendNewFormOtpValidInput,
          transactionId: expiredOtpTransaction._id,
          fieldId: expiredOtpField._id,
        }
        const result = await VerificationService.sendNewOtp(expiredOtpInput)

        expect(MockMailService.sendVerificationOtp).not.toHaveBeenCalled()
        expect(MockSmsFactory.sendVerificationOtp).not.toHaveBeenCalled()
        expect(
          MockFormsgSdk.verification.generateSignature,
        ).not.toHaveBeenCalled()
        expect(updateHashSpy).not.toHaveBeenCalled()
        expect(result._unsafeUnwrapErr()).toEqual(new WaitForOtpError())
      })

      it('should return OtpRequestCountExceededError when OTP max requests are exceeded', async () => {
        const maxExceededOtpField = generateFieldParams({
          otpRequests: 11,
        })
        const maxExceededOtpTransaction = await VerificationModel.create({
          formId: mockFormId,
          // Expire 1 hour in future
          expireAt: addHours(new Date(), 1),
          fields: [maxExceededOtpField],
        })

        const result = await VerificationService.sendNewOtp({
          ...mockSendNewFormOtpValidInput,
          transactionId: maxExceededOtpTransaction._id,
          fieldId: maxExceededOtpField._id,
        })

        expect(MockMailService.sendVerificationOtp).not.toHaveBeenCalled()
        expect(MockSmsFactory.sendVerificationOtp).not.toHaveBeenCalled()
        expect(
          MockFormsgSdk.verification.generateSignature,
        ).not.toHaveBeenCalled()
        expect(updateHashSpy).not.toHaveBeenCalled()
        expect(result._unsafeUnwrapErr()).toEqual(
          new OtpRequestCountExceededError(),
        )
      })

      it('should forward errors returned by MailService.sendVerificationOtp', async () => {
        const error = new MailSendError()
        MockMailService.sendVerificationOtp.mockReturnValueOnce(errAsync(error))
        const field = generateFieldParams({
          fieldType: BasicField.Email,
        })
        const transaction = await VerificationModel.create({
          formId: mockFormId,
          fields: [field],
        })

        const result = await VerificationService.sendNewOtp({
          ...mockSendNewFormOtpValidInput,
          transactionId: transaction._id,
          fieldId: field._id,
        })

        expect(MockMailService.sendVerificationOtp).toHaveBeenCalledWith(
          MOCK_LOCAL_RECIPIENT,
          MOCK_OTP,
          MOCK_OTP_PREFIX,
        )
        expect(
          MockFormsgSdk.verification.generateSignature,
        ).not.toHaveBeenCalled()
        expect(updateHashSpy).not.toHaveBeenCalled()
        expect(result._unsafeUnwrapErr()).toEqual(error)
      })

      it('should forward errors returned by SmsFactory.sendVerificationOtp', async () => {
        MockFormService.retrieveFormById.mockReturnValue(okAsync(mockForm))

        const error = new SmsSendError()

        MockSmsFactory.sendVerificationOtp.mockReturnValueOnce(errAsync(error))
        const field = generateFieldParams({
          fieldType: BasicField.Mobile,
          _id: mockFieldIdObj as unknown as string,
        })
        const transaction = await VerificationModel.create({
          formId: mockFormId,
          fields: [field],
        })

        const result = await VerificationService.sendNewOtp({
          ...mockSendNewFormOtpValidInput,
          transactionId: transaction._id,
        })

        expect(MockSmsFactory.sendVerificationOtp).toHaveBeenCalledWith(
          MOCK_LOCAL_RECIPIENT,
          MOCK_OTP,
          MOCK_OTP_PREFIX,
          new ObjectId(mockFormId),
          MOCK_SENDER_IP,
        )
        expect(
          MockFormsgSdk.verification.generateSignature,
        ).not.toHaveBeenCalled()
        expect(updateHashSpy).not.toHaveBeenCalled()
        expect(result._unsafeUnwrapErr()).toEqual(error)
      })

      it('should return TransactionNotFoundError when database update returns null', async () => {
        updateHashSpy.mockResolvedValueOnce(null)

        const result = await VerificationService.sendNewOtp(
          mockSendNewFormOtpValidInput,
        )

        // Mock params default to mobile
        expect(MockSmsFactory.sendVerificationOtp).toHaveBeenCalledWith(
          MOCK_LOCAL_RECIPIENT,
          MOCK_OTP,
          MOCK_OTP_PREFIX,
          new ObjectId(mockFormId),
          MOCK_SENDER_IP,
        )
        expect(
          MockFormsgSdk.verification.generateSignature,
        ).toHaveBeenCalledWith({
          transactionId: mockTransactionId,
          formId: new ObjectId(mockFormId),
          fieldId: mockFieldId,
          answer: MOCK_LOCAL_RECIPIENT,
        })
        expect(updateHashSpy).toHaveBeenCalledWith({
          fieldId: mockFieldId,
          hashedOtp: MOCK_HASHED_OTP,
          signedData: MOCK_SIGNED_DATA,
          transactionId: mockTransactionId,
          isPayment: false,
        })
        expect(result._unsafeUnwrapErr()).toEqual(
          new TransactionNotFoundError(),
        )
      })
    })

    describe('payment contact field', () => {
      const mockSendNewPaymentOtpValidInput: SendOtpParams = {
        transactionId: mockTransactionId,
        fieldId: PAYMENT_CONTACT_FIELD_ID,
        hashedOtp: MOCK_HASHED_OTP,
        otp: MOCK_OTP,
        recipient: MOCK_EMAIL_RECIPIENT,
        senderIp: MOCK_SENDER_IP,
        otpPrefix: MOCK_OTP_PREFIX,
      }

      beforeEach(async () => {
        MockSmsFactory.sendVerificationOtp.mockReturnValue(okAsync(true))
        MockMailService.sendVerificationOtp.mockReturnValue(okAsync(true))
        MockFormsgSdk.verification.generateSignature.mockReturnValue(
          MOCK_SIGNED_DATA,
        )

        mockTransactionSuccessful = JSON.parse(JSON.stringify(mockTransaction))
        mockTransactionSuccessful.paymentField.signedData = MOCK_SIGNED_DATA
        mockTransactionSuccessful.paymentField.hashedOtp = MOCK_HASHED_OTP
        mockTransactionSuccessful.paymentField.otpRequests = 1

        updateHashSpy = jest
          .spyOn(VerificationModel, 'updateHashForField')
          .mockResolvedValue(mockTransactionSuccessful)
        MockFormService.retrieveFormById.mockReturnValue(okAsync(mockForm))
      })

      it('should send OTP and update hashes when parameters are valid', async () => {
        const result = await VerificationService.sendNewOtp(
          mockSendNewPaymentOtpValidInput,
        )
        // expect(result).toBeNull()

        // Default mock params has fieldType: 'mobile'
        expect(MockMailService.sendVerificationOtp).toHaveBeenCalledWith(
          MOCK_EMAIL_RECIPIENT,
          MOCK_OTP,
          MOCK_OTP_PREFIX,
        )
        expect(
          MockFormsgSdk.verification.generateSignature,
        ).toHaveBeenCalledWith({
          transactionId: mockTransactionId,
          formId: mockTransaction.formId,
          fieldId: PAYMENT_CONTACT_FIELD_ID,
          answer: MOCK_EMAIL_RECIPIENT,
        })
        expect(result._unsafeUnwrap()).toEqual(mockTransactionSuccessful)
      })

      it('should return TransactionNotFoundError when transaction ID does not exist', async () => {
        const result = await VerificationService.sendNewOtp({
          ...mockSendNewPaymentOtpValidInput,
          // non-existent transaction ID
          transactionId: new ObjectId().toHexString(),
        })

        expect(MockMailService.sendVerificationOtp).not.toHaveBeenCalled()
        expect(MockSmsFactory.sendVerificationOtp).not.toHaveBeenCalled()
        expect(
          MockFormsgSdk.verification.generateSignature,
        ).not.toHaveBeenCalled()
        expect(updateHashSpy).not.toHaveBeenCalled()
        expect(result._unsafeUnwrapErr()).toEqual(
          new TransactionNotFoundError(),
        )
      })

      it('should forward TransactionExpiredError from form service', async () => {
        MockFormService.retrieveFormById.mockReturnValueOnce(
          errAsync(new TransactionExpiredError()),
        )

        const expiredTransaction = await VerificationModel.create({
          formId: mockFormId,
          // Expire 25 hours ago
          expireAt: subHours(new Date(), 25),
        })

        const result = await VerificationService.sendNewOtp({
          ...mockSendNewPaymentOtpValidInput,
          transactionId: expiredTransaction._id,
        })

        expect(MockMailService.sendVerificationOtp).not.toHaveBeenCalled()
        expect(MockSmsFactory.sendVerificationOtp).not.toHaveBeenCalled()
        expect(
          MockFormsgSdk.verification.generateSignature,
        ).not.toHaveBeenCalled()
        expect(updateHashSpy).not.toHaveBeenCalled()
        expect(result._unsafeUnwrapErr()).toEqual(new TransactionExpiredError())
      })

      it('should forward FieldNotFoundInTransactionError from form service', async () => {
        MockFormService.retrieveFormById.mockReturnValueOnce(
          errAsync(new FieldNotFoundInTransactionError()),
        )

        const result = await VerificationService.sendNewOtp({
          ...mockSendNewPaymentOtpValidInput,
          // ObjectId which does not exist in mockTransaction
          fieldId: new ObjectId().toHexString(),
        })

        expect(MockMailService.sendVerificationOtp).not.toHaveBeenCalled()
        expect(MockSmsFactory.sendVerificationOtp).not.toHaveBeenCalled()
        expect(
          MockFormsgSdk.verification.generateSignature,
        ).not.toHaveBeenCalled()
        expect(updateHashSpy).not.toHaveBeenCalled()
        expect(result._unsafeUnwrapErr()).toEqual(
          new FieldNotFoundInTransactionError(),
        )
      })

      it('should return WaitForOtpError when OTP waiting time has not elapsed', async () => {
        const expiredOtpField = generateFieldParams({
          // Hash created 5 seconds ago
          hashCreatedAt: subSeconds(new Date(), 5),
        })
        const expiredOtpTransaction = await VerificationModel.create({
          formId: mockFormId,
          // Expire 1 hour in future
          expireAt: addHours(new Date(), 1),
          fields: [expiredOtpField],
        })
        const expiredOtpInput = {
          ...mockSendNewPaymentOtpValidInput,
          transactionId: expiredOtpTransaction._id,
          fieldId: expiredOtpField._id,
        }
        const result = await VerificationService.sendNewOtp(expiredOtpInput)

        expect(MockMailService.sendVerificationOtp).not.toHaveBeenCalled()
        expect(MockSmsFactory.sendVerificationOtp).not.toHaveBeenCalled()
        expect(
          MockFormsgSdk.verification.generateSignature,
        ).not.toHaveBeenCalled()
        expect(updateHashSpy).not.toHaveBeenCalled()
        expect(result._unsafeUnwrapErr()).toEqual(new WaitForOtpError())
      })

      it('should return OtpRequestCountExceededError when OTP max requests are exceeded', async () => {
        const maxExceededOtpField = generateFieldParams({
          otpRequests: 11,
        })
        const maxExceededOtpTransaction = await VerificationModel.create({
          formId: mockFormId,
          // Expire 1 hour in future
          expireAt: addHours(new Date(), 1),
          fields: [maxExceededOtpField],
        })

        const result = await VerificationService.sendNewOtp({
          ...mockSendNewPaymentOtpValidInput,
          transactionId: maxExceededOtpTransaction._id,
          fieldId: maxExceededOtpField._id,
        })

        expect(MockMailService.sendVerificationOtp).not.toHaveBeenCalled()
        expect(MockSmsFactory.sendVerificationOtp).not.toHaveBeenCalled()
        expect(
          MockFormsgSdk.verification.generateSignature,
        ).not.toHaveBeenCalled()
        expect(updateHashSpy).not.toHaveBeenCalled()
        expect(result._unsafeUnwrapErr()).toEqual(
          new OtpRequestCountExceededError(),
        )
      })

      it('should forward errors returned by MailService.sendVerificationOtp', async () => {
        const error = new MailSendError()
        MockMailService.sendVerificationOtp.mockReturnValueOnce(errAsync(error))

        const result = await VerificationService.sendNewOtp(
          mockSendNewPaymentOtpValidInput,
        )

        expect(MockMailService.sendVerificationOtp).toHaveBeenCalledWith(
          MOCK_EMAIL_RECIPIENT,
          MOCK_OTP,
          MOCK_OTP_PREFIX,
        )
        expect(
          MockFormsgSdk.verification.generateSignature,
        ).not.toHaveBeenCalled()
        expect(updateHashSpy).not.toHaveBeenCalled()
        expect(result._unsafeUnwrapErr()).toEqual(error)
      })

      it('should return TransactionNotFoundError when database update returns null', async () => {
        updateHashSpy.mockResolvedValueOnce(null)

        const result = await VerificationService.sendNewOtp(
          mockSendNewPaymentOtpValidInput,
        )

        // Mock params default to mobile
        expect(MockMailService.sendVerificationOtp).toHaveBeenCalledWith(
          MOCK_EMAIL_RECIPIENT,
          MOCK_OTP,
          MOCK_OTP_PREFIX,
        )
        expect(
          MockFormsgSdk.verification.generateSignature,
        ).toHaveBeenCalledWith({
          transactionId: mockTransactionId,
          formId: new ObjectId(mockFormId),
          fieldId: PAYMENT_CONTACT_FIELD_ID,
          answer: MOCK_EMAIL_RECIPIENT,
        })
        expect(updateHashSpy).toHaveBeenCalledWith({
          fieldId: PAYMENT_CONTACT_FIELD_ID,
          hashedOtp: MOCK_HASHED_OTP,
          signedData: MOCK_SIGNED_DATA,
          transactionId: mockTransactionId,
          isPayment: true,
        })
        expect(result._unsafeUnwrapErr()).toEqual(
          new TransactionNotFoundError(),
        )
      })
    })
  })

  describe('verifyOtp', () => {
    let verifyOtpTransaction: IVerificationSchema
    let verifyOtpTransactionId: string
    let otpFieldId: string

    let mockVerifyOtpValidInput: VerifyOtpParams
    let incrementFieldRetriesSpy: jest.SpyInstance<
      Promise<IVerificationSchema | null>,
      [transactionId: string, isPayment: boolean, fieldId: string]
    >

    describe('form field', () => {
      beforeEach(async () => {
        incrementFieldRetriesSpy = jest
          .spyOn(VerificationModel, 'incrementFieldRetries')
          .mockResolvedValue(mockField as unknown as IVerificationSchema)
        MockHashUtils.compareHash.mockReturnValue(okAsync(true))
        verifyOtpTransaction = await VerificationModel.create({
          formId: mockFormId,
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
        mockVerifyOtpValidInput = {
          transactionId: verifyOtpTransactionId,
          fieldId: otpFieldId,
          inputOtp: MOCK_OTP,
        }
      })

      it('should return signedData when OTP is valid', async () => {
        const result = await VerificationService.verifyOtp(
          mockVerifyOtpValidInput,
        )

        expect(incrementFieldRetriesSpy).toHaveBeenCalledWith(
          verifyOtpTransactionId,
          false,
          otpFieldId,
        )
        expect(MockHashUtils.compareHash).toHaveBeenCalledWith(
          MOCK_OTP,
          verifyOtpTransaction.fields[0].hashedOtp,
        )
        expect(result._unsafeUnwrap()).toEqual(
          verifyOtpTransaction.fields[0].signedData,
        )
      })

      it('should return TransactionNotFoundError when transaction ID does not exist', async () => {
        const result = await VerificationService.verifyOtp({
          ...mockVerifyOtpValidInput,
          transactionId: new ObjectId().toHexString(),
        })

        expect(incrementFieldRetriesSpy).not.toHaveBeenCalled()
        expect(result._unsafeUnwrapErr()).toEqual(
          new TransactionNotFoundError(),
        )
      })

      it('should return TransactionExpiredError when transaction has expired', async () => {
        const expiredTransaction = await VerificationModel.create({
          formId: mockFormId,
          // Expire 25 hours ago
          expireAt: subHours(new Date(), 25),
        })

        const result = await VerificationService.verifyOtp({
          ...mockVerifyOtpValidInput,
          transactionId: expiredTransaction._id,
        })

        expect(incrementFieldRetriesSpy).not.toHaveBeenCalled()
        expect(result._unsafeUnwrapErr()).toEqual(new TransactionExpiredError())
      })

      it('should return FieldNotFoundInTransactionError when field ID does not exist', async () => {
        const result = await VerificationService.verifyOtp({
          ...mockVerifyOtpValidInput,
          fieldId: new ObjectId().toHexString(),
        })

        expect(incrementFieldRetriesSpy).not.toHaveBeenCalled()
        expect(result._unsafeUnwrapErr()).toEqual(
          new FieldNotFoundInTransactionError(),
        )
      })

      it('should return MissingHashDataError when hash has not been created', async () => {
        const missingHashTransaction = await VerificationModel.create({
          formId: mockFormId,
          // hash data defaults to null
          fields: [generateFieldParams()],
        })

        const result = await VerificationService.verifyOtp({
          ...mockVerifyOtpValidInput,
          transactionId: missingHashTransaction._id,
          fieldId: missingHashTransaction.fields[0]._id!,
        })

        expect(result._unsafeUnwrapErr()).toEqual(new MissingHashDataError())
      })

      it('should return OtpExpiredError when OTP has expired', async () => {
        const expiredOtpField = generateFieldParams({
          signedData: MOCK_SIGNED_DATA,
          hashRetries: 0,
          hashedOtp: MOCK_HASHED_OTP,
          // hash created 60min ago
          hashCreatedAt: subMinutes(new Date(), 60),
        })
        const expiredOtpTransaction = await VerificationModel.create({
          formId: mockFormId,
          fields: [expiredOtpField],
        })

        const result = await VerificationService.verifyOtp({
          ...mockVerifyOtpValidInput,
          transactionId: expiredOtpTransaction._id,
          fieldId: expiredOtpField._id,
        })

        expect(result._unsafeUnwrapErr()).toEqual(new OtpExpiredError())
      })

      it('should return OtpRetryExceededError when max retries have been exceeded', async () => {
        const retriesExceededField = generateFieldParams({
          signedData: MOCK_SIGNED_DATA,
          hashRetries: 5,
          hashedOtp: MOCK_HASHED_OTP,
          hashCreatedAt: new Date(),
        })
        const retriesExceededTransaction = await VerificationModel.create({
          formId: mockFormId,
          fields: [retriesExceededField],
        })

        const result = await VerificationService.verifyOtp({
          ...mockVerifyOtpValidInput,
          transactionId: retriesExceededTransaction._id,
          fieldId: retriesExceededField._id,
        })

        expect(result._unsafeUnwrapErr()).toEqual(new OtpRetryExceededError())
      })

      it('should return DatabaseError when database update errors', async () => {
        incrementFieldRetriesSpy.mockRejectedValueOnce('rejected')

        const result = await VerificationService.verifyOtp(
          mockVerifyOtpValidInput,
        )

        expect(incrementFieldRetriesSpy).toHaveBeenCalledWith(
          verifyOtpTransactionId,
          false,
          otpFieldId,
        )
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(DatabaseError)
      })

      it('should return WrongOtpError when OTP is wrong', async () => {
        MockHashUtils.compareHash.mockReturnValueOnce(okAsync(false))

        const result = await VerificationService.verifyOtp(
          mockVerifyOtpValidInput,
        )

        expect(incrementFieldRetriesSpy).toHaveBeenCalledWith(
          verifyOtpTransactionId,
          false,
          otpFieldId,
        )
        expect(result._unsafeUnwrapErr()).toEqual(new WrongOtpError())
      })
    })

    describe('payment contact field', () => {
      beforeEach(async () => {
        incrementFieldRetriesSpy = jest
          .spyOn(VerificationModel, 'incrementFieldRetries')
          .mockResolvedValue(mockField as unknown as IVerificationSchema)
        MockHashUtils.compareHash.mockReturnValue(okAsync(true))
        verifyOtpTransaction = await VerificationModel.create({
          formId: mockFormId,
          paymentField: generatePaymentContactFieldParams({
            signedData: MOCK_SIGNED_DATA,
            hashRetries: 0,
            hashedOtp: MOCK_HASHED_OTP,
            hashCreatedAt: new Date(),
          }),
        })
        verifyOtpTransactionId = verifyOtpTransaction._id
        mockVerifyOtpValidInput = {
          transactionId: verifyOtpTransactionId,
          fieldId: PAYMENT_CONTACT_FIELD_ID,
          inputOtp: MOCK_OTP,
        }
      })

      it('should return signedData when OTP is valid', async () => {
        const result = await VerificationService.verifyOtp(
          mockVerifyOtpValidInput,
        )

        expect(incrementFieldRetriesSpy).toHaveBeenCalledWith(
          verifyOtpTransactionId,
          true,
          PAYMENT_CONTACT_FIELD_ID,
        )
        expect(MockHashUtils.compareHash).toHaveBeenCalledWith(
          MOCK_OTP,
          verifyOtpTransaction.paymentField.hashedOtp,
        )
        expect(result._unsafeUnwrap()).toEqual(
          verifyOtpTransaction.paymentField.signedData,
        )
      })

      it('should return TransactionNotFoundError when transaction ID does not exist', async () => {
        const result = await VerificationService.verifyOtp({
          ...mockVerifyOtpValidInput,
          transactionId: new ObjectId().toHexString(),
        })

        expect(incrementFieldRetriesSpy).not.toHaveBeenCalled()
        expect(result._unsafeUnwrapErr()).toEqual(
          new TransactionNotFoundError(),
        )
      })

      it('should return TransactionExpiredError when transaction has expired', async () => {
        const expiredTransaction = await VerificationModel.create({
          formId: mockFormId,
          // Expire 25 hours ago
          expireAt: subHours(new Date(), 25),
        })

        const result = await VerificationService.verifyOtp({
          ...mockVerifyOtpValidInput,
          transactionId: expiredTransaction._id,
        })

        expect(incrementFieldRetriesSpy).not.toHaveBeenCalled()
        expect(result._unsafeUnwrapErr()).toEqual(new TransactionExpiredError())
      })

      it('should return FieldNotFoundInTransactionError when field ID does not exist', async () => {
        const result = await VerificationService.verifyOtp({
          ...mockVerifyOtpValidInput,
          fieldId: new ObjectId().toHexString(),
        })

        expect(incrementFieldRetriesSpy).not.toHaveBeenCalled()
        expect(result._unsafeUnwrapErr()).toEqual(
          new FieldNotFoundInTransactionError(),
        )
      })

      it('should return MissingHashDataError when hash has not been created', async () => {
        const missingHashTransaction = await VerificationModel.create({
          formId: mockFormId,
          // hash data defaults to null
          paymentField: generatePaymentContactFieldParams(),
        })

        const result = await VerificationService.verifyOtp({
          ...mockVerifyOtpValidInput,
          transactionId: missingHashTransaction._id,
        })

        expect(result._unsafeUnwrapErr()).toEqual(new MissingHashDataError())
      })

      it('should return OtpExpiredError when OTP has expired', async () => {
        const expiredOtpField = generateFieldParams({
          signedData: MOCK_SIGNED_DATA,
          hashRetries: 0,
          hashedOtp: MOCK_HASHED_OTP,
          // hash created 60min ago
          hashCreatedAt: subMinutes(new Date(), 60),
        })
        const expiredOtpTransaction = await VerificationModel.create({
          formId: mockFormId,
          paymentField: expiredOtpField,
        })

        const result = await VerificationService.verifyOtp({
          ...mockVerifyOtpValidInput,
          transactionId: expiredOtpTransaction._id,
        })

        expect(result._unsafeUnwrapErr()).toEqual(new OtpExpiredError())
      })

      it('should return OtpRetryExceededError when max retries have been exceeded', async () => {
        const retriesExceededField = generateFieldParams({
          signedData: MOCK_SIGNED_DATA,
          hashRetries: 5,
          hashedOtp: MOCK_HASHED_OTP,
          hashCreatedAt: new Date(),
        })
        const retriesExceededTransaction = await VerificationModel.create({
          formId: mockFormId,
          paymentField: retriesExceededField,
        })

        const result = await VerificationService.verifyOtp({
          ...mockVerifyOtpValidInput,
          transactionId: retriesExceededTransaction._id,
        })

        expect(result._unsafeUnwrapErr()).toEqual(new OtpRetryExceededError())
      })

      it('should return DatabaseError when database update errors', async () => {
        incrementFieldRetriesSpy.mockRejectedValueOnce('rejected')

        const result = await VerificationService.verifyOtp(
          mockVerifyOtpValidInput,
        )

        expect(incrementFieldRetriesSpy).toHaveBeenCalledWith(
          verifyOtpTransactionId,
          true,
          PAYMENT_CONTACT_FIELD_ID,
        )
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(DatabaseError)
      })

      it('should return WrongOtpError when OTP is wrong', async () => {
        MockHashUtils.compareHash.mockReturnValueOnce(okAsync(false))

        const result = await VerificationService.verifyOtp(
          mockVerifyOtpValidInput,
        )

        expect(incrementFieldRetriesSpy).toHaveBeenCalledWith(
          verifyOtpTransactionId,
          true,
          PAYMENT_CONTACT_FIELD_ID,
        )
        expect(result._unsafeUnwrapErr()).toEqual(new WrongOtpError())
      })
    })
  })

  describe('disableVerifiedFieldsIfRequired', () => {
    const MOCK_FORM = {
      title: 'some mock form',
      _id: new ObjectId(),
      admin: {
        _id: new ObjectId(),
      },
      permissionList: [{ email: 'some@user.gov.sg' }],
    } as IPopulatedForm
    let mobileTransaction: IVerificationSchema
    const EMAIL_FIELD = generateFieldParams({ fieldType: BasicField.Email })
    const MOBILE_FIELD = generateFieldParams({ fieldType: BasicField.Mobile })
    const onboardSpy = jest.spyOn(FormUtils, 'isFormOnboarded')
    const retrievalSpy = jest.spyOn(SmsService, 'retrieveFreeSmsCounts')
    const disableSpy = jest.spyOn(
      AdminFormService,
      'disableSmsVerificationsForUser',
    )

    beforeEach(async () => {
      mobileTransaction = await VerificationModel.create({
        formId: MOCK_FORM._id,
        fields: [MOBILE_FIELD],
        // Expire 1 hour in future
        expireAt: addHours(new Date(), 1),
      })
    })

    it('should not do anything when the transaction is not for a BasicField.Mobile field', async () => {
      // Arrange
      const nonMobileTransaction = await VerificationModel.create({
        formId: MOCK_FORM._id,
        fields: [EMAIL_FIELD],
        // Expire 1 hour in future
        expireAt: addHours(new Date(), 1),
      })

      // Act
      const actualResult =
        await VerificationService.disableVerifiedFieldsIfRequired(
          MOCK_FORM,
          nonMobileTransaction,
          EMAIL_FIELD._id,
        )

      // Assert
      expect(actualResult._unsafeUnwrap()).toEqual(false)
      expect(retrievalSpy).not.toHaveBeenCalled()
    })

    it('should not do anything when the form is onboarded even with Mobile field', async () => {
      // Arrange
      onboardSpy.mockReturnValueOnce(true)

      // Act
      const actualResult =
        await VerificationService.disableVerifiedFieldsIfRequired(
          MOCK_FORM,
          mobileTransaction,
          MOBILE_FIELD._id,
        )

      // Assert
      expect(actualResult._unsafeUnwrap()).toBe(false)
      expect(retrievalSpy).not.toHaveBeenCalled()
    })

    it('should disable sms verifications and send email when sms limit is exceeded', async () => {
      // Arrange
      MockMailService.sendSmsVerificationDisabledEmail.mockReturnValueOnce(
        okAsync(true),
      )

      disableSpy.mockReturnValueOnce(okAsync(true))
      retrievalSpy.mockReturnValueOnce(
        okAsync(smsConfig.smsVerificationLimit + 1),
      )

      // Act
      const actualResult =
        await VerificationService.disableVerifiedFieldsIfRequired(
          MOCK_FORM,
          mobileTransaction,
          MOBILE_FIELD._id,
        )

      // Assert
      expect(actualResult._unsafeUnwrap()).toBe(true)
      expect(
        MockMailService.sendSmsVerificationDisabledEmail,
      ).toHaveBeenCalledWith(MOCK_FORM)
      // NOTE: String casting is required so that the test recognises them as equal
      expect(disableSpy).toHaveBeenCalledWith(String(MOCK_FORM.admin._id))
    })

    it('should send a warning when the admin has sent out a certain number of sms', async () => {
      // Arrange
      MockMailService.sendSmsVerificationWarningEmail.mockReturnValueOnce(
        okAsync(true),
      )
      retrievalSpy.mockReturnValueOnce(okAsync(SMS_WARNING_TIERS.LOW))

      // Act
      const actualResult =
        await VerificationService.disableVerifiedFieldsIfRequired(
          MOCK_FORM,
          mobileTransaction,
          MOBILE_FIELD._id,
        )
      // Assert
      expect(actualResult._unsafeUnwrap()).toBe(true)
      expect(disableSpy).not.toHaveBeenCalled()
      expect(
        MockMailService.sendSmsVerificationWarningEmail,
      ).toHaveBeenCalledWith(MOCK_FORM, SMS_WARNING_TIERS.LOW)
    })

    it('should not do anything when the sms sent by admin is not at any limit', async () => {
      // Arrange
      retrievalSpy.mockReturnValueOnce(okAsync(SMS_WARNING_TIERS.LOW - 1))

      // Act
      const actualResult =
        await VerificationService.disableVerifiedFieldsIfRequired(
          MOCK_FORM,
          mobileTransaction,
          MOBILE_FIELD._id,
        )
      // Assert
      expect(actualResult._unsafeUnwrap()).toBe(false)
      expect(
        MockMailService.sendSmsVerificationDisabledEmail,
      ).not.toHaveBeenCalled()
      expect(
        MockMailService.sendSmsVerificationWarningEmail,
      ).not.toHaveBeenCalled()
      expect(disableSpy).not.toHaveBeenCalled()
    })

    it('should log any errors encountered during warning mail sending', async () => {
      // Arrange
      const expected = new MailGenerationError('big ded')
      MockMailService.sendSmsVerificationWarningEmail.mockReturnValueOnce(
        errAsync(expected),
      )
      retrievalSpy.mockReturnValueOnce(okAsync(SMS_WARNING_TIERS.LOW))

      // Act
      const actualResult =
        await VerificationService.disableVerifiedFieldsIfRequired(
          MOCK_FORM,
          mobileTransaction,
          MOBILE_FIELD._id,
        )
      // Assert
      expect(actualResult._unsafeUnwrapErr()).toBe(undefined)
      expect(disableSpy).not.toHaveBeenCalled()
      expect(
        MockMailService.sendSmsVerificationWarningEmail,
      ).toHaveBeenCalledWith(MOCK_FORM, SMS_WARNING_TIERS.LOW)
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({ error: expected }),
      )
    })

    it('should propagate any errors encountered during disabled mail sending', async () => {
      // Arrange
      const expected = new MailGenerationError('big ded')
      MockMailService.sendSmsVerificationDisabledEmail.mockReturnValueOnce(
        errAsync(expected),
      )
      retrievalSpy.mockReturnValueOnce(
        okAsync(smsConfig.smsVerificationLimit + 1),
      )

      // Act
      const actualResult =
        await VerificationService.disableVerifiedFieldsIfRequired(
          MOCK_FORM,
          mobileTransaction,
          MOBILE_FIELD._id,
        )

      // Assert
      expect(disableSpy).not.toHaveBeenCalled()
      expect(
        MockMailService.sendSmsVerificationWarningEmail,
      ).not.toHaveBeenCalled()
      expect(actualResult._unsafeUnwrapErr()).toBe(undefined)
      expect(
        MockMailService.sendSmsVerificationDisabledEmail,
      ).toHaveBeenCalledWith(MOCK_FORM)
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({ error: expected }),
      )
    })

    it('should log the error received when retrieval of sms counts fails', async () => {
      // Arrange
      const expected = new DatabaseError()
      onboardSpy.mockReturnValueOnce(false)
      retrievalSpy.mockReturnValueOnce(errAsync(expected))

      // Act
      const actualResult =
        await VerificationService.disableVerifiedFieldsIfRequired(
          MOCK_FORM,
          mobileTransaction,
          MOBILE_FIELD._id,
        )

      // Assert
      expect(actualResult._unsafeUnwrapErr()).toBe(undefined)
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({ error: expected }),
      )
      expect(retrievalSpy).toHaveBeenCalledWith(String(MOCK_FORM.admin._id))
    })
  })

  describe('shouldGenerateMobileOtp', () => {
    it('should return true when the fieldId is valid and verifiable', async () => {
      // Arrange
      const fieldId = new ObjectId().toHexString()
      const mockForm = {
        form_fields: [
          generateDefaultField(BasicField.Mobile, {
            _id: fieldId,
            isVerifiable: true,
          }),
        ],
      }
      const recipient = MOCK_LOCAL_RECIPIENT

      // Act
      const actual = await VerificationService.shouldGenerateMobileOtp(
        mockForm,
        fieldId,
        recipient,
      )

      // Assert
      expect(actual._unsafeUnwrap()).toBe(true)
    })

    it('should return OtpRequestError when an OTP is requested on a field that is not verifiable', async () => {
      // Arrange
      const fieldId = new ObjectId().toHexString()
      const mockForm = {
        // Not enabled.
        form_fields: [
          generateDefaultField(BasicField.Mobile, {
            _id: fieldId,
            isVerifiable: false,
          }),
        ],
      }
      const recipient = MOCK_LOCAL_RECIPIENT

      // Act
      const actual = await VerificationService.shouldGenerateMobileOtp(
        mockForm,
        fieldId,
        recipient,
      )

      // Assert
      expect(actual._unsafeUnwrapErr()).toBeInstanceOf(OtpRequestError)
    })

    it('should return OtpRequestError if there are no matching form fields with the correct id', async () => {
      // Arrange
      const mockForm = {
        form_fields: [
          generateDefaultField(BasicField.Mobile, {
            _id: new ObjectId().toHexString(),
            isVerifiable: true,
          }),
        ],
      }
      const recipient = MOCK_LOCAL_RECIPIENT
      const fieldIdOtherString = new ObjectId().toHexString()

      // Act
      const actual = await VerificationService.shouldGenerateMobileOtp(
        mockForm,
        fieldIdOtherString,
        recipient,
      )

      // Assert
      expect(actual._unsafeUnwrapErr()).toBeInstanceOf(OtpRequestError)
    })

    it('should return OtpRequestError if form_fields is empty', async () => {
      // Arrange
      const mockForm = {
        form_fields: [],
      }
      const fieldId = new ObjectId().toHexString()
      const recipient = MOCK_LOCAL_RECIPIENT

      // Act
      const actual = await VerificationService.shouldGenerateMobileOtp(
        mockForm,
        fieldId,
        recipient,
      )

      // Assert
      expect(actual._unsafeUnwrapErr()).toBeInstanceOf(OtpRequestError)
    })

    it('should return OtpRequestError when OTP is requested for an intl number and the form does not allow intl numbers', async () => {
      // Arrange
      const fieldId = new ObjectId().toHexString()
      const mockForm = {
        form_fields: [
          generateDefaultField(BasicField.Mobile, {
            _id: fieldId,
            isVerifiable: true,
            allowIntlNumbers: false,
          }),
        ],
      }
      const recipient = MOCK_INTL_RECIPIENT

      // Act
      const actual = await VerificationService.shouldGenerateMobileOtp(
        mockForm,
        fieldId,
        recipient,
      )

      // Assert
      expect(actual._unsafeUnwrapErr()).toBeInstanceOf(OtpRequestError)
    })
  })
})
