import axios from 'axios'
import session, { Session } from 'supertest-session'
import { mocked } from 'ts-jest/utils'

import { setupApp } from 'tests/integration/helpers/express-setup'
import { buildCelebrateError } from 'tests/unit/backend/helpers/celebrate'

import { SpcpRouter } from '../spcp.routes'

import {
  MOCK_ERROR_CODE,
  MOCK_ESRVCID,
  MOCK_TARGET,
} from './spcp.test.constants'

jest.mock('axios')
const MockAxios = mocked(axios, true)
const spcpApp = setupApp('/spcp', SpcpRouter)

describe('spcp.routes', () => {
  let request: Session

  beforeEach(() => {
    jest.clearAllMocks()
    request = session(spcpApp)
  })

  describe('GET /spcp/redirect', () => {
    const ROUTE = '/spcp/redirect'

    it('should return 400 when authType is not provided as a query param', async () => {
      const response = await request
        .get(ROUTE)
        .query({ target: MOCK_TARGET, esrvcId: MOCK_ESRVCID })

      expect(response.status).toBe(400)
      expect(response.body).toEqual(
        buildCelebrateError({ query: { key: 'authType' } }),
      )
    })

    it('should return 400 when authType is malformed', async () => {
      const response = await request.get(ROUTE).query({
        authType: 'malformed',
        target: MOCK_TARGET,
        esrvcId: MOCK_ESRVCID,
      })

      expect(response.status).toBe(400)
      expect(response.body).toEqual(
        buildCelebrateError({
          query: {
            key: 'authType',
            message: '"authType" must be one of [SP, CP]',
          },
        }),
      )
    })

    it('should return 400 when target is not provided as a query param', async () => {
      const response = await request
        .get(ROUTE)
        .query({ authType: 'SP', esrvcId: MOCK_ESRVCID })

      expect(response.status).toBe(400)
      expect(response.body).toEqual(
        buildCelebrateError({ query: { key: 'target' } }),
      )
    })

    it('should return 400 when esrvcId is not provided as a query param', async () => {
      const response = await request
        .get(ROUTE)
        .query({ authType: 'CP', target: MOCK_TARGET })

      expect(response.status).toBe(400)
      expect(response.body).toEqual(
        buildCelebrateError({ query: { key: 'esrvcId' } }),
      )
    })

    it('should return 200 with the redirect URL when Singpass request is valid', async () => {
      const response = await request
        .get(ROUTE)
        .query({ authType: 'SP', target: MOCK_TARGET, esrvcId: MOCK_ESRVCID })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        redirectURL: expect.any(String),
      })
    })

    it('should return 200 with the redirect URL when Corppass request is valid', async () => {
      const response = await request
        .get('/spcp/redirect')
        .query({ authType: 'CP', target: MOCK_TARGET, esrvcId: MOCK_ESRVCID })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        redirectURL: expect.any(String),
      })
    })
  })

  describe('GET /spcp/validate', () => {
    const ROUTE = '/spcp/validate'
    it('should return 400 when authType is not provided as a query param', async () => {
      const response = await request
        .get(ROUTE)
        .query({ target: MOCK_TARGET, esrvcId: MOCK_ESRVCID })

      expect(response.status).toBe(400)
      expect(response.body).toEqual(
        buildCelebrateError({ query: { key: 'authType' } }),
      )
    })

    it('should return 400 when authType is malformed', async () => {
      const response = await request.get(ROUTE).query({
        authType: 'malformed',
        target: MOCK_TARGET,
        esrvcId: MOCK_ESRVCID,
      })

      expect(response.status).toBe(400)
      expect(response.body).toEqual(
        buildCelebrateError({
          query: {
            key: 'authType',
            message: '"authType" must be one of [SP, CP]',
          },
        }),
      )
    })

    it('should return 400 when target is not provided as a query param', async () => {
      const response = await request
        .get(ROUTE)
        .query({ authType: 'SP', esrvcId: MOCK_ESRVCID })

      expect(response.status).toBe(400)
      expect(response.body).toEqual(
        buildCelebrateError({ query: { key: 'target' } }),
      )
    })

    it('should return 400 when esrvcId is not provided as a query param', async () => {
      const response = await request
        .get(ROUTE)
        .query({ authType: 'CP', target: MOCK_TARGET })

      expect(response.status).toBe(400)
      expect(response.body).toEqual(
        buildCelebrateError({ query: { key: 'esrvcId' } }),
      )
    })

    it('should return 200 with isValid true when Singpass request is valid', async () => {
      MockAxios.get.mockResolvedValueOnce({ data: '<title>Title</title>' })
      const response = await request
        .get(ROUTE)
        .query({ authType: 'SP', target: MOCK_TARGET, esrvcId: MOCK_ESRVCID })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        isValid: true,
      })
    })

    it('should return 200 with isValid true when Corppass request is valid', async () => {
      MockAxios.get.mockResolvedValueOnce({ data: '<title>Title</title>' })
      const response = await request
        .get(ROUTE)
        .query({ authType: 'CP', target: MOCK_TARGET, esrvcId: MOCK_ESRVCID })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        isValid: true,
      })
    })

    it('should return 200 with isValid false and errorCode when Singpass request is invalid', async () => {
      MockAxios.get.mockResolvedValueOnce({
        data: `<title>Error</title>System Code:&nbsp<b>${MOCK_ERROR_CODE}</b>`,
      })
      const response = await request
        .get(ROUTE)
        .query({ authType: 'SP', target: MOCK_TARGET, esrvcId: MOCK_ESRVCID })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        isValid: false,
        errorCode: MOCK_ERROR_CODE,
      })
    })

    it('should return 200 with isValid false and errorCode when Corppass request is invalid', async () => {
      MockAxios.get.mockResolvedValueOnce({
        data: `<title>Error</title>System Code:&nbsp<b>${MOCK_ERROR_CODE}</b>`,
      })
      const response = await request
        .get(ROUTE)
        .query({ authType: 'CP', target: MOCK_TARGET, esrvcId: MOCK_ESRVCID })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        isValid: false,
        errorCode: MOCK_ERROR_CODE,
      })
    })

    it('should return 503 with error message when Singpass server request errors', async () => {
      MockAxios.get.mockRejectedValueOnce('')
      const response = await request
        .get(ROUTE)
        .query({ authType: 'SP', target: MOCK_TARGET, esrvcId: MOCK_ESRVCID })

      expect(response.status).toBe(503)
      expect(response.body).toEqual({
        message: 'Failed to contact SingPass. Please try again.',
      })
    })

    it('should return 503 with error message when Corppass server request errors', async () => {
      MockAxios.get.mockRejectedValueOnce('')
      const response = await request
        .get(ROUTE)
        .query({ authType: 'CP', target: MOCK_TARGET, esrvcId: MOCK_ESRVCID })

      expect(response.status).toBe(503)
      expect(response.body).toEqual({
        message: 'Failed to contact SingPass. Please try again.',
      })
    })

    it('should return 502 with error message when Singpass server response cannot be parsed', async () => {
      MockAxios.get.mockResolvedValueOnce({
        data: `mock`,
      })
      const response = await request
        .get(ROUTE)
        .query({ authType: 'SP', target: MOCK_TARGET, esrvcId: MOCK_ESRVCID })

      expect(response.status).toBe(502)
      expect(response.body).toEqual({
        message: 'Error while contacting SingPass. Please try again.',
      })
    })

    it('should return 502 with error message when Corppass server response cannot be parsed', async () => {
      MockAxios.get.mockResolvedValueOnce({
        data: `mock`,
      })
      const response = await request
        .get(ROUTE)
        .query({ authType: 'CP', target: MOCK_TARGET, esrvcId: MOCK_ESRVCID })

      expect(response.status).toBe(502)
      expect(response.body).toEqual({
        message: 'Error while contacting SingPass. Please try again.',
      })
    })
  })
})
