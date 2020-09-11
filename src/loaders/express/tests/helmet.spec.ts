import helmet from 'helmet'
import { mocked } from 'ts-jest/utils'

import config from 'src/config/config'
import featureManager from 'src/config/feature-manager'

import helmetMiddlewares from '../helmet'

describe('helmetMiddlewares', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should load the value of helmet.xssFilter()', () => {
    jest.mock('helmet')
    const mockHelmet = mocked(helmet, true)
    mockHelmet.xssFilter = jest.fn().mockImplementation(() => 'xss')
    const xssValue = helmetMiddlewares()[0]
    expect(xssValue).toEqual('xss')
  })

  it('should load the value of helmet.noSniff()', () => {
    jest.mock('helmet')
    const mockHelmet = mocked(helmet, true)
    mockHelmet.noSniff = jest.fn().mockImplementation(() => 'nosniff')
    const noSniff = helmetMiddlewares()[1]
    expect(noSniff).toEqual('nosniff')
  })

  it('should load the value of helmet.ieNoOpen()', () => {
    jest.mock('helmet')
    const mockHelmet = mocked(helmet, true)
    mockHelmet.ieNoOpen = jest.fn().mockImplementation(() => 'ieNoOpen')
    const ieNoOpen = helmetMiddlewares()[2]
    expect(ieNoOpen).toEqual('ieNoOpen')
  })

  it('should load the value of helmet.dnsPrefetchControl()', () => {
    jest.mock('helmet')
    const mockHelmet = mocked(helmet, true)
    mockHelmet.dnsPrefetchControl = jest
      .fn()
      .mockImplementation(() => 'dnsPrefetchControl')
    const dnsPrefetchControl = helmetMiddlewares()[3]
    expect(dnsPrefetchControl).toEqual('dnsPrefetchControl')
  })

  it('should load the value of helmet.hidePoweredBy()', () => {
    jest.mock('helmet')
    const mockHelmet = mocked(helmet, true)
    mockHelmet.hidePoweredBy = jest
      .fn()
      .mockImplementation(() => 'hidePoweredBy')
    const hidePoweredBy = helmetMiddlewares()[4]
    expect(hidePoweredBy).toEqual('hidePoweredBy')
  })

  it('should load the value of helmet.referrerPolicy()', () => {
    jest.mock('helmet')
    const mockHelmet = mocked(helmet, true)
    mockHelmet.referrerPolicy = jest
      .fn()
      .mockImplementation(() => 'referrerPolicy')
    const referrerPolicy = helmetMiddlewares()[6]
    expect(referrerPolicy).toEqual('referrerPolicy')
  })

  it('should pass the correct directive values to helmet.contentSecurityPolicy()', () => {
    jest.mock('helmet')
    const mockHelmet = mocked(helmet, true)
    mockHelmet.contentSecurityPolicy = jest
      .fn()
      .mockImplementation((directiveObj) => JSON.stringify(directiveObj))
    const contentSecurityPolicy = helmetMiddlewares()[7]
    expect(contentSecurityPolicy).toContain(`"defaultSrc":["'self'"]`)
    expect(contentSecurityPolicy).toContain(
      `["'self'","data:","https://www.googletagmanager.com/","https://www.google-analytics.com/","https://s3-${config.aws.region}.amazonaws.com/agency.form.sg/","${config.aws.imageBucketUrl}","${config.aws.logoBucketUrl}","*"]`,
    )
    expect(contentSecurityPolicy).toContain(
      `"fontSrc":["'self'","data:","https://fonts.gstatic.com/"]`,
    )
    expect(contentSecurityPolicy).toContain(
      `"scriptSrc":["'self'","https://www.googletagmanager.com/","https://ssl.google-analytics.com/","https://www.google-analytics.com/","https://www.tagmanager.google.com/","https://www.google.com/recaptcha/","https://www.recaptcha.net/recaptcha/","https://www.gstatic.com/recaptcha/","https://www.gstatic.cn/","https://www.google-analytics.com/"]`,
    )
    expect(contentSecurityPolicy).toContain(
      `"connectSrc":["'self'","https://www.google-analytics.com/","https://ssl.google-analytics.com/","https://sentry.io/api/","${config.aws.attachmentBucketUrl}","${config.aws.imageBucketUrl}","${config.aws.logoBucketUrl}"]`,
    )

    expect(contentSecurityPolicy).toContain(
      `"frameSrc":["'self'","https://www.google.com/recaptcha/","https://www.recaptcha.net/recaptcha/"]`,
    )
    expect(contentSecurityPolicy).toContain(`"objectSrc":["'none'"]`)
    expect(contentSecurityPolicy).toContain(
      `"styleSrc":["'self'","https://www.google.com/recaptcha/","https://www.recaptcha.net/recaptcha/","https://www.gstatic.com/recaptcha/","https://www.gstatic.cn/"]`,
    )
    expect(contentSecurityPolicy).toContain(`"formAction":["'self'"]`)
  })
})

it('should pass the correct reportUri value to helmet.contentSecurityPolicy()', () => {
  jest.mock('helmet')
  const mockHelmet = mocked(helmet, true)
  mockHelmet.contentSecurityPolicy = jest
    .fn()
    .mockImplementation((directiveObj) => JSON.stringify(directiveObj))
  jest.mock('src/config/feature-manager')
  const mockFeatureManager = mocked(featureManager, true)

  mockFeatureManager.props = jest.fn().mockImplementation(() => {
    return { cspReportUri: 'value' }
  })
  let contentSecurityPolicy = helmetMiddlewares()[7]
  expect(contentSecurityPolicy).toContain(`"reportUri":["value"]`)

  mockFeatureManager.props = jest.fn().mockImplementation(() => {
    return
  })
  contentSecurityPolicy = helmetMiddlewares()[7]
  expect(contentSecurityPolicy).not.toContain(`"reportUri"`)
})

it('should pass the correct upgradeInsecureRequest value to helmet.contentSecurityPolicy()', () => {
  jest.mock('helmet')
  const mockHelmet = mocked(helmet, true)
  mockHelmet.contentSecurityPolicy = jest
    .fn()
    .mockImplementation((directiveObj) => JSON.stringify(directiveObj))

  jest.mock('src/config/config')
  const mockConfig = mocked(config, true)

  mockConfig.isDev = false
  let contentSecurityPolicy = helmetMiddlewares()[7]
  expect(contentSecurityPolicy).toContain(`upgradeInsecureRequests`)

  mockConfig.isDev = true
  contentSecurityPolicy = helmetMiddlewares()[7]
  expect(contentSecurityPolicy).not.toContain(`upgradeInsecureRequests`)
})
