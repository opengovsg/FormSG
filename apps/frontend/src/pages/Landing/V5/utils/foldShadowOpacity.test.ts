import { foldShadowOpacity } from './foldShadowOpacity'

const OPEN = 250

describe('foldShadowOpacity', () => {
  it('throws no crease on flat, uncut paper', () => {
    expect(foldShadowOpacity(0, OPEN)).toBe(0)
  })

  it('peaks mid-travel rather than at either end', () => {
    const peak = foldShadowOpacity(0.575 * OPEN, OPEN)
    expect(peak).toBeGreaterThan(foldShadowOpacity(0, OPEN))
    expect(peak).toBeGreaterThan(foldShadowOpacity(OPEN, OPEN))
  })

  it('rises then falls across the travel, with no second hump', () => {
    const samples = [0, 40, 80, 120, 145, 180, 215, 250].map((cut) =>
      foldShadowOpacity(cut, OPEN),
    )
    const peakIndex = samples.indexOf(Math.max(...samples))
    expect(peakIndex).toBeGreaterThan(0)
    expect(peakIndex).toBeLessThan(samples.length - 1)
    // strictly increasing up to the peak, strictly decreasing after it
    samples.slice(1, peakIndex + 1).forEach((value, i) => {
      expect(value).toBeGreaterThan(samples[i])
    })
    samples.slice(peakIndex + 1).forEach((value, i) => {
      expect(value).toBeLessThan(samples[peakIndex + i])
    })
  })

  it('never returns a negative opacity, even past full open', () => {
    // 1.15 * open is where the curve crosses zero; beyond it the raw
    // expression goes negative and would be an invalid opacity.
    expect(foldShadowOpacity(2 * OPEN, OPEN)).toBe(0)
  })

  it('has no crease when there is no travel to be partway through', () => {
    expect(foldShadowOpacity(44, 0)).toBe(0)
  })
})
