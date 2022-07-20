import fs from 'fs'
import session, { Session } from 'supertest-session'

import { setupApp } from 'tests/integration/helpers/express-setup'

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
})
