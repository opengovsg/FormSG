import compression from 'compression'
import express, { Express } from 'express'
import addRequestId from 'express-request-id'
import http from 'http'
import { Connection } from 'mongoose'
import path from 'path'
import url from 'url'

import config from '../../config/config'
import { AuthRouter } from '../../modules/auth/auth.routes'
import { ExamplesRouter } from '../../modules/examples/examples.routes'
import { AdminFormsRouter } from '../../modules/form/admin-form/admin-form.routes'
import { PublicFormRouter } from '../../modules/form/public-form/public-form.routes'
import { FrontendRouter } from '../../modules/frontend/frontend.routes'
import * as HomeController from '../../modules/home/home.controller'
import { MYINFO_ROUTER_PREFIX } from '../../modules/myinfo/myinfo.constants'
import { MyInfoRouter } from '../../modules/myinfo/myinfo.routes'
import { ReactMigrationRouter } from '../../modules/react-migration/react-migration.routes'
import { SgidRouter } from '../../modules/sgid/sgid.routes'
import { SubmissionRouter } from '../../modules/submission/submission.routes'
import { VfnRouter } from '../../modules/verification/verification.routes'
import { ApiRouter } from '../../routes/api'
import { SpOidcJwksRouter } from '../../routes/singpass'
import * as IntranetMiddleware from '../../services/intranet/intranet.middleware'

import errorHandlerMiddlewares from './error-handler'
import helmetMiddlewares from './helmet'
import appLocals from './locals'
import loggingMiddleware from './logging'
import parserMiddlewares from './parser'
import sentryMiddlewares from './sentry'
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
        return /json|text|javascript|css/.test(res.get('content-type'))
      },
      // zlib option for compression level
      level: 9,
    }),
  )

  // Showing stack errors
  app.set('showStackError', true)

  // Set EJS as the template engine
  // eslint-disable-next-line @typescript-eslint/no-var-requires
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

  // Deprecated routes
  app.use('/frontend', FrontendRouter)
  app.use('/auth', AuthRouter)
  app.use('/transaction', VfnRouter)
  app.use('/examples', ExamplesRouter)
  app.use('/v2/submissions', SubmissionRouter)

  // jwks endpoint for SP OIDC
  app.use('/singpass/.well-known/jwks.json', SpOidcJwksRouter)
  // Registered routes with sgID
  app.use('/sgid', SgidRouter)
  // Use constant for registered routes with MyInfo servers
  app.use(MYINFO_ROUTER_PREFIX, MyInfoRouter)

  // Deprecated routes, must be here since API starts with form id regex prefix.
  app.use(AdminFormsRouter)
  app.use(PublicFormRouter)

  // New routes in preparation for API refactor.
  app.use('/api', ApiRouter)

  app.use(express.static(path.resolve('dist/frontend'), { index: false }))
  app.use('/public', express.static(path.resolve('dist/angularjs')))
  app.get('/old/', HomeController.home)

  app.use('/', ReactMigrationRouter)

  app.use(sentryMiddlewares())
  app.use(errorHandlerMiddlewares())

  const server = http.createServer(app)

  return server
}

export default loadExpressApp
