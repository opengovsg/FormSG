import helmet from 'helmet'
import { mocked } from 'ts-jest/utils'

import config from 'src/config/config'
import featureManager from 'src/config/feature-manager'

import helmetMiddlewares from '../helmet'

describe('helmetMiddlewares', () => {
  jest.mock('helmet')
  const mockHelmet = mocked(helmet, true)
  jest.mock('src/config/feature-manager')
  const mockFeatureManager = mocked(featureManager, true)
  jest.mock('src/config/config')
  const mockConfig = mocked(config, true)

  beforeAll(() => {
    mockHelmet.xssFilter = jest.fn().mockImplementation(() => 'xssFilter')
    mockHelmet.noSniff = jest.fn().mockImplementation(() => 'noSniff')
    mockHelmet.ieNoOpen = jest.fn().mockImplementation(() => 'ieNoOpen')
    mockHelmet.dnsPrefetchControl = jest
      .fn()
      .mockImplementation(() => 'dnsPrefetchControl')
    mockHelmet.hidePoweredBy = jest
      .fn()
      .mockImplementation(() => 'hidePoweredBy')
    mockHelmet.referrerPolicy = jest
      .fn()
      .mockImplementation(() => 'referrerPolicy')
    mockHelmet.contentSecurityPolicy = jest
      .fn()
      .mockImplementation(() => 'contentSecurityPolicy')
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

  const cspCoreDirectives = {
    defaultSrc: ["'self'"],
    imgSrc: [
      "'self'",
      'data:',
      'https://www.googletagmanager.com/',
      'https://www.google-analytics.com/',
      `https://s3-${config.aws.region}.amazonaws.com/agency.form.sg/`,
      config.aws.imageBucketUrl,
      config.aws.logoBucketUrl,
      '*',
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
      config.aws.attachmentBucketUrl,
      config.aws.imageBucketUrl,
      config.aws.logoBucketUrl,
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

  it('should call helmet.contentSecurityPolicy() with the correct directives if cspReportUri and !isDev', () => {
    mockFeatureManager.props = jest
      .fn()
      .mockReturnValue({ cspReportUri: 'value' })
    mockConfig.isDev = false
    helmetMiddlewares()
    expect(mockHelmet.contentSecurityPolicy).toHaveBeenCalledWith({
      directives: {
        ...cspCoreDirectives,
        reportUri: ['value'],
        upgradeInsecureRequests: [],
      },
    })
  })

  it('should call helmet.contentSecurityPolicy() with the correct directives if !cspReportUri and isDev', () => {
    mockConfig.isDev = true
    helmetMiddlewares()
    expect(mockHelmet.contentSecurityPolicy).toHaveBeenCalledWith({
      directives: {
        ...cspCoreDirectives,
      },
    })
  })

  it('should return the correct values from helmet', () => {
    const result = helmetMiddlewares()
    expect(result).toContain('xssFilter')
    expect(result).toContain('noSniff')
    expect(result).toContain('ieNoOpen')
    expect(result).toContain('dnsPrefetchControl')
    expect(result).toContain('hidePoweredBy')
    expect(result).toContain('referrerPolicy')
    expect(result).toContain('contentSecurityPolicy')
  })
})
