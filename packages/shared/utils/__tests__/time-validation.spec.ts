import { isCanonicalTime, normalizeTime } from '../time-validation'

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
