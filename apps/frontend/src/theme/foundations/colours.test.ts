import { colours } from './colours'

const WHITE = '#FFFFFF'

const channelLuminance = (channel: number): number => {
  const ratio = channel / 255
  return ratio <= 0.04045
    ? ratio / 12.92
    : Math.pow((ratio + 0.055) / 1.055, 2.4)
}

const relativeLuminance = (hex: string): number => {
  const [r, g, b] = [1, 3, 5].map((offset) =>
    parseInt(hex.slice(offset, offset + 2), 16),
  )
  return (
    0.2126 * channelLuminance(r) +
    0.7152 * channelLuminance(g) +
    0.0722 * channelLuminance(b)
  )
}

const contrastRatio = (a: string, b: string): number => {
  const [lighter, darker] = [relativeLuminance(a), relativeLuminance(b)].sort(
    (x, y) => y - x,
  )
  return (lighter + 0.05) / (darker + 0.05)
}

describe('primary tints against white', () => {
  it('puts primary.50 at half the separation of primary.100', () => {
    expect(contrastRatio(colours.primary[100], WHITE)).toBeCloseTo(1.07, 2)
    expect(contrastRatio(colours.primary[50], WHITE)).toBeCloseTo(1.035, 3)
  })

  it('keeps primary.50 lighter than primary.100', () => {
    expect(relativeLuminance(colours.primary[50])).toBeGreaterThan(
      relativeLuminance(colours.primary[100]),
    )
  })

  it('gives theme-blue the same tint, since it shares the palette', () => {
    expect(colours['theme-blue'][50]).toEqual(colours.primary[50])
  })
})
