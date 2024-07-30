import expressHandler from '__tests__/unit/backend/helpers/jest-express'
import helmet from 'helmet'

import config from 'src/app/config/config'

import { CSP_CORE_DIRECTIVES } from '../constants'
import helmetMiddlewares from '../helmet'

describe('helmetMiddlewares', () => {
  jest.mock('helmet')
  const mockHelmet = jest.mocked(helmet)
  jest.mock('src/app/config/config')
  const mockConfig = jest.mocked(config)

  const cspCoreDirectives = CSP_CORE_DIRECTIVES

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
    expect(mockHelmet.hsts).toHaveBeenCalledWith({ maxAge: 400 * 24 * 60 * 60 }) // 400 days
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
    mockConfig.isDev = false
    helmetMiddlewares()
    expect(mockHelmet.contentSecurityPolicy).toHaveBeenCalledWith({
      useDefaults: true,
      directives: {
        ...cspCoreDirectives,
      },
    })
  })

  it('should call helmet.contentSecurityPolicy() with the correct directives if !cspReportUri and isDev', () => {
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
