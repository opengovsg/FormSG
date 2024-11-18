import compression from 'compression'
import cookieParser from 'cookie-parser'
import express, { Express, Router } from 'express'
import session from 'express-session'

import { errorHandlerMiddlewares } from 'src/app/loaders/express/error-handler'
import helmetMiddlewares from 'src/app/loaders/express/helmet'
import loggingMiddleware from 'src/app/loaders/express/logging'
import parserMiddlewares from 'src/app/loaders/express/parser'
import { AuthRouter } from 'src/app/routes/api/v3/auth/auth.routes'

// Special session middleware that only uses the memory store.
const testSessionMiddlewares = () => {
  // Configure express-session and connect to mongo
  const expressSession = session({
    saveUninitialized: false,
    resave: false,
    secret: 'test-session-secret',
    name: 'formsg.connect.sid',
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
