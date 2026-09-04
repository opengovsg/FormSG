import { describe, expect, it } from 'vitest'

import { isValidTimeOfDay } from './TimeInput'

/**
 * `isValidTimeOfDay` is what stops a partially-typed time from being saved.
 * That matters more than it looks: `toCloseAt` builds the instant with
 * `date-fns`' `set`, which coerces rather than rejecting — so an unguarded
 * partial value does not throw, it silently persists the wrong deadline.
 * "09:3" becomes 09:03, and an empty field becomes midnight.
 */
describe('isValidTimeOfDay', () => {
  it.each(['00:00', '09:30', '13:05', '23:59'])('should accept %s', (v) => {
    expect(isValidTimeOfDay(v)).toBe(true)
  })

  it.each([
    ['', 'empty'],
    ['0', 'single digit'],
    ['09', 'hours only'],
    ['09:', 'trailing colon'],
    ['09:3', 'one minute digit — would silently save 09:03'],
    ['1430', 'unmasked digits'],
    ['24:00', 'hour out of range'],
    ['23:60', 'minute out of range'],
    ['99:99', 'both out of range'],
    ['9:30', 'unpadded hour'],
    ['ab:cd', 'letters'],
  ])('should reject %j (%s)', (v) => {
    expect(isValidTimeOfDay(v)).toBe(false)
  })
})
