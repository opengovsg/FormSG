import { RequestHandler } from 'express'
import helmet from 'helmet'
import { ContentSecurityPolicyOptions } from 'helmet/dist/middlewares/content-security-policy'
import { get } from 'lodash'

import config from '../../config/config'
import featureManager, { FeatureNames } from '../../config/feature-manager'

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
    defaultSrc: ["'self'"],
    imgSrc: [
      "'self'",
      'data:',
      'https://www.googletagmanager.com/',
      'https://www.google-analytics.com/',
      `https://s3-${config.aws.region}.amazonaws.com/agency.form.sg/`, // Agency logos
      config.aws.imageBucketUrl, // Image field
      config.aws.logoBucketUrl, // Form logo
      '*', // TODO: Remove when we host our own images for Image field and Form Logo
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
      'https://www.google-analytics.com/',
    ],
    connectSrc: [
      "'self'",
      'https://www.google-analytics.com/',
      'https://ssl.google-analytics.com/',
      'https://sentry.io/api/',
      config.aws.attachmentBucketUrl, // Attachment downloads
      config.aws.imageBucketUrl, // Image field
      config.aws.logoBucketUrl, // Form logo
    ],
    frameSrc: [
      "'self'",
      'https://www.google.com/recaptcha/',
      'https://www.recaptcha.net/recaptcha/',
    ],
    objectSrc: ["'none'"],
    styleSrc: [
      "'self'",
      'https://www.google.com/recaptcha/',
      'https://www.recaptcha.net/recaptcha/',
      'https://www.gstatic.com/recaptcha/',
      'https://www.gstatic.cn/',
      // For inline styles in angular-sanitize.js
      "'sha256-b3IrgBVvuKx/Q3tmAi79fnf6AFClibrz/0S5x1ghdGU='",
    ],
    formAction: ["'self'"],
  }

  const reportUri = get(
    featureManager.props(FeatureNames.Sentry),
    'cspReportUri',
    undefined,
  )

  const cspOptionalDirectives: ContentSecurityPolicyOptions['directives'] = {}

  // Add on reportUri CSP header if ReportUri exists
  // It is necessary to have the if statement for optional directives because falsey values
  // do not work - e.g. cspOptionalDirectives.reportUri = [false] will still set the reportUri header
  // See https://github.com/helmetjs/csp/issues/36 and
  // https://github.com/helmetjs/helmet/blob/cb170160e7c1ccac314cc19d3b979cfc771f1349/middlewares/content-security-policy/index.ts#L135
  if (reportUri) cspOptionalDirectives.reportUri = [reportUri]

  // Add on upgradeInsecureRequest CSP header if !config.isDev
  if (!config.isDev) cspOptionalDirectives.upgradeInsecureRequests = []

  const contentSecurityPolicyMiddleware = helmet.contentSecurityPolicy({
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
