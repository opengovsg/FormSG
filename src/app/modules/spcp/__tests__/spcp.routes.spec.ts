import session, { Session } from 'supertest-session'

import { setupApp } from 'tests/integration/helpers/express-setup'
import { buildCelebrateError } from 'tests/unit/backend/helpers/celebrate'

import { SpcpRouter } from '../spcp.routes'

import { MOCK_ESRVCID, MOCK_TARGET } from './spcp.test.constants'

const spcpApp = setupApp('/spcp', SpcpRouter)

describe('GET /spcp/redirect', () => {
  let request: Session

  beforeEach(() => {
    jest.clearAllMocks()
    request = session(spcpApp)
  })

  it('should return 400 when authType is not provided as a query param', async () => {
    const response = await request
      .get('/spcp/redirect')
      .query({ target: MOCK_TARGET, esrvcId: MOCK_ESRVCID })

    expect(response.status).toBe(400)
    expect(response.body).toEqual(
      buildCelebrateError({ query: { key: 'authType' } }),
    )
  })

  it('should return 400 when authType is malformed', async () => {
    const response = await request.get('/spcp/redirect').query({
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
      .get('/spcp/redirect')
      .query({ authType: 'SP', esrvcId: MOCK_ESRVCID })

    expect(response.status).toBe(400)
    expect(response.body).toEqual(
      buildCelebrateError({ query: { key: 'target' } }),
    )
  })

  it('should return 400 when esrvcId is not provided as a query param', async () => {
    const response = await request
      .get('/spcp/redirect')
      .query({ authType: 'CP', target: MOCK_TARGET })

    expect(response.status).toBe(400)
    expect(response.body).toEqual(
      buildCelebrateError({ query: { key: 'esrvcId' } }),
    )
  })

  it('should return 200 with the redirect URL when Singpass request is valid', async () => {
    const response = await request
      .get('/spcp/redirect')
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
