import compression from 'compression'
import express, { Express } from 'express'
import device from 'express-device'
import helmet from 'helmet'
import http from 'http'
import { Connection } from 'mongoose'
import path from 'path'
import url from 'url'

import apiRoutes from '../../app/routes'
import config from '../../config/config'

import errorHandlerMiddlewares from './error-handler'
import helmetMiddlewares from './helmet'
import appLocals from './locals'
import loggingMiddleware from './logging'
import parserMiddlewares from './parser'
import sentryMiddlewares from './sentry'
import sessionMiddlewares from './session'

const loadExpressApp = async (connection: Connection) => {
  // Initialize express app
  let app = express()
  app.locals = appLocals

  const environmentConfigs = {
    production(app: Express) {
      // Add x-forwarded-proto headers to handle https cookie,
      // and trust the proxy that is in front of you
      app.use(function (req, res, next) {
        req.headers['x-forwarded-proto'] = 'https'
        return next()
      })
      app.set('trust proxy', 1)
      return app
    },
  }

  const configureEnvironmentFor = environmentConfigs[config.nodeEnv]
  if (typeof configureEnvironmentFor === 'function') {
    app = configureEnvironmentFor(app)
  }

  app.use(function (req, res, next) {
    let urlPath = url.parse(req.url).path.split('/')
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
  // ./dist/frontend/fonts. After that, helmet.noCache() ensures that
  // cache headers are not set on requests for fonts, which ensures that
  // fonts are shown correctly on IE11.
  // The last line redirects requests to /public to ./dist/frontend,
  // with cache headers set normally.
  app.use(
    '/public/fonts',
    express.static(path.resolve('./dist/frontend/fonts')),
  )

  app.use(helmet.noCache()) // Add headers to prevent browser caching front-end code

  // Setting the app static folder
  app.use('/public', express.static(path.resolve('./dist/frontend')))

  // Point crawlers to our robots.txt
  app.use(
    '/robots.txt',
    express.static(path.resolve('./dist/frontend/robots.txt')),
  )

  app.use(sessionMiddlewares(connection))

  app.use(loggingMiddleware())

  // setup express-device
  app.use(device.capture({ parseUserAgent: true }))

  // Mount all API endpoints
  apiRoutes.forEach(function (routeFunction) {
    routeFunction(app)
  })

  app.use(sentryMiddlewares())

  app.use(errorHandlerMiddlewares())

  const server = http.createServer(app)

  return server
}

export default loadExpressApp
