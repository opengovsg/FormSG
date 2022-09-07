import express from 'express'
import supertest, { Session } from 'supertest-session'

import errorHandlerMiddlewares from '../error-handler'
import parserMiddlewares from '../parser'

describe('error-handler.loader', () => {
  let request: Session
  describe('body-parser errors', () => {
    // Test preparation
    const app = express()
    app
      .use(parserMiddlewares())
      .post('/', (_req, res) => {
        res.sendStatus(200)
      })
      .use(errorHandlerMiddlewares())

    beforeEach(() => {
      request = supertest(app)
    })

    it('should catch invalid json bodies', async () => {
      // Arrange + Act
      const response = await request
        .post('/')
        .send('{"invalid json"}')
        .type('json')

      // Assert
      expect(response.status).toEqual(400)
      expect(response.text).toContain('Unexpected token')
    })
  })
})
