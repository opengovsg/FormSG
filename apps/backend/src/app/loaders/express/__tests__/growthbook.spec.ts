import expressHandler from '__tests__/unit/backend/helpers/jest-express'
import { GrowthBook } from '@growthbook/growthbook'
import { featureFlags } from 'formsg-shared/constants'

import config from 'src/app/config/config'
import { growthbookConfig } from 'src/app/config/features/growthbook.config'

import growthbookMiddleware from '../growthbook'

jest.mock('src/app/config/config', () => ({
  isDev: false,
  isTest: true,
  app: { appUrl: 'http://localhost' },
}))
jest.mock('src/app/config/features/growthbook.config', () => ({
  growthbookConfig: {
    growthbookClientKey: 'local-test',
    growthbookApiHost: '',
    enableStepLoginPreview: false,
  },
}))

describe('local step login preview middleware', () => {
  beforeEach(() => {
    jest
      .spyOn(GrowthBook.prototype, 'init')
      .mockResolvedValue({ success: true, source: 'cache' })
  })
  afterEach(() => jest.restoreAllMocks())

  it.each([
    [true, true, true],
    [true, false, false],
    [false, true, false],
  ])(
    'development=%s preview=%s forces the two flags=%s',
    async (isDev, enabled, expected) => {
      config.isDev = isDev
      growthbookConfig.enableStepLoginPreview = enabled
      const req = expressHandler.mockRequest()
      const res = expressHandler.mockResponse()
      const next = jest.fn()
      await growthbookMiddleware(req, res, next)
      expect(req.growthbook?.isOn(featureFlags.mrfStepLogin)).toBe(expected)
      expect(req.growthbook?.isOn(featureFlags.isNricFieldEnabled)).toBe(
        expected,
      )
      expect(req.growthbook?.isOn('unrelated-feature')).toBe(false)
      req.growthbook?.destroy()
    },
  )
})
