import { describe, expect, it } from 'vitest'

import { fromCanonical, toCanonical } from './TimeInput'

/**
 * The widget's whole job is to turn what the respondent typed into the
 * canonical persisted form. These two functions are that conversion, so the
 * display settings stop here and never reach the backend.
 */
const build = (
  digits: string,
  opts: Partial<{
    meridiem: 'AM' | 'PM'
    includeSeconds: boolean
    use24HourFormat: boolean
  }> = {},
) =>
  toCanonical({
    digits,
    meridiem: opts.meridiem ?? 'AM',
    includeSeconds: opts.includeSeconds ?? false,
    use24HourFormat: opts.use24HourFormat ?? true,
  })

describe('toCanonical', () => {
  describe('24-hour', () => {
    it.each([
      ['0930', '09:30:00'],
      ['0000', '00:00:00'],
      ['2359', '23:59:00'],
    ])('should turn %j into %j', (digits, expected) => {
      expect(build(digits)).toEqual(expected)
    })

    it('should include seconds when the field collects them', () => {
      expect(build('093015', { includeSeconds: true })).toEqual('09:30:15')
    })
  })

  describe('12-hour', () => {
    it.each([
      ['1230', 'AM', '00:30:00'], // midnight half hour
      ['1230', 'PM', '12:30:00'], // just after noon
      ['0230', 'PM', '14:30:00'],
      ['0230', 'AM', '02:30:00'],
      ['1159', 'PM', '23:59:00'],
    ] as const)('should turn %j %s into %j', (digits, meridiem, expected) => {
      expect(build(digits, { meridiem, use24HourFormat: false })).toEqual(
        expected,
      )
    })
  })

  describe('returns empty rather than a partial value', () => {
    it.each([
      ['', 'nothing typed'],
      ['09', 'hour only'],
      ['093', 'incomplete minute'],
      ['0930', 'no seconds yet, but the field collects them'],
    ])('should return empty for %j (%s)', (digits) => {
      const includeSeconds = digits === '0930'
      expect(build(digits, { includeSeconds })).toEqual('')
    })

    it.each([
      ['2400', true, 'hour 24 on a 24-hour clock'],
      ['0960', true, 'minute 60'],
      ['1330', false, 'hour 13 on a 12-hour clock'],
      ['0030', false, 'hour 0 on a 12-hour clock'],
    ] as [string, boolean, string][])(
      'should return empty for %j (%s)',
      (digits, use24HourFormat) => {
        expect(build(digits, { use24HourFormat })).toEqual('')
      },
    )
  })
})

describe('fromCanonical', () => {
  it('should recover what the respondent would have typed, 24-hour', () => {
    expect(
      fromCanonical('14:30:00', {
        includeSeconds: false,
        use24HourFormat: true,
      }),
    ).toEqual({ digits: '1430', meridiem: 'PM' })
  })

  it('should recover a 12-hour reading with its meridiem', () => {
    expect(
      fromCanonical('14:30:00', {
        includeSeconds: false,
        use24HourFormat: false,
      }),
    ).toEqual({ digits: '0230', meridiem: 'PM' })
  })

  it('should include seconds only when the field collects them', () => {
    const opts = { use24HourFormat: true }
    expect(
      fromCanonical('14:30:15', { ...opts, includeSeconds: true }).digits,
    ).toEqual('143015')
    expect(
      fromCanonical('14:30:15', { ...opts, includeSeconds: false }).digits,
    ).toEqual('1430')
  })

  it.each(['', '14:30', 'nonsense'])(
    'should yield an empty entry for the non-canonical value %j',
    (value) => {
      expect(
        fromCanonical(value, {
          includeSeconds: false,
          use24HourFormat: true,
        }),
      ).toEqual({ digits: '', meridiem: 'AM' })
    },
  )

  it('should round-trip every minute of the day in both formats', () => {
    for (let hour = 0; hour < 24; hour++) {
      for (const minute of [0, 7, 30, 59]) {
        const canonical = `${String(hour).padStart(2, '0')}:${String(
          minute,
        ).padStart(2, '0')}:00`
        for (const use24HourFormat of [true, false]) {
          const opts = { includeSeconds: false, use24HourFormat }
          const { digits, meridiem } = fromCanonical(canonical, opts)
          expect(toCanonical({ digits, meridiem, ...opts })).toEqual(canonical)
        }
      }
    }
  })
})
