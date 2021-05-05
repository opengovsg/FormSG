import { mocked } from 'ts-jest/utils'

import { FeatureNames, ISpcpMyInfo } from 'config/feature-manager'
import { AuthType } from 'src/types'

import { MissingFeatureError } from '../../core/core.errors'
import { createSpcpFactory } from '../spcp.factory'
import { SpcpService } from '../spcp.service'
import { JwtPayload } from '../spcp.types'

import { MOCK_SERVICE_PARAMS } from './spcp.test.constants'

jest.mock('../spcp.service')
const MockSpcpService = mocked(SpcpService, true)

describe('spcp.factory', () => {
  it('should return error functions when isEnabled is false', async () => {
    const SpcpFactory = createSpcpFactory({
      isEnabled: false,
      props: {} as ISpcpMyInfo,
    })
    const error = new MissingFeatureError(FeatureNames.SpcpMyInfo)
    const createRedirectUrlResult = SpcpFactory.createRedirectUrl(
      AuthType.SP,
      '',
      '',
    )
    const fetchLoginPageResult = await SpcpFactory.fetchLoginPage('')
    const validateLoginPageResult = SpcpFactory.validateLoginPage('')
    const extractSingpassJwtPayloadResult = await SpcpFactory.extractSingpassJwtPayload(
      '',
    )
    const extractCorppassJwtPayloadResult = await SpcpFactory.extractCorppassJwtPayload(
      '',
    )
    const parseOOBParamsResult = SpcpFactory.parseOOBParams('', '', AuthType.SP)
    const getSpcpAttributesResult = await SpcpFactory.getSpcpAttributes(
      '',
      '',
      AuthType.SP,
    )
    const createJWTResult = SpcpFactory.createJWT(
      ({} as unknown) as JwtPayload,
      0,
      AuthType.SP,
    )
    const createJWTPayloadResult = SpcpFactory.createJWTPayload(
      {},
      true,
      AuthType.SP,
    )
    const cookieSettings = await SpcpFactory.getCookieSettings()
    expect(createRedirectUrlResult._unsafeUnwrapErr()).toEqual(error)
    expect(fetchLoginPageResult._unsafeUnwrapErr()).toEqual(error)
    expect(validateLoginPageResult._unsafeUnwrapErr()).toEqual(error)
    expect(extractSingpassJwtPayloadResult._unsafeUnwrapErr()).toEqual(error)
    expect(extractCorppassJwtPayloadResult._unsafeUnwrapErr()).toEqual(error)
    expect(parseOOBParamsResult._unsafeUnwrapErr()).toEqual(error)
    expect(getSpcpAttributesResult._unsafeUnwrapErr()).toEqual(error)
    expect(createJWTResult._unsafeUnwrapErr()).toEqual(error)
    expect(createJWTPayloadResult._unsafeUnwrapErr()).toEqual(error)
    expect(cookieSettings).toEqual({})
  })

  it('should return error functions when props is undefined', async () => {
    const SpcpFactory = createSpcpFactory({
      isEnabled: true,
      props: undefined,
    })
    const error = new Error(
      'spcp-myinfo is not activated, but a feature-specific function was called.',
    )
    const createRedirectUrlResult = SpcpFactory.createRedirectUrl(
      AuthType.SP,
      '',
      '',
    )
    const fetchLoginPageResult = await SpcpFactory.fetchLoginPage('')
    const validateLoginPageResult = SpcpFactory.validateLoginPage('')
    const extractSingpassJwtPayloadResult = await SpcpFactory.extractSingpassJwtPayload(
      '',
    )
    const extractCorppassJwtPayloadResult = await SpcpFactory.extractCorppassJwtPayload(
      '',
    )
    const parseOOBParamsResult = SpcpFactory.parseOOBParams('', '', AuthType.SP)
    const getSpcpAttributesResult = await SpcpFactory.getSpcpAttributes(
      '',
      '',
      AuthType.SP,
    )
    const createJWTResult = SpcpFactory.createJWT(
      ({} as unknown) as JwtPayload,
      0,
      AuthType.SP,
    )
    const createJWTPayloadResult = SpcpFactory.createJWTPayload(
      {},
      true,
      AuthType.SP,
    )
    const cookieSettings = await SpcpFactory.getCookieSettings()
    expect(createRedirectUrlResult._unsafeUnwrapErr()).toEqual(error)
    expect(fetchLoginPageResult._unsafeUnwrapErr()).toEqual(error)
    expect(validateLoginPageResult._unsafeUnwrapErr()).toEqual(error)
    expect(extractSingpassJwtPayloadResult._unsafeUnwrapErr()).toEqual(error)
    expect(extractCorppassJwtPayloadResult._unsafeUnwrapErr()).toEqual(error)
    expect(parseOOBParamsResult._unsafeUnwrapErr()).toEqual(error)
    expect(getSpcpAttributesResult._unsafeUnwrapErr()).toEqual(error)
    expect(createJWTResult._unsafeUnwrapErr()).toEqual(error)
    expect(createJWTPayloadResult._unsafeUnwrapErr()).toEqual(error)
    expect(cookieSettings).toEqual({})
  })

  it('should call the SpcpService constructor when isEnabled is true and props is truthy', () => {
    createSpcpFactory({
      isEnabled: true,
      props: MOCK_SERVICE_PARAMS,
    })
    expect(MockSpcpService).toHaveBeenCalledWith(MOCK_SERVICE_PARAMS)
  })
})
