import { flatten, sortBy, times } from 'lodash'
import mongoose from 'mongoose'
import { errAsync } from 'neverthrow'
import supertest, { Session } from 'supertest-session'

import getFormModel from 'src/app/models/form.server.model'
import getLoginModel from 'src/app/models/login.server.model'
import { IUserSchema } from 'src/types'

import { createAuthedSession } from 'tests/integration/helpers/express-auth'
import { setupApp } from 'tests/integration/helpers/express-setup'
import { buildCelebrateError } from 'tests/unit/backend/helpers/celebrate'
import dbHandler from 'tests/unit/backend/helpers/jest-db'

import {
  FormAuthType,
  FormResponseMode,
} from '../../../../../../../shared/types'
import * as BillingService from '../../../../../modules/billing/billing.service'
import { DatabaseError } from '../../../../../modules/core/core.errors'
import { BillingsRouter } from '../billings.routes'

const app = setupApp('/billings', BillingsRouter, {
  setupWithAuth: true,
})

const FormModel = getFormModel(mongoose)
const LoginModel = getLoginModel(mongoose)

describe('billings.routes', () => {
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

  describe('GET /billings', () => {
    const VALID_ESRVCID_1 = 'mockEsrvcId1'
    const VALID_ESRVCID_2 = 'mockEsrvcId2'
    const INVALID_ESRVCID = 'invalidEsrvcId'
    const VALID_QUERY_YR = new Date().getFullYear()
    const VALID_QUERY_MTH = new Date().getMonth()

    it('should return 200 with array of results of form SPCP logins of the given esrvcId', async () => {
      // Arrange
      // Log in user.
      const session = await createAuthedSession(defaultUser.email, request)
      // Generate login statistics.
      const { generatedLoginTimes, generatedForms } =
        await generateLoginStatistics({
          user: defaultUser,
          esrvcIdToCheck: VALID_ESRVCID_1,
          altEsrvcId: VALID_ESRVCID_2,
        })

      // Act
      const response = await session.get('/billings').query({
        esrvcId: VALID_ESRVCID_1,
        yr: VALID_QUERY_YR,
        mth: VALID_QUERY_MTH,
      })

      // Assert
      // Only first two forms returned, as those have logins with
      // VALID_ESRVCID_1.
      // Should not contain third form with VALID_ESRVCID_2.
      const expectedStats = [
        {
          adminEmail: defaultUser.email,
          formName: generatedForms[0].title,
          total: generatedLoginTimes[0],
          formId: String(generatedForms[0]._id),
          authType: FormAuthType.SP,
        },
        {
          adminEmail: defaultUser.email,
          formName: generatedForms[1].title,
          total: generatedLoginTimes[1],
          formId: String(generatedForms[1]._id),
          authType: FormAuthType.SP,
        },
      ]
      expect(response.status).toEqual(200)
      // Check shape.
      expect(response.body).toEqual({
        loginStats: expect.any(Array),
      })
      // Sort by total and compare.
      expect(sortBy(response.body.loginStats, ['total'])).toEqual(
        sortBy(expectedStats, ['total']),
      )
    })

    it('should return 200 with empty array when no esrvcId matches logins', async () => {
      // Arrange
      // Log in user.
      const session = await createAuthedSession(defaultUser.email, request)

      // Act
      const response = await session.get('/billings').query({
        esrvcId: INVALID_ESRVCID,
        yr: VALID_QUERY_YR,
        mth: VALID_QUERY_MTH,
      })

      // Assert
      expect(response.status).toEqual(200)
      expect(response.body).toEqual({ loginStats: [] })
    })

    it('should return 400 when query.esrvcId is not provided', async () => {
      // Arrange
      // Log in user.
      const session = await createAuthedSession(defaultUser.email, request)

      // Act
      const response = await session.get('/billings').query({
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
      const response = await session.get('/billings').query({
        esrvcId: VALID_ESRVCID_1,
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
      const response = await session.get('/billings').query({
        esrvcId: VALID_ESRVCID_1,
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
      const response = await request.get('/billings').query({
        esrvcId: VALID_ESRVCID_1,
        yr: VALID_QUERY_YR,
        mth: VALID_QUERY_MTH,
      })

      // Assert
      expect(response.status).toEqual(401)
      expect(response.body).toEqual({ message: 'User is unauthorized.' })
    })

    it('should return 500 when error occurs whilst querying the database', async () => {
      // Arrange
      // Log in user.
      const session = await createAuthedSession(defaultUser.email, request)

      // Mock database error from service call.
      const retrieveStatsSpy = jest
        .spyOn(BillingService, 'getSpLoginStats')
        .mockReturnValueOnce(errAsync(new DatabaseError()))

      // Act
      const response = await session.get('/billings').query({
        esrvcId: VALID_ESRVCID_1,
        yr: VALID_QUERY_YR,
        mth: VALID_QUERY_MTH,
      })

      // Assert
      expect(retrieveStatsSpy).toHaveBeenCalled()
      expect(response.status).toEqual(500)
      expect(response.body).toEqual({
        message: 'Error in retrieving billing records',
      })
    })
  })
})

/**
 * Helper method to generate login statistics for testing.
 */
const generateLoginStatistics = async ({
  user,
  esrvcIdToCheck,
  altEsrvcId,
}: {
  user: IUserSchema
  esrvcIdToCheck: string
  altEsrvcId: string
}) => {
  // Generate login statistics.
  // Create 3 random forms.
  const formPromises = times(3, (idx) =>
    FormModel.create({
      title: `example form title ${idx}`,
      admin: user._id,
      responseMode: FormResponseMode.Email,
      emails: [user.email],
    }),
  )
  const forms = await Promise.all(formPromises)

  // Login to first two forms a set number of times with the same esrvcId.
  const esrvc1LoginTimes = [4, 2]
  const loginPromises = flatten(
    forms.map((form, idx) =>
      times(esrvc1LoginTimes[idx], () =>
        LoginModel.create({
          form: form._id,
          admin: user._id,
          agency: user.agency,
          authType: FormAuthType.SP,
          esrvcId: esrvcIdToCheck,
        }),
      ),
    ),
  )
  // Login to third form with a different esrvcId.
  loginPromises.push(
    ...times(5, () =>
      LoginModel.create({
        form: forms[2]._id,
        admin: user._id,
        agency: user.agency,
        authType: FormAuthType.SP,
        esrvcId: altEsrvcId,
      }),
    ),
  )

  await Promise.all(loginPromises)

  return {
    generatedLoginTimes: esrvc1LoginTimes,
    generatedForms: forms,
  }
}
