import { formatCompactStat, STAT_PLACEHOLDER } from './formatCompactStat'

describe('formatCompactStat', () => {
  it('leaves values below a thousand unabbreviated', () => {
    expect(formatCompactStat(0)).toBe('0')
    expect(formatCompactStat(167)).toBe('167')
    expect(formatCompactStat(999)).toBe('999')
  })

  it('abbreviates thousands and millions', () => {
    expect(formatCompactStat(1000)).toBe('1K')
    expect(formatCompactStat(413208)).toBe('413K')
    expect(formatCompactStat(271000000)).toBe('271M')
  })

  it('drops fractional digits rather than showing 413.2K', () => {
    expect(formatCompactStat(271400000)).toBe('271M')
    expect(formatCompactStat(413800)).toBe('414K')
  })

  it('falls back to a placeholder when the stat has not arrived', () => {
    expect(formatCompactStat(undefined)).toBe(STAT_PLACEHOLDER)
  })

  it('falls back to a placeholder for non-finite values', () => {
    expect(formatCompactStat(NaN)).toBe(STAT_PLACEHOLDER)
    expect(formatCompactStat(Infinity)).toBe(STAT_PLACEHOLDER)
  })
})
