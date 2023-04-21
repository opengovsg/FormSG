import bodyParser from 'body-parser'
import { RequestHandler } from 'express'
import { set } from 'lodash'

const parserMiddlewares = () => {
  // Convert to application/json before bodyParser to handle SNS
  const convertSnsMessageType: RequestHandler = function (req, res, next) {
    if (req.get('x-amz-sns-message-type')) {
      req.headers['content-type'] = 'application/json;charset=UTF-8'
    }
    return next()
  }

  // processes that must be done before any other middlewares
  const preMiddlewareProcesses = [convertSnsMessageType]

  const bodyParserUrlMiddleWare = bodyParser.urlencoded({
    extended: true,
    limit: '100mb',
  })

  const bodyParserJsonMiddleware = bodyParser.json({
    limit: '40mb',
    // Because Stripe needs the raw body, we compute it but only when hitting the Stripe callback URL.
    verify: function (req, _res, buf) {
      const url = req.url
      if (url?.endsWith('/api/v3/notifications/stripe')) {
        set(req, 'rawBody', buf.toString())
      }
    },
  })

  return [
    ...preMiddlewareProcesses,
    bodyParserUrlMiddleWare,
    bodyParserJsonMiddleware,
  ]
}

export default parserMiddlewares
