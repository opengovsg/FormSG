import { mocked } from 'ts-jest/utils'

import { ISpcpMyInfo } from 'src/config/feature-manager'
import { AuthType } from 'src/types'

import { createSpcpFactory } from '../spcp.factory'
import { SpcpService } from '../spcp.service'

import { MOCK_SERVICE_PARAMS } from './spcp.test.constants'

jest.mock('../spcp.service')
const MockSpcpService = mocked(SpcpService, true)

describe('spcp.factory', () => {
  it('should return error functions when isEnabled is false', () => {
    const MyInfoFactory = createSpcpFactory({
      isEnabled: false,
      props: {} as ISpcpMyInfo,
    })
    const error = new Error(
      'spcp-myinfo is not activated, but a feature-specific function was called.',
    )
    const createRedirectUrlResult = MyInfoFactory.createRedirectUrl(
      AuthType.SP,
      '',
      '',
    )
    expect(createRedirectUrlResult._unsafeUnwrapErr()).toEqual(error)
  })

  it('should return error functions when props is undefined', () => {
    const MyInfoFactory = createSpcpFactory({
      isEnabled: true,
      props: undefined,
    })
    const error = new Error(
      'spcp-myinfo is not activated, but a feature-specific function was called.',
    )
    const createRedirectUrlResult = MyInfoFactory.createRedirectUrl(
      AuthType.SP,
      '',
      '',
    )
    expect(createRedirectUrlResult._unsafeUnwrapErr()).toEqual(error)
  })

  it('should call the SpcpService constructor when isEnabled is true and props is truthy', () => {
    createSpcpFactory({
      isEnabled: true,
      props: MOCK_SERVICE_PARAMS,
    })
    expect(MockSpcpService).toHaveBeenCalledWith(MOCK_SERVICE_PARAMS)
  })
})
