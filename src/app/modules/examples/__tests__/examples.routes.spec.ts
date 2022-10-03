import { ObjectId } from 'bson-ext'
import { keyBy } from 'lodash'
import { errAsync } from 'neverthrow'
import supertest, { Session } from 'supertest-session'

import { IAgencySchema, IUserSchema } from 'src/types'

import { createAuthedSession } from 'tests/integration/helpers/express-auth'
import { setupApp } from 'tests/integration/helpers/express-setup'
import { buildCelebrateError } from 'tests/unit/backend/helpers/celebrate'
import dbHandler from 'tests/unit/backend/helpers/jest-db'

import { DatabaseError } from '../../core/core.errors'
import { ExamplesRouter } from '../examples.routes'
import * as ExamplesService from '../examples.service'
import { FormInfo } from '../examples.types'

import prepareTestData, {
  SearchTerm,
  TestData,
} from './helpers/prepareTestData'

// Mock min sub count so anything above 0 submissions will be counted.
jest.mock('../examples.constants', () => ({
  PAGE_SIZE: 16,
  MIN_SUB_COUNT: 0,
}))

const app = setupApp('/examples', ExamplesRouter, {
  setupWithAuth: true,
})

jest.mock('../../spcp/spcp.oidc.client')

describe('examples.routes', () => {
  let request: Session
  let orgTestData: TestData
  let comTestData: TestData
  let defaultUser: IUserSchema
  let comAgency: IAgencySchema
  let orgAgency: IAgencySchema

  beforeAll(async () => {
    await dbHandler.connect()
    const orgData = await dbHandler.insertFormCollectionReqs({
      mailDomain: 'example.org',
      shortName: 'orgTest',
    })
    orgAgency = orgData.agency
    defaultUser = orgData.user

    const comData = await dbHandler.insertFormCollectionReqs({
      mailDomain: 'example.com',
      shortName: 'comTest',
    })
    comAgency = comData.agency

    // Populate database with both users' forms.
    orgTestData = await prepareTestData(orgData.user, orgData.agency)
    comTestData = await prepareTestData(comData.user, comData.agency)
  })
  beforeEach(async () => {
    request = supertest(app)
  })
  afterEach(async () => {
    jest.clearAllMocks()
  })
  afterAll(async () => await dbHandler.closeDatabase())

  describe('GET /examples', () => {
    it('should return 200 with array of example forms for all agencies when query.agency is missing', async () => {
      // Arrange
      const session = await createAuthedSession(defaultUser.email, request)

      // Act
      const response = await session.get('/examples').query({
        pageNo: '0',
      })

      // Assert
      // Should have both comTestData and orgTestData since searching by all
      // agencies.
      const expectedBody = keyBy(
        [
          ...stringifyFormInfoArray(comTestData.total.expectedFormInfo),
          ...stringifyFormInfoArray(orgTestData.total.expectedFormInfo),
        ],
        '_id',
      )
      const actualBody = keyBy(response.body.forms, '_id')
      expect(response.status).toEqual(200)
      // Check shape.
      expect(response.body).toEqual({
        forms: expect.any(Array),
      })
      expect(actualBody).toEqual(expectedBody)
    })

    it('should return 200 with array of example forms for a particular agency when query.agency is provided', async () => {
      // Arrange
      const session = await createAuthedSession(defaultUser.email, request)

      // Act
      const response = await session.get('/examples').query({
        pageNo: '0',
        agency: orgAgency._id.toString(),
      })

      // Assert
      // Should only have orgTestData since its agency id is provided.
      const expectedBody = keyBy(
        stringifyFormInfoArray(orgTestData.total.expectedFormInfo),
        '_id',
      )
      const actualBody = keyBy(response.body.forms, '_id')
      // Check shape.
      expect(response.status).toEqual(200)
      expect(response.body).toEqual({
        forms: expect.any(Array),
      })
      expect(actualBody).toEqual(expectedBody)
    })

    it('should return 200 with empty array when no forms match the criterias', async () => {
      // Arrange
      const session = await createAuthedSession(defaultUser.email, request)

      // Act
      const response = await session.get('/examples').query({
        pageNo: '0',
        agency: new ObjectId().toHexString(),
      })

      // Assert
      expect(response.status).toEqual(200)
      // Check shape.
      expect(response.body).toEqual({
        forms: [],
      })
    })

    it('should return 200 with array of example forms that match given query.searchTerm when that is provided', async () => {
      // Arrange
      const session = await createAuthedSession(defaultUser.email, request)

      // Act
      const response = await session.get('/examples').query({
        pageNo: '0',
        agency: comAgency._id.toString(),
        shouldGetTotalNumResults: 'true',
        searchTerm: SearchTerm.First,
      })

      // Assert
      // Should only have comTestData since its agency id is provided.
      const expectedBody = keyBy(
        stringifyFormInfoArray(comTestData.first.expectedFormInfo),
        '_id',
      )
      const actualBody = keyBy(response.body.forms, '_id')
      // Check shape.
      expect(response.status).toEqual(200)
      expect(response.body).toEqual({
        forms: expect.any(Array),
        // Should have total num results key value.
        totalNumResults: comTestData.first.formCount,
      })
      expect(actualBody).toEqual(expectedBody)
    })

    it('should return 200 with correctly offset example forms according to query.pageNo when that is provided', async () => {
      // Arrange
      const session = await createAuthedSession(defaultUser.email, request)

      // Act
      const response = await session.get('/examples').query({
        pageNo: '1',
        shouldGetTotalNumResults: 'true',
      })

      // Assert
      const actualBody = keyBy(response.body.forms, '_id')
      // Check shape.
      expect(response.status).toEqual(200)
      expect(response.body).toEqual({
        forms: expect.any(Array),
        // Should have total num results key value.
        totalNumResults:
          comTestData.total.formCount + orgTestData.total.formCount,
      })
      // Should have nothing since the number of results is less than the
      // offset.
      expect(actualBody).toEqual({})
    })

    it('should return 200 with array of example forms and total count when query.shouldGetTotalNumResults is true', async () => {
      // Arrange
      const session = await createAuthedSession(defaultUser.email, request)

      // Act
      const response = await session.get('/examples').query({
        pageNo: '0',
        agency: comAgency._id.toString(),
        shouldGetTotalNumResults: 'true',
      })

      // Assert
      // Should only have comTestData since its agency id is provided.
      const expectedBody = keyBy(
        stringifyFormInfoArray(comTestData.total.expectedFormInfo),
        '_id',
      )
      const actualBody = keyBy(response.body.forms, '_id')
      // Check shape.
      expect(response.status).toEqual(200)
      expect(response.body).toEqual({
        forms: expect.any(Array),
        // Should have total num results key value.
        totalNumResults: comTestData.total.formCount,
      })
      expect(actualBody).toEqual(expectedBody)
    })

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
      expect(response.body).toEqual({ message: 'User is unauthorized.' })
    })

    it('should return 500 when an error occurs whilst querying the database', async () => {
      // Arrange
      const getExamplesSpy = jest
        .spyOn(ExamplesService, 'getExampleForms')
        .mockReturnValueOnce(errAsync(new DatabaseError()))
      const session = await createAuthedSession(defaultUser.email, request)

      // Act
      const response = await session.get('/examples').query({
        pageNo: '0',
      })

      // Assert
      expect(getExamplesSpy).toHaveBeenCalledTimes(1)
      expect(response.status).toEqual(500)
      expect(response.body).toEqual({
        message: 'Error retrieving example forms',
      })
    })
  })

  describe('GET /examples/:formId', () => {
    it('should return 200 with the example information of the retrieved form', async () => {
      // Arrange
      const session = await createAuthedSession(defaultUser.email, request)
      const validFormId = comTestData.second.forms[0]._id

      // Act
      const response = await session.get(`/examples/${validFormId}`)

      // Assert
      const expectedFormInfo = stringifyFormInfo(
        comTestData.second.expectedFormInfo[0],
      )

      expect(response.status).toEqual(200)
      expect(response.body).toEqual({
        form: expectedFormInfo,
      })
    })

    it('should return 404 when the form with the given formId does not exist in the database', async () => {
      // Arrange
      const session = await createAuthedSession(defaultUser.email, request)
      const randomFormId = new ObjectId().toHexString()

      // Act
      const response = await session.get(`/examples/${randomFormId}`)

      // Assert
      expect(response.status).toEqual(404)
      expect(response.body).toEqual({
        message: 'Error in retrieving template form - form not found.',
      })
    })

    it('should return 401 when user is not logged in', async () => {
      // Arrange
      const validFormId = comTestData.first.forms[0]._id

      // Act
      const response = await request.get(`/examples/${validFormId}`)

      // Assert
      expect(response.status).toEqual(401)
      expect(response.body).toEqual({ message: 'User is unauthorized.' })
    })

    it('should return 500 when error occurs whilst querying the database', async () => {
      // Arrange
      const session = await createAuthedSession(defaultUser.email, request)
      const validFormId = comTestData.first.forms[0]._id
      const mockErrorString = 'database error'
      jest
        .spyOn(ExamplesService, 'getSingleExampleForm')
        .mockReturnValueOnce(errAsync(new DatabaseError(mockErrorString)))

      // Act
      const response = await session.get(`/examples/${validFormId}`)

      // Assert
      expect(response.status).toEqual(500)
      expect(response.body).toEqual({ message: mockErrorString })
    })
  })
})

// Helper functions
/**
 * Stringifies expected form info arrays. Unable to do the usual JSON.stringify
 * -> parse combination due to mongoose dates being converted to an empty
 * object.
 */
const stringifyFormInfoArray = (array: FormInfo[]) => {
  return array.map(stringifyFormInfo)
}

const stringifyFormInfo = (formInfo: FormInfo) => {
  return {
    ...formInfo,
    _id: formInfo._id.toString(),
  }
}
