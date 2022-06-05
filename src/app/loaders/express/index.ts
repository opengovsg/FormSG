import compression from 'compression'
import connectDatadog from 'connect-datadog'
import express, { Express } from 'express'
import addRequestId from 'express-request-id'
import { StatsD } from 'hot-shots'
import http from 'http'
import { Connection } from 'mongoose'
import nocache from 'nocache'
import path from 'path'
import url from 'url'

import config from '../../config/config'
import { AnalyticsRouter } from '../../modules/analytics/analytics.routes'
import { AuthRouter } from '../../modules/auth/auth.routes'
import { BillingRouter } from '../../modules/billing/billing.routes'
import { BounceRouter } from '../../modules/bounce/bounce.routes'
import { ExamplesRouter } from '../../modules/examples/examples.routes'
import { AdminFormsRouter } from '../../modules/form/admin-form/admin-form.routes'
import { PublicFormRouter } from '../../modules/form/public-form/public-form.routes'
import { FrontendRouter } from '../../modules/frontend/frontend.routes'
import { HomeRouter } from '../../modules/home/home.routes'
import { MYINFO_ROUTER_PREFIX } from '../../modules/myinfo/myinfo.constants'
import { MyInfoRouter } from '../../modules/myinfo/myinfo.routes'
import { SgidRouter } from '../../modules/sgid/sgid.routes'
import {
  CorppassLoginRouter,
  SingpassLoginRouter,
  SpcpRouter,
  SpOidcJwksRouter,
} from '../../modules/spcp/spcp.routes'
import { SubmissionRouter } from '../../modules/submission/submission.routes'
import UserRouter from '../../modules/user/user.routes'
import { VfnRouter } from '../../modules/verification/verification.routes'
import { ApiRouter } from '../../routes/api'
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

  // !!!!! DO NOT CHANGE THE ORDER OF THE NEXT 3 LINES !!!!!
  // The first line redirects requests to /public/fonts to
  // ./dist/frontend/fonts. After that, nocache() ensures that
  // cache headers are not set on requests for fonts, which ensures that
  // fonts are shown correctly on IE11.
  // The last line redirects requests to /public to ./dist/frontend,
  // with cache headers set normally.
  app.use(
    '/public/fonts',
    express.static(path.resolve('./dist/frontend/fonts')),
  )

  app.use(nocache()) // Add headers to prevent browser caching front-end code

  // Generate UUID for request and add it to X-Request-Id header
  app.use(addRequestId())

  // Setting the app static folder
  app.use('/public', express.static(path.resolve('./dist/frontend')))

  // Point crawlers to our robots.txt
  app.use(
    '/robots.txt',
    express.static(path.resolve('./dist/frontend/robots.txt')),
  )

  app.use(sessionMiddlewares(connection))

  app.use(loggingMiddleware())

  // Log intranet usage
  app.use(IntranetMiddleware.logIntranetUsage)

  app.use(
    connectDatadog({
      method: true,
      response_code: true,
      path: false, // !! Important: do not turn this true or the tag cardinality will explode
      dogstatsd: new StatsD({
        useDefaultRoute: true,
      }),
    }),
  )

  app.use('/', HomeRouter)
  app.use('/frontend', FrontendRouter)
  app.use('/auth', AuthRouter)
  app.use('/user', UserRouter)
  app.use('/emailnotifications', BounceRouter)
  app.use('/transaction', VfnRouter)
  app.use('/billing', BillingRouter)
  app.use('/analytics', AnalyticsRouter)
  app.use('/examples', ExamplesRouter)
  app.use('/v2/submissions', SubmissionRouter)
  // Internal routes for Singpass/Corppass
  app.use('/spcp', SpcpRouter)
  // Registered routes with the Singpass/Corppass servers
  app.use('/singpass/login', SingpassLoginRouter)
  app.use('/corppass/login', CorppassLoginRouter)
  // jwks endpoint for SP OIDC
  app.use('/singpass/.well-known/jwks.json', SpOidcJwksRouter)
  // Registered routes with sgID
  app.use('/sgid', SgidRouter)
  // Use constant for registered routes with MyInfo servers
  app.use(MYINFO_ROUTER_PREFIX, MyInfoRouter)
  app.use(AdminFormsRouter)
  app.use(PublicFormRouter)

  // New routes in preparation for API refactor.
  app.use('/api', ApiRouter)

  app.use(sentryMiddlewares())

  app.use(errorHandlerMiddlewares())

  const server = http.createServer(app)

  return server
}

export default loadExpressApp
