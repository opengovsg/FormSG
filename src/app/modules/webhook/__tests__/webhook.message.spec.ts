import { ObjectId } from 'bson'

import {
  DUE_TIME_TOLERANCE_SECONDS,
  QUEUE_MESSAGE_VERSION,
  RETRY_INTERVALS,
} from '../webhook.constants'
import {
  WebhookNoMoreRetriesError,
  WebhookQueueMessageParsingError,
} from '../webhook.errors'
import { WebhookQueueMessage } from '../webhook.message'
import { WebhookQueueMessageObject } from '../webhook.types'
import { prettifyEpoch } from '../webhook.utils'

describe('WebhookQueueMessage', () => {
  const VALID_MESSAGE: WebhookQueueMessageObject = {
    submissionId: new ObjectId().toHexString(),
    previousAttempts: [Date.now()],
    nextAttempt: Date.now(),
    _v: 0,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('deserialise', () => {
    it('should return WebhookQueueMessageParsingError when string is invalid JSON', () => {
      const result = WebhookQueueMessage.deserialise('tis')

      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        WebhookQueueMessageParsingError,
      )
    })

    it('should return WebhookQueueMessageParsingError when JSON has invalid shape', () => {
      const result = WebhookQueueMessage.deserialise(
        JSON.stringify({ but: 'a' }),
      )

      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        WebhookQueueMessageParsingError,
      )
    })

    it('should return WebhookQueueMessageParsingError when submissionId is not an ObjectId', () => {
      const result = WebhookQueueMessage.deserialise(
        JSON.stringify({
          ...VALID_MESSAGE,
          submissionId: 'flesh wound',
        }),
      )

      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        WebhookQueueMessageParsingError,
      )
    })

    it('should return instance of WebhookQueueMessage when input is valid', () => {
      const result = WebhookQueueMessage.deserialise(
        JSON.stringify(VALID_MESSAGE),
      )

      expect(result._unsafeUnwrap().message).toEqual(VALID_MESSAGE)
    })
  })

  describe('fromSubmissionId', () => {
    it('should correctly create a WebhookQueueMessage without any retry history', () => {
      const submissionId = new ObjectId().toHexString()
      const result = WebhookQueueMessage.fromSubmissionId(submissionId)

      expect(result._unsafeUnwrap().message).toEqual({
        submissionId,
        previousAttempts: [],
        nextAttempt: expect.any(Number),
        _v: QUEUE_MESSAGE_VERSION,
      })
    })
  })

  describe('serialise', () => {
    it('should return stringified message', () => {
      const msg = new WebhookQueueMessage(VALID_MESSAGE)

      expect(msg.serialise()).toEqual(JSON.stringify(VALID_MESSAGE))
    })
  })

  describe('isDue', () => {
    const MOCK_NOW = Date.now()

    beforeAll(() => {
      jest.spyOn(Date, 'now').mockReturnValue(MOCK_NOW)
    })

    afterAll(() => jest.restoreAllMocks())

    it('should return true if nextAttempt is in the past', () => {
      const msg = new WebhookQueueMessage({
        ...VALID_MESSAGE,
        nextAttempt: MOCK_NOW - 1,
      })

      expect(msg.isDue()).toBe(true)
    })

    it('should return true if nextAttempt is in the future but within tolerance', () => {
      const msg = new WebhookQueueMessage({
        ...VALID_MESSAGE,
        nextAttempt: MOCK_NOW + DUE_TIME_TOLERANCE_SECONDS * 1000 - 1,
      })

      expect(msg.isDue()).toBe(true)
    })

    it('should return false if nextAttempt is in the future and outside tolerance', () => {
      const msg = new WebhookQueueMessage({
        ...VALID_MESSAGE,
        nextAttempt: MOCK_NOW + DUE_TIME_TOLERANCE_SECONDS * 1000 + 1,
      })

      expect(msg.isDue()).toBe(true)
    })
  })

  describe('incrementAttempts', () => {
    it('should return incremented attempts when retries have not been exhausted', () => {
      const msg = new WebhookQueueMessage(VALID_MESSAGE)

      const result = msg.incrementAttempts()._unsafeUnwrap()

      expect(result.message.previousAttempts).toEqual([
        ...VALID_MESSAGE.previousAttempts,
        VALID_MESSAGE.nextAttempt,
      ])
      expect(result.message.submissionId).toBe(VALID_MESSAGE.submissionId)
      // nextAttempt should have been incremented
      expect(result.message.nextAttempt).toBeGreaterThan(
        VALID_MESSAGE.nextAttempt,
      )
    })

    it('should return WebhookNoMoreRetriesError when retries have been exhausted', () => {
      const msg = new WebhookQueueMessage({
        ...VALID_MESSAGE,
        // length greater than allowed number of retries
        previousAttempts: Array(RETRY_INTERVALS.length).fill(0),
      })

      const result = msg.incrementAttempts()._unsafeUnwrapErr()

      expect(result).toBeInstanceOf(WebhookNoMoreRetriesError)
    })
  })

  describe('getRetriesFailedState', () => {
    it('should correctly convert message to failed state', () => {
      const msg = new WebhookQueueMessage(VALID_MESSAGE)

      expect(msg.getRetriesFailedState()).toEqual({
        submissionId: VALID_MESSAGE.submissionId,
        previousAttempts: [
          ...VALID_MESSAGE.previousAttempts,
          VALID_MESSAGE.nextAttempt,
        ].map(prettifyEpoch),
        _v: VALID_MESSAGE._v,
      })
    })
  })

  describe('prettify', () => {
    it('should return human-readable form of message', () => {
      const msg = new WebhookQueueMessage(VALID_MESSAGE)

      expect(msg.prettify()).toEqual({
        submissionId: VALID_MESSAGE.submissionId,
        previousAttempts: VALID_MESSAGE.previousAttempts.map(prettifyEpoch),
        nextAttempt: prettifyEpoch(VALID_MESSAGE.nextAttempt),
        _v: VALID_MESSAGE._v,
      })
    })
  })
})
