import { describe, expect, it } from 'vitest'

import { BrandAssets, selectBrandAssets } from './selectBrandAssets'

const KEYS: (keyof BrandAssets)[] = [
  'markColour',
  'hortColour',
  'markDark',
  'hortDark',
  'hortLightMono',
]

describe('selectBrandAssets', () => {
  it.each([false, true])(
    'returns all five treatments with truthy Svg and url when isOn=%s',
    (isOn) => {
      const assets = selectBrandAssets(isOn)
      for (const key of KEYS) {
        expect(assets[key].Svg).toBeTruthy()
        expect(assets[key].url).toBeTruthy()
      }
    },
  )

  it('returns a different set for true vs false, for every key', () => {
    const oldAssets = selectBrandAssets(false)
    const newAssets = selectBrandAssets(true)

    for (const key of KEYS) {
      expect(newAssets[key].Svg).not.toBe(oldAssets[key].Svg)
      expect(newAssets[key].url).not.toBe(oldAssets[key].url)
    }
  })
})
