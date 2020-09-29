import { ObjectId } from 'bson-ext'
import { pick } from 'lodash'
import mongoose from 'mongoose'
import { errAsync, okAsync } from 'neverthrow'
import supertest, { Session } from 'supertest-session'

import getUserModel from 'src/app/models/user.server.model'
import * as SmsService from 'src/app/services/sms.service'
import * as OtpUtils from 'src/app/utils/otp'
import { IAgencySchema, IUserSchema } from 'src/types'

import { getAuthedSession } from 'tests/integration/helpers/express-auth'
import { setupApp } from 'tests/integration/helpers/express-setup'
import dbHandler from 'tests/unit/backend/helpers/jest-db'

import { DatabaseError } from '../../core/core.errors'
import UserRouter from '../user.routes'
import * as UserService from '../user.service'

const UserModel = getUserModel(mongoose)

const app = setupApp('/user', UserRouter, {
  setupWithAuth: true,
})

describe('user.routes', () => {
  const VALID_DOMAIN = 'example.com'
  const VALID_MAILNAME = 'test'
  const VALID_EMAIL = `${VALID_MAILNAME}@${VALID_DOMAIN}`
  const USER_ID = new ObjectId()
  // Obtained from Twilio's
  // https://www.twilio.com/blog/2018/04/twilio-test-credentials-magic-numbers.html
  const VALID_CONTACT = '+15005550006'

  let request: Session
  let defaultAgency: IAgencySchema
  let defaultUser: IUserSchema

  beforeAll(async () => await dbHandler.connect())
  beforeEach(async () => {
    request = supertest(app)
    const { user, agency } = await dbHandler.insertFormCollectionReqs({
      mailDomain: VALID_DOMAIN,
      mailName: VALID_MAILNAME,
      userId: USER_ID,
    })
    defaultUser = user
    defaultAgency = agency
  })
  afterEach(async () => {
    await dbHandler.clearDatabase()
    jest.restoreAllMocks()
  })
  afterAll(async () => await dbHandler.closeDatabase())

  describe('GET /user', () => {
    it('should return 200 with current logged in user if session user is valid', async () => {
      // Arrange
      // Log in user.
      const session = await getAuthedSession(defaultUser.email, request)

      // Act
      const response = await session.get('/user')

      // Assert
      expect(response.status).toEqual(200)
      // Response should contain user object.
      expect(response.body).toEqual(
        expect.objectContaining({
          ...JSON.parse(JSON.stringify(defaultUser.toObject())),
          // Should be object since agency key should be populated.
          agency: JSON.parse(JSON.stringify(defaultAgency.toObject())),
        }),
      )
    })

    it('should return 401 if user id does not exist in session', async () => {
      // Act
      const response = await request.get('/user')

      // Assert
      expect(response.status).toEqual(401)
      expect(response.text).toEqual('User is unauthorized.')
    })

    it('should return 500 when retrieving user returns a database error', async () => {
      // Arrange
      // Log in user.
      const session = await getAuthedSession(VALID_EMAIL, request)

      const mockErrorString = 'Database goes boom'
      // Mock database error from service call.
      const retrieveUserSpy = jest
        .spyOn(UserService, 'getPopulatedUserById')
        .mockReturnValueOnce(errAsync(new DatabaseError(mockErrorString)))

      // Act
      const response = await session.get('/user')

      // Assert
      expect(retrieveUserSpy).toBeCalled()
      expect(response.status).toEqual(500)
      expect(response.text).toEqual(mockErrorString)
    })
  })

  describe('POST /user/contact/sendotp', () => {
    it('should return 200 when otp is sent successfully', async () => {
      // Arrange
      const session = await getAuthedSession(defaultUser.email, request)
      const sendSmsOtpSpy = jest
        .spyOn(SmsService, 'sendAdminContactOtp')
        .mockReturnValueOnce(okAsync(true))

      // Act
      const response = await session.post('/user/contact/sendotp').send({
        contact: VALID_CONTACT,
        userId: defaultUser._id,
      })

      // Assert
      expect(sendSmsOtpSpy).toHaveBeenCalled()
      expect(response.status).toEqual(200)
      expect(response.text).toEqual('OK')
    })

    it('should return 400 when body.contact is not provided as a param', async () => {
      // Act
      const response = await request.post('/user/contact/sendotp').send({
        userId: defaultUser.email,
      })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.text).toEqual('Some required parameters are missing')
    })

    it('should return 400 when body.userId is not provided as a param', async () => {
      // Act
      const response = await request.post('/user/contact/sendotp').send({
        contact: VALID_CONTACT,
      })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.text).toEqual('Some required parameters are missing')
    })

    it('should return 401 when body.userId does not match current session userId', async () => {
      // Arrange
      const session = await getAuthedSession(defaultUser.email, request)
      const invalidUserId = new ObjectId()

      // Act
      const response = await session.post('/user/contact/sendotp').send({
        contact: VALID_CONTACT,
        userId: invalidUserId,
      })

      // Assert
      expect(response.status).toEqual(401)
      expect(response.text).toEqual('User is unauthorized.')
    })

    it('should return 401 when user is not currently logged in', async () => {
      // Act
      // POSTing without first logging in.
      const response = await request.post('/user/contact/sendotp').send({
        contact: VALID_CONTACT,
        userId: defaultUser._id,
      })

      // Assert
      expect(response.status).toEqual(401)
      expect(response.text).toEqual('User is unauthorized.')
    })

    it('should return 422 when userId cannot be found in the database', async () => {
      // Arrange
      const session = await getAuthedSession(defaultUser.email, request)
      // Delete user after login.
      await dbHandler.clearCollection(UserModel.collection.name)

      // Act
      const response = await session.post('/user/contact/sendotp').send({
        contact: VALID_CONTACT,
        userId: defaultUser._id,
      })

      // Assert
      expect(response.status).toEqual(422)
      expect(response.text).toEqual('User not found')
    })

    it('should return 422 when OTP fails to be sent', async () => {
      // Arrange
      const session = await getAuthedSession(defaultUser.email, request)
      const sendSmsOtpSpy = jest
        .spyOn(SmsService, 'sendAdminContactOtp')
        .mockReturnValueOnce(errAsync(new SmsService.SmsSendError()))

      // Act
      const response = await session.post('/user/contact/sendotp').send({
        contact: VALID_CONTACT,
        userId: defaultUser._id,
      })

      // Assert
      expect(sendSmsOtpSpy).toHaveBeenCalled()
      expect(response.status).toEqual(422)
      expect(response.text).toEqual(
        'Failed to send emergency contact verification SMS',
      )
    })

    it('should return 500 when creating an OTP returns a database error', async () => {
      // Arrange
      const session = await getAuthedSession(defaultUser.email, request)
      const mockErrorString = 'Big database oof'
      const createOtpSpy = jest
        .spyOn(UserService, 'createContactOtp')
        .mockReturnValueOnce(errAsync(new DatabaseError(mockErrorString)))

      // Act
      const response = await session.post('/user/contact/sendotp').send({
        contact: VALID_CONTACT,
        userId: defaultUser._id,
      })

      // Assert
      expect(createOtpSpy).toBeCalled()
      expect(response.status).toEqual(500)
      expect(response.text).toEqual(mockErrorString)
    })
  })

  describe('POST /user/contact/verifyotp', () => {
    const MOCK_VALID_OTP = '123456'

    beforeEach(async () => {
      jest.spyOn(OtpUtils, 'generateOtp').mockReturnValue(MOCK_VALID_OTP)
    })

    it('should return 200 with updated user when verification is successful', async () => {
      // Arrange
      const session = await getAuthedSession(defaultUser.email, request)
      await requestForContactOtp(defaultUser, VALID_CONTACT, session)
      // Default user should not have any contact number yet.
      expect(defaultUser.contact).not.toBeDefined()

      // Act
      const response = await session.post('/user/contact/verifyotp').send({
        contact: VALID_CONTACT,
        otp: MOCK_VALID_OTP,
        userId: defaultUser._id,
      })

      // Assert
      expect(response.status).toEqual(200)
      // Body should be an user object.
      expect(response.body).toEqual({
        ...JSON.parse(JSON.stringify(defaultUser.toObject())),
        agency: JSON.parse(JSON.stringify(defaultAgency.toObject())),
        // This time with the new contact number.
        contact: VALID_CONTACT,
        // Dynamic date strings to be returned.
        updatedAt: expect.any(String),
        lastAccessed: expect.any(String),
      })
    })

    it('should return 400 when body.contact is not provided as a param', async () => {
      // Act
      const response = await request.post('/user/contact/verifyotp').send({
        userId: defaultUser.email,
        otp: MOCK_VALID_OTP,
      })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.text).toEqual('Some required parameters are missing')
    })

    it('should return 400 when body.userId is not provided as a param', async () => {
      // Act
      const response = await request.post('/user/contact/verifyotp').send({
        contact: VALID_CONTACT,
        otp: MOCK_VALID_OTP,
      })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.text).toEqual('Some required parameters are missing')
    })

    it('should return 400 when body.otp is not provided as a param', async () => {
      // Act
      const response = await request.post('/user/contact/verifyotp').send({
        contact: VALID_CONTACT,
        userId: defaultUser._id,
      })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.text).toEqual('Some required parameters are missing')
    })

    it('should return 401 when body.userId does not match current session userId', async () => {
      // Arrange
      const session = await getAuthedSession(defaultUser.email, request)
      const invalidUserId = new ObjectId()

      // Act
      const response = await session.post('/user/contact/verifyotp').send({
        contact: VALID_CONTACT,
        otp: MOCK_VALID_OTP,
        userId: invalidUserId,
      })

      // Assert
      expect(response.status).toEqual(401)
      expect(response.text).toEqual('User is unauthorized.')
    })

    it('should return 401 when user is not currently logged in', async () => {
      // Act
      // POSTing without first logging in.
      const response = await request.post('/user/contact/verifyotp').send({
        contact: VALID_CONTACT,
        otp: MOCK_VALID_OTP,
        userId: defaultUser._id,
      })

      // Assert
      expect(response.status).toEqual(401)
      expect(response.text).toEqual('User is unauthorized.')
    })

    it('should return 422 when hashes does not exist for current contact', async () => {
      // Arrange
      const session = await getAuthedSession(defaultUser.email, request)

      // Act
      const response = await session.post('/user/contact/verifyotp').send({
        contact: VALID_CONTACT,
        otp: MOCK_VALID_OTP,
        userId: defaultUser._id,
      })

      // Assert
      expect(response.status).toEqual(422)
      expect(response.text).toEqual(
        'OTP has expired. Please request for a new OTP.',
      )
    })

    it('should return 422 when given otp does not match hashed otp', async () => {
      // Arrange
      const session = await getAuthedSession(defaultUser.email, request)
      await requestForContactOtp(defaultUser, VALID_CONTACT, session)

      // Act
      const response = await session.post('/user/contact/verifyotp').send({
        contact: VALID_CONTACT,
        otp: '999999',
        userId: defaultUser._id,
      })

      // Assert
      expect(response.status).toEqual(422)
      expect(response.text).toEqual('OTP is invalid. Please try again.')
    })

    it('should return 422 when given contact does not match hashed contact', async () => {
      // Arrange
      const session = await getAuthedSession(defaultUser.email, request)
      await requestForContactOtp(defaultUser, VALID_CONTACT, session)
      const invalidContact = '999'

      // Act
      const response = await session.post('/user/contact/verifyotp').send({
        contact: invalidContact,
        otp: MOCK_VALID_OTP,
        userId: defaultUser._id,
      })

      // Assert
      expect(response.status).toEqual(422)
      expect(response.text).toEqual(
        'Contact number given does not match the number the OTP is sent to. Please try again with the correct contact number.',
      )
    })

    it('should return 422 when otp has been attempted too many times', async () => {
      // Arrange
      const session = await getAuthedSession(defaultUser.email, request)
      await requestForContactOtp(defaultUser, VALID_CONTACT, session)
      const invalidOtp = '999999'

      // Act
      // Attempt invalid OTP for MAX_OTP_ATTEMPTS.
      const verifyPromises = []
      for (let i = 0; i < UserService.MAX_OTP_ATTEMPTS; i++) {
        verifyPromises.push(
          session.post('/user/contact/verifyotp').send({
            contact: VALID_CONTACT,
            otp: invalidOtp,
            userId: defaultUser._id,
          }),
        )
      }
      const results = (await Promise.all(verifyPromises)).map((resolve) =>
        pick(resolve, ['status', 'text']),
      )
      // Should be all invalid OTP responses.
      expect(results).toEqual(
        Array(UserService.MAX_OTP_ATTEMPTS).fill({
          status: 422,
          text: 'OTP is invalid. Please try again.',
        }),
      )

      // Act again, this time with a valid OTP.
      const response = await session.post('/user/contact/verifyotp').send({
        contact: VALID_CONTACT,
        userId: defaultUser._id,
        otp: MOCK_VALID_OTP,
      })

      // Assert
      // Should still reject with max OTP attempts error.
      expect(response.status).toEqual(422)
      expect(response.text).toEqual(
        'You have hit the max number of attempts. Please request for a new OTP.',
      )
    })

    it('should return 422 when user cannot be found in the database', async () => {
      // Arrange
      const session = await getAuthedSession(defaultUser.email, request)
      await requestForContactOtp(defaultUser, VALID_CONTACT, session)
      // Delete user after login.
      await dbHandler.clearCollection(UserModel.collection.name)

      // Act
      const response = await session.post('/user/contact/verifyotp').send({
        contact: VALID_CONTACT,
        userId: defaultUser._id,
        otp: MOCK_VALID_OTP,
      })

      // Assert
      expect(response.status).toEqual(422)
      expect(response.text).toEqual('User not found')
    })

    it('should return 500 when database errors occurs whilst verifying otp', async () => {
      // Arrange
      const session = await getAuthedSession(defaultUser.email, request)
      await requestForContactOtp(defaultUser, VALID_CONTACT, session)
      const mockErrorString = 'Database pewpew'

      const incrementSpy = jest
        .spyOn(UserService, 'verifyContactOtp')
        .mockReturnValueOnce(errAsync(new DatabaseError(mockErrorString)))

      // Act
      const response = await session.post('/user/contact/verifyotp').send({
        contact: VALID_CONTACT,
        userId: defaultUser._id,
        otp: MOCK_VALID_OTP,
      })

      // Assert
      expect(incrementSpy).toBeCalled()
      expect(response.status).toEqual(500)
      expect(response.text).toEqual(mockErrorString)
    })

    it('should return 500 when database errors occurs whilst updating contact', async () => {
      // Arrange
      const session = await getAuthedSession(defaultUser.email, request)
      await requestForContactOtp(defaultUser, VALID_CONTACT, session)
      const mockErrorString = 'Database pewpew'

      const uodateSpy = jest
        .spyOn(UserService, 'updateUserContact')
        .mockReturnValueOnce(errAsync(new DatabaseError(mockErrorString)))

      // Act
      const response = await session.post('/user/contact/verifyotp').send({
        contact: VALID_CONTACT,
        userId: defaultUser._id,
        otp: MOCK_VALID_OTP,
      })

      // Assert
      expect(uodateSpy).toBeCalled()
      expect(response.status).toEqual(500)
      expect(response.text).toEqual(mockErrorString)
    })
  })
})

// Helper methods
const requestForContactOtp = async (
  user: IUserSchema,
  contact: string,
  authedSession: Session,
) => {
  // Set that so no real mail is sent.
  const sendSmsOtpSpy = jest
    .spyOn(SmsService, 'sendAdminContactOtp')
    .mockReturnValueOnce(okAsync(true))

  // Act
  const response = await authedSession.post('/user/contact/sendotp').send({
    userId: user._id,
    contact,
  })

  // Assert
  expect(sendSmsOtpSpy).toHaveBeenCalled()
  expect(response.status).toEqual(200)
  expect(response.text).toEqual('OK')
}
