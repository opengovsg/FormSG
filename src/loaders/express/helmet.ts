import { RequestHandler } from 'express'
import helmet from 'helmet'

import config from '../../config/config'

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

  const contentSecurityPolicyMiddleware = helmet.contentSecurityPolicy({
    directives: {
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
      ],
      formAction: ["'self'"],
      upgradeInsecureRequests: !config.isDev,
      reportUri: config.cspReportUri,
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
