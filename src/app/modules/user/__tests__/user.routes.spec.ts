import { ObjectId } from 'bson-ext'
import { pick } from 'lodash'
import mongoose from 'mongoose'
import { errAsync, okAsync } from 'neverthrow'
import supertest, { Session } from 'supertest-session'

import getUserModel from 'src/app/models/user.server.model'
import { SmsSendError } from 'src/app/services/sms/sms.errors'
import * as SmsService from 'src/app/services/sms/sms.service'
import * as OtpUtils from 'src/app/utils/otp'
import { AgencyDocument, IUserSchema } from 'src/types'

import { createAuthedSession } from 'tests/integration/helpers/express-auth'
import { setupApp } from 'tests/integration/helpers/express-setup'
import { buildCelebrateError } from 'tests/unit/backend/helpers/celebrate'
import dbHandler from 'tests/unit/backend/helpers/jest-db'
import { jsonParseStringify } from 'tests/unit/backend/helpers/serialize-data'

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
  let defaultAgency: AgencyDocument
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
      const session = await createAuthedSession(defaultUser.email, request)

      // Act
      const response = await session.get('/user')

      // Assert
      expect(response.status).toEqual(200)
      // Response should contain user object.
      expect(response.body).toEqual(
        expect.objectContaining({
          ...jsonParseStringify(defaultUser.toObject()),
          // Should be object since agency key should be populated.
          agency: jsonParseStringify(defaultAgency.toObject()),
        }),
      )
    })

    it('should return 401 if user id does not exist in session', async () => {
      // Act
      const response = await request.get('/user')

      // Assert
      expect(response.status).toEqual(401)
      expect(response.body).toEqual({
        message: 'User is unauthorized.',
      })
    })

    it('should return 500 when retrieving user returns a database error', async () => {
      // Arrange
      // Log in user.
      const session = await createAuthedSession(VALID_EMAIL, request)

      const mockErrorString = 'Database goes boom'
      // Mock database error from service call.
      const retrieveUserSpy = jest
        .spyOn(UserService, 'getPopulatedUserById')
        .mockReturnValueOnce(errAsync(new DatabaseError(mockErrorString)))

      // Act
      const response = await session.get('/user')

      // Assert
      expect(retrieveUserSpy).toHaveBeenCalled()
      expect(response.status).toEqual(500)
      expect(response.body).toEqual({ message: mockErrorString })
    })
  })

  describe('POST /user/contact/sendotp', () => {
    it('should return 200 when otp is sent successfully', async () => {
      // Arrange
      const session = await createAuthedSession(defaultUser.email, request)
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
      expect(response.body).toEqual(
        buildCelebrateError({ body: { key: 'contact' } }),
      )
    })

    it('should return 400 when body.userId is not provided as a param', async () => {
      // Act
      const response = await request.post('/user/contact/sendotp').send({
        contact: VALID_CONTACT,
      })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.body).toEqual(
        buildCelebrateError({ body: { key: 'userId' } }),
      )
    })

    it('should return 401 when body.userId does not match current session userId', async () => {
      // Arrange
      const session = await createAuthedSession(defaultUser.email, request)
      const invalidUserId = new ObjectId()

      // Act
      const response = await session.post('/user/contact/sendotp').send({
        contact: VALID_CONTACT,
        userId: invalidUserId,
      })

      // Assert
      expect(response.status).toEqual(401)
      expect(response.body).toEqual('User is unauthorized.')
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
      expect(response.body).toEqual('User is unauthorized.')
    })

    it('should return 422 when userId cannot be found in the database', async () => {
      // Arrange
      const session = await createAuthedSession(defaultUser.email, request)
      // Delete user after login.
      await dbHandler.clearCollection(UserModel.collection.name)

      // Act
      const response = await session.post('/user/contact/sendotp').send({
        contact: VALID_CONTACT,
        userId: defaultUser._id,
      })

      // Assert
      expect(response.status).toEqual(422)
      expect(response.body).toEqual('User not found')
    })

    it('should return 422 when OTP fails to be sent', async () => {
      // Arrange
      const mockErrorString = 'mock sms send error! oh no'
      const session = await createAuthedSession(defaultUser.email, request)
      const sendSmsOtpSpy = jest
        .spyOn(SmsService, 'sendAdminContactOtp')
        .mockReturnValueOnce(errAsync(new SmsSendError(mockErrorString)))

      // Act
      const response = await session.post('/user/contact/sendotp').send({
        contact: VALID_CONTACT,
        userId: defaultUser._id,
      })

      // Assert
      expect(sendSmsOtpSpy).toHaveBeenCalled()
      expect(response.status).toEqual(422)
      expect(response.body).toEqual(mockErrorString)
    })

    it('should return 500 when creating an OTP returns a database error', async () => {
      // Arrange
      const session = await createAuthedSession(defaultUser.email, request)
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
      expect(createOtpSpy).toHaveBeenCalled()
      expect(response.status).toEqual(500)
      expect(response.body).toEqual(mockErrorString)
    })
  })

  describe('POST /user/contact/verifyotp', () => {
    const MOCK_VALID_OTP = '123456'

    beforeEach(async () => {
      jest.spyOn(OtpUtils, 'generateOtp').mockReturnValue(MOCK_VALID_OTP)
    })

    it('should return 200 with updated user when verification is successful', async () => {
      // Arrange
      const session = await createAuthedSession(defaultUser.email, request)
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
        ...jsonParseStringify(defaultUser.toObject()),
        agency: jsonParseStringify(defaultAgency.toObject()),
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
      expect(response.body).toEqual(
        buildCelebrateError({ body: { key: 'contact' } }),
      )
    })

    it('should return 400 when body.userId is not provided as a param', async () => {
      // Act
      const response = await request.post('/user/contact/verifyotp').send({
        contact: VALID_CONTACT,
        otp: MOCK_VALID_OTP,
      })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.body).toEqual(
        buildCelebrateError({ body: { key: 'userId' } }),
      )
    })

    it('should return 400 when body.otp is not provided as a param', async () => {
      // Act
      const response = await request.post('/user/contact/verifyotp').send({
        contact: VALID_CONTACT,
        userId: defaultUser._id,
      })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.body).toEqual(
        buildCelebrateError({ body: { key: 'otp' } }),
      )
    })

    it('should return 401 when body.userId does not match current session userId', async () => {
      // Arrange
      const session = await createAuthedSession(defaultUser.email, request)
      const invalidUserId = new ObjectId()

      // Act
      const response = await session.post('/user/contact/verifyotp').send({
        contact: VALID_CONTACT,
        otp: MOCK_VALID_OTP,
        userId: invalidUserId,
      })

      // Assert
      expect(response.status).toEqual(401)
      expect(response.body).toEqual('User is unauthorized.')
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
      expect(response.body).toEqual('User is unauthorized.')
    })

    it('should return 404 when hashes does not exist for current contact', async () => {
      // Arrange
      const session = await createAuthedSession(defaultUser.email, request)

      // Act
      const response = await session.post('/user/contact/verifyotp').send({
        contact: VALID_CONTACT,
        otp: MOCK_VALID_OTP,
        userId: defaultUser._id,
      })

      // Assert
      expect(response.status).toEqual(404)
      expect(response.body).toEqual(
        'OTP has expired. Please request for a new OTP.',
      )
    })

    it('should return 404 when given otp does not match hashed otp', async () => {
      // Arrange
      const session = await createAuthedSession(defaultUser.email, request)
      await requestForContactOtp(defaultUser, VALID_CONTACT, session)

      // Act
      const response = await session.post('/user/contact/verifyotp').send({
        contact: VALID_CONTACT,
        otp: '999999',
        userId: defaultUser._id,
      })

      // Assert
      expect(response.status).toEqual(404)
      expect(response.body).toEqual('OTP is invalid. Please try again.')
    })

    it('should return 404 when given contact does not match hashed contact', async () => {
      // Arrange
      const session = await createAuthedSession(defaultUser.email, request)
      await requestForContactOtp(defaultUser, VALID_CONTACT, session)
      const invalidContact = '999'

      // Act
      const response = await session.post('/user/contact/verifyotp').send({
        contact: invalidContact,
        otp: MOCK_VALID_OTP,
        userId: defaultUser._id,
      })

      // Assert
      expect(response.status).toEqual(404)
      expect(response.body).toEqual(
        'Contact number given does not match the number the OTP is sent to. Please try again with the correct contact number.',
      )
    })

    it('should return 404 when otp has been attempted too many times', async () => {
      // Arrange
      const session = await createAuthedSession(defaultUser.email, request)
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
        pick(resolve, ['status', 'body']),
      )
      // Should be all invalid OTP responses.
      expect(results).toEqual(
        Array(UserService.MAX_OTP_ATTEMPTS).fill({
          status: 404,
          body: 'OTP is invalid. Please try again.',
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
      expect(response.status).toEqual(404)
      expect(response.body).toEqual(
        'You have hit the max number of attempts. Please request for a new OTP.',
      )
    })

    it('should return 422 when user cannot be found in the database', async () => {
      // Arrange
      const session = await createAuthedSession(defaultUser.email, request)
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
      expect(response.body).toEqual('User not found')
    })

    it('should return 500 when database errors occurs whilst verifying otp', async () => {
      // Arrange
      const session = await createAuthedSession(defaultUser.email, request)
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
      expect(incrementSpy).toHaveBeenCalled()
      expect(response.status).toEqual(500)
      expect(response.body).toEqual(mockErrorString)
    })

    it('should return 500 when database errors occurs whilst updating contact', async () => {
      // Arrange
      const session = await createAuthedSession(defaultUser.email, request)
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
      expect(uodateSpy).toHaveBeenCalled()
      expect(response.status).toEqual(500)
      expect(response.body).toEqual(mockErrorString)
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
