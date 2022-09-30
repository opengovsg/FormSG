import { ObjectId } from 'bson-ext'
import fs from 'fs'
import { JWTVerifyResult } from 'jose'
import mongoose from 'mongoose'
import session, { Session } from 'supertest-session'
import { mocked } from 'ts-jest/utils'

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
  MOCK_SERVICE_PARAMS,
  MOCK_TARGET,
  MOCK_UEN,
} from '../../../../../modules/spcp/__tests__/spcp.test.constants'
import { CpOidcClient } from '../../../../../modules/spcp/spcp.oidc.client'
import { CorppassOidcRouter } from '../corppass.routes'

const LoginModel = getLoginModel(mongoose)

jest.mock('../../../../../modules/spcp/spcp.oidc.client')

const MockCpOidcClient = mocked(CpOidcClient, true)

describe('corppass.oidc.router', () => {
  beforeAll(async () => await dbHandler.connect())
  beforeEach(async () => jest.clearAllMocks())
  afterAll(async () => await dbHandler.closeDatabase())

  const app = setupApp('/corppass', CorppassOidcRouter)
  let request: Session

  beforeEach(() => {
    request = session(app)
  })

  describe('GET /corppass/.well-known/jwks.json', () => {
    it('should return 200 with the public jwks', async () => {
      // Act
      const response = await request.get('/corppass/.well-known/jwks.json')

      const responseJson = JSON.parse(response.text)
      const expectedJson = JSON.parse(
        fs.readFileSync(MOCK_SERVICE_PARAMS.cpOidcRpJwksPublicPath).toString(),
      )
      // Assert

      expect(response.status).toEqual(200)
      expect(responseJson).toMatchObject(expectedJson)
    })
  })

  describe('GET /corppass/login', () => {
    const LOGIN_ROUTE = '/corppass/login'
    const mockClient = mocked(MockCpOidcClient.mock.instances[0], true)
    beforeEach(async () => {
      mockClient.createJWT.mockResolvedValue(MOCK_JWT)
      jest.restoreAllMocks()
      await dbHandler.insertEmailForm({
        formId: new ObjectId(MOCK_TARGET),
        formOptions: {
          authType: FormAuthType.CP,
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
      mockClient.extractCPEntityIdFromIdToken.mockReturnValueOnce(MOCK_UEN)

      // Act
      const response = await request.get(LOGIN_ROUTE).query({
        state: MOCK_OIDC_STATE,
        code: MOCK_CP_OIDC_AUTHORISATION_CODE,
      })

      // Assert

      expect(response.status).toBe(302)
      expect(response.headers['set-cookie']).toEqual([
        expect.stringContaining(`jwtCp=${MOCK_JWT}`),
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
      mockClient.extractCPEntityIdFromIdToken.mockReturnValueOnce(MOCK_UEN)

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
      mockClient.extractCPEntityIdFromIdToken.mockReturnValueOnce(MOCK_UEN)

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
      mockClient.extractCPEntityIdFromIdToken.mockReturnValueOnce(MOCK_UEN)

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
