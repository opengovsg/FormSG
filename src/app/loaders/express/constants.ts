import { RequestHandler } from 'express'

import config from '../../config/config'

export const CSP_CORE_DIRECTIVES = {
  imgSrc: [
    "'self'",
    'blob:',
    'data:',
    'https://www.googletagmanager.com/',
    'https://www.google-analytics.com/',
    `https://s3-${config.aws.region}.amazonaws.com/agency.form.sg/`,
    config.aws.imageBucketUrl,
    config.aws.logoBucketUrl,
    '*',
    'https://*.google-analytics.com',
    'https://*.googletagmanager.com',
  ],
  fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com/'],
  scriptSrc: [
    "'self'",
    'https://ssl.google-analytics.com/',
    'https://www.google-analytics.com/',
    'https://www.tagmanager.google.com/',
    'https://www.google.com/recaptcha/',
    'https://www.recaptcha.net/recaptcha/',
    'https://www.gstatic.com/recaptcha/releases/',
    'https://challenges.cloudflare.com',
    'https://js.stripe.com/v3',
    // GA4 https://developers.google.com/tag-platform/tag-manager/web/csp
    // not actively used yet, loading specific files due to CSP bypass issue
    'https://*.googletagmanager.com/gtag/',
    'https://*.cloudflareinsights.com/', // Cloudflare web analytics https://developers.cloudflare.com/analytics/types-of-analytics/#web-analytics
    'https://www.gstatic.com/charts/', // React Google Charts for FormSG charts
    'https://www.gstatic.cn/recaptcha/releases/',
    (_req: Parameters<RequestHandler>[0], res: Parameters<RequestHandler>[1]) =>
      `'nonce-${res.locals.nonce}'`,
  ],
  connectSrc: [
    "'self'",
    'https://www.google-analytics.com/',
    'https://ssl.google-analytics.com/',
    'https://*.browser-intake-datadoghq.com',
    config.aws.attachmentBucketUrl,
    config.aws.imageBucketUrl,
    config.aws.logoBucketUrl,
    config.aws.virusScannerQuarantineS3BucketUrl,
    'https://*.google-analytics.com',
    'https://*.analytics.google.com',
    'https://*.googletagmanager.com',
  ],
  frameSrc: [
    "'self'",
    'https://www.google.com/recaptcha/',
    'https://www.recaptcha.net/recaptcha/',
    'https://challenges.cloudflare.com',
    'https://js.stripe.com/',
  ],
  styleSrc: [
    "'self'",
    'https://www.google.com/recaptcha/',
    'https://www.recaptcha.net/recaptcha/',
    'https://www.gstatic.com/recaptcha/',
    'https://www.gstatic.cn/',
    "'unsafe-inline'",
    'https://www.gstatic.com/charts/', // React Google Charts for FormSG charts
  ],
  workerSrc: [
    "'self'",
    'blob:', // DataDog RUM session replay - https://docs.datadoghq.com/real_user_monitoring/faq/content_security_policy/
  ],
  frameAncestors: ['*'],
}
