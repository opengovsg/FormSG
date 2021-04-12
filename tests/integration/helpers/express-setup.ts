import compression from 'compression'
import cookieParser from 'cookie-parser'
import express, { Express, Router } from 'express'
import session from 'express-session'
import nocache from 'nocache'

import { AuthRouter } from 'src/app/modules/auth/auth.routes'
import errorHandlerMiddlewares from 'src/loaders/express/error-handler'
import helmetMiddlewares from 'src/loaders/express/helmet'
import loggingMiddleware from 'src/loaders/express/logging'
import parserMiddlewares from 'src/loaders/express/parser'

// Special session middleware that only uses the memory store.
const testSessionMiddlewares = () => {
  // Configure express-session and connect to mongo
  const expressSession = session({
    saveUninitialized: false,
    resave: false,
    secret: 'test-session-secret',
    name: 'connect.sid',
    store: new session.MemoryStore(),
  })

  return [
    cookieParser(), // CookieParser should be above session
    expressSession,
  ]
}

export const setupApp = (
  route: string | undefined,
  router: Router,
  options: { showLogs?: boolean; setupWithAuth?: boolean } = {},
): Express => {
  const app = express()

  app.use(compression())
  app.use(parserMiddlewares())
  app.use(helmetMiddlewares())
  app.use(nocache())

  app.use(testSessionMiddlewares())

  if (options.showLogs) {
    app.use(loggingMiddleware())
  }

  if (options.setupWithAuth) {
    app.use('/auth', AuthRouter)
  }

  if (route) {
    app.use(route, router)
  } else {
    app.use(router)
  }

  app.use(errorHandlerMiddlewares())

  return app
}
