import { celebrate, Joi, Segments } from 'celebrate'
import express from 'express'
import supertest, { Session } from 'supertest-session'

import {
  adminFormErrorKey,
  attachAdminFormErrorI18n,
} from '../../../modules/form/admin-form/admin-form.i18n'
import { errorHandlerMiddlewares } from '../error-handler'
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
      expect(response.text).toContain('"message":"Expected \':\'')
    })
  })

  describe('Celebrate errors', () => {
    const app = express()
    app
      .use(express.json())
      .post(
        '/',
        celebrate({
          [Segments.BODY]: Joi.object({
            buttonLink: attachAdminFormErrorI18n(
              Joi.string()
                .uri({ scheme: ['http', 'https'] })
                .message('Please enter a valid HTTP or HTTPS URI'),
              adminFormErrorKey('endPage.invalidUrl'),
            ),
          }),
        }),
        (_req, res) => res.sendStatus(200),
      )
      .use(errorHandlerMiddlewares())

    beforeEach(() => {
      request = supertest(app)
    })

    it('adds i18n metadata while retaining the Celebrate payload', async () => {
      const response = await request
        .post('/')
        .send({ buttonLink: 'not-a-url' })
        .type('json')

      expect(response.status).toEqual(400)
      expect(response.body).toMatchObject({
        message: 'Please enter a valid HTTP or HTTPS URI',
        messageKey: 'features.adminForm.backendErrors.endPage.invalidUrl',
        validation: {
          body: {
            message: 'Please enter a valid HTTP or HTTPS URI',
          },
        },
      })
    })
  })
})
