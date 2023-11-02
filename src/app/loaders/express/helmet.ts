import { RequestHandler } from 'express'
import helmet from 'helmet'
import { ContentSecurityPolicyOptions } from 'helmet/dist/types/middlewares/content-security-policy'

import config from '../../config/config'
import { sentryConfig } from '../../config/features/sentry.config'

import { CSP_CORE_DIRECTIVES } from './constants'

const helmetMiddlewares = () => {
  // Only add the "Strict-Transport-Security" header if request is https.
  const hstsMiddleware: RequestHandler = (req, res, next) => {
    if (req.secure) {
      helmet.hsts({ maxAge: 400 * 24 * 60 * 60 })(req, res, next) // 400 days
    } else next()
  }

  const xssFilterMiddleware = helmet.xssFilter()

  const noSniffMiddleware = helmet.noSniff()

  const ieNoOpenMiddlware = helmet.ieNoOpen()

  const dnsPrefetchControlMiddleware = helmet.dnsPrefetchControl()

  const hidePoweredByMiddleware = helmet.hidePoweredBy()

  const referrerPolicyMiddleware = helmet.referrerPolicy({
    policy: 'strict-origin-when-cross-origin',
  })

  const cspCoreDirectives: ContentSecurityPolicyOptions['directives'] =
    CSP_CORE_DIRECTIVES

  const reportUri = sentryConfig.cspReportUri

  const cspOptionalDirectives: ContentSecurityPolicyOptions['directives'] = {}

  // Add on reportUri CSP header if ReportUri exists
  // It is necessary to have the if statement for optional directives because falsey values
  // do not work - e.g. cspOptionalDirectives.reportUri = [false] will still set the reportUri header
  // See https://github.com/helmetjs/csp/issues/36 and
  // https://github.com/helmetjs/helmet/blob/cb170160e7c1ccac314cc19d3b979cfc771f1349/middlewares/content-security-policy/index.ts#L135
  if (reportUri) cspOptionalDirectives.reportUri = [reportUri]

  // Remove upgradeInsecureRequest CSP header if config.isDev
  // See https://github.com/helmetjs/helmet for use of null to disable default
  if (config.isDev) cspOptionalDirectives.upgradeInsecureRequests = null

  const contentSecurityPolicyMiddleware = helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      ...cspCoreDirectives,
      ...cspOptionalDirectives,
    },
  })
  return [
    xssFilterMiddleware,
    noSniffMiddleware,
    ieNoOpenMiddlware,
    dnsPrefetchControlMiddleware,
    hidePoweredByMiddleware,
    hstsMiddleware,
    referrerPolicyMiddleware,
    contentSecurityPolicyMiddleware,
  ]
}

export default helmetMiddlewares
