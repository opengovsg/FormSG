import { ObjectId } from 'bson-ext'
import { JWTVerifyResult } from 'jose'
import mongoose from 'mongoose'
import session, { Session } from 'supertest-session'

import { setupApp } from 'tests/integration/helpers/express-setup'

import { FormAuthType } from '../../../../../../../shared/types'
import { buildCelebrateError } from '../../../../../../../tests/unit/backend/helpers/celebrate'
import dbHandler from '../../../../../../../tests/unit/backend/helpers/jest-db'
import getLoginModel from '../../../../../models/login.server.model'
import {
  MOCK_CP_OIDC_AUTHORISATION_CODE,
  MOCK_DESTINATION,
  MOCK_ESRVCID,
  MOCK_JWT,
  MOCK_NRIC,
  MOCK_OIDC_STATE,
  MOCK_TARGET,
} from '../../../../../modules/spcp/__tests__/spcp.test.constants'
import { SpOidcClient } from '../../../../../modules/spcp/spcp.oidc.client'
import { SingpassOidcRouter } from '../singpass.routes'

jest.mock('../../../../../modules/spcp/spcp.oidc.client')
const LoginModel = getLoginModel(mongoose)

const MockSpOidcClient = jest.mocked(SpOidcClient)

describe('singpass.oidc.router', () => {
  beforeAll(async () => await dbHandler.connect())
  beforeEach(async () => jest.clearAllMocks())
  afterAll(async () => await dbHandler.closeDatabase())

  const app = setupApp('/singpass', SingpassOidcRouter)
  let request: Session

  beforeEach(() => {
    request = session(app)
  })

  describe('GET /singpass/login', () => {
    const LOGIN_ROUTE = '/singpass/login'
    const mockClient = jest.mocked(MockSpOidcClient.mock.instances[0])
    beforeEach(async () => {
      mockClient.createJWT.mockResolvedValue(MOCK_JWT)
      jest.restoreAllMocks()
      await dbHandler.insertEmailForm({
        formId: new ObjectId(MOCK_TARGET),
        formOptions: {
          authType: FormAuthType.SP,
          esrvcId: MOCK_ESRVCID,
        },
      })
    })

    afterEach(async () => await dbHandler.clearDatabase())

    it('should return 400 if code param does not exist', async () => {
      // Act
      const response = await request.get(LOGIN_ROUTE).query({
        state: 'state',
      })

      // Assert

      expect(response.status).toEqual(400)
      expect(response.body).toEqual(
        buildCelebrateError({ query: { key: 'code' } }),
      )
    })

    it('should return 400 if state param does not exist', async () => {
      // Act
      const response = await request.get(LOGIN_ROUTE).query({
        code: 'code',
      })

      // Assert

      expect(response.status).toEqual(400)
      expect(response.body).toEqual(
        buildCelebrateError({ query: { key: 'state' } }),
      )
    })

    it('should redirect to destination with JWT cookie when params are valid', async () => {
      // Arrange

      mockClient.exchangeAuthCodeAndDecodeVerifyToken.mockResolvedValueOnce(
        'token' as unknown as JWTVerifyResult,
      )
      mockClient.extractNricOrForeignIdFromIdToken.mockReturnValueOnce(
        MOCK_NRIC,
      )

      // Act
      const response = await request.get(LOGIN_ROUTE).query({
        state: MOCK_OIDC_STATE,
        code: MOCK_CP_OIDC_AUTHORISATION_CODE,
      })

      // Assert

      expect(response.status).toBe(302)
      expect(response.headers['set-cookie']).toEqual([
        expect.stringContaining(`jwtSp=${MOCK_JWT}`),
      ])
      expect(response.headers['location']).toEqual(MOCK_DESTINATION)
    })

    it('should return 400 when token exchange fails', async () => {
      // Arrange

      mockClient.exchangeAuthCodeAndDecodeVerifyToken.mockRejectedValueOnce(
        new Error(),
      )

      // Act
      const response = await request.get(LOGIN_ROUTE).query({
        state: MOCK_OIDC_STATE,
        code: MOCK_CP_OIDC_AUTHORISATION_CODE,
      })

      // Assert
      expect(response.status).toBe(400)
    })

    it('should return 400 when state is invalid', async () => {
      // Arrange

      mockClient.exchangeAuthCodeAndDecodeVerifyToken.mockRejectedValueOnce(
        new Error(),
      )

      // Act
      const response = await request.get(LOGIN_ROUTE).query({
        state: 'invalid state',
        code: MOCK_CP_OIDC_AUTHORISATION_CODE,
      })

      // Assert
      expect(response.status).toBe(400)
    })

    it('should return 404 when destination form ID is not found', async () => {
      // Arrange

      mockClient.exchangeAuthCodeAndDecodeVerifyToken.mockResolvedValueOnce(
        'token' as unknown as JWTVerifyResult,
      )
      mockClient.extractNricOrForeignIdFromIdToken.mockReturnValueOnce(
        MOCK_NRIC,
      )

      // Act
      const response = await request.get(LOGIN_ROUTE).query({
        state: `/${new ObjectId().toHexString()}-false`,
        code: MOCK_CP_OIDC_AUTHORISATION_CODE,
      })

      // Assert
      expect(response.status).toBe(404)
    })

    it('should redirect with isLoginError cookie when jwt creation fails', async () => {
      // Arrange

      mockClient.createJWT.mockRejectedValueOnce(new Error())

      mockClient.exchangeAuthCodeAndDecodeVerifyToken.mockResolvedValueOnce(
        'token' as unknown as JWTVerifyResult,
      )
      mockClient.extractNricOrForeignIdFromIdToken.mockReturnValueOnce(
        MOCK_NRIC,
      )

      // Act
      const response = await request.get(LOGIN_ROUTE).query({
        state: MOCK_OIDC_STATE,
        code: MOCK_CP_OIDC_AUTHORISATION_CODE,
      })

      expect(response.status).toBe(302)
      expect(response.headers['set-cookie']).toEqual([
        expect.stringContaining(`isLoginError=true`),
      ])
      expect(response.headers['location']).toEqual(MOCK_DESTINATION)
    })

    it('should redirect with isLoginError cookie when saving login fails', async () => {
      // Arrange
      mockClient.exchangeAuthCodeAndDecodeVerifyToken.mockResolvedValueOnce(
        'token' as unknown as JWTVerifyResult,
      )
      mockClient.extractNricOrForeignIdFromIdToken.mockReturnValueOnce(
        MOCK_NRIC,
      )

      jest.spyOn(LoginModel, 'addLoginFromForm').mockRejectedValueOnce('')

      // Act
      const response = await request.get(LOGIN_ROUTE).query({
        state: MOCK_OIDC_STATE,
        code: MOCK_CP_OIDC_AUTHORISATION_CODE,
      })

      expect(response.status).toBe(302)
      expect(response.headers['set-cookie']).toEqual([
        expect.stringContaining(`isLoginError=true`),
      ])
      expect(response.headers['location']).toEqual(MOCK_DESTINATION)
    })
  })
})
