import bodyParser from 'body-parser'
import { RequestHandler } from 'express'

const parserMiddlewares = () => {
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
  const limitJsonLimit = bodyParser.json({ limit: '40mb' })

  return [convertSnsMessageType, bodyParserMiddleWare, limitJsonLimit]
}

export default parserMiddlewares
