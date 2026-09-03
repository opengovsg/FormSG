import { describe, expect, it } from 'vitest'

import {
  formatTimeEntry,
  meridiemOf,
  parseTimeEntry,
  stripUntypeable,
} from './TimeInput'

/**
 * The widget's whole job is to turn what the respondent typed into the
 * canonical persisted form. This conversion is where the display settings
 * stop — nothing meridiem-shaped goes any further.
 */
const parse = (
  raw: string,
  opts: Partial<{
    meridiem: 'AM' | 'PM'
    includeSeconds: boolean
    use24HourFormat: boolean
  }> = {},
) =>
  parseTimeEntry(raw, {
    meridiem: opts.meridiem ?? 'AM',
    includeSeconds: opts.includeSeconds ?? false,
    use24HourFormat: opts.use24HourFormat ?? true,
  })

describe('parseTimeEntry', () => {
  describe('24-hour', () => {
    it.each([
      ['0930', '09:30:00', 'four digits'],
      ['930', '09:30:00', 'three digits read as h:mm'],
      ['9:30', '09:30:00', 'unpadded hour'],
      ['09:30', '09:30:00', 'already padded'],
      ['9', '09:00:00', 'a bare hour is the top of that hour'],
      ['14', '14:00:00', 'a bare two-digit hour'],
      ['1430', '14:30:00', 'afternoon'],
      ['0000', '00:00:00', 'midnight'],
      ['2359', '23:59:00', 'last minute of the day'],
      [' 9:30 ', '09:30:00', 'surrounding whitespace'],
    ])('should parse %j as %j (%s)', (raw, expected) => {
      expect(parse(raw)).toEqual(expected)
    })

    it.each([
      ['093015', '09:30:15', 'six digits'],
      ['93015', '09:30:15', 'five digits read as h:mm:ss'],
      ['9:30:15', '09:30:15', 'unpadded hour with seconds'],
      ['0930', '09:30:00', 'seconds may be left off'],
    ])(
      'should parse %j as %j (%s) when the field collects seconds',
      (raw, expected) => {
        expect(parse(raw, { includeSeconds: true })).toEqual(expected)
      },
    )
  })

  describe('12-hour', () => {
    const opts = { use24HourFormat: false }

    it.each([
      ['1230', 'AM', '00:30:00', '12 AM is midnight'],
      ['1230', 'PM', '12:30:00', '12 PM is noon'],
      ['230', 'PM', '14:30:00', 'the toggle supplies the half of the day'],
      ['230', 'AM', '02:30:00', 'the same entry on the other half'],
      ['1159', 'PM', '23:59:00', 'last minute of the day'],
    ] as [string, 'AM' | 'PM', string, string][])(
      'should parse %j with %s as %j (%s)',
      (raw, meridiem, expected) => {
        expect(parse(raw, { ...opts, meridiem })).toEqual(expected)
      },
    )

    it.each([
      ['9:30pm', 'AM', '21:30:00', 'a typed meridiem outranks the toggle'],
      ['9:30 PM', 'AM', '21:30:00', 'spaced and upper case'],
      ['12:30am', 'PM', '00:30:00', 'typed AM against a PM toggle'],
      ['1430', 'AM', '14:30:00', '24-hour entry is taken at face value'],
      ['0030', 'PM', '00:30:00', 'a zero hour is half past midnight'],
    ] as [string, 'AM' | 'PM', string, string][])(
      'should parse %j with toggle %s as %j (%s)',
      (raw, meridiem, expected) => {
        expect(parse(raw, { ...opts, meridiem })).toEqual(expected)
      },
    )

    it('should accept a typed meridiem in 24-hour mode too', () => {
      expect(parse('3:00pm', { use24HourFormat: true })).toEqual('15:00:00')
    })
  })

  describe('refuses what is not a time', () => {
    it.each([
      ['', 'empty'],
      ['   ', 'whitespace only'],
      [':', 'bare colon'],
      ['9:', 'trailing colon'],
      [':30', 'leading colon'],
      ['abc', 'letters'],
      ['pm', 'a meridiem with no time'],
      ['9:60', 'minute out of range'],
      ['2400', 'hour 24'],
      ['2500', 'hour 25'],
      ['9:30:15', 'seconds the field does not collect'],
      ['093015', 'six digits when the field does not collect seconds'],
      ['1:2:3:4', 'too many parts'],
    ])('should return null for %j (%s)', (raw) => {
      expect(parse(raw)).toBeNull()
    })

    it.each([
      ['14:00pm', 'a 24-hour hour contradicts an explicit meridiem'],
      ['0:00am', 'hour 0 contradicts an explicit meridiem'],
    ])('should return null for %j (%s)', (raw) => {
      expect(parse(raw, { use24HourFormat: false })).toBeNull()
    })

    it('should reject a seconds entry that is out of range', () => {
      expect(parse('9:30:60', { includeSeconds: true })).toBeNull()
    })
  })
})

describe('formatTimeEntry', () => {
  it.each([
    ['14:30:00', true, false, '14:30'],
    ['14:30:00', false, false, '02:30'],
    ['00:30:00', false, false, '12:30'],
    ['12:00:00', false, false, '12:00'],
    ['14:30:15', true, true, '14:30:15'],
    ['14:30:15', false, true, '02:30:15'],
  ] as [string, boolean, boolean, string][])(
    'should render %j (24h %s, seconds %s) as %j',
    (value, use24HourFormat, includeSeconds, expected) => {
      expect(
        formatTimeEntry(value, { includeSeconds, use24HourFormat }),
      ).toEqual(expected)
    },
  )

  it.each(['', '14:30', 'nonsense'])(
    'should render nothing for the non-canonical value %j',
    (value) => {
      expect(
        formatTimeEntry(value, {
          includeSeconds: false,
          use24HourFormat: true,
        }),
      ).toEqual('')
    },
  )
})

describe('meridiemOf', () => {
  it.each([
    ['00:00:00', 'AM'],
    ['11:59:00', 'AM'],
    ['12:00:00', 'PM'],
    ['23:59:00', 'PM'],
    ['nonsense', 'AM'],
  ])('should read %j as %s', (value, expected) => {
    expect(meridiemOf(value)).toEqual(expected)
  })
})

describe('stripUntypeable', () => {
  it('should keep digits, separators and the meridiem letters', () => {
    expect(stripUntypeable('9:30 pm')).toEqual('9:30 pm')
  })

  it('should drop anything that could not become a time', () => {
    expect(stripUntypeable('9x:3&0')).toEqual('9:30')
  })
})

/**
 * Round-tripping is the property that keeps the box honest: what is shown back
 * plus the toggle beside it must re-parse to the same instant, or blurring
 * twice would walk the respondent's answer.
 */
describe('round-tripping', () => {
  it('should re-parse every displayed time in both formats', () => {
    for (let hour = 0; hour < 24; hour++) {
      for (const minute of [0, 7, 30, 59]) {
        const canonical = `${String(hour).padStart(2, '0')}:${String(
          minute,
        ).padStart(2, '0')}:00`
        for (const use24HourFormat of [true, false]) {
          const display = { includeSeconds: false, use24HourFormat }
          const text = formatTimeEntry(canonical, display)
          expect(
            parseTimeEntry(text, {
              ...display,
              meridiem: meridiemOf(canonical),
            }),
          ).toEqual(canonical)
        }
      }
    }
  })
})
