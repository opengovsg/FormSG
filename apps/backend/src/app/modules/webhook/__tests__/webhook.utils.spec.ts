import { addHours, addMinutes } from 'date-fns'
import { last } from 'lodash'

import { randomUniformInt } from 'src/app/utils/random-uniform'

import { MAX_DELAY_SECONDS, RETRY_INTERVALS } from '../webhook.constants'
import { WebhookNoMoreRetriesError } from '../webhook.errors'
import { calculateDelaySeconds, getNextAttempt } from '../webhook.utils'

jest.mock('src/app/utils/random-uniform')
const MockRandomUniformInt = jest.mocked(randomUniformInt)

describe('webhook.utils', () => {
  const MOCK_NOW = Date.now()
  const MOCK_RANDOM_INT = 37

  beforeAll(() => {
    jest.spyOn(Date, 'now').mockReturnValue(MOCK_NOW)
    MockRandomUniformInt.mockReturnValue(MOCK_RANDOM_INT)
  })
  describe('getNextAttempt', () => {
    it('should return WebhookNoMoreRetriesError when retry limit is exceeded', () => {
      // array of previous attempts is equal to RETRY_INTERVALS + 1, meaning
      // all retries are used up (in addition to 1 initial webhook attempt)
      const result = getNextAttempt(Array(RETRY_INTERVALS.length + 1).fill(0))

      expect(result._unsafeUnwrapErr()).toEqual(new WebhookNoMoreRetriesError())
    })

    it('should return time of next attempt correctly when there are retries remaining', () => {
      // total number of allowed attempts is RETRY_INTERVALS.length + 1, with the +1
      // accounting for the initial attempt
      const result = getNextAttempt(
        Array(RETRY_INTERVALS.length).fill(MOCK_NOW),
      )

      const finalRetryInterval = last(RETRY_INTERVALS)!
      expect(MockRandomUniformInt).toHaveBeenCalledWith(
        finalRetryInterval.base - finalRetryInterval.jitter,
        finalRetryInterval.base + finalRetryInterval.jitter,
      )
      // previousAttempts array was filled with MOCK_NOW, so next attempt is calculated
      // from MOCK_NOW
      expect(result._unsafeUnwrap()).toBe(MOCK_NOW + MOCK_RANDOM_INT * 1000)
    })
  })

  describe('calculateDelaySeconds', () => {
    it('should return 0 when nextAttempt is in the past', () => {
      const result = calculateDelaySeconds(MOCK_NOW - 1000)

      expect(result).toBe(0)
    })

    it('should return a maximum of 15min regardless of how far nextAttempt is in the future', () => {
      const result = calculateDelaySeconds(addHours(MOCK_NOW, 12).getTime())

      expect(result).toBe(MAX_DELAY_SECONDS)
    })

    it('should return exactly the time to nextAttempt if it is less than 15min in the future', () => {
      const minutesInFuture = 10
      const result = calculateDelaySeconds(
        addMinutes(MOCK_NOW, minutesInFuture).getTime(),
      )

      expect(result).toBe(minutesInFuture * 60)
    })
  })
})
