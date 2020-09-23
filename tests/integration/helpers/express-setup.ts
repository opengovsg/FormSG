import compression from 'compression'
import express, { Express, Router } from 'express'
import mongoose from 'mongoose'
import nocache from 'nocache'

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
): Express => {
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
