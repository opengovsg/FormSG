import compression from 'compression'
import express, { Router } from 'express'
import mongoose from 'mongoose'
import nocache from 'nocache'
import { Response } from 'supertest'

import { AuthRouter } from 'src/app/modules/auth/auth.routes'
import errorHandlerMiddlewares from 'src/loaders/express/error-handler'
import helmetMiddlewares from 'src/loaders/express/helmet'
import loggingMiddleware from 'src/loaders/express/logging'
import parserMiddlewares from 'src/loaders/express/parser'
import sessionMiddlewares from 'src/loaders/express/session'

export const setupApp = (
  route: string,
  router: Router,
  options: { showLogs?: boolean; setupWithAuth?: boolean } = {},
) => {
  const app = express()

  app.use(compression())
  app.use(parserMiddlewares())
  app.use(helmetMiddlewares())
  app.use(nocache())

  app.use(sessionMiddlewares(mongoose.connection))

  if (options.showLogs) {
    app.use(loggingMiddleware())
  }

  app.use(route, router)

  if (options.setupWithAuth) {
    app.use('/auth', AuthRouter)
  }

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
  #currentCookie = ''

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
