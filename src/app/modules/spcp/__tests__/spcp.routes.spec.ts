import SPCPAuthClient from '@opengovsg/spcp-auth-client'
import { ObjectId } from 'bson'
import mongoose from 'mongoose'
import session, { Session } from 'supertest-session'
import { mocked } from 'ts-jest/utils'

import getLoginModel from 'src/app/models/login.server.model'

import { setupApp } from 'tests/integration/helpers/express-setup'
import { buildCelebrateError } from 'tests/unit/backend/helpers/celebrate'
import dbHandler from 'tests/unit/backend/helpers/jest-db'

import { FormAuthType } from '../../../../../shared/types'
import { CorppassLoginRouter, SingpassLoginRouter } from '../spcp.routes'

import {
  MOCK_CP_SAML,
  MOCK_DESTINATION,
  MOCK_ESRVCID,
  MOCK_GET_ATTRIBUTES_RETURN_VALUE,
  MOCK_JWT,
  MOCK_RELAY_STATE,
  MOCK_SP_SAML,
  MOCK_TARGET,
} from './spcp.test.constants'

jest.mock('../spcp.oidc.client')

jest.mock('axios')
jest.mock('@opengovsg/spcp-auth-client')
const MockAuthClient = mocked(SPCPAuthClient, true)

const LoginModel = getLoginModel(mongoose)

const singpassLoginApp = setupApp('/singpass/login', SingpassLoginRouter)
const corppassLoginApp = setupApp('/corppass/login', CorppassLoginRouter)

describe('spcp.routes', () => {
  beforeAll(async () => await dbHandler.connect())
  beforeEach(async () => jest.clearAllMocks())
  afterAll(async () => await dbHandler.closeDatabase())

  describe('GET /singpass/login', () => {
    const ROUTE = '/singpass/login'
    let request: Session
    // Assumes that SingPass client was initialised first
    const mockClient = mocked(MockAuthClient.mock.instances[0], true)
    beforeEach(async () => {
      request = session(singpassLoginApp)
      mockClient.getAttributes.mockImplementation((_samlArt, _dest, cb) =>
        cb(null, MOCK_GET_ATTRIBUTES_RETURN_VALUE),
      )
      mockClient.createJWT.mockReturnValue(MOCK_JWT)
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

    it('should return 400 when SAMLart is not provided as a query param', async () => {
      const response = await request
        .get(ROUTE)
        .query({ RelayState: MOCK_RELAY_STATE })

      expect(response.status).toBe(400)
      expect(response.body).toEqual(
        buildCelebrateError({ query: { key: 'SAMLart' } }),
      )
    })

    it('should return 400 when RelayState is not provided as a query param', async () => {
      const response = await request.get(ROUTE).query({ SAMLart: MOCK_SP_SAML })

      expect(response.status).toBe(400)
      expect(response.body).toEqual(
        buildCelebrateError({ query: { key: 'RelayState' } }),
      )
    })

    it('should redirect to destination with JWT cookie when params are valid', async () => {
      const response = await request
        .get(ROUTE)
        .query({ SAMLart: MOCK_SP_SAML, RelayState: MOCK_RELAY_STATE })

      expect(response.status).toBe(302)
      expect(response.headers['set-cookie']).toEqual([
        expect.stringContaining(`jwtSp=${MOCK_JWT}`),
      ])
      expect(response.headers['location']).toEqual(MOCK_DESTINATION)
    })

    it('should return 400 when SAML artifact is invalid', async () => {
      const response = await request
        .get(ROUTE)
        .query({ SAMLart: 'invalid', RelayState: MOCK_RELAY_STATE })

      expect(response.status).toBe(400)
    })

    it('should return 400 when RelayState is malformed', async () => {
      const response = await request
        .get(ROUTE)
        .query({ SAMLart: MOCK_SP_SAML, RelayState: 'malformed' })

      expect(response.status).toBe(400)
    })

    it('should return 404 when destination form ID is not found', async () => {
      const response = await request.get(ROUTE).query({
        SAMLart: MOCK_SP_SAML,
        RelayState: `/${new ObjectId().toHexString()},true`,
      })

      expect(response.status).toBe(404)
    })

    it('should redirect with isLoginError cookie when destination is valid but attr retrieve fails', async () => {
      mockClient.getAttributes.mockImplementation((_samlArt, _dest, cb) =>
        cb(new Error(''), { relayState: MOCK_RELAY_STATE }),
      )
      const response = await request
        .get(ROUTE)
        .query({ SAMLart: MOCK_SP_SAML, RelayState: MOCK_RELAY_STATE })

      expect(response.status).toBe(302)
      expect(response.headers['set-cookie']).toEqual([
        expect.stringContaining(`isLoginError=true`),
      ])
      expect(response.headers['location']).toEqual(MOCK_DESTINATION)
    })

    it('should redirect with isLoginError cookie when destination is valid but attributes are missing', async () => {
      mockClient.getAttributes.mockImplementation((_samlArt, _dest, cb) =>
        cb(null, { relayState: MOCK_RELAY_STATE }),
      )
      const response = await request
        .get(ROUTE)
        .query({ SAMLart: MOCK_SP_SAML, RelayState: MOCK_RELAY_STATE })

      expect(response.status).toBe(302)
      expect(response.headers['set-cookie']).toEqual([
        expect.stringContaining(`isLoginError=true`),
      ])
      expect(response.headers['location']).toEqual(MOCK_DESTINATION)
    })

    it('should redirect with isLoginError cookie when saving login fails', async () => {
      jest.spyOn(LoginModel, 'addLoginFromForm').mockRejectedValueOnce('')
      const response = await request
        .get(ROUTE)
        .query({ SAMLart: MOCK_SP_SAML, RelayState: MOCK_RELAY_STATE })

      expect(response.status).toBe(302)
      expect(response.headers['set-cookie']).toEqual([
        expect.stringContaining(`isLoginError=true`),
      ])
      expect(response.headers['location']).toEqual(MOCK_DESTINATION)
    })
  })

  describe('GET /corppass/login', () => {
    const ROUTE = '/corppass/login'
    let request: Session
    // Assumes that SingPass client was initialised first
    const mockClient = mocked(MockAuthClient.mock.instances[1], true)
    beforeEach(async () => {
      request = session(corppassLoginApp)
      mockClient.getAttributes.mockImplementation((_samlArt, _dest, cb) =>
        cb(null, MOCK_GET_ATTRIBUTES_RETURN_VALUE),
      )
      mockClient.createJWT.mockReturnValue(MOCK_JWT)
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

    it('should return 400 when SAMLart is not provided as a query param', async () => {
      const response = await request
        .get(ROUTE)
        .query({ RelayState: MOCK_RELAY_STATE })

      expect(response.status).toBe(400)
      expect(response.body).toEqual(
        buildCelebrateError({ query: { key: 'SAMLart' } }),
      )
    })

    it('should return 400 when RelayState is not provided as a query param', async () => {
      const response = await request.get(ROUTE).query({ SAMLart: MOCK_CP_SAML })

      expect(response.status).toBe(400)
      expect(response.body).toEqual(
        buildCelebrateError({ query: { key: 'RelayState' } }),
      )
    })

    it('should redirect to destination with JWT cookie when params are valid', async () => {
      const response = await request
        .get(ROUTE)
        .query({ SAMLart: MOCK_CP_SAML, RelayState: MOCK_RELAY_STATE })

      expect(response.status).toBe(302)
      expect(response.headers['set-cookie']).toEqual([
        expect.stringContaining(`jwtCp=${MOCK_JWT}`),
      ])
      expect(response.headers['location']).toEqual(MOCK_DESTINATION)
    })

    it('should return 400 when SAML artifact is invalid', async () => {
      const response = await request
        .get(ROUTE)
        .query({ SAMLart: 'invalid', RelayState: MOCK_RELAY_STATE })

      expect(response.status).toBe(400)
    })

    it('should return 400 when RelayState is malformed', async () => {
      const response = await request
        .get(ROUTE)
        .query({ SAMLart: MOCK_CP_SAML, RelayState: 'malformed' })

      expect(response.status).toBe(400)
    })

    it('should return 404 when destination form ID is not found', async () => {
      const response = await request.get(ROUTE).query({
        SAMLart: MOCK_CP_SAML,
        RelayState: `/${new ObjectId().toHexString()},true`,
      })

      expect(response.status).toBe(404)
    })

    it('should redirect with isLoginError cookie when destination is valid but attr retrieve fails', async () => {
      mockClient.getAttributes.mockImplementation((_samlArt, _dest, cb) =>
        cb(new Error(''), { relayState: MOCK_RELAY_STATE }),
      )
      const response = await request
        .get(ROUTE)
        .query({ SAMLart: MOCK_CP_SAML, RelayState: MOCK_RELAY_STATE })

      expect(response.status).toBe(302)
      expect(response.headers['set-cookie']).toEqual([
        expect.stringContaining(`isLoginError=true`),
      ])
      expect(response.headers['location']).toEqual(MOCK_DESTINATION)
    })

    it('should redirect with isLoginError cookie when destination is valid but attributes are missing', async () => {
      mockClient.getAttributes.mockImplementation((_samlArt, _dest, cb) =>
        cb(null, { relayState: MOCK_RELAY_STATE }),
      )
      const response = await request
        .get(ROUTE)
        .query({ SAMLart: MOCK_CP_SAML, RelayState: MOCK_RELAY_STATE })

      expect(response.status).toBe(302)
      expect(response.headers['set-cookie']).toEqual([
        expect.stringContaining(`isLoginError=true`),
      ])
      expect(response.headers['location']).toEqual(MOCK_DESTINATION)
    })

    it('should redirect with isLoginError cookie when saving login fails', async () => {
      jest.spyOn(LoginModel, 'addLoginFromForm').mockRejectedValueOnce('')
      const response = await request
        .get(ROUTE)
        .query({ SAMLart: MOCK_CP_SAML, RelayState: MOCK_RELAY_STATE })

      expect(response.status).toBe(302)
      expect(response.headers['set-cookie']).toEqual([
        expect.stringContaining(`isLoginError=true`),
      ])
      expect(response.headers['location']).toEqual(MOCK_DESTINATION)
    })
  })
})
