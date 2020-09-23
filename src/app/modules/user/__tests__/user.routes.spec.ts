import { ObjectId } from 'bson-ext'
import { errAsync } from 'neverthrow'
import supertest, { Session } from 'supertest-session'

import { IAgencySchema, IUserSchema } from 'src/types'

import { getAuthedSession } from 'tests/integration/helpers/express-auth'
import { setupApp } from 'tests/integration/helpers/express-setup'
import dbHandler from 'tests/unit/backend/helpers/jest-db'

import { DatabaseError } from '../../core/core.errors'
import UserRouter from '../user.routes'
import * as UserService from '../user.service'

const app = setupApp('/user', UserRouter, {
  setupWithAuth: true,
})

describe('user.routes', () => {
  const VALID_DOMAIN = 'example.com'
  const VALID_MAILNAME = 'test'
  const VALID_EMAIL = `${VALID_MAILNAME}@${VALID_DOMAIN}`
  const USER_ID = new ObjectId()

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
    it('should return 401 if user id does not exist in session', async () => {
      // Act
      const response = await request.get('/user')

      // Assert
      expect(response.status).toEqual(401)
      expect(response.text).toEqual('User is unauthorized.')
    })

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
})
