import { Request, Response } from 'express'
import { mocked } from 'ts-jest/utils'

import { MissingFeatureError } from 'src/app/modules/core/core.errors'
import { FeatureNames } from 'src/config/feature-manager'

import { createCaptchaFactory } from '../captcha.factory'
import { CaptchaService } from '../captcha.service'

const MOCK_PRIVATE_KEY = 'privateKey'
const MOCK_PUBLIC_KEY = 'publicKey'

jest.mock('../captcha.service')
const MockCaptchaService = mocked(CaptchaService, true)

describe('captcha.factory', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should return error and passthrough functions when isEnabled is false', async () => {
    const captchaFactory = createCaptchaFactory({
      isEnabled: false,
      props: {
        captchaPrivateKey: MOCK_PRIVATE_KEY,
        captchaPublicKey: MOCK_PUBLIC_KEY,
      },
    })
    const nextSpy = jest.fn()

    const verifyResult = await captchaFactory.verifyCaptchaResponse(
      undefined,
      undefined,
    )
    captchaFactory.validateCaptchaParams(
      ({} as unknown) as Request,
      ({} as unknown) as Response,
      nextSpy,
    )
    expect(verifyResult._unsafeUnwrapErr()).toEqual(
      new MissingFeatureError(FeatureNames.Captcha),
    )
    expect(nextSpy).toHaveBeenCalled()
  })

  it('should return error and passthrough functions when props is falsey', async () => {
    const captchaFactory = createCaptchaFactory({
      isEnabled: true,
      props: undefined,
    })
    const nextSpy = jest.fn()

    const verifyResult = await captchaFactory.verifyCaptchaResponse(
      undefined,
      undefined,
    )
    captchaFactory.validateCaptchaParams(
      ({} as unknown) as Request,
      ({} as unknown) as Response,
      nextSpy,
    )
    expect(verifyResult._unsafeUnwrapErr()).toEqual(
      new MissingFeatureError(FeatureNames.Captcha),
    )
    expect(nextSpy).toHaveBeenCalled()
  })

  it('should call CaptchaService constructor when isEnabled is true and props is truthy', () => {
    createCaptchaFactory({
      isEnabled: true,
      props: {
        captchaPrivateKey: MOCK_PRIVATE_KEY,
        captchaPublicKey: MOCK_PUBLIC_KEY,
      },
    })

    expect(MockCaptchaService).toHaveBeenCalledWith(MOCK_PRIVATE_KEY)
  })
})
