import { setupApp } from '__tests__/integration/helpers/express-setup'
import { ObjectId } from 'mongodb'
import session, { Session } from 'supertest-session'

import { LegacyRedirectRouter } from '../legacy-redirect.routes'

const app = setupApp(undefined, LegacyRedirectRouter)

const MOCK_FORM_ID = new ObjectId().toHexString()

describe('legacy-redirect.routes', () => {
  let request: Session

  beforeEach(() => {
    request = session(app)
  })

  describe('GET /:formId/publicform', () => {
    it('should return 301 and redirect to /:formId', async () => {
      // Act
      const response = await request.get(`/${MOCK_FORM_ID}/publicform`)

      // Assert
      expect(response.status).toEqual(301)
      expect(response.text).toContain(`Redirecting to /${MOCK_FORM_ID}`)
    })
  })

  describe('GET /:formId/preview', () => {
    it('should return 301 and redirect to /admin/form/:formId/preview', async () => {
      // Act
      const response = await request.get(`/${MOCK_FORM_ID}/preview`)

      // Assert
      expect(response.status).toEqual(301)
      expect(response.text).toContain(
        `Redirecting to /admin/form/${MOCK_FORM_ID}/preview`,
      )
    })
  })

  describe('GET /:formId/template', () => {
    it('should return 301 and redirect to /admin/form/:formId/use-template', async () => {
      // Act
      const response = await request.get(`/${MOCK_FORM_ID}/template`)

      // Assert
      expect(response.status).toEqual(301)
      expect(response.text).toContain(
        `Redirecting to /admin/form/${MOCK_FORM_ID}/use-template`,
      )
    })
  })

  describe('GET /:formId/use-template', () => {
    it('should return 301 and redirect to /admin/form/:formId/use-template', async () => {
      // Act
      const response = await request.get(`/${MOCK_FORM_ID}/use-template`)

      // Assert
      expect(response.status).toEqual(301)
      expect(response.text).toContain(
        `Redirecting to /admin/form/${MOCK_FORM_ID}/use-template`,
      )
    })
  })

  describe('GET /:formId/embed', () => {
    it('should return 301 and redirect to /:formId', async () => {
      // Act
      const response = await request.get(`/${MOCK_FORM_ID}/embed`)

      // Assert
      expect(response.status).toEqual(301)
      expect(response.text).toContain(`Redirecting to /${MOCK_FORM_ID}`)
    })
  })

  describe('GET /forms/:agency/:formId', () => {
    it('should return 301 and redirect to /:formId', async () => {
      // Act
      const response = await request.get(`/forms/mockagency/${MOCK_FORM_ID}`)

      // Assert
      expect(response.status).toEqual(301)
      expect(response.text).toContain(`Redirecting to /${MOCK_FORM_ID}`)
    })
  })

  describe('GET /forms/:agency/:formId/preview', () => {
    it('should return 301 and redirect to /admin/form/:formId/preview', async () => {
      // Act
      const response = await request.get(
        `/forms/mockagency/${MOCK_FORM_ID}/preview`,
      )

      // Assert
      expect(response.status).toEqual(301)
      expect(response.text).toContain(
        `Redirecting to /admin/form/${MOCK_FORM_ID}/preview`,
      )
    })
  })

  describe('GET /forms/:agency/:formId/template', () => {
    it('should return 301 and redirect to /admin/form/:formId/use-template', async () => {
      // Act
      const response = await request.get(
        `/forms/mockagency/${MOCK_FORM_ID}/template`,
      )

      // Assert
      expect(response.status).toEqual(301)
      expect(response.text).toContain(
        `Redirecting to /admin/form/${MOCK_FORM_ID}/use-template`,
      )
    })
  })

  describe('GET /forms/:agency/:formId/use-template', () => {
    it('should return 301 and redirect to /admin/form/:formId/use-template', async () => {
      // Act
      const response = await request.get(
        `/forms/mockagency/${MOCK_FORM_ID}/use-template`,
      )

      // Assert
      expect(response.status).toEqual(301)
      expect(response.text).toContain(
        `Redirecting to /admin/form/${MOCK_FORM_ID}/use-template`,
      )
    })
  })

  describe('GET /forms/:agency/:formId/embed', () => {
    it('should return 301 and redirect to /:formId', async () => {
      // Act
      const response = await request.get(
        `/forms/mockagency/${MOCK_FORM_ID}/embed`,
      )

      // Assert
      expect(response.status).toEqual(301)
      expect(response.text).toContain(`Redirecting to /${MOCK_FORM_ID}`)
    })
  })
})
