import { mocked } from 'ts-jest/utils'

import { FeatureNames } from 'src/app/config/feature-manager'
import { MissingFeatureError } from 'src/app/modules/core/core.errors'

import { createIntranetFactory } from '../intranet.factory'
import { IntranetService } from '../intranet.service'

jest.mock('../intranet.service')
const MockIntranetService = mocked(IntranetService, true)

const MOCK_INTRANET_PROPS = {
  intranetIpListPath: 'somePath',
}

describe('intranet.factory', () => {
  afterEach(() => jest.clearAllMocks())

  it('should call the IntranetService constructor when Intranet feature is enabled', () => {
    createIntranetFactory({
      isEnabled: true,
      props: MOCK_INTRANET_PROPS,
    })

    expect(MockIntranetService).toHaveBeenCalledWith(MOCK_INTRANET_PROPS)
  })

  it('should return error functions when isEnabled is false', () => {
    const intranetFactory = createIntranetFactory({
      isEnabled: false,
      props: MOCK_INTRANET_PROPS,
    })

    expect(MockIntranetService).not.toHaveBeenCalled()
    expect(intranetFactory.isIntranetIp('')._unsafeUnwrapErr()).toEqual(
      new MissingFeatureError(FeatureNames.Intranet),
    )
  })

  it('should return error functions when props is undefined', () => {
    const intranetFactory = createIntranetFactory({
      isEnabled: true,
    })

    expect(MockIntranetService).not.toHaveBeenCalled()
    expect(intranetFactory.isIntranetIp('')._unsafeUnwrapErr()).toEqual(
      new MissingFeatureError(FeatureNames.Intranet),
    )
  })
})
