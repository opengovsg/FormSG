import { IPersonBasic, IPersonBasicRequest } from '@opengovsg/myinfo-gov-client'
import { pick } from 'lodash'
import { mocked } from 'ts-jest/utils'

import config from 'src/config/config'
import { ISpcpMyInfo } from 'src/config/feature-manager'
import { Environment } from 'src/types'

import { createMyInfoFactory } from '../myinfo.factory'
import * as MyInfoServiceModule from '../myinfo.service'

import { MOCK_APP_TITLE, MOCK_NODE_ENV } from './myinfo.test.constants'

jest.mock('../myinfo.service', () => ({
  MyInfoService: jest.fn(),
}))
const MockMyInfoService = mocked(MyInfoServiceModule, true)
jest.mock('src/config/config')
const MockConfig = mocked(config, true)
MockConfig.nodeEnv = MOCK_NODE_ENV as Environment
MockConfig.app = {
  title: MOCK_APP_TITLE,
  description: '',
  appUrl: '',
  keywords: '',
  images: [''],
  twitterImage: '',
}

describe('myinfo.factory', () => {
  it('should return error functions when isEnabled is false', async () => {
    const MyInfoFactory = createMyInfoFactory({
      isEnabled: false,
      props: {} as ISpcpMyInfo,
    })
    const error = new Error(
      'spcp-myinfo is not activated, but a feature-specific function was called.',
    )
    const fetchMyInfoPersonDataResult = await MyInfoFactory.fetchMyInfoPersonData(
      {} as IPersonBasicRequest,
    )
    const prefillMyInfoFieldsResult = MyInfoFactory.prefillMyInfoFields(
      {} as IPersonBasic,
      [],
    )
    const saveMyInfoHashesResult = await MyInfoFactory.saveMyInfoHashes(
      '',
      '',
      [],
    )
    const fetchMyInfoHashesResult = await MyInfoFactory.fetchMyInfoHashes(
      '',
      '',
    )
    const checkMyInfoHashesResult = await MyInfoFactory.checkMyInfoHashes(
      [],
      {},
    )
    expect(fetchMyInfoPersonDataResult._unsafeUnwrapErr()).toEqual(error)
    expect(prefillMyInfoFieldsResult._unsafeUnwrapErr()).toEqual(error)
    expect(saveMyInfoHashesResult._unsafeUnwrapErr()).toEqual(error)
    expect(fetchMyInfoHashesResult._unsafeUnwrapErr()).toEqual(error)
    expect(checkMyInfoHashesResult._unsafeUnwrapErr()).toEqual(error)
  })

  it('should return error functions when props is falsey', async () => {
    const MyInfoFactory = createMyInfoFactory({
      isEnabled: true,
      props: undefined,
    })
    const error = new Error(
      'spcp-myinfo is not activated, but a feature-specific function was called.',
    )
    const fetchMyInfoPersonDataResult = await MyInfoFactory.fetchMyInfoPersonData(
      {} as IPersonBasicRequest,
    )
    const prefillMyInfoFieldsResult = MyInfoFactory.prefillMyInfoFields(
      {} as IPersonBasic,
      [],
    )
    const saveMyInfoHashesResult = await MyInfoFactory.saveMyInfoHashes(
      '',
      '',
      [],
    )
    const fetchMyInfoHashesResult = await MyInfoFactory.fetchMyInfoHashes(
      '',
      '',
    )
    const checkMyInfoHashesResult = await MyInfoFactory.checkMyInfoHashes(
      [],
      {},
    )
    expect(fetchMyInfoPersonDataResult._unsafeUnwrapErr()).toEqual(error)
    expect(prefillMyInfoFieldsResult._unsafeUnwrapErr()).toEqual(error)
    expect(saveMyInfoHashesResult._unsafeUnwrapErr()).toEqual(error)
    expect(fetchMyInfoHashesResult._unsafeUnwrapErr()).toEqual(error)
    expect(checkMyInfoHashesResult._unsafeUnwrapErr()).toEqual(error)
  })

  it('should call the MyInfoService constructor when isEnabled is true and props is truthy', () => {
    const mockProps = ({
      myInfoClientMode: 'mock1',
      myInfoKeyPath: 'mock2',
      spCookieMaxAge: 200,
      spEsrvcId: 'mock3',
    } as unknown) as ISpcpMyInfo
    createMyInfoFactory({
      isEnabled: true,
      props: mockProps,
    })

    expect(MockMyInfoService.MyInfoService).toHaveBeenCalledWith({
      myInfoConfig: pick(mockProps, ['myInfoClientMode', 'myInfoKeyPath']),
      nodeEnv: MOCK_NODE_ENV,
      realm: MOCK_APP_TITLE,
      singpassEserviceId: mockProps.spEsrvcId,
      spCookieMaxAge: mockProps.spCookieMaxAge,
    })
  })
})
