import MyInfoClient, { IMyInfoConfig } from '@opengovsg/myinfo-gov-client'
import { ObjectId } from 'bson'
import session, { Session } from 'supertest-session'
import { v4 as uuidv4 } from 'uuid'

import { setupApp } from 'tests/integration/helpers/express-setup'
import { buildCelebrateError } from 'tests/unit/backend/helpers/celebrate'
import dbHandler from 'tests/unit/backend/helpers/jest-db'

import { FormAuthType } from '../../../../../shared/types'
import { MyInfoAuthCodeCookieState } from '../myinfo.types'

import {
  MOCK_ACCESS_TOKEN,
  MOCK_AUTH_CODE,
  MOCK_ESRVC_ID,
  MOCK_FORM_ID,
  MOCK_REDIRECT_URL,
} from './myinfo.test.constants'

// Avoid async refresh calls
jest.mock('src/app/modules/spcp/spcp.oidc.client.ts')

jest.mock('@opengovsg/myinfo-gov-client', () => ({
  MyInfoGovClient: jest.fn().mockReturnValue({
    createRedirectURL: jest.fn(),
    getAccessToken: jest.fn(),
  }),
  MyInfoMode: jest.requireActual('@opengovsg/myinfo-gov-client').MyInfoMode,
  MyInfoSource: jest.requireActual('@opengovsg/myinfo-gov-client').MyInfoSource,
  MyInfoAddressType: jest.requireActual('@opengovsg/myinfo-gov-client')
    .MyInfoAddressType,
  MyInfoAttribute: jest.requireActual('@opengovsg/myinfo-gov-client')
    .MyInfoAttribute,
}))
const MockMyInfoGovClient = jest.mocked(
  new MyInfoClient.MyInfoGovClient({} as IMyInfoConfig),
)

// Import last so that mocks are imported correctly
// eslint-disable-next-line import/first
import { MyInfoRouter } from '../myinfo.routes'

const myInfoApp = setupApp('/myinfo', MyInfoRouter)

describe('myinfo.routes', () => {
  beforeAll(async () => await dbHandler.connect())
  beforeEach(async () => {
    jest.clearAllMocks()
    await dbHandler.clearDatabase()
  })
  afterAll(async () => await dbHandler.closeDatabase())

  describe('GET /myinfo/redirect', () => {
    const ROUTE = '/myinfo/redirect'
    let request: Session

    beforeAll(() => {
      MockMyInfoGovClient.createRedirectURL.mockReturnValue(MOCK_REDIRECT_URL)
    })

    beforeEach(async () => {
      request = session(myInfoApp)
      await dbHandler.insertEmailForm({
        formId: new ObjectId(MOCK_FORM_ID),
        formOptions: {
          authType: FormAuthType.MyInfo,
          esrvcId: MOCK_ESRVC_ID,
        },
      })
    })

    it('should return 400 when formId is not provided as a query param', async () => {
      const response = await request.get(ROUTE)

      expect(response.status).toBe(400)
      expect(response.body).toEqual(
        buildCelebrateError({ query: { key: 'formId' } }),
      )
    })

    it('should return 400 when formId is malformed', async () => {
      const malformedFormId = 'malformed'
      const response = await request.get(ROUTE).query({
        formId: malformedFormId,
      })

      expect(response.status).toBe(400)
      expect(response.body).toEqual(
        buildCelebrateError({
          query: {
            key: 'formId',
            message: `"formId" with value "${malformedFormId}" fails to match the required pattern: /^[0-9a-fA-F]{24}$/`,
          },
        }),
      )
    })

    it('should return 200 with the redirect URL when Singpass request is valid', async () => {
      const response = await request.get(ROUTE).query({
        formId: MOCK_FORM_ID,
      })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        redirectURL: MOCK_REDIRECT_URL,
      })
    })
  })

  describe('GET /myinfo/login', () => {
    const ROUTE = '/myinfo/login'
    const mockState = {
      formId: MOCK_FORM_ID,
      uuid: uuidv4(),
    }
    const expectedSuccessCookie = {
      authCode: MOCK_AUTH_CODE,
      state: MyInfoAuthCodeCookieState.Success,
    }
    const expectedErrorCookie = {
      state: MyInfoAuthCodeCookieState.Error,
    }
    let request: Session

    beforeEach(async () => {
      request = session(myInfoApp)
      MockMyInfoGovClient.getAccessToken.mockResolvedValueOnce(
        MOCK_ACCESS_TOKEN,
      )
      await dbHandler.insertEmailForm({
        formId: new ObjectId(MOCK_FORM_ID),
        formOptions: {
          authType: FormAuthType.MyInfo,
          esrvcId: MOCK_ESRVC_ID,
        },
      })
    })

    it('should return 400 when state is not provided as a query param', async () => {
      const response = await request.get(ROUTE)

      expect(response.status).toBe(400)
      expect(response.body).toEqual(
        buildCelebrateError({
          query: {
            key: '',
            message: '"value" does not match any of the allowed types',
          },
        }),
      )
    })

    it('should return 400 when neither code nor error are provided as query params', async () => {
      const response = await request.get(ROUTE).query({
        state: 'someState',
      })

      expect(response.status).toBe(400)
      expect(response.body).toEqual(
        buildCelebrateError({
          query: {
            key: '',
            message: '"value" does not match any of the allowed types',
          },
        }),
      )
    })

    it('should return 400 when state is malformed', async () => {
      const response = await request.get(ROUTE).query({
        state: 'someState',
        code: MOCK_AUTH_CODE,
      })

      expect(response.status).toBe(400)
    })

    it('should redirect to destination with cookie when params are valid', async () => {
      const response = await request
        .get(ROUTE)
        .query({ state: JSON.stringify(mockState), code: MOCK_AUTH_CODE })

      expect(response.status).toBe(302)
      expect(response.headers['set-cookie']).toEqual([
        expect.stringContaining(
          encodeURIComponent(JSON.stringify(expectedSuccessCookie)),
        ),
      ])
      expect(response.headers['location']).toEqual(`/${MOCK_FORM_ID}`)
    })

    it('should return 400 when form ID is not a valid object ID', async () => {
      const invalidFormIdState = {
        ...mockState,
        formId: 'abc',
      }
      const response = await request.get(ROUTE).query({
        state: JSON.stringify(invalidFormIdState),
        code: MOCK_AUTH_CODE,
      })

      expect(response.status).toBe(400)
    })

    it('should redirect to form with error cookie when consent flow is unsuccessful', async () => {
      const response = await request.get(ROUTE).query({
        state: JSON.stringify(mockState),
        error: 'error',
        'error-description': 'error-description',
      })

      expect(response.status).toBe(302)
      expect(response.headers['set-cookie']).toEqual([
        expect.stringContaining(
          encodeURIComponent(JSON.stringify(expectedErrorCookie)),
        ),
      ])
      expect(response.headers['location']).toEqual(`/${MOCK_FORM_ID}`)
    })
  })
})
