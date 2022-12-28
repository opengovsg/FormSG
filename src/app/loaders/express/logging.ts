import expressWinston from 'express-winston'
import get from 'lodash/get'
import winston from 'winston'

import config from '../../config/config'
import { customFormat } from '../../config/logger'
import { getRequestIp, getTrace } from '../../utils/request'

const LOGGER_LABEL = 'network'

type LogMeta = {
  clientIp: string
  userId: string
  contentLength?: string
  transactionId?: string
  trace?: string
  reactMigration?: {
    respRolloutEmail: number
    respRolloutStorage: number
    adminRollout: number
    qaCookie: string | undefined
    adminCookieOld: string | undefined
    adminCookie: string | undefined
    respCookie: string | undefined
  }
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
        userId: get(req, 'session.user._id', ''),
        // Don't use ...createReqMeta(req) here because
        // headers and url are already in meta;
        // dynamicMeta is for additional information
        clientIp: getRequestIp(req),
        trace: getTrace(req),
      }

      const contentLength = res.get('content-length')
      const transactionId = req.params.transactionId

      if (contentLength) {
        meta.contentLength = contentLength
      }

      if (transactionId) {
        meta.transactionId = transactionId
      }

      // Temporary: cookies are blacklisted, but we to track the state of the rollout for this particular request
      if (
        req.cookies?.[config.reactMigration.adminCookieNameOld] ||
        req.cookies?.[config.reactMigration.adminCookieName] ||
        req.cookies?.[config.reactMigration.respondentCookieName] ||
        req.cookies?.[config.reactMigration.qaCookieName]
      ) {
        meta.reactMigration = {
          respRolloutEmail: config.reactMigration.respondentRolloutEmail,
          respRolloutStorage: config.reactMigration.respondentRolloutStorage,
          adminRollout: config.reactMigration.adminRollout,
          qaCookie: req.cookies?.[config.reactMigration.qaCookieName],
          adminCookieOld:
            req.cookies?.[config.reactMigration.adminCookieNameOld],
          adminCookie: req.cookies?.[config.reactMigration.adminCookieName],
          respCookie: req.cookies?.[config.reactMigration.respondentCookieName],
        }
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
