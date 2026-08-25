import {
  from24HourClock,
  isCanonicalTime,
  normalizeTime,
  to24HourClock,
} from '../time-validation'

/**
 * These two functions are the boundary between what a respondent may send and
 * what is persisted. The display settings on a Time field (`includeSeconds`,
 * `use24HourFormat`) never reach here: the input converts to 24-hour form
 * before submitting, so nothing meridiem-shaped is ever normalised.
 */
describe('normalizeTime', () => {
  describe('without seconds', () => {
    it.each([
      ['09:30', '09:30:00'],
      ['00:00', '00:00:00'],
      ['23:59', '23:59:00'],
      ['9:30', '09:30:00'], // unpadded hour
      ['  09:30  ', '09:30:00'], // surrounding whitespace
    ])('should normalise %j to %j', (input, expected) => {
      expect(normalizeTime(input, false)).toEqual(expected)
    })

    it('should reject a seconds component when the field does not collect one', () => {
      // Belt and braces: the input never offers seconds when includeSeconds is
      // false, so this only catches a hand-crafted API call.
      expect(normalizeTime('09:30:15', false)).toBeNull()
    })
  })

  describe('with seconds', () => {
    it.each([
      ['09:30:15', '09:30:15'],
      ['23:59:59', '23:59:59'],
      ['9:30:5', '09:30:05'], // unpadded hour and seconds
    ])('should normalise %j to %j', (input, expected) => {
      expect(normalizeTime(input, true)).toEqual(expected)
    })

    it('should default a missing seconds component to 00', () => {
      // Full precision is stored either way, so an export column stays uniform.
      expect(normalizeTime('09:30', true)).toEqual('09:30:00')
    })
  })

  describe('rejects', () => {
    it.each([
      ['', 'empty'],
      ['   ', 'whitespace only'],
      ['0930', 'no separator'],
      ['09', 'hour only'],
      ['09:', 'trailing separator'],
      ['24:00', 'hour out of range'],
      ['09:60', 'minute out of range'],
      ['09:30:60', 'seconds out of range'],
      ['-1:30', 'negative hour'],
      ['09:30 PM', 'meridiem suffix'],
      ['9:30pm', 'meridiem suffix, no space'],
      ['ab:cd', 'letters'],
      ['09:30:15:20', 'too many components'],
    ])('should reject %j (%s)', (input) => {
      expect(normalizeTime(input, true)).toBeNull()
      expect(normalizeTime(input, false)).toBeNull()
    })
  })

  it('should be idempotent on an already canonical value', () => {
    const once = normalizeTime('14:30:00', true)
    expect(once).toEqual('14:30:00')
    expect(normalizeTime(once as string, true)).toEqual(once)
  })
})

describe('isCanonicalTime', () => {
  it.each(['00:00:00', '09:30:15', '23:59:59'])(
    'should accept the canonical form %j',
    (value) => {
      expect(isCanonicalTime(value)).toBe(true)
    },
  )

  it.each([
    ['09:30', 'no seconds component'],
    ['9:30:00', 'unpadded hour'],
    ['24:00:00', 'hour out of range'],
    ['02:30:00 PM', 'meridiem suffix'],
    ['', 'empty'],
  ])('should reject %j (%s)', (value) => {
    expect(isCanonicalTime(value)).toBe(false)
  })

  it('should accept whatever normalizeTime produces', () => {
    // The two must agree, or a value could be normalised and then rejected on
    // the way into storage.
    for (const input of ['9:30', '09:30', '23:59:59', '0:0:0']) {
      const normalized = normalizeTime(input, true)
      expect(normalized).not.toBeNull()
      expect(isCanonicalTime(normalized as string)).toBe(true)
    }
  })
})

describe('to24HourClock / from24HourClock', () => {
  // The dial's two ends are the ones that catch people out.
  it.each([
    [12, 'AM', 0], // midnight
    [1, 'AM', 1],
    [11, 'AM', 11],
    [12, 'PM', 12], // noon
    [1, 'PM', 13],
    [11, 'PM', 23],
  ] as const)('should convert %i %s to %i', (hour12, meridiem, expected) => {
    expect(to24HourClock(hour12, meridiem)).toEqual(expected)
  })

  it.each([0, 13, -1, 1.5, NaN])(
    'should reject %p as a 12-hour reading',
    (hour12) => {
      expect(to24HourClock(hour12 as number, 'AM')).toBeNull()
    },
  )

  it.each([
    [0, 12, 'AM'],
    [1, 1, 'AM'],
    [11, 11, 'AM'],
    [12, 12, 'PM'],
    [13, 1, 'PM'],
    [23, 11, 'PM'],
  ] as const)('should convert %i back to %i %s', (hour24, hour12, meridiem) => {
    expect(from24HourClock(hour24)).toEqual({ hour12, meridiem })
  })

  it.each([-1, 24, 1.5])('should reject %p as a 24-hour hour', (hour24) => {
    expect(from24HourClock(hour24 as number)).toBeNull()
  })

  it('should round-trip every hour of the day', () => {
    for (let hour24 = 0; hour24 <= 23; hour24++) {
      const split = from24HourClock(hour24)
      expect(split).not.toBeNull()
      const { hour12, meridiem } = split as {
        hour12: number
        meridiem: 'AM' | 'PM'
      }
      expect(to24HourClock(hour12, meridiem)).toEqual(hour24)
    }
  })
})
