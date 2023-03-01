import helmet from 'helmet'

import config from 'src/app/config/config'
import { sentryConfig } from 'src/app/config/features/sentry.config'

import expressHandler from 'tests/unit/backend/helpers/jest-express'

import helmetMiddlewares from '../helmet'

describe('helmetMiddlewares', () => {
  jest.mock('helmet')
  const mockHelmet = jest.mocked(helmet)
  jest.mock('src/app/config/config')
  const mockConfig = jest.mocked(config)
  jest.mock('src/app/config/features/sentry.config')
  const mockSentryConfig = jest.mocked(sentryConfig)

  const cspCoreDirectives = {
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
      'https://www.googletagmanager.com/',
      'https://ssl.google-analytics.com/',
      'https://www.google-analytics.com/',
      'https://www.tagmanager.google.com/',
      'https://www.google.com/recaptcha/',
      'https://www.recaptcha.net/recaptcha/',
      'https://www.gstatic.com/recaptcha/',
      'https://www.gstatic.cn/',
      'https://*.googletagmanager.com',
    ],
    connectSrc: [
      "'self'",
      'https://www.google-analytics.com/',
      'https://ssl.google-analytics.com/',
      'https://*.browser-intake-datadoghq.com',
      'https://sentry.io/api/',
      config.aws.attachmentBucketUrl,
      config.aws.imageBucketUrl,
      config.aws.logoBucketUrl,
      'https://*.google-analytics.com',
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

  beforeAll(() => {
    mockHelmet.xssFilter = jest.fn().mockReturnValue('xssFilter')
    mockHelmet.noSniff = jest.fn().mockReturnValue('noSniff')
    mockHelmet.ieNoOpen = jest.fn().mockReturnValue('ieNoOpen')
    mockHelmet.dnsPrefetchControl = jest
      .fn()
      .mockReturnValue('dnsPrefetchControl')
    mockHelmet.hidePoweredBy = jest.fn().mockReturnValue('hidePoweredBy')
    mockHelmet.referrerPolicy = jest.fn().mockReturnValue('referrerPolicy')
    mockHelmet.contentSecurityPolicy = jest
      .fn()
      .mockReturnValue(
        'contentSecurityPolicy',
      ) as typeof mockHelmet.contentSecurityPolicy // Type assertion as
    // getDefaultDirectives() is defined as a property of contentSecurityPolicy namespace
    mockHelmet.hsts = jest.fn().mockReturnValue(jest.fn())
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should call the correct helmet functions', () => {
    helmetMiddlewares()
    expect(mockHelmet.xssFilter).toHaveBeenCalled()
    expect(mockHelmet.noSniff).toHaveBeenCalled()
    expect(mockHelmet.ieNoOpen).toHaveBeenCalled()
    expect(mockHelmet.dnsPrefetchControl).toHaveBeenCalled()
    expect(mockHelmet.hidePoweredBy).toHaveBeenCalled()
    expect(mockHelmet.referrerPolicy).toHaveBeenCalled()
    expect(mockHelmet.contentSecurityPolicy).toHaveBeenCalled()
  })

  it('should call helmet.hsts() if req.secure', () => {
    const mockReq = expressHandler.mockRequest({ secure: true })
    const mockRes = expressHandler.mockResponse()
    const mockNext = jest.fn()

    // Find works for helmet.hsts() because the other functions are mocked to return a string
    const hstsFn = helmetMiddlewares().find(
      (result) => typeof result === 'function',
    )
    // Necessary to check for hstsFn because find() returns undefined by default, otherwise
    // will throw TypeError
    if (hstsFn) {
      hstsFn(mockReq, mockRes, mockNext)
    }
    expect(mockHelmet.hsts).toHaveBeenCalledWith({ maxAge: 5184000 })
    expect(mockNext).not.toHaveBeenCalled()
  })

  it('should not call helmet.hsts() if !req.secure', () => {
    const mockReq = expressHandler.mockRequest({ secure: false })
    const mockRes = expressHandler.mockResponse()
    const mockNext = jest.fn()

    const hstsFn = helmetMiddlewares().find(
      (result) => typeof result === 'function',
    )
    if (hstsFn) {
      hstsFn(mockReq, mockRes, mockNext)
    }

    expect(mockHelmet.hsts).not.toHaveBeenCalled()
    expect(mockNext).toHaveBeenCalled()
  })

  it('should call helmet.contentSecurityPolicy() with the correct directives if cspReportUri and !isDev', () => {
    mockSentryConfig.cspReportUri = 'value'
    mockConfig.isDev = false
    helmetMiddlewares()
    expect(mockHelmet.contentSecurityPolicy).toHaveBeenCalledWith({
      useDefaults: true,
      directives: {
        ...cspCoreDirectives,
        reportUri: ['value'],
      },
    })
  })

  it('should call helmet.contentSecurityPolicy() with the correct directives if !cspReportUri and isDev', () => {
    mockSentryConfig.cspReportUri = ''
    mockConfig.isDev = true
    helmetMiddlewares()
    expect(mockHelmet.contentSecurityPolicy).toHaveBeenCalledWith({
      useDefaults: true,
      directives: {
        upgradeInsecureRequests: null,
        ...cspCoreDirectives,
      },
    })
  })

  it('should return the correct values from helmet', () => {
    const result = helmetMiddlewares()
    /* eslint-disable @typescript-eslint/ban-ts-comment */
    // @ts-ignore
    expect(result).toContain('xssFilter')
    // @ts-ignore
    expect(result).toContain('noSniff')
    // @ts-ignore
    expect(result).toContain('ieNoOpen')
    // @ts-ignore
    expect(result).toContain('dnsPrefetchControl')
    // @ts-ignore
    expect(result).toContain('hidePoweredBy')
    // @ts-ignore
    expect(result).toContain('referrerPolicy')
    // @ts-ignore
    expect(result).toContain('contentSecurityPolicy')
    /* eslint-enable */
  })
})
