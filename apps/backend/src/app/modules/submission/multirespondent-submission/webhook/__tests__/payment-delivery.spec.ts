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
import express from 'express'
import { featureFlags } from 'formsg-shared/constants/feature-flags'
import {
  BasicField,
  FormStatus,
  PaymentChannel,
  PaymentStatus,
  PaymentType,
} from 'formsg-shared/types'
import mongoose from 'mongoose'
import request from 'supertest'

import config, { aws } from 'src/app/config/config'
import formsgSdk from 'src/app/config/formsg-sdk'
import { stripe } from 'src/app/loaders/stripe'
import getFormModel from 'src/app/models/form.server.model'
import getPaymentModel from 'src/app/models/payment.server.model'
import getPendingSubmissionModel, {
  getEncryptPendingSubmissionModel,
} from 'src/app/models/pending_submission.server.model'
import {
  confirmPaymentPendingSubmission,
  performPaymentPostSubmissionActions,
} from 'src/app/modules/payments/payments.service'
import { copyPendingSubmissionToSubmissions } from 'src/app/modules/submission/submission.service'
import { createWebhookQueueHandler } from 'src/app/modules/webhook/webhook.consumer'
import { WebhookProducer } from 'src/app/modules/webhook/webhook.producer'
import { IPopulatedMultirespondentForm } from 'src/types'
import { MultirespondentSubmissionDto } from 'src/types/api'
import { WebhookView } from 'src/types/submission'

import { submitMultirespondentFormForTest } from '../../multirespondent-submission.controller'
import {
  createMultiRespondentFormPendingSubmission,
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
// Controller imports initialise the NDI clients. Stub their external discovery
// too, so unused authentication clients do not retry network calls forever.
jest.mock('axios', () => {
  const mock = jest.createMockFromModule<typeof import('axios')>('axios')
  jest.mocked(mock.default.get).mockResolvedValue({ data: { keys: [] } })
  return mock
})
jest.mock('openid-client-legacy', () => ({
  Issuer: { discover: jest.fn().mockResolvedValue({ Client: jest.fn() }) },
}))
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
const PLUMBER_URL = 'https://plumber.gov.sg/webhooks/payment'
const growthbook = new GrowthBook({
  features: {
    [featureFlags.enableMrfWebhooks]: { defaultValue: true },
    [featureFlags.mrfPayments]: { defaultValue: true },
  },
})

describe('[GATE] payment webhook delivery', () => {
  const objects = new Map<string, string>()
  let queued: string[]
  let posted: string[]
  let producer: WebhookProducer

  beforeAll(async () => {
    await dbHandler.connect()
    producer = new WebhookProducer('https://sqs.example/webhooks')
  })

  beforeEach(() => {
    jest
      .spyOn(config.mail.transporter, 'sendMail')
      .mockResolvedValue({} as never)
    jest
      .spyOn(stripe.paymentIntents, 'create')
      .mockResolvedValue({ id: 'pi_test' } as never)
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

  const prepare = async ({
    withAttachments = false,
    webhookUrl = GENERIC_URL,
    isRetryEnabled = true,
  } = {}) => {
    const formKeypair = formsgSdk.crypto.generate()
    const { form } = await dbHandler.insertMultirespondentForm({
      formOptions: {
        publicKey: formKeypair.publicKey,
        status: FormStatus.Public,
        hasCaptcha: false,
        payments_field: {
          enabled: true,
          payment_type: PaymentType.Fixed,
          amount_cents: 1000,
        } as never,
        payments_channel: {
          channel: PaymentChannel.Stripe,
          target_account_id: 'acct_test',
          publishable_key: 'pk_test',
        },
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
        webhook: { url: webhookUrl, isRetryEnabled },
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
      paymentReceiptEmail: 'payer@example.com',
    } as unknown as MultirespondentSubmissionDto
    return { form, populated, payload, formKeypair }
  }

  const submit = async (options: Parameters<typeof prepare>[0] = {}) => {
    const { form, populated, payload, formKeypair } = await prepare(options)
    const paymentId = new mongoose.Types.ObjectId()
    const submission = (
      await createMultiRespondentFormPendingSubmission({
        form: populated,
        paymentId: String(paymentId),
        encryptedPayload: payload,
        verifiedContentPlaintext: {
          'cpUen (Step 1)': '201234567A',
          'cpUid (Step 1)': 'S1234567D',
        },
        logMeta: { action: 'retry-fidelity-test' },
      })
    )._unsafeUnwrap()
    const payment = await getPaymentModel(mongoose).create({
      _id: paymentId,
      formId: form._id,
      pendingSubmissionId: submission._id,
      targetAccountId: 'acct_test',
      email: 'payer@example.com',
      amount: 1000,
      paymentIntentId: 'pi_test',
      gstEnabled: false,
      responses: [],
      payment_fields_snapshot: { payment_type: PaymentType.Variable },
    })
    return { submission, form, payment, formKeypair, payload, populated }
  }

  const submitThroughRoute = async (
    input: Awaited<ReturnType<typeof prepare>>,
    flags = growthbook,
  ) => {
    const app = express()
    app.post('/forms/:formId/submissions/multirespondent', (req, res) => {
      void submitMultirespondentFormForTest(
        Object.assign(req, {
          growthbook: flags,
          formsg: {
            formDef: input.populated,
            encryptedPayload: input.payload,
            verifiedContentPlaintext: {
              'cpUen (Step 1)': '201234567A',
              'cpUid (Step 1)': 'S1234567D',
            },
          },
        }) as Parameters<typeof submitMultirespondentFormForTest>[0],
        res,
      )
    })
    return request(app)
      .post(`/forms/${input.form._id}/submissions/multirespondent`)
      .send({})
  }

  const confirm = async (
    payment: Awaited<ReturnType<typeof submit>>['payment'],
    flags = growthbook,
  ) => {
    const session = await mongoose.startSession()
    try {
      ;(
        await confirmPaymentPendingSubmission(
          payment,
          new Date(),
          'https://receipt.example/test',
          50,
          session,
        )
      )._unsafeUnwrap()
      payment.status = PaymentStatus.Succeeded
      await payment.save()
    } finally {
      await session.endSession()
    }
    expect(
      (await performPaymentPostSubmissionActions(payment._id, flags)).isOk(),
    ).toBe(true)
    // The initial sender is fire-and-forget. Wait for its observable output.
    for (let attempt = 0; posted.length === 0 && attempt < 100; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 10))
    }
  }

  const consume = async (body = queued[queued.length - 1]) => {
    const message: Message = {
      Body: JSON.stringify({ ...JSON.parse(body), nextAttempt: Date.now() }),
    }
    await expect(createWebhookQueueHandler(producer)(message)).resolves.toBe(
      message,
    )
  }

  it('delivers a decryptable V1 payload with payment content after pending submission confirmation', async () => {
    const { payment, submission, formKeypair } = await submit()
    expect(posted).toEqual([])
    await confirm(payment)
    expect(String(payment.completedPayment!.submissionId)).toBe(
      String(submission._id),
    )
    expect(posted).toHaveLength(1)
    const { data } = JSON.parse(posted[0]) as WebhookView
    expect(data.version).toBe(2.1)
    expect(
      formsgSdk.crypto.decrypt(formKeypair.secretKey, data)?.responses,
    ).toEqual([
      {
        _id: fieldId,
        question: 'Name',
        fieldType: BasicField.ShortText,
        answer: 'Alice',
      },
    ])
    expect(
      formsgSdk.crypto.decrypt(formKeypair.secretKey, data)?.verified,
    ).toEqual({ cpUen: '201234567A', cpUid: 'S1234567D' })
    expect(data.paymentContent).toMatchObject({
      status: PaymentStatus.Succeeded,
      amount: '10.00',
      payer: 'payer@example.com',
    })
    expect(data).not.toHaveProperty('encryptedSubmissionSecretKey')
  })
  it('carries verified plaintext through the payment respondent controller into the delivered V1 payload', async () => {
    const input = await prepare()
    const response = await submitThroughRoute(input)
    expect(response.status).toBe(200)
    const payment = await getPaymentModel(mongoose).findById(
      response.body.paymentData.paymentId,
    )
    await confirm(payment!)
    const { data } = JSON.parse(posted[0]) as WebhookView
    expect(
      formsgSdk.crypto.decrypt(input.formKeypair.secretKey, data)?.verified,
    ).toEqual({ cpUen: '201234567A', cpUid: 'S1234567D' })
  })
  it('delivers and retries V1 from the first-step snapshot after MRF duplicate-key recovery', async () => {
    const { payment, formKeypair } = await submit()
    const session = await mongoose.startSession()
    try {
      ;(
        await copyPendingSubmissionToSubmissions(
          payment.pendingSubmissionId,
          session,
        )
      )._unsafeUnwrap()
    } finally {
      await session.endSession()
    }
    const post = mockAxios.post.getMockImplementation()!
    mockAxios.post.mockImplementationOnce(async (...args) => {
      await post(...args)
      throw new Error('Transient delivery failure')
    })
    await confirm(payment)
    const recoverySubmissionId = String(payment.completedPayment!.submissionId)
    expect(recoverySubmissionId).not.toBe(String(payment.pendingSubmissionId))
    for (let attempt = 0; queued.length === 0 && attempt < 100; attempt++)
      await new Promise((resolve) => setTimeout(resolve, 10))
    await consume()

    expect(posted).toHaveLength(2)
    for (const body of posted) {
      const { data } = JSON.parse(body) as WebhookView
      expect(data.submissionId).toBe(recoverySubmissionId)
      expect(
        formsgSdk.crypto.decrypt(formKeypair.secretKey, data)?.responses,
      ).toEqual([
        {
          _id: fieldId,
          question: 'Name',
          fieldType: BasicField.ShortText,
          answer: 'Alice',
        },
      ])
    }
    const reads = jest
      .mocked(aws.s3.send)
      .mock.calls.filter(([command]) => command instanceof GetObjectCommand)
      .map(([command]) => (command as GetObjectCommand).input.Key)
    expect(reads).toHaveLength(2)
    for (const key of reads)
      expect(key).toContain(`/${String(payment.pendingSubmissionId)}/`)
  })
  it.each([
    [
      'snapshot',
      aws.submissionHistoryV1S3Bucket,
      500,
      'Failed to save submission. Please try again later.',
    ],
    [
      'attachment',
      aws.submissionHistoryV1AttachmentS3Bucket,
      400,
      'Could not upload attachments for submission. For assistance, please contact the person who asked you to fill in this form.',
    ],
  ])(
    'rejects a required %s write failure before saving pending or creating a PaymentIntent, even without a URL',
    async (_kind, bucket, status, message) => {
      const input = await prepare({ withAttachments: true, webhookUrl: '' })
      const send = jest.mocked(aws.s3.send).getMockImplementation()!
      jest.mocked(aws.s3.send).mockImplementation(async (...args) => {
        const [command] = args
        if (
          command instanceof PutObjectCommand &&
          command.input.Bucket === bucket
        )
          throw new Error('S3 unavailable')
        return send(...args)
      })
      const response = await submitThroughRoute(input)
      expect(response.status).toBe(status)
      expect(response.body).toEqual({ message })
      expect(await getPendingSubmissionModel(mongoose).countDocuments()).toBe(0)
      expect(stripe.paymentIntents.create).not.toHaveBeenCalled()
      expect(posted).toEqual([])
    },
  )
  it.each([
    ['payment without retries', true, GENERIC_URL, false, true],
    ['non-payment without retries', false, GENERIC_URL, false, true],
    ['payment without a URL', true, '', true, true],
    ['payment with generic webhooks off', true, GENERIC_URL, true, false],
    [
      'payment to Plumber',
      true,
      'https://plumber.gov.sg/webhooks/payment',
      true,
      true,
    ],
  ] as const)(
    'writes the V1 snapshot only for %s, independently of send eligibility',
    async (_name, isPayment, webhookUrl, isRetryEnabled, enabled) => {
      const input = await prepare({
        withAttachments: true,
        webhookUrl,
        isRetryEnabled,
      })
      const flags = new GrowthBook({
        features: {
          [featureFlags.mrfPayments]: { defaultValue: true },
          [featureFlags.enableMrfWebhooks]: { defaultValue: enabled },
        },
      })
      const writes: { pendingCount: number; paymentIntentCount: number }[] = []
      const send = jest.mocked(aws.s3.send).getMockImplementation()!
      jest.mocked(aws.s3.send).mockImplementation(async (...args) => {
        const [command] = args
        if (command instanceof PutObjectCommand) {
          writes.push({
            pendingCount:
              await getPendingSubmissionModel(mongoose).countDocuments(),
            paymentIntentCount: jest.mocked(stripe.paymentIntents.create).mock
              .calls.length,
          })
        }
        return send(...args)
      })
      let status: number | undefined
      if (isPayment) {
        status = (await submitThroughRoute(input, flags)).status
      } else {
        ;(
          await createMultiRespondentFormSubmission({
            form: input.populated,
            encryptedPayload: input.payload,
            logMeta: { action: 'payment-delivery-test' },
            growthbook: flags,
          })
        )._unsafeUnwrap()
      }
      expect(status).toBe(isPayment ? 200 : undefined)
      expect(writes).toEqual(
        writes.map(() => ({ pendingCount: 0, paymentIntentCount: 0 })),
      )
      const snapshots = [...objects].filter(([key]) =>
        key.startsWith(`${aws.submissionHistoryV1S3Bucket}/`),
      )
      expect(snapshots).toHaveLength(isPayment ? 1 : 0)
      expect(
        [...objects.keys()].some((key) =>
          key.startsWith(`${aws.submissionHistoryV4S3Bucket}/`),
        ),
      ).toBe(false)
      for (const [, body] of snapshots) {
        const snapshot = JSON.parse(body)
        expect(
          formsgSdk.crypto.decrypt(input.formKeypair.secretKey, {
            ...snapshot,
            version: 2.1,
          })?.verified,
        ).toEqual({ cpUen: '201234567A', cpUid: 'S1234567D' })
        for (const key of Object.values(snapshot.attachmentMetadata)) {
          const stored = JSON.parse(
            objects.get(`${aws.submissionHistoryV1AttachmentS3Bucket}/${key}`)!,
          )
          const decrypted = await formsgSdk.crypto.decryptFile(
            input.formKeypair.secretKey,
            {
              ...stored.encryptedFile,
              binary: new Uint8Array(
                Buffer.from(stored.encryptedFile.binary, 'base64'),
              ),
            },
          )
          expect(Buffer.from(decrypted!)).toEqual(
            Buffer.from('Scanned attachment'),
          )
        }
      }
      // An abandoned checkout sends neither a webhook nor an integrity error.
      expect(posted).toEqual([])
      expect(mockLogger.error).not.toHaveBeenCalled()
    },
  )
  it.each([
    {
      name: 'URL added',
      beforeUrl: '',
      afterUrl: GENERIC_URL,
      webhooksEnabled: true,
      isRetryEnabled: false,
      expectedVersion: 2.1,
      editWorkflow: false,
    },
    {
      name: 'generic to Plumber',
      beforeUrl: GENERIC_URL,
      afterUrl: PLUMBER_URL,
      webhooksEnabled: false,
      isRetryEnabled: true,
      expectedVersion: 4,
      editWorkflow: false,
    },
    {
      name: 'Plumber to generic',
      beforeUrl: PLUMBER_URL,
      afterUrl: GENERIC_URL,
      webhooksEnabled: true,
      isRetryEnabled: true,
      expectedVersion: 2.1,
      editWorkflow: false,
    },
    {
      name: 'URL changed',
      beforeUrl: GENERIC_URL,
      afterUrl: 'https://example.com/new',
      webhooksEnabled: true,
      isRetryEnabled: true,
      expectedVersion: 2.1,
      editWorkflow: false,
    },
    {
      name: 'workflow edited after submission',
      beforeUrl: GENERIC_URL,
      afterUrl: GENERIC_URL,
      webhooksEnabled: true,
      isRetryEnabled: true,
      expectedVersion: 2.1,
      editWorkflow: true,
    },
    {
      name: 'URL removed',
      beforeUrl: GENERIC_URL,
      afterUrl: '',
      webhooksEnabled: true,
      isRetryEnabled: true,
      expectedVersion: undefined,
      editWorkflow: false,
    },
    {
      name: 'generic flag still off',
      beforeUrl: GENERIC_URL,
      afterUrl: GENERIC_URL,
      webhooksEnabled: false,
      isRetryEnabled: true,
      expectedVersion: undefined,
      editWorkflow: false,
    },
  ] as const)(
    'selects initial delivery at confirmation: $name',
    async ({
      beforeUrl,
      afterUrl,
      webhooksEnabled,
      isRetryEnabled,
      expectedVersion,
      editWorkflow,
    }) => {
      const input = await prepare({
        webhookUrl: beforeUrl,
        withAttachments: true,
      })
      const response = await submitThroughRoute(
        input,
        new GrowthBook({
          features: { [featureFlags.mrfPayments]: { defaultValue: true } },
        }),
      )
      expect(response.status).toBe(200)
      const payment = await getPaymentModel(mongoose).findById(
        response.body.paymentData.paymentId,
      )
      input.form.webhook = { url: afterUrl, isRetryEnabled }
      await input.form.save()
      if (editWorkflow)
        await input.form.updateOne({ $set: { workflow: [{}, {}] } })
      const originalObjects = [...objects]
      jest.mocked(aws.s3.send).mockClear()
      await confirm(
        payment!,
        new GrowthBook({
          features: {
            [featureFlags.enableMrfWebhooks]: { defaultValue: webhooksEnabled },
          },
        }),
      )
      expect(posted).toHaveLength(expectedVersion === undefined ? 0 : 1)
      const reads = jest
        .mocked(aws.s3.send)
        .mock.calls.filter(([command]) => command instanceof GetObjectCommand)
      expect(reads).toHaveLength(expectedVersion === 2.1 ? 1 : 0)
      expect([...objects]).toEqual(originalObjects)
      const data = posted[0]
        ? (JSON.parse(posted[0]) as WebhookView).data
        : undefined
      expect(mockAxios.post.mock.calls[0]?.[0]).toBe(
        expectedVersion === undefined ? undefined : afterUrl,
      )
      expect(data?.version).toBe(expectedVersion)
      const capturedContent = JSON.parse(
        originalObjects.find(([key]) =>
          key.startsWith(`${aws.submissionHistoryV1S3Bucket}/`),
        )![1],
      ).encryptedContent
      expect(data?.encryptedContent).toBe(
        expectedVersion === undefined
          ? undefined
          : expectedVersion === 4
            ? input.payload.encryptedContent
            : capturedContent,
      )
    },
  )
  it.each([
    ['V1', GENERIC_URL, PLUMBER_URL, aws.submissionHistoryV1AttachmentS3Bucket],
    ['V4', PLUMBER_URL, GENERIC_URL, aws.attachmentS3Bucket],
  ])(
    'retries payment %s to the current URL in its original format after a consumer change',
    async (format, before, after, bucket) => {
      const { payment, form } = await submit({
        webhookUrl: before,
        withAttachments: true,
      })
      const post = mockAxios.post.getMockImplementation()!
      mockAxios.post.mockImplementationOnce(async (...args) => {
        await post(...args)
        throw new Error('Transient delivery failure')
      })
      await confirm(payment)
      for (let attempt = 0; queued.length === 0 && attempt < 100; attempt++)
        await new Promise((resolve) => setTimeout(resolve, 10))
      expect(queued).toHaveLength(1)
      const message = JSON.parse(queued[0])
      expect(message.snapshotRef).toEqual(
        format === 'V1'
          ? { submissionIndex: 0, contentFormat: 'v1' }
          : undefined,
      )
      form.webhook!.url = after
      await form.save()
      jest.mocked(aws.s3.send).mockClear()
      await consume()
      expect(mockAxios.post.mock.calls.map(([url]) => url)).toEqual([
        before,
        after,
      ])
      const [initial, retry] = posted.map(
        (body) => (JSON.parse(body) as WebhookView).data,
      )
      expect(retry.attachmentDownloadUrls).not.toEqual(
        initial.attachmentDownloadUrls,
      )
      const normalise = (data: typeof initial) => ({
        ...data,
        attachmentDownloadUrls: Object.fromEntries(
          Object.entries(data.attachmentDownloadUrls).map(([id, url]) => [
            id,
            url.split('?')[0],
          ]),
        ),
      })
      expect(normalise(retry)).toEqual(normalise(initial))
      for (const url of Object.values(retry.attachmentDownloadUrls))
        expect(url).toContain(`/${bucket}/`)
      expect(aws.s3.send).toHaveBeenCalledTimes(format === 'V4' ? 0 : 1)
    },
  )
  it('still delivers the Storage-mode webhook after the same duplicate-key recovery', async () => {
    const { form } = await dbHandler.insertEncryptForm({
      formOptions: { webhook: { url: GENERIC_URL, isRetryEnabled: true } },
    })
    const paymentId = new mongoose.Types.ObjectId()
    const pending = await getEncryptPendingSubmissionModel(mongoose).create({
      form: form._id,
      authType: form.authType,
      encryptedContent: 'storage-content',
      version: 2.1,
      paymentId,
    })
    const payment = await getPaymentModel(mongoose).create({
      _id: paymentId,
      formId: form._id,
      pendingSubmissionId: pending._id,
      targetAccountId: 'acct_test',
      email: 'payer@example.com',
      amount: 1000,
      paymentIntentId: 'pi_storage',
      gstEnabled: false,
      responses: [],
      payment_fields_snapshot: { payment_type: PaymentType.Variable },
    })
    const session = await mongoose.startSession()
    try {
      ;(
        await copyPendingSubmissionToSubmissions(
          payment.pendingSubmissionId,
          session,
        )
      )._unsafeUnwrap()
    } finally {
      await session.endSession()
    }
    await confirm(payment)
    expect(String(payment.completedPayment!.submissionId)).not.toBe(
      String(payment.pendingSubmissionId),
    )
    expect(posted).toHaveLength(1)
    expect((JSON.parse(posted[0]) as WebhookView).data).toMatchObject({
      encryptedContent: 'storage-content',
      version: 2.1,
    })
  })
  it('blocks new payment submissions before the V1 snapshot write and PaymentIntent creation when mrf-payments is off', async () => {
    const input = await prepare({ withAttachments: true })
    const response = await submitThroughRoute(
      input,
      new GrowthBook({
        features: { [featureFlags.enableMrfWebhooks]: { defaultValue: true } },
      }),
    )
    expect(response.status).toBe(422)
    expect(response.body.message).toBe(
      'Payments are currently unavailable for this form. Please try again later, or contact the form admin.',
    )
    expect(objects.size).toBe(0)
    expect(await getPendingSubmissionModel(mongoose).countDocuments()).toBe(0)
    expect(stripe.paymentIntents.create).not.toHaveBeenCalled()
  })
  it.each([GENERIC_URL, PLUMBER_URL])(
    'stops outstanding retries for %s when the URL is removed or retries are disabled',
    async (webhookUrl) => {
      const { payment, form } = await submit({ webhookUrl })
      const post = mockAxios.post.getMockImplementation()!
      mockAxios.post.mockImplementationOnce(async (...args) => {
        await post(...args)
        throw new Error('Transient delivery failure')
      })
      await confirm(payment)
      for (let attempt = 0; queued.length === 0 && attempt < 100; attempt++)
        await new Promise((resolve) => setTimeout(resolve, 10))
      expect(queued).toHaveLength(1)
      form.webhook!.url = ''
      await form.save()
      await consume()
      form.webhook = { url: webhookUrl, isRetryEnabled: false }
      await form.save()
      await consume()
      expect(posted).toHaveLength(1)
      expect(queued).toHaveLength(1)
    },
  )
  it('maps V1 snapshot build failures before pending save or PaymentIntent creation', async () => {
    const input = await prepare()
    input.populated.publicKey = 'invalid-public-key'
    const response = await submitThroughRoute(input)
    expect(response.status).toBe(500)
    expect(response.body).toEqual({
      message: 'Failed to save submission. Please try again later.',
    })
    expect(await getPendingSubmissionModel(mongoose).countDocuments()).toBe(0)
    expect(stripe.paymentIntents.create).not.toHaveBeenCalled()
  })
  it('matches the non-payment V1 payload apart from payment content and per-submission metadata', async () => {
    const { payment, populated, payload, formKeypair } = await submit()
    await confirm(payment)
    const paid = (JSON.parse(posted[0]) as WebhookView).data
    populated.payments_field.enabled = false
    const { submission, snapshot } = (
      await createMultiRespondentFormSubmission({
        form: populated,
        encryptedPayload: payload,
        verifiedContentPlaintext: {
          'cpUen (Step 1)': '201234567A',
          'cpUid (Step 1)': 'S1234567D',
        },
        logMeta: { action: 'payment-delivery-test' },
        growthbook,
      })
    )._unsafeUnwrap()
    await performMultiRespondentPostSubmissionCreateActions({
      submission,
      snapshot,
      submissionId: String(submission._id),
      form: populated,
      encryptedPayload: payload,
      logMeta: { action: 'payment-delivery-test' },
      growthbook,
    })
    for (let attempt = 0; posted.length < 2 && attempt < 100; attempt++)
      await new Promise((resolve) => setTimeout(resolve, 10))
    expect(posted).toHaveLength(2)
    const unpaid = (JSON.parse(posted[1]) as WebhookView).data
    expect(Object.keys(paid).sort()).toEqual(Object.keys(unpaid).sort())
    const comparable = (data: typeof paid) => ({
      ...data,
      submissionId: undefined,
      created: undefined,
      paymentContent: undefined,
      encryptedContent: undefined,
      verifiedContent: undefined,
      decrypted: formsgSdk.crypto.decrypt(formKeypair.secretKey, data),
    })
    expect(comparable(paid)).toEqual(comparable(unpaid))
    expect(unpaid.paymentContent).toEqual({})
    expect(paid.paymentContent).toMatchObject({
      amount: '10.00',
      status: PaymentStatus.Succeeded,
    })
  })
  it('logs a missing payment snapshot without falling back to native V4', async () => {
    const { payment } = await submit()
    objects.clear()
    await confirm(payment)
    expect(posted).toEqual([])
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.any(SnapshotDataIntegrityError),
      }),
    )
  })
})
