import { RequestHandler } from 'express'
import helmet from 'helmet'
import { ContentSecurityPolicyOptions } from 'helmet/dist/types/middlewares/content-security-policy'

import config from '../../config/config'
import { sentryConfig } from '../../config/features/sentry.config'

const helmetMiddlewares = () => {
  // Only add the "Strict-Transport-Security" header if request is https.
  const hstsMiddleware: RequestHandler = (req, res, next) => {
    if (req.secure) {
      helmet.hsts({ maxAge: 5184000 })(req, res, next) // 60 days
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

  const cspCoreDirectives: ContentSecurityPolicyOptions['directives'] = {
    imgSrc: [
      "'self'",
      'blob:',
      'data:',
      'https://www.googletagmanager.com/', // TODO #4279: This is used for Universal Analytics, so remove after react rollout
      'https://www.google-analytics.com/',
      `https://s3-${config.aws.region}.amazonaws.com/agency.form.sg/`, // Agency logos
      config.aws.imageBucketUrl, // Image field
      config.aws.logoBucketUrl, // Form logo
      '*', // TODO: Remove when we host our own images for Image field and Form Logo
      'https://*.google-analytics.com', // GA4 https://developers.google.com/tag-platform/tag-manager/web/csp
      'https://*.googletagmanager.com',
    ],
    fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com/'],
    scriptSrc: [
      "'self'",
      'https://www.googletagmanager.com/',
      'https://ssl.google-analytics.com/',
      'https://www.google-analytics.com/',
      'https://www.tagmanager.google.com/',
      'https://www.google.com/recaptcha/',
      'https://www.recaptcha.net/recaptcha/',
      'https://www.gstatic.com/recaptcha/',
      'https://www.gstatic.cn/',
      'https://*.googletagmanager.com', // GA4 https://developers.google.com/tag-platform/tag-manager/web/csp
    ],
    connectSrc: [
      "'self'",
      'https://www.google-analytics.com/',
      'https://ssl.google-analytics.com/',
      'https://*.browser-intake-datadoghq.com', // https://docs.datadoghq.com/real_user_monitoring/faq/content_security_policy/
      'https://sentry.io/api/',
      config.aws.attachmentBucketUrl, // Attachment downloads
      config.aws.imageBucketUrl, // Image field
      config.aws.logoBucketUrl, // Form logo
      'https://*.google-analytics.com', // GA4 https://developers.google.com/tag-platform/tag-manager/web/csp
      'https://*.analytics.google.com',
      'https://*.googletagmanager.com',
    ],
    frameSrc: [
      "'self'",
      'https://www.google.com/recaptcha/',
      'https://www.recaptcha.net/recaptcha/',
    ],
    styleSrc: [
      "'self'",
      'https://www.google.com/recaptcha/',
      'https://www.recaptcha.net/recaptcha/',
      'https://www.gstatic.com/recaptcha/',
      'https://www.gstatic.cn/',
      "'unsafe-inline'",
    ],
    workerSrc: [
      "'self'",
      'blob:', // DataDog RUM session replay - https://docs.datadoghq.com/real_user_monitoring/faq/content_security_policy/
    ],
    frameAncestors: ['*'],
  }

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
