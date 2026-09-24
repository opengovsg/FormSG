import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import {
  GetObjectCommand,
  NoSuchKey,
  PutObjectCommand,
} from '@aws-sdk/client-s3'
import { Message } from '@aws-sdk/client-sqs'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { GrowthBook } from '@growthbook/growthbook'
import axios from 'axios'
import { ObjectId } from 'bson'
import { promises as dns } from 'dns'
import { featureFlags } from 'formsg-shared/constants/feature-flags'
import { BasicField } from 'formsg-shared/types'
import mongoose from 'mongoose'

import { aws } from 'src/app/config/config'
import formsgSdk from 'src/app/config/formsg-sdk'
import getFormModel from 'src/app/models/form.server.model'
import { createWebhookQueueHandler } from 'src/app/modules/webhook/webhook.consumer'
import { WebhookQueueMessageParsingError } from 'src/app/modules/webhook/webhook.errors'
import { WebhookProducer } from 'src/app/modules/webhook/webhook.producer'
import { IPopulatedMultirespondentForm } from 'src/types'
import { MultirespondentSubmissionDto } from 'src/types/api'
import { WebhookView } from 'src/types/submission'

import {
  createMultiRespondentFormSubmission,
  performMultiRespondentPostSubmissionCreateActions,
} from '../../multirespondent-submission.service'
import { SnapshotDataIntegrityError } from '../submission-snapshot.errors'

// Enable the real initial sender's queue, replacing only external I/O.
jest.mock('src/app/config/features/webhook-verified-content.config', () => {
  const actual = jest.requireActual(
    'src/app/config/features/webhook-verified-content.config',
  )
  return {
    ...actual,
    webhooksAndVerifiedContentConfig: {
      ...actual.webhooksAndVerifiedContentConfig,
      webhookQueueUrl: 'https://sqs.example/webhooks',
    },
  }
})
jest.mock('sqs-consumer', () => ({
  Consumer: {
    create: () => ({ on: jest.fn(), start: jest.fn() }),
  },
}))
jest.mock('sqs-producer', () => ({
  Producer: {
    create: () => ({ send: (...args: unknown[]) => mockSqsSend(...args) }),
  },
}))
jest.mock('axios')
jest.mock('@aws-sdk/s3-request-presigner')
jest.mock('src/app/config/logger', () => {
  const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() }
  return {
    ...jest.requireActual('src/app/config/logger'),
    createLoggerWithLabel: () => logger,
    __mockLogger: logger,
  }
})
const mockLogger = (
  jest.requireMock('src/app/config/logger') as {
    __mockLogger: { error: jest.Mock }
  }
).__mockLogger

const mockSqsSend = jest.fn()
const mockAxios = jest.mocked(axios)
const fieldId = new ObjectId().toHexString()
const attachmentIds = [
  new ObjectId().toHexString(),
  new ObjectId().toHexString(),
]
const GENERIC_URL = 'https://example.com/hook'
const growthbook = new GrowthBook({
  features: { [featureFlags.enableMrfWebhooks]: { defaultValue: true } },
})

describe('[GATE] webhook retry consumer fidelity', () => {
  const objects = new Map<string, string>()
  let queued: string[]
  let posted: string[]
  let producer: WebhookProducer

  beforeAll(async () => {
    await dbHandler.connect()
    producer = new WebhookProducer('https://sqs.example/webhooks')
  })

  beforeEach(() => {
    objects.clear()
    queued = []
    posted = []
    let signature = 0
    jest.mocked(getSignedUrl).mockImplementation(async (_client, command) => {
      const { Bucket, Key } = (command as GetObjectCommand).input
      return `https://s3.example/${Bucket}/${Key}?X-Amz-Signature=${++signature}`
    })
    mockSqsSend.mockImplementation(async (message: { body: string }) => {
      queued.push(message.body)
      return []
    })
    jest
      .spyOn(dns, 'lookup')
      .mockResolvedValue([{ address: '8.8.8.8', family: 4 }] as never)
    jest.spyOn(aws.s3, 'send').mockImplementation(async (command) => {
      if (command instanceof PutObjectCommand) {
        objects.set(
          `${command.input.Bucket}/${command.input.Key}`,
          String(command.input.Body),
        )
        return {} as never
      }
      if (command instanceof GetObjectCommand) {
        const body = objects.get(`${command.input.Bucket}/${command.input.Key}`)
        if (body === undefined) {
          throw new NoSuchKey({ $metadata: {}, message: 'Missing snapshot' })
        }
        return { Body: { transformToString: async () => body } } as never
      }
      throw new Error('Unexpected S3 operation')
    })
    mockAxios.post.mockImplementation(async (_url, body) => {
      posted.push(JSON.stringify(body))
      if (posted.length === 1) throw new Error('Transient connection failure')
      return {
        status: 200,
        data: {},
        headers: {},
        statusText: 'OK',
        config: {},
      }
    })
  })

  afterEach(async () => {
    await dbHandler.clearDatabase()
    jest.restoreAllMocks()
    jest.clearAllMocks()
  })
  afterAll(async () => await dbHandler.closeDatabase())

  const submit = async ({
    withAttachments = false,
    webhookUrl = GENERIC_URL,
  } = {}) => {
    const { form } = await dbHandler.insertMultirespondentForm({
      formOptions: {
        publicKey: formsgSdk.crypto.generate().publicKey,
        workflow: [],
        form_fields: [
          {
            _id: fieldId,
            fieldType: BasicField.ShortText,
            title: 'Name',
            required: true,
            disabled: false,
          },
          ...(withAttachments
            ? attachmentIds.map((_id) => ({
                _id,
                fieldType: BasicField.Attachment,
                title: 'Evidence',
                required: true,
                disabled: false,
                attachmentSize: '1',
              }))
            : []),
        ] as never,
        form_logics: [],
        webhook: { url: webhookUrl, isRetryEnabled: true },
      },
    })
    const populated = (await getFormModel(mongoose).getFullFormById(
      String(form._id),
    )) as IPopulatedMultirespondentForm
    const submissionKeypair = formsgSdk.crypto.generate()
    const attachmentPlaintext = Buffer.from('Scanned attachment')
    const attachmentResponses: Record<string, unknown> = {}
    const attachments: Record<string, unknown> = {}
    if (withAttachments) {
      for (const id of attachmentIds) {
        attachments[id] = {
          encryptedFile: await formsgSdk.cryptoV3.encryptFile(
            new Uint8Array(attachmentPlaintext),
            submissionKeypair.publicKey,
          ),
        }
        attachmentResponses[id] = {
          fieldType: BasicField.Attachment,
          answer: {
            value: 'evidence.txt',
            filename: 'evidence.txt',
            content: attachmentPlaintext,
            hasBeenScanned: true,
            md5Hash: 'mock-md5',
          },
        }
      }
    }
    const payload = {
      submissionPublicKey: submissionKeypair.publicKey,
      encryptedSubmissionSecretKey: 'wrapped-read-key',
      encryptedContent: 'native-v4-content',
      verifiedContent: 'native-v4-verified-content',
      submissionSecretKey: submissionKeypair.secretKey,
      version: 4,
      workflowStep: 0,
      attachments,
      responses: {
        ...attachmentResponses,
        [fieldId]: {
          fieldType: BasicField.ShortText,
          answer: { value: 'Alice' },
        },
      },
      mrfVersion: 2,
    } as unknown as MultirespondentSubmissionDto
    const { submission, snapshot } = (
      await createMultiRespondentFormSubmission({
        form: populated,
        encryptedPayload: payload,
        verifiedContentPlaintext: {
          'cpUen (Step 1)': '201234567A',
          'cpUid (Step 1)': 'S1234567D',
        },
        logMeta: { action: 'retry-fidelity-test' },
        growthbook,
      })
    )._unsafeUnwrap()
    await performMultiRespondentPostSubmissionCreateActions({
      submission,
      snapshot,
      submissionId: String(submission._id),
      form: populated,
      encryptedPayload: payload,
      logMeta: { action: 'retry-fidelity-test' },
      growthbook,
    })
    // Post-submission delivery is fire-and-forget; wait for its observable queue output.
    for (let attempt = 0; queued.length === 0 && attempt < 100; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 10))
    }
    expect(queued).toHaveLength(1)
    return { submission, form }
  }

  const consume = async (body = queued[queued.length - 1]) => {
    const message: Message = {
      Body: JSON.stringify({ ...JSON.parse(body), nextAttempt: Date.now() }),
    }
    await expect(createWebhookQueueHandler(producer)(message)).resolves.toBe(
      message,
    )
  }

  it('retries a failed V1 initial POST with identical bytes despite changed live content and form settings', async () => {
    const { submission, form } = await submit()
    const initial = posted[0]
    const initialData = (JSON.parse(initial) as WebhookView).data
    expect(initialData.version).toBe(2.1)
    expect(initialData.verifiedContent).toBeDefined()
    expect(initialData).not.toHaveProperty('encryptedSubmissionSecretKey')
    expect(initialData).not.toHaveProperty('workflowContent')

    submission.encryptedContent = 'changed-native-v4-content'
    submission.verifiedContent = 'changed-native-v4-verified-content'
    await submission.save()
    form.webhook!.webhookFormat = 'v4'
    await form.save()

    await consume()

    expect(posted).toEqual([initial, initial])
  })

  it.each([
    ['missing', () => undefined],
    ['invalid JSON', () => '{'],
    [
      'missing encrypted content',
      (body: string) =>
        JSON.stringify({ ...JSON.parse(body), encryptedContent: undefined }),
    ],
    [
      'unknown envelope version',
      (body: string) => JSON.stringify({ ...JSON.parse(body), _v: 999 }),
    ],
    [
      'wrong content format',
      (body: string) =>
        JSON.stringify({
          ...JSON.parse(body),
          contentFormat: 'v4',
          encryptedSubmissionSecretKey: 'wrong-key',
        }),
    ],
  ])(
    'logs a data-integrity error without posting the live row for V1 snapshot corruption: %s',
    async (_case, corrupt) => {
      await submit()
      for (const [key, body] of objects) {
        const corrupted = corrupt(body)
        if (corrupted === undefined) objects.delete(key)
        else objects.set(key, corrupted)
      }
      mockLogger.error.mockClear()

      await consume()

      expect(posted).toHaveLength(1)
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(SnapshotDataIntegrityError),
          meta: expect.objectContaining({
            webhookMessage: expect.objectContaining({
              snapshotRef: { submissionIndex: 0, contentFormat: 'v1' },
            }),
          }),
        }),
      )
    },
  )

  it.each([
    ['generic V1', GENERIC_URL, aws.submissionHistoryV1AttachmentS3Bucket],
    [
      'Plumber V4',
      'https://plumber.gov.sg/webhooks/retry',
      aws.attachmentS3Bucket,
    ],
  ])(
    'replays %s with fresh URLs targeting the same attachment objects for every field',
    async (_case, webhookUrl, bucket) => {
      const { submission } = await submit({ withAttachments: true, webhookUrl })
      submission.encryptedContent = 'changed-native-content'
      submission.verifiedContent = 'changed-native-verified-content'
      submission.attachmentMetadata = new Map([
        [attachmentIds[0], 'changed-native-object'],
      ])
      await submission.save()

      await consume()

      expect(posted).toHaveLength(2)
      const [initial, retry] = posted.map(
        (body) => (JSON.parse(body) as WebhookView).data,
      )
      expect(Object.keys(retry.attachmentDownloadUrls).sort()).toEqual(
        [...attachmentIds].sort(),
      )
      expect(retry.attachmentDownloadUrls).not.toEqual(
        initial.attachmentDownloadUrls,
      )
      const targets = (urls: Record<string, string>) =>
        Object.fromEntries(
          Object.entries(urls).map(([id, url]) => [id, url.split('?')[0]]),
        )
      expect({
        ...retry,
        attachmentDownloadUrls: targets(retry.attachmentDownloadUrls),
      }).toEqual({
        ...initial,
        attachmentDownloadUrls: targets(initial.attachmentDownloadUrls),
      })
      for (const url of Object.values(retry.attachmentDownloadUrls)) {
        const objectKey = new URL(url).pathname.slice(1)
        expect(objectKey.startsWith(`${bucket}/`)).toBe(true)
        expect(objects.has(objectKey)).toBe(true)
      }
    },
  )

  it('preserves V1 replay when a failed retry is queued again', async () => {
    await submit()
    const initial = posted[0]
    mockAxios.post.mockImplementationOnce(async (_url, body) => {
      posted.push(JSON.stringify(body))
      throw new Error('Another transient failure')
    })

    await consume()
    expect(queued).toHaveLength(2)
    await consume()

    expect(posted).toEqual([initial, initial, initial])
  })

  it('delivers an in-flight legacy queue message using the existing live-row mechanism', async () => {
    const { submission } = await submit({
      webhookUrl: 'https://plumber.gov.sg/webhooks/retry',
    })
    submission.encryptedContent = 'legacy-latest-native-content'
    await submission.save()
    objects.clear()
    const legacyMessage = JSON.stringify({
      _v: 0,
      submissionId: String(submission._id),
      previousAttempts: [Date.now()],
      nextAttempt: Date.now(),
    })

    await consume(legacyMessage)

    expect(posted).toHaveLength(2)
    const retry = (JSON.parse(posted[1]) as WebhookView).data
    expect(retry.encryptedContent).toBe('legacy-latest-native-content')
    expect(retry.version).toBe(4)
    expect(retry.encryptedSubmissionSecretKey).toBe('wrapped-read-key')
  })

  it('rejects and logs an unknown queue version without attempting delivery', async () => {
    await submit()
    mockLogger.error.mockClear()
    const message = {
      Body: JSON.stringify({
        ...JSON.parse(queued[0]),
        _v: 999,
        nextAttempt: Date.now(),
      }),
    }

    await expect(
      createWebhookQueueHandler(producer)(message),
    ).rejects.toBeUndefined()

    expect(posted).toHaveLength(1)
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.any(WebhookQueueMessageParsingError),
      }),
    )
  })
})
