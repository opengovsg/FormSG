import expressWinston from 'express-winston'
import get from 'lodash/get'
import winston from 'winston'

import config from '../../config/config'
import { customFormat } from '../../config/logger'

const LOGGER_LABEL = 'network'

type LogMeta = {
  clientIp: string
  userId: string
  contentLength?: string
  transactionId?: string
}

const loggingMiddleware = () => {
  const expressLogger = expressWinston.logger({
    transports: [new winston.transports.Console()],
    format: winston.format.combine(
      winston.format.label({ label: LOGGER_LABEL }),
      winston.format.timestamp(),
      config.isDev
        ? winston.format.combine(winston.format.colorize(), customFormat)
        : winston.format.json(),
    ),
    expressFormat: true,
    // Set dynamic log level according to status codes
    level: function (req, res) {
      let level = ''
      if (res.statusCode >= 100) {
        level = 'info'
      }
      if (res.statusCode >= 400) {
        level = 'warn'
      }
      if (res.statusCode >= 500) {
        level = 'error'
      }
      return level
    },
    dynamicMeta: (req, res) => {
      const meta: LogMeta = {
        // Define our own token for client ip
        // req.headers['cf-connecting-ip'] : Cloudflare
        // req.ip : Contains the remote IP address of the request.
        // If trust proxy setting is true, the value of this property is
        // derived from the left-most entry in the X-Forwarded-For header.
        // This header can be set by the client or by the proxy.
        // If trust proxy setting is false, the app is understood as directly
        // facing the Internet and the client’s IP address is derived from
        // req.connection.remoteAddress.
        clientIp: req.get('cf-connecting-ip') || req.ip,
        userId: get(req, 'session.user._id', ''),
      }

      const contentLength = res.get('content-length')
      const transactionId = req.params.transactionId

      if (contentLength) {
        meta.contentLength = contentLength
      }

      if (transactionId) {
        meta.transactionId = transactionId
      }
      return meta
    },
    headerBlacklist: ['cookie'],
    ignoredRoutes: ['/'],
    skip: (req, res) => {
      // Skip if it's ELB-HealthChecker to avoid polluting logs
      const userAgent = req.get('user-agent') || ''
      if (userAgent.startsWith('ELB-HealthChecker')) return true

      const contentType = res.get('content-type') || ''
      // Do not skip if it's a server error starting with 5
      if (String(res.statusCode).startsWith('5')) return false

      // Skip if the returned response is not json or not text/html
      return !(
        contentType.startsWith('application/json') ||
        contentType.startsWith('text/html') ||
        contentType.startsWith('text/plain')
      )
    },
  })

  return expressLogger
}

export default loggingMiddleware
