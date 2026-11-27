import { featureFlags } from 'formsg-shared/constants'

import { createGrowthbookInstance } from './growthbook'

describe('local step login preview', () => {
  afterEach(() => vi.unstubAllEnvs())

  it.each([
    [true, 'true', true],
    [true, undefined, false],
    [true, 'false', false],
    [false, 'true', false],
  ])(
    'DEV=%s, local preview=%s enables only the preview flags=%s',
    (dev, setting, expected) => {
      vi.stubEnv('DEV', dev)
      vi.stubEnv('VITE_ENABLE_STEP_LOGIN_PREVIEW', setting)
      const growthbook = createGrowthbookInstance('local-test')
      expect(growthbook.isOn(featureFlags.mrfStepLogin)).toBe(expected)
      expect(growthbook.isOn(featureFlags.isNricFieldEnabled)).toBe(expected)
      expect(growthbook.isOn('unrelated-feature')).toBe(false)
      growthbook.destroy()
    },
  )
})
