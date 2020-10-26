import { errAsync } from 'neverthrow'
import supertest, { Session } from 'supertest-session'

import { IUserSchema } from 'src/types'

import { createAuthedSession } from 'tests/integration/helpers/express-auth'
import { setupApp } from 'tests/integration/helpers/express-setup'
import { buildCelebrateError } from 'tests/unit/backend/helpers/celebrate'
import dbHandler from 'tests/unit/backend/helpers/jest-db'

import { DatabaseError } from '../../core/core.errors'
import { BillingFactory } from '../billing.factory'
import { BillingRouter } from '../billing.routes'

const app = setupApp('/billing', BillingRouter, {
  setupWithAuth: true,
})

describe('billing.routes', () => {
  let request: Session
  let defaultUser: IUserSchema

  beforeAll(async () => await dbHandler.connect())
  beforeEach(async () => {
    request = supertest(app)
    const { user } = await dbHandler.insertFormCollectionReqs()
    defaultUser = user
  })
  afterEach(async () => {
    await dbHandler.clearDatabase()
    jest.restoreAllMocks()
  })
  afterAll(async () => await dbHandler.closeDatabase())

  describe('GET /billing', () => {
    const VALID_ESRVCID = 'mockEsrvcId'
    const VALID_QUERY_YR = 2020
    const VALID_QUERY_MTH = 10

    it('should return 400 when query.esrvcId is not provided', async () => {
      // Arrange
      // Log in user.
      const session = await createAuthedSession(defaultUser.email, request)

      // Act
      const response = await session.get('/billing').query({
        // No esrvcId provided.
        yr: VALID_QUERY_YR,
        mth: VALID_QUERY_MTH,
      })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.body).toEqual(
        buildCelebrateError({ query: { key: 'esrvcId' } }),
      )
    })

    it('should return 400 when query.yr is not provided', async () => {
      // Arrange
      // Log in user.
      const session = await createAuthedSession(defaultUser.email, request)

      // Act
      const response = await session.get('/billing').query({
        esrvcId: VALID_ESRVCID,
        // No yr provided.
        mth: VALID_QUERY_MTH,
      })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.body).toEqual(
        buildCelebrateError({ query: { key: 'yr' } }),
      )
    })

    it('should return 400 when query.mth is not provided', async () => {
      // Arrange
      // Log in user.
      const session = await createAuthedSession(defaultUser.email, request)

      // Act
      const response = await session.get('/billing').query({
        esrvcId: VALID_ESRVCID,
        yr: VALID_QUERY_YR,
        // No mth provided.
      })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.body).toEqual(
        buildCelebrateError({ query: { key: 'mth' } }),
      )
    })

    it('should return 401 when user session does not exist', async () => {
      // Act
      // Call endpoint directly without first logging in.
      const response = await request.get('/billing').query({
        esrvcId: VALID_ESRVCID,
        yr: VALID_QUERY_YR,
        mth: VALID_QUERY_MTH,
      })

      // Assert
      expect(response.status).toEqual(401)
      expect(response.body).toEqual('User is unauthorized.')
    })

    it('should return 500 when error occurs whilst querying the database', async () => {
      // Arrange
      // Log in user.
      const session = await createAuthedSession(defaultUser.email, request)

      // Mock database error from service call.
      const retrieveStatsSpy = jest
        .spyOn(BillingFactory, 'getSpLoginStats')
        .mockReturnValueOnce(errAsync(new DatabaseError()))

      // Act
      const response = await session.get('/billing').query({
        esrvcId: VALID_ESRVCID,
        yr: VALID_QUERY_YR,
        mth: VALID_QUERY_MTH,
      })

      // Assert
      expect(retrieveStatsSpy).toBeCalled()
      expect(response.status).toEqual(500)
      expect(response.body).toEqual('Error in retrieving billing records')
    })
  })
})
