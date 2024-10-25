import compression from 'compression'
import express, { Express } from 'express'
import addRequestId from 'express-request-id'
import http from 'http'
import { Connection } from 'mongoose'
import path from 'path'
import url from 'url'

import config from '../../config/config'
import { FrontendRouter } from '../../modules/frontend/frontend.routes'
import * as IntranetMiddleware from '../../modules/intranet/intranet.middleware'
import {
  LEGACY_MYINFO_ROUTER_PREFIX,
  MYINFO_ROUTER_PREFIX,
} from '../../modules/myinfo/myinfo.constants'
import { MyInfoRouter } from '../../modules/myinfo/myinfo.routes'
import { SgidRouter } from '../../modules/sgid/sgid.routes'
import { ApiRouter } from '../../routes/api'
import { LegacyRedirectRouter } from '../../routes/legacy-redirect'
import { SpOidcJwksRouter } from '../../routes/singpass'

import {
  catchNonExistentStaticRoutesMiddleware,
  errorHandlerMiddlewares,
} from './error-handler'
import growthbookMiddleware from './growthbook'
import helmetMiddlewares from './helmet'
import appLocals from './locals'
import loggingMiddleware from './logging'
import parserMiddlewares from './parser'
import sessionMiddlewares from './session'

const loadExpressApp = async (connection: Connection) => {
  // Initialize express app.
  let app = express()
  app.locals = appLocals

  const getConfigFunctionFor = (environment: string) => {
    switch (environment) {
      case 'production': {
        return function (app: Express) {
          // Trust the load balancer that is in front of the server
          app.set('trust proxy', true)
          return app
        }
      }
      default:
        return null
    }
  }

  const configureEnvironmentFor = getConfigFunctionFor(config.nodeEnv)
  if (configureEnvironmentFor) {
    app = configureEnvironmentFor(app)
  }

  app.use(function (req, res, next) {
    const urlPath = url.parse(req.url).path?.split('/') ?? []
    if (
      urlPath.indexOf('static') > -1 &&
      urlPath.indexOf('view') === urlPath.indexOf('static') - 1
    ) {
      urlPath.splice(1, 1)
      req.url = urlPath.join('/')
    }
    return next()
  })

  // Passing the request url to environment locals
  app.use(function (req, res, next) {
    res.locals.url = req.protocol + '://' + req.headers.host + req.url
    return next()
  })

  // Should be placed before express.static
  app.use(
    compression({
      // only compress files for the following content types
      filter: function (_req, res) {
        return /json|text|javascript|css/.test(res.get('content-type') ?? '')
      },
      // zlib option for compression level
      level: 9,
    }),
  )

  // Showing stack errors
  app.set('showStackError', true)

  // Set EJS as the template engine
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  app.engine('server.view.html', require('ejs').__express)

  // Set views path and view engine
  app.set('view engine', 'server.view.html')
  app.set('views', './src/app/views')

  app.use(parserMiddlewares())

  app.use(helmetMiddlewares())

  // Generate UUID for request and add it to X-Request-Id header
  app.use(addRequestId())

  app.use(sessionMiddlewares(connection))

  app.use(loggingMiddleware())

  // Log intranet usage
  app.use(IntranetMiddleware.logIntranetUsage)

  // Growthbook should not be enabled in test environment to avoid flakiness
  if (!config.isTest) {
    app.use(growthbookMiddleware)
  }

  // jwks endpoint for SP OIDC
  app.use('/singpass/.well-known/jwks.json', SpOidcJwksRouter)
  // Registered routes with sgID
  app.use('/sgid', SgidRouter)
  // Use constant for registered routes with MyInfo servers
  app.use(LEGACY_MYINFO_ROUTER_PREFIX, MyInfoRouter)
  app.use(MYINFO_ROUTER_PREFIX, MyInfoRouter)

  // Legacy frontend routes which may still be in use
  app.use(LegacyRedirectRouter)

  // API routes
  app.use('/api', ApiRouter)

  // serve static assets. `dist/frontend` contains the root files as well as a `/static` folder
  // express.static calls next() if the file is not found
  app.use(express.static(path.resolve('dist/frontend'), { index: false }))

  // If requests for known static asset patterns were not served by
  // the static handlers above, middleware should try to fetch from s3 static bucket or else return 404s
  app.get(
    /^\/(public|static|\.well-known)\//,
    catchNonExistentStaticRoutesMiddleware,
  )

  // Requests for root files (e.g. /robots.txt or /favicon.ico) that were
  // not served statically above will also return 404
  app.get(/^\/[^/]+\.[a-z]+$/, catchNonExistentStaticRoutesMiddleware)

  app.use('/', FrontendRouter)

  app.use(errorHandlerMiddlewares())

  const server = http.createServer(app)

  return server
}

export default loadExpressApp
