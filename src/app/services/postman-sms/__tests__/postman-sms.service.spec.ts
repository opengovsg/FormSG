import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import { ObjectId } from 'bson'
import mongoose from 'mongoose'
import { okAsync } from 'neverthrow'

import getFormModel from 'src/app/models/form.server.model'
import { MalformedParametersError } from 'src/app/modules/core/core.errors'
import { FormOtpData, IFormSchema, IUserSchema } from 'src/types'

import { FormResponseMode } from '../../../../../shared/types'
import { InvalidNumberError } from '../postman-sms.errors'
import PostmanSmsService from '../postman-sms.service'

const FormModel = getFormModel(mongoose)

const TEST_NUMBER = '+15005550006'

const MOCK_RECIPIENT_EMAIL = 'recipientEmail@email.com'
const MOCK_ADMIN_EMAIL = 'adminEmail@email.com'
const MOCK_ADMIN_ID = new ObjectId().toHexString()
const MOCK_FORM_ID = new ObjectId().toHexString()
const MOCK_FORM_TITLE = 'formTitle'
const MOCK_SENDER_IP = '200.000.000.000'

describe('postman-sms.service', () => {
  let testUser: IUserSchema

  beforeAll(async () => await dbHandler.connect())
  beforeEach(async () => {
    const { user } = await dbHandler.insertFormCollectionReqs()
    testUser = user
    jest.clearAllMocks()
  })
  afterEach(async () => await dbHandler.clearDatabase())
  afterAll(async () => await dbHandler.closeDatabase())

  describe('sendFormDeactivatedSms', () => {
    it('should send SMS through internal channel when sending is successful', async () => {
      // Arrange
      const postmanInternalSendSpy = jest
        .spyOn(PostmanSmsService, '_sendInternalSms')
        .mockResolvedValueOnce(okAsync(true))

      const postmanMopSendSpy = jest
        .spyOn(PostmanSmsService, '_sendMopSms')
        .mockResolvedValueOnce(okAsync(true))

      // Act
      await PostmanSmsService.sendFormDeactivatedSms(
        TEST_NUMBER,
        MOCK_ADMIN_EMAIL,
        MOCK_ADMIN_ID,
        MOCK_FORM_ID,
        MOCK_FORM_TITLE,
        MOCK_RECIPIENT_EMAIL,
      )

      // Assert
      expect(postmanInternalSendSpy).toHaveBeenCalledOnce()
      expect(postmanMopSendSpy).not.toHaveBeenCalled()
    })

    it('should return InvalidNumberError when invalid number is supplied', async () => {
      // Arrange
      const postmanInternalSendSpy = jest
        .spyOn(PostmanSmsService, '_sendInternalSms')
        .mockResolvedValueOnce(okAsync(true))

      const postmanMopSendSpy = jest
        .spyOn(PostmanSmsService, '_sendMopSms')
        .mockResolvedValueOnce(okAsync(true))

      const invalidNumber = '1+11'

      // Act
      const actualResult = await PostmanSmsService.sendFormDeactivatedSms(
        invalidNumber,
        MOCK_ADMIN_EMAIL,
        MOCK_ADMIN_ID,
        MOCK_FORM_ID,
        MOCK_FORM_TITLE,
        MOCK_RECIPIENT_EMAIL,
      )

      // Assert
      expect(actualResult._unsafeUnwrapErr()).toEqual(new InvalidNumberError())
      expect(postmanInternalSendSpy).not.toHaveBeenCalled()
      expect(postmanMopSendSpy).not.toHaveBeenCalled()
    })
  })

  describe('sendBouncedSubmissionSms', () => {
    it('should send SMS through internal channel success when sending is successful', async () => {
      // Arrange
      const postmanInternalSendSpy = jest
        .spyOn(PostmanSmsService, '_sendInternalSms')
        .mockResolvedValueOnce(okAsync(true))

      const postmanMopSendSpy = jest
        .spyOn(PostmanSmsService, '_sendMopSms')
        .mockResolvedValueOnce(okAsync(true))

      // Act
      await PostmanSmsService.sendBouncedSubmissionSms(
        TEST_NUMBER,
        MOCK_ADMIN_EMAIL,
        MOCK_ADMIN_ID,
        MOCK_FORM_ID,
        MOCK_FORM_TITLE,
        MOCK_RECIPIENT_EMAIL,
      )

      expect(postmanInternalSendSpy).toHaveBeenCalledOnce()
      expect(postmanMopSendSpy).not.toHaveBeenCalled()
    })

    it('should return InvalidNumberError when invalid number is supplied', async () => {
      // Arrange
      const postmanInternalSendSpy = jest
        .spyOn(PostmanSmsService, '_sendInternalSms')
        .mockResolvedValueOnce(okAsync(true))

      const postmanMopSendSpy = jest
        .spyOn(PostmanSmsService, '_sendMopSms')
        .mockResolvedValueOnce(okAsync(true))

      const invalidNumber = '1+11'

      // Act
      const actualResult = await PostmanSmsService.sendBouncedSubmissionSms(
        invalidNumber,
        MOCK_ADMIN_EMAIL,
        MOCK_ADMIN_ID,
        MOCK_FORM_ID,
        MOCK_FORM_TITLE,
        MOCK_RECIPIENT_EMAIL,
      )

      // Assert
      expect(actualResult._unsafeUnwrapErr()).toEqual(new InvalidNumberError())

      expect(postmanInternalSendSpy).not.toHaveBeenCalled()
      expect(postmanMopSendSpy).not.toHaveBeenCalled()
    })
  })

  describe('sendVerificationOtp', () => {
    let mockOtpData: FormOtpData
    let testForm: IFormSchema

    beforeEach(async () => {
      testForm = await FormModel.create({
        title: 'Test Form',
        emails: [testUser.email],
        admin: testUser._id,
        responseMode: FormResponseMode.Email,
      })

      mockOtpData = {
        form: testForm._id,
        formAdmin: {
          email: testUser.email,
          userId: testUser._id,
        },
      }
    })

    it('should return MalformedParametersError error when retrieved otpData is null', async () => {
      // Arrange
      // Return null on Form method
      jest.spyOn(FormModel, 'getOtpData').mockResolvedValueOnce(null)
      const postmanSendSpy = jest
        .spyOn(PostmanSmsService, '_sendMopSms')
        .mockResolvedValueOnce(okAsync(true))

      // Act
      const actualResult = await PostmanSmsService.sendVerificationOtp(
        TEST_NUMBER,
        '111111',
        'ABC',
        testForm._id,
        MOCK_SENDER_IP,
      )

      // Assert
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new MalformedParametersError(
          `Unable to retrieve otpData from ${testForm._id}`,
        ),
      )
      expect(postmanSendSpy).not.toHaveBeenCalled()
    })

    it('should log and send verification OTP through MOP channel when sending has no errors', async () => {
      // Arrange
      jest.spyOn(FormModel, 'getOtpData').mockResolvedValueOnce(mockOtpData)

      const postmanSendSpy = jest
        .spyOn(PostmanSmsService, '_sendMopSms')
        .mockResolvedValueOnce(okAsync(true))

      // Act
      const actualResult = await PostmanSmsService.sendVerificationOtp(
        TEST_NUMBER,
        '111111',
        'ABC',
        testForm._id,
        MOCK_SENDER_IP,
      )

      // Assert
      expect(actualResult._unsafeUnwrap()).toEqual(true)
      expect(postmanSendSpy).toHaveBeenCalledOnce()
    })

    it('should return InvalidNumberError when invalid number is supplied', async () => {
      // Arrange
      jest.spyOn(FormModel, 'getOtpData').mockResolvedValueOnce(mockOtpData)
      const postmanSendSpy = jest
        .spyOn(PostmanSmsService, '_sendMopSms')
        .mockResolvedValueOnce(okAsync(true))

      const invalidNumber = '1+11123'
      // Act
      const actualResult = await PostmanSmsService.sendVerificationOtp(
        invalidNumber,
        '111111',
        'ABC',
        testForm._id,
        MOCK_SENDER_IP,
      )

      // Assert
      expect(actualResult._unsafeUnwrapErr()).toEqual(new InvalidNumberError())
      expect(postmanSendSpy).not.toHaveBeenCalled()
    })
  })

  describe('sendAdminContactOtp', () => {
    it('should log and send contact OTP when sending has no errors', async () => {
      // Arrange
      const postmanInternalSendSpy = jest
        .spyOn(PostmanSmsService, '_sendInternalSms')
        .mockResolvedValueOnce(okAsync(true))

      const postmanMopSendSpy = jest
        .spyOn(PostmanSmsService, '_sendMopSms')
        .mockResolvedValueOnce(okAsync(true))

      // Act
      const actualResult = await PostmanSmsService.sendAdminContactOtp(
        TEST_NUMBER,
        '111111',
        testUser._id,
        MOCK_SENDER_IP,
      )

      // Assert
      expect(actualResult._unsafeUnwrap()).toEqual(true)
      expect(postmanInternalSendSpy).toHaveBeenCalledOnce()
      expect(postmanMopSendSpy).not.toHaveBeenCalled()
    })

    it('should return InvalidNumberError when invalid number is supplied', async () => {
      // Arrange
      const postmanInternalSendSpy = jest
        .spyOn(PostmanSmsService, '_sendInternalSms')
        .mockResolvedValueOnce(okAsync(true))

      const postmanMopSendSpy = jest
        .spyOn(PostmanSmsService, '_sendMopSms')
        .mockResolvedValueOnce(okAsync(true))

      const invalidNumber = '1+11123'

      // Act
      const actualResult = await PostmanSmsService.sendAdminContactOtp(
        invalidNumber,
        '111111',
        testUser._id,
        MOCK_SENDER_IP,
      )

      // Assert
      expect(actualResult._unsafeUnwrapErr()).toEqual(new InvalidNumberError())
      expect(postmanInternalSendSpy).not.toHaveBeenCalled()
      expect(postmanMopSendSpy).not.toHaveBeenCalled()
    })
  })
})
