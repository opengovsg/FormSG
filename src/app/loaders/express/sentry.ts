import { RequestHandler } from 'express'

import config from '../../config/config'

const sentryMiddlewares = () => {
  const sentryHeadersMiddleware: RequestHandler = (req, res, next) => {
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', config.app.appUrl)

    // Request methods you wish to allow
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, OPTIONS, PUT, PATCH, DELETE',
    )

    // Request headers you wish to allow
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-Requested-With,content-type',
    )

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', 'true')

    // Pass to next layer of middleware
    return next()
  }

  return [sentryHeadersMiddleware]
}

export default sentryMiddlewares
