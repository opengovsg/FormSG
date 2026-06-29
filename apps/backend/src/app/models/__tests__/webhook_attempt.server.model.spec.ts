import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import { ObjectId } from 'bson'
import mongoose from 'mongoose'

import getWebhookAttemptModel from 'src/app/models/webhook_attempt.server.model'
import { WebhookView } from 'src/types'

const WebhookAttempt = getWebhookAttemptModel(mongoose)

const MOCK_SUBMISSION_ID = new ObjectId()
const MOCK_FORM_ID = new ObjectId()

const makeWebhookView = (encryptedContent: string): WebhookView => ({
  data: {
    formId: MOCK_FORM_ID.toHexString(),
    submissionId: MOCK_SUBMISSION_ID.toHexString(),
    encryptedContent,
    verifiedContent: 'verified',
    version: 1,
    created: new Date('2026-06-17T08:30:00.000Z'),
    // Stable S3 keys (pre-presign), as stored.
    attachmentDownloadUrls: { fieldId1: 'form/sub/field/attachment' },
  },
})

const baseParams = (overrides: Record<string, unknown> = {}) => ({
  submissionId: MOCK_SUBMISSION_ID,
  submissionIndex: 0,
  formId: MOCK_FORM_ID,
  webhookUrl: 'https://example.com/hook',
  attemptNumber: 0,
  signature: 'sig',
  payload: makeWebhookView('enc-0'),
  status: 'failure' as const,
  expireAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  ...overrides,
})

describe('WebhookAttempt Model', () => {
  beforeAll(async () => await dbHandler.connect())
  afterEach(async () => await dbHandler.clearDatabase())
  afterAll(async () => await dbHandler.closeDatabase())

  describe('Schema', () => {
    it('registers a TTL index on expireAt', () => {
      const ttlIndex = WebhookAttempt.schema
        .indexes()
        .find(([fields]) => (fields as Record<string, unknown>).expireAt === 1)
      expect(ttlIndex).toBeDefined()
      expect(ttlIndex?.[1]).toMatchObject({ expireAfterSeconds: 0 })
    })

    it('uses the webhook_attempts collection', () => {
      expect(WebhookAttempt.collection.collectionName).toBe('webhook_attempts')
    })
  })

  describe('recordAttempt', () => {
    it('persists the outgoing payload, outcome and metadata', async () => {
      const params = baseParams({ response: { status: 400 } })

      const saved = await WebhookAttempt.recordAttempt(params)

      expect(saved.submissionIndex).toBe(0)
      expect(saved.attemptNumber).toBe(0)
      expect(saved.status).toBe('failure')
      expect(saved.response?.status).toBe(400)
      expect(saved.payload).toEqual(params.payload)

      const found = await WebhookAttempt.findById(saved._id).lean()
      expect(found?.webhookUrl).toBe('https://example.com/hook')
      expect(found?.expireAt).toBeInstanceOf(Date)
    })
  })

  describe('getReplayPayload', () => {
    it('returns the attempt #0 payload for a step (not later retries)', async () => {
      await WebhookAttempt.recordAttempt(
        baseParams({ attemptNumber: 0, payload: makeWebhookView('enc-step0') }),
      )
      await WebhookAttempt.recordAttempt(
        baseParams({ attemptNumber: 1, payload: makeWebhookView('enc-retry') }),
      )

      const replay = await WebhookAttempt.getReplayPayload(
        MOCK_SUBMISSION_ID.toHexString(),
        0,
      )

      expect(replay?.data.encryptedContent).toBe('enc-step0')
    })

    it('returns null when no attempt is stored for the step', async () => {
      const replay = await WebhookAttempt.getReplayPayload(
        new ObjectId().toHexString(),
        0,
      )

      expect(replay).toBeNull()
    })
  })
})
