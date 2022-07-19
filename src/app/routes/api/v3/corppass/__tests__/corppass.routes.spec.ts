import fs from 'fs'
import session, { Session } from 'supertest-session'

import { setupApp } from 'tests/integration/helpers/express-setup'

import { buildCelebrateError } from '../../../../../../../tests/unit/backend/helpers/celebrate'
import { MOCK_SERVICE_PARAMS } from '../../../../../modules/spcp/__tests__/spcp.test.constants'
import { CorppassOidcRouter } from '../corppass.routes'

describe('corppass.oidc.router', () => {
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
    it('should return 400 if code param does not exist', async () => {
      // Act
      const response = await request.get('/corppass/login').query({
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
      const response = await request.get('/corppass/login').query({
        code: 'code',
      })

      // Assert

      expect(response.status).toEqual(400)
      expect(response.body).toEqual(
        buildCelebrateError({ query: { key: 'state' } }),
      )
    })
  })
})
