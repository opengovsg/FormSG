import request from 'supertest'
import { setupApp } from 'tests/integration/helpers/express-setup'
import dbHandler from 'tests/unit/backend/helpers/jest-db'

import { AuthRouter } from '../auth.routes'

describe('auth.routes', () => {
  const app = setupApp('/auth', AuthRouter)

  beforeAll(async () => await dbHandler.connect())
  beforeEach(async () => await dbHandler.clearDatabase())
  afterAll(async () => await dbHandler.closeDatabase())

  describe('POST /auth/checkuser', () => {
    it('should return 400 when email is not provided as a param', async () => {
      // Act
      const response = await request(app).post('/auth/checkuser')

      // Assert
      expect(response.status).toEqual(400)
      expect(response.text).toEqual('"email" is required')
    })

    it('should return 400 when provided email is invalid', async () => {
      // Arrange
      const invalidEmail = 'not an email'

      // Act
      const response = await request(app)
        .post('/auth/checkuser')
        .send({ email: invalidEmail })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.text).toEqual('Please enter a valid email')
    })

    it('should return 401 when email domain does not exist in Agency collection', async () => {
      // Arrange
      const validEmailWithInvalidDomain = 'test@example.com'

      // Act
      const response = await request(app)
        .post('/auth/checkuser')
        .send({ email: validEmailWithInvalidDomain })

      // Assert
      expect(response.status).toEqual(401)
      expect(response.text).toEqual(
        'This is not a whitelisted public service email domain. Please log in with your official government or government-linked email address.',
      )
    })

    it('should return 200 when email domain exists in Agency collection', async () => {
      // Arrange
      // Insert agency
      const validDomain = 'example.com'
      const validEmail = `test@${validDomain}`
      await dbHandler.insertDefaultAgency({ mailDomain: validDomain })

      const response = await request(app)
        .post('/auth/checkuser')
        .send({ email: validEmail })

      // Assert
      expect(response.status).toEqual(200)
      expect(response.text).toEqual('OK')
    })
  })
})
