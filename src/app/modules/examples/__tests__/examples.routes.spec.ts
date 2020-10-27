import { errAsync } from 'neverthrow'
import supertest, { Session } from 'supertest-session'

import { IUserSchema } from 'src/types'

import { createAuthedSession } from 'tests/integration/helpers/express-auth'
import { setupApp } from 'tests/integration/helpers/express-setup'
import { buildCelebrateError } from 'tests/unit/backend/helpers/celebrate'
import dbHandler from 'tests/unit/backend/helpers/jest-db'

import { DatabaseError } from '../../core/core.errors'
import { ExamplesFactory } from '../examples.factory'
import { ExamplesRouter } from '../examples.routes'

const app = setupApp('/examples', ExamplesRouter, {
  setupWithAuth: true,
})

describe('examples.routes', () => {
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

  describe('GET /examples', () => {
    it('should return 200 with array of example forms for a particular agency when query.agencyId is provided', async () => {})

    it('should return 200 with empty array when no forms match the criterias', async () => {})

    it('should return 200 with array of example forms that match given query.searchTerm when that is provided', async () => {})

    it('should return 200 with correctly offset example forms according to query.pageNo when that is provided', async () => {})

    it('should return 200 with array of example forms and total count when query.shouldGetTotalNumResults is true', async () => {})

    it('should return 400 when query.pageNo is not provided', async () => {
      // Arrange
      const session = await createAuthedSession(defaultUser.email, request)

      // Act
      const response = await session.get('/examples').query({
        // query.pageNo omitted.
      })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.body).toEqual(
        buildCelebrateError({
          query: {
            key: 'pageNo',
          },
        }),
      )
    })

    it('should return 400 when query.pageNo is a negative number', async () => {
      // Arrange
      const session = await createAuthedSession(defaultUser.email, request)

      // Act
      const response = await session.get('/examples').query({
        pageNo: '-1',
      })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.body).toEqual(
        buildCelebrateError({
          query: {
            key: 'pageNo',
            message: '"pageNo" must be greater than or equal to 0',
          },
        }),
      )
    })

    it('should return 400 when query.agency is not an ObjectId-like string', async () => {
      // Arrange
      const session = await createAuthedSession(defaultUser.email, request)
      const invalidAgencyId = 'some-random-string'

      // Act
      const response = await session.get('/examples').query({
        pageNo: '0',
        agency: invalidAgencyId,
      })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.body).toEqual(
        buildCelebrateError({
          query: {
            key: 'agency',
            message: `"agency" with value "${invalidAgencyId}" fails to match the required pattern: /^[0-9a-fA-F]{24}$/`,
          },
        }),
      )
    })

    it('should return 400 when query.shouldGetTotalNumResults is not a boolean string', async () => {
      // Arrange
      const session = await createAuthedSession(defaultUser.email, request)

      // Act
      const response = await session.get('/examples').query({
        pageNo: '0',
        shouldGetTotalNumResults: 'not-a-boolean',
      })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.body).toEqual(
        buildCelebrateError({
          query: {
            key: 'shouldGetTotalNumResults',
            message: '"shouldGetTotalNumResults" must be a boolean',
          },
        }),
      )
    })

    it('should return 401 when user is not logged in', async () => {
      // Act
      const response = await request.get('/examples').query({
        pageNo: '0',
      })

      // Assert
      expect(response.status).toEqual(401)
      expect(response.body).toEqual('User is unauthorized.')
    })

    it('should return 500 when an error occurs whilst querying the database', async () => {
      // Arrange
      const getExamplesSpy = jest
        .spyOn(ExamplesFactory, 'getExampleForms')
        .mockReturnValueOnce(errAsync(new DatabaseError()))
      const session = await createAuthedSession(defaultUser.email, request)

      // Act
      const response = await session.get('/examples').query({
        pageNo: '0',
      })

      // Assert
      expect(getExamplesSpy).toHaveBeenCalledTimes(1)
      expect(response.status).toEqual(500)
      expect(response.body).toEqual('Error retrieving example forms')
    })
  })
})
