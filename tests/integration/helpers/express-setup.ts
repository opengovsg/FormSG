import compression from 'compression'
import express, { Router } from 'express'
import helmet from 'helmet'
import mongoose from 'mongoose'
import { Response } from 'supertest'

import errorHandlerMiddlewares from 'src/loaders/express/error-handler'
import helmetMiddlewares from 'src/loaders/express/helmet'
import loggingMiddleware from 'src/loaders/express/logging'
import parserMiddlewares from 'src/loaders/express/parser'
import sessionMiddlewares from 'src/loaders/express/session'

export const setupApp = (
  route: string,
  router: Router,
  options: { showLogs?: boolean } = {},
) => {
  const app = express()

  app.use(compression())
  app.use(parserMiddlewares())
  app.use(helmetMiddlewares())
  app.use(helmet.noCache())

  app.use(sessionMiddlewares(mongoose.connection))

  if (options.showLogs) {
    app.use(loggingMiddleware())
  }

  app.use(route, router)

  app.use(errorHandlerMiddlewares())

  return app
}

/**
 * Helper class to store cookies for routes that require authorization. 
 * @example
 * request
    .post('/some/route/that/requires/auth')
    .set('cookie', cookieStore.get());
 */
export class CookieStore {
  #currentCookie: string = ''

  handleCookie(res: Response) {
    this.set(res.header['set-cookie'][0])
  }

  set(cookie: string) {
    this.#currentCookie = cookie
  }

  get() {
    return this.#currentCookie
  }

  clear() {
    this.#currentCookie = ''
  }
}
