import { mocked } from 'ts-jest/utils'

import config from 'src/config/config'
import { ISpcpMyInfo } from 'src/config/feature-manager'
import { Environment, IPopulatedForm } from 'src/types'

import { MyInfoData } from '../myinfo.adapter'
import { createMyInfoFactory } from '../myinfo.factory'
import * as MyInfoServiceModule from '../myinfo.service'
import { IMyInfoRedirectURLArgs } from '../myinfo.types'

import { MOCK_APP_URL, MOCK_NODE_ENV } from './myinfo.test.constants'

jest.mock('../myinfo.service', () => ({
  MyInfoService: jest.fn(),
}))
const MockMyInfoService = mocked(MyInfoServiceModule, true)
jest.mock('src/config/config')
const MockConfig = mocked(config, true)
MockConfig.nodeEnv = MOCK_NODE_ENV as Environment
MockConfig.app = {
  title: '',
  description: '',
  appUrl: MOCK_APP_URL,
  keywords: '',
  images: [''],
  twitterImage: '',
}

describe('myinfo.factory', () => {
  afterEach(() => jest.clearAllMocks())
  it('should return error functions when isEnabled is false', async () => {
    const MyInfoFactory = createMyInfoFactory({
      isEnabled: false,
      props: {} as ISpcpMyInfo,
    })
    const error = new Error(
      'spcp-myinfo is not activated, but a feature-specific function was called.',
    )
    const retrieveAccessTokenResult = await MyInfoFactory.retrieveAccessToken(
      '',
    )
    const createRedirectURLResult = MyInfoFactory.createRedirectURL(
      {} as IMyInfoRedirectURLArgs,
    )
    const parseMyInfoRelayStateResult = MyInfoFactory.parseMyInfoRelayState('')
    const extractUinFinResult = MyInfoFactory.extractUinFin('')
    const fetchMyInfoDataResult = await MyInfoFactory.fetchMyInfoData(
      ({} as unknown) as IPopulatedForm,
      {},
    )
    const prefillMyInfoFieldsResult = MyInfoFactory.prefillMyInfoFields(
      {} as MyInfoData,
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
    expect(retrieveAccessTokenResult._unsafeUnwrapErr()).toEqual(error)
    expect(parseMyInfoRelayStateResult._unsafeUnwrapErr()).toEqual(error)
    expect(createRedirectURLResult._unsafeUnwrapErr()).toEqual(error)
    expect(extractUinFinResult._unsafeUnwrapErr()).toEqual(error)
    expect(fetchMyInfoDataResult._unsafeUnwrapErr()).toEqual(error)
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
    const retrieveAccessTokenResult = await MyInfoFactory.retrieveAccessToken(
      '',
    )
    const createRedirectURLResult = MyInfoFactory.createRedirectURL(
      {} as IMyInfoRedirectURLArgs,
    )
    const parseMyInfoRelayStateResult = MyInfoFactory.parseMyInfoRelayState('')
    const extractUinFinResult = MyInfoFactory.extractUinFin('')
    const fetchMyInfoDataResult = await MyInfoFactory.fetchMyInfoData(
      ({} as unknown) as IPopulatedForm,
      {},
    )
    const prefillMyInfoFieldsResult = MyInfoFactory.prefillMyInfoFields(
      {} as MyInfoData,
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
    expect(retrieveAccessTokenResult._unsafeUnwrapErr()).toEqual(error)
    expect(parseMyInfoRelayStateResult._unsafeUnwrapErr()).toEqual(error)
    expect(createRedirectURLResult._unsafeUnwrapErr()).toEqual(error)
    expect(extractUinFinResult._unsafeUnwrapErr()).toEqual(error)
    expect(fetchMyInfoDataResult._unsafeUnwrapErr()).toEqual(error)
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
      spcpMyInfoConfig: mockProps,
      nodeEnv: MOCK_NODE_ENV,
      appUrl: MOCK_APP_URL,
    })
  })
})
