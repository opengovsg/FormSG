import bodyParser from 'body-parser'
import { RequestHandler } from 'express'
import { set } from 'lodash'

const parserMiddlewares = () => {
  const saveStripeWebhookRawBody = bodyParser.json({
    // Because Stripe needs the raw body, we compute it but only when hitting the Stripe callback URL.
    limit: '40mb',
    verify: function (req, _res, buf) {
      const url = req.url
      if (url?.endsWith('/api/v3/notifications/stripe')) {
        set(req, 'rawBody', buf.toString())
      }
    },
  })

  // Convert to application/json before bodyParser to handle SNS
  const convertSnsMessageType: RequestHandler = function (req, res, next) {
    if (req.get('x-amz-sns-message-type')) {
      req.headers['content-type'] = 'application/json;charset=UTF-8'
    }
    return next()
  }

  const bodyParserMiddleWare = bodyParser.urlencoded({
    extended: true,
    limit: '100mb',
  })

  // In particular, this enforces that encrypted content of submissions be less than 10MB
  // const limitJsonLimit = bodyParser.json({ limit: '40mb' })

  return [
    saveStripeWebhookRawBody,
    convertSnsMessageType,
    bodyParserMiddleWare,
    // limitJsonLimit,
  ]
}

export default parserMiddlewares
