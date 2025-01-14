import { setupApp } from '__tests__/integration/helpers/express-setup'
import fs from 'fs'
import session, { Session } from 'supertest-session'

import { MOCK_SERVICE_PARAMS } from '../../../modules/spcp/__tests__/spcp.test.constants'
import { SpOidcJwksRouter } from '../sp.oidc.jwks.routes'

const app = setupApp('/sp/.well-known/jwks.json', SpOidcJwksRouter)

describe('sp.oidc.jwks.router', () => {
  let request: Session

  beforeEach(() => {
    request = session(app)
  })

  describe('GET /sp/.well-known/jwks.json', () => {
    it('should return 200 with the public jwks', async () => {
      // Act
      const response = await request.get('/sp/.well-known/jwks.json')

      const responseJson = JSON.parse(response.text)
      const expectedJson = JSON.parse(
        fs.readFileSync(MOCK_SERVICE_PARAMS.spOidcRpJwksPublicPath).toString(),
      )

      // Assert
      expect(response.status).toEqual(200)
      expect(responseJson).toMatchObject(expectedJson)
    })
  })
})
