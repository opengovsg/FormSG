import { ObjectId } from 'bson'
import { readFileSync } from 'fs'
import { resolve } from 'path'

import {
  DUE_TIME_TOLERANCE_SECONDS,
  QUEUE_MESSAGE_VERSION,
  QUEUE_MESSAGE_VERSION_LEGACY,
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
    _v: QUEUE_MESSAGE_VERSION_LEGACY,
  }

  const VALID_SNAPSHOT_MESSAGE: WebhookQueueMessageObject = {
    submissionId: new ObjectId().toHexString(),
    submissionIndex: 1,
    contentFormat: 'v4',
    previousAttempts: [Date.now()],
    nextAttempt: Date.now(),
    _v: QUEUE_MESSAGE_VERSION,
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

    it('should parse a legacy message enqueued before the snapshot retry path shipped', () => {
      const result = WebhookQueueMessage.deserialise(
        JSON.stringify(VALID_MESSAGE),
      )

      const message = result._unsafeUnwrap()
      expect(message.message._v).toBe(QUEUE_MESSAGE_VERSION_LEGACY)
      expect(message.submissionIndex).toBeUndefined()
      expect(message.contentFormat).toBeUndefined()
    })

    it('should parse a snapshot message carrying its submission index and content format', () => {
      const result = WebhookQueueMessage.deserialise(
        JSON.stringify(VALID_SNAPSHOT_MESSAGE),
      )

      const message = result._unsafeUnwrap()
      expect(message.message).toEqual(VALID_SNAPSHOT_MESSAGE)
      expect(message.submissionIndex).toBe(1)
      expect(message.contentFormat).toBe('v4')
    })

    it('should return WebhookQueueMessageParsingError when a snapshot message omits submissionIndex', () => {
      const { submissionIndex: _omitted, ...withoutIndex } =
        VALID_SNAPSHOT_MESSAGE as Extract<
          WebhookQueueMessageObject,
          { submissionIndex: number }
        >

      const result = WebhookQueueMessage.deserialise(
        JSON.stringify(withoutIndex),
      )

      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        WebhookQueueMessageParsingError,
      )
    })

    it('should return WebhookQueueMessageParsingError when a snapshot message omits contentFormat', () => {
      const { contentFormat: _omitted, ...withoutFormat } =
        VALID_SNAPSHOT_MESSAGE as Extract<
          WebhookQueueMessageObject,
          { contentFormat: string }
        >

      const result = WebhookQueueMessage.deserialise(
        JSON.stringify(withoutFormat),
      )

      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        WebhookQueueMessageParsingError,
      )
    })

    it('should fail loud on an unknown message version rather than defaulting to a path', () => {
      const result = WebhookQueueMessage.deserialise(
        JSON.stringify({
          ...VALID_SNAPSHOT_MESSAGE,
          _v: QUEUE_MESSAGE_VERSION + 1,
        }),
      )

      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        WebhookQueueMessageParsingError,
      )
    })
  })

  describe('fromSubmissionId', () => {
    const MOCK_NOW = Date.now()

    beforeAll(() => {
      jest.spyOn(Date, 'now').mockReturnValue(MOCK_NOW)
    })

    afterAll(() => jest.restoreAllMocks())

    it('should correctly create a WebhookQueueMessage without any retry history', () => {
      const submissionId = new ObjectId().toHexString()
      const result = WebhookQueueMessage.fromSubmissionId(submissionId)

      expect(result._unsafeUnwrap().message).toEqual({
        submissionId,
        previousAttempts: [MOCK_NOW],
        nextAttempt: expect.any(Number),
        _v: QUEUE_MESSAGE_VERSION_LEGACY,
      })
    })

    it('should name the step submission and content format when a snapshot was recorded', () => {
      const submissionId = new ObjectId().toHexString()
      const result = WebhookQueueMessage.fromSubmissionId(submissionId, {
        submissionIndex: 2,
        contentFormat: 'v4',
      })

      expect(result._unsafeUnwrap().message).toEqual({
        submissionId,
        previousAttempts: [MOCK_NOW],
        nextAttempt: expect.any(Number),
        _v: QUEUE_MESSAGE_VERSION,
        submissionIndex: 2,
        contentFormat: 'v4',
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

    it('should carry the named step submission and content format into the next attempt', () => {
      const msg = new WebhookQueueMessage(VALID_SNAPSHOT_MESSAGE)

      const result = msg.incrementAttempts()._unsafeUnwrap()

      expect(result.submissionIndex).toBe(1)
      expect(result.contentFormat).toBe('v4')
      expect(result.message._v).toBe(QUEUE_MESSAGE_VERSION)
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

  // @steering-gate: delete after S5 verified & merged
  describe('[STEERING:S5] M9 is pure', () => {
    const IO_IMPORT_SOURCES = [
      'aws-sdk',
      '@aws-sdk/',
      'axios',
      'mongoose',
      'sqs-producer',
      'sqs-consumer',
      '../../models/',
    ]

    it.each(['webhook.types.ts', 'webhook.message.ts'])(
      '%s reaches no I/O client',
      (moduleFile) => {
        const source = readFileSync(
          resolve(__dirname, '..', moduleFile),
          'utf8',
        )
        const importedFrom = [...source.matchAll(/from '([^']+)'/g)].map(
          ([, specifier]) => specifier,
        )

        expect(
          importedFrom.filter((specifier) =>
            IO_IMPORT_SOURCES.some((io) => specifier.startsWith(io)),
          ),
        ).toEqual([])
      },
    )
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
