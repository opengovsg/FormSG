import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import axios, { AxiosResponse } from 'axios'
import { ObjectId } from 'bson'
import { featureFlags } from 'formsg-shared/constants/feature-flags'
import {
  BasicField,
  FormAuthType,
  FormResponseMode,
  FormStatus,
  FormWorkflowStepDto,
  WorkflowType,
} from 'formsg-shared/types'
import mongoose from 'mongoose'
import { createRequest, createResponse } from 'node-mocks-http'

import { aws as AwsConfig } from 'src/app/config/config'
import formsgSdk from 'src/app/config/formsg-sdk'
import getFormModel from 'src/app/models/form.server.model'
import { submitMultirespondentFormForTest } from 'src/app/modules/submission/multirespondent-submission/multirespondent-submission.controller'
import {
  createMultiRespondentFormSubmission,
  getMultirespondentSubmission,
  performMultiRespondentPostSubmissionCreateActions,
} from 'src/app/modules/submission/multirespondent-submission/multirespondent-submission.service'
import { AttachmentUploadError } from 'src/app/modules/submission/submission.errors'
import { getSubmissionMetadataList } from 'src/app/modules/submission/submission.service'
import * as WebhookValidationModule from 'src/app/modules/webhook/webhook.validation'
import { IPopulatedMultirespondentForm } from 'src/types'
import { MultirespondentSubmissionDto } from 'src/types/api'
import { WebhookData, WebhookView } from 'src/types/submission'

import { V1ContentMappingError } from '../submission-snapshot.errors'
import { readSnapshot } from '../submission-snapshot.store'

import { FakeS3 } from './helpers/fake-s3'

jest.mock('axios')
const MockAxios = jest.mocked(axios)

jest.mock('src/app/modules/webhook/webhook.validation')
const MockWebhookValidation = jest.mocked(WebhookValidationModule)

const MOCK_AXIOS_RESPONSE = {
  data: { result: 'ok' },
  status: 200,
  statusText: 'success',
  headers: {},
  config: {},
} as AxiosResponse

const GENERIC_URL = 'https://example.com/hook'
const PLUMBER_URL = 'https://plumber.gov.sg/webhooks/x'

const shortTextId = new ObjectId().toHexString()
const attachmentId = new ObjectId().toHexString()

const ATTACHMENT_PLAINTEXT = Buffer.from(
  'the quick brown fox jumps over the lazy dog',
)
const DEFAULT_ATTACHMENTS = [
  { id: attachmentId, content: ATTACHMENT_PLAINTEXT },
]
type TestAttachment = (typeof DEFAULT_ATTACHMENTS)[number]

const ATTACHMENT_FILENAME = 'evidence.txt'

const FORM_FIELDS = [
  {
    _id: shortTextId,
    fieldType: BasicField.ShortText,
    title: 'Your name',
    description: '',
    required: true,
    disabled: false,
  },
  {
    _id: attachmentId,
    fieldType: BasicField.Attachment,
    title: 'Your evidence',
    description: '',
    required: true,
    disabled: false,
    attachmentSize: '1',
  },
]

const step = (): FormWorkflowStepDto =>
  ({
    _id: new ObjectId().toHexString(),
    workflow_type: WorkflowType.Static,
    emails: [],
    edit: [shortTextId, attachmentId],
  }) as FormWorkflowStepDto

let formKeypair: { publicKey: string; secretKey: string }
let formsBuilt = 0

const buildForm = async (
  webhook: Record<string, unknown>,
  attachments: TestAttachment[] = DEFAULT_ATTACHMENTS,
): Promise<IPopulatedMultirespondentForm> => {
  formsBuilt += 1
  const { form } = await dbHandler.insertMultirespondentForm({
    mailName: `admin-${formsBuilt}`,
    formOptions: {
      title: 'Converged storage-mode form',
      authType: FormAuthType.NIL,
      status: FormStatus.Public,
      hasCaptcha: false,
      submissionLimit: null,
      publicKey: formKeypair.publicKey,
      form_fields: [
        FORM_FIELDS[0],
        ...attachments.map(({ id }) => ({ ...FORM_FIELDS[1], _id: id })),
      ],
      form_logics: [],
      workflow: [
        { ...step(), edit: [shortTextId, ...attachments.map(({ id }) => id)] },
      ],
      webhook,
    } as never,
  })

  const populated = await getFormModel(mongoose).getFullFormById(
    String(form._id),
  )
  return populated as unknown as IPopulatedMultirespondentForm
}

const buildPayload = async (
  attachments: TestAttachment[] = DEFAULT_ATTACHMENTS,
): Promise<MultirespondentSubmissionDto> => {
  const submissionKeypair = formsgSdk.crypto.generate()
  return {
    submissionPublicKey: submissionKeypair.publicKey,
    encryptedSubmissionSecretKey: 'wrapped-read-key-v4',
    encryptedContent: 'v4-encrypted-content',
    verifiedContent: undefined,
    submissionSecretKey: submissionKeypair.secretKey,
    version: 4,
    workflowStep: 0,
    attachments: Object.fromEntries(
      await Promise.all(
        attachments.map(async ({ id, content }) => {
          const encryptedFile = await formsgSdk.cryptoV3.encryptFile(
            new Uint8Array(content),
            submissionKeypair.publicKey,
          )
          return [
            id,
            {
              encryptedFile: {
                ...encryptedFile,
                binary: Buffer.from(encryptedFile.binary).toString('base64'),
              },
            },
          ]
        }),
      ),
    ),
    responses: {
      [shortTextId]: {
        fieldType: BasicField.ShortText,
        answer: { value: 'Tan Ah Kow' },
      },
      ...Object.fromEntries(
        attachments.map(({ id, content }) => [
          id,
          {
            fieldType: BasicField.Attachment,
            answer: {
              value: ATTACHMENT_FILENAME,
              filename: ATTACHMENT_FILENAME,
              content,
              hasBeenScanned: true,
              md5Hash: 'mock-md5',
            },
          },
        ]),
      ),
    },
    mrfVersion: 2,
  } as unknown as MultirespondentSubmissionDto
}

const growthbookWith = (enableMrfWebhooks: boolean) =>
  ({
    isOn: jest.fn(
      (flag: string) =>
        flag === featureFlags.enableMrfWebhooks && enableMrfWebhooks,
    ),
    getFeatureValue: jest.fn((_flag: string, def: unknown) => def),
  }) as never

const flushPromises = () => new Promise((resolve) => setImmediate(resolve))

const SECOND_ATTACHMENT = {
  id: new ObjectId().toHexString(),
  content: Buffer.from([0, 255, 128, 1]),
}
const TWO_ATTACHMENTS = [...DEFAULT_ATTACHMENTS, SECOND_ATTACHMENT]

// Decode exactly the envelope an existing storage-mode consumer reads.
const decryptAttachment = async (object: Buffer, secretKey: string) => {
  const { encryptedFile } = JSON.parse(object.toString())
  const bytes = await formsgSdk.crypto.decryptFile(secretKey, {
    ...encryptedFile,
    binary: new Uint8Array(Buffer.from(encryptedFile.binary, 'base64')),
  })
  if (!bytes) throw new Error('Consumer could not decrypt the attachment')
  return Buffer.from(bytes)
}

describe('[GATE] V1 attachment form-key copies', () => {
  let storage: FakeS3

  beforeAll(async () => {
    await dbHandler.connect()
    formKeypair = formsgSdk.crypto.generate()
  })
  afterEach(async () => {
    await dbHandler.clearDatabase()
    jest.restoreAllMocks()
    jest.clearAllMocks()
    formsBuilt = 0
  })
  afterAll(async () => await dbHandler.closeDatabase())

  beforeEach(() => {
    storage = new FakeS3()
    storage.install()
    MockWebhookValidation.validateWebhookUrl.mockResolvedValue(undefined)
    MockAxios.post.mockResolvedValue(MOCK_AXIOS_RESPONSE)
  })

  const prepareSubmission = async ({
    attachments = DEFAULT_ATTACHMENTS,
    isRetryEnabled = true,
    webhookUrl = GENERIC_URL,
  } = {}) => ({
    form: await buildForm({ url: webhookUrl, isRetryEnabled }, attachments),
    encryptedPayload: await buildPayload(attachments),
    logMeta: { action: 'test' },
    growthbook: growthbookWith(true),
  })

  const submitThroughController = async (
    args: Awaited<ReturnType<typeof prepareSubmission>>,
  ) => {
    const request = createRequest({
      method: 'POST',
      params: { formId: String(args.form._id) },
      headers: { 'cf-connecting-ip': '127.0.0.1' },
      formsg: {
        formDef: args.form,
        encryptedPayload: args.encryptedPayload,
      },
      growthbook: args.growthbook,
    })
    const response = createResponse()
    await submitMultirespondentFormForTest(
      request as unknown as Parameters<
        typeof submitMultirespondentFormForTest
      >[0],
      response,
    )
    await flushPromises()
    return { status: response.statusCode, body: response._getJSONData() }
  }

  const receivedWebhook = (): WebhookData => {
    const post = MockAxios.post.mock.calls[0]
    expect(post).toBeDefined()
    return (post![1] as WebhookView).data
  }

  const submit = async (
    options: Parameters<typeof prepareSubmission>[0] = {},
  ) => {
    const args = await prepareSubmission(options)
    const result = await createMultiRespondentFormSubmission(args)
    const { submission, snapshot } = result._unsafeUnwrap()
    await performMultiRespondentPostSubmissionCreateActions({
      ...args,
      submission,
      snapshot,
      submissionId: String(submission._id),
    })
    await flushPromises()
    return {
      body: receivedWebhook(),
      submissionId: String(submission._id),
      submissionSecretKey: args.encryptedPayload.submissionSecretKey!,
    }
  }

  const downloadAndDecryptAttachments = async (
    body: WebhookData,
    secretKey = formKeypair.secretKey,
    bucket = AwsConfig.submissionHistoryV1AttachmentS3Bucket,
  ) =>
    Object.fromEntries(
      await Promise.all(
        Object.entries(body.attachmentDownloadUrls).map(
          async ([fieldId, url]) => [
            fieldId,
            await decryptAttachment(storage.download(url, bucket), secretKey),
          ],
        ),
      ),
    )

  const retrieveSubmission = async (id: string) =>
    (await getMultirespondentSubmission(id))._unsafeUnwrap()

  const retrieveSnapshot = async (submissionId: string) => {
    const submission = await retrieveSubmission(submissionId)
    const token = submission.submittedSteps?.[0]?.snapshotTokens?.v1
    if (!token) throw new Error('Submission has no V1 submission snapshot')
    return (
      await readSnapshot({
        formId: String(submission.form),
        submissionId,
        submissionIndex: 0,
        token,
        contentFormat: 'v1',
      })
    )._unsafeUnwrap()
  }

  const getSubmissionAndSnapshotCounts = async (formId: string) => {
    const listing = (
      await getSubmissionMetadataList(FormResponseMode.Multirespondent, formId)
    )._unsafeUnwrap()
    return {
      savedSubmissions: listing.count,
      storedSnapshots: storage.objectsIn(AwsConfig.submissionHistoryV1S3Bucket)
        .length,
    }
  }

  it('lets a storage-mode consumer download and decrypt the V1 attachment using its form secret key', async () => {
    const { body } = await submit()
    expect(await downloadAndDecryptAttachments(body)).toEqual({
      [attachmentId]: ATTACHMENT_PLAINTEXT,
    })
  })

  it('keeps every attachment associated with its field in the V1 delivery', async () => {
    const { body } = await submit({ attachments: TWO_ATTACHMENTS })
    // Downloading both URLs requires both files to have been PUT into the V1 bucket.
    expect(await downloadAndDecryptAttachments(body)).toEqual({
      [attachmentId]: ATTACHMENT_PLAINTEXT,
      [SECOND_ATTACHMENT.id]: Buffer.from([0, 255, 128, 1]),
    })
  })

  it('preserves the native attachments for callers retrieving the submission', async () => {
    const { submissionId, submissionSecretKey } = await submit({
      attachments: TWO_ATTACHMENTS,
    })
    const submission = await retrieveSubmission(submissionId)
    const nativeView = await submission.getWebhookView()
    const files = Object.fromEntries(
      await Promise.all(
        Object.entries(nativeView.data.attachmentDownloadUrls).map(
          async ([id, key]) => [
            id,
            await decryptAttachment(
              storage.read(AwsConfig.attachmentS3Bucket, key),
              submissionSecretKey,
            ),
          ],
        ),
      ),
    )
    expect(files).toEqual({
      [attachmentId]: ATTACHMENT_PLAINTEXT,
      [SECOND_ATTACHMENT.id]: Buffer.from([0, 255, 128, 1]),
    })
  })

  it('persists a V1 submission snapshot that references the same V1 attachments delivered initially', async () => {
    const { body, submissionId } = await submit({
      attachments: TWO_ATTACHMENTS,
    })
    const snapshot = await retrieveSnapshot(submissionId)
    const recordedTargets = Object.fromEntries(
      Object.entries(snapshot.attachmentMetadata ?? {}).map(([id, key]) => [
        id,
        { bucket: AwsConfig.submissionHistoryV1AttachmentS3Bucket, key },
      ]),
    )
    const deliveredTargets = Object.fromEntries(
      Object.entries(body.attachmentDownloadUrls).map(([id, url]) => [
        id,
        storage.targetOf(url),
      ]),
    )
    expect(recordedTargets).toEqual(deliveredTargets)
  })

  it('lets a Plumber consumer download native attachments using the submission secret key', async () => {
    const { body, submissionSecretKey } = await submit({
      webhookUrl: PLUMBER_URL,
    })
    expect(
      await downloadAndDecryptAttachments(
        body,
        submissionSecretKey,
        AwsConfig.attachmentS3Bucket,
      ),
    ).toEqual({ [attachmentId]: ATTACHMENT_PLAINTEXT })
  })

  it('does not create unused V1 copies for a Plumber delivery', async () => {
    await submit({ webhookUrl: PLUMBER_URL })
    expect(
      storage.objectsIn(AwsConfig.submissionHistoryV1AttachmentS3Bucket),
    ).toEqual([])
  })

  it('still lets the consumer download all attachments when retries are disabled', async () => {
    const { body } = await submit({
      attachments: TWO_ATTACHMENTS,
      isRetryEnabled: false,
    })
    expect(await downloadAndDecryptAttachments(body)).toEqual({
      [attachmentId]: ATTACHMENT_PLAINTEXT,
      [SECOND_ATTACHMENT.id]: Buffer.from([0, 255, 128, 1]),
    })
  })

  it('does not retain a V1 submission snapshot when retries are disabled', async () => {
    const { submissionId } = await submit({ isRetryEnabled: false })
    const submission = await retrieveSubmission(submissionId)
    expect({
      snapshotToken: submission.submittedSteps?.[0]?.snapshotTokens?.v1,
      snapshots: storage.objectsIn(AwsConfig.submissionHistoryV1S3Bucket),
    }).toEqual({ snapshotToken: undefined, snapshots: [] })
  })

  it('delivers an empty attachment download URL map when the form has no attachments', async () => {
    const { body } = await submit({ attachments: [] })
    expect(body.attachmentDownloadUrls).toEqual({})
  })

  it('does not store attachment objects when the form has no attachments', async () => {
    await submit({ attachments: [] })
    expect({
      v1: storage.objectsIn(AwsConfig.submissionHistoryV1AttachmentS3Bucket),
      native: storage.objectsIn(AwsConfig.attachmentS3Bucket),
    }).toEqual({ v1: [], native: [] })
  })

  it('does not save the submission or snapshot when attachment encryption fails', async () => {
    const args = await prepareSubmission()
    // Fault injection at the SDK boundary; successful encryption uses the real SDK.
    jest
      .spyOn(formsgSdk.crypto, 'encryptFile')
      .mockRejectedValueOnce(new Error('encryption failed'))
    const result = await createMultiRespondentFormSubmission(args)
    expect({
      error: result._unsafeUnwrapErr(),
      ...(await getSubmissionAndSnapshotCounts(String(args.form._id))),
    }).toEqual({
      error: expect.any(V1ContentMappingError),
      savedSubmissions: 0,
      storedSnapshots: 0,
    })
  })

  it('does not save the submission or snapshot when an attachment upload fails', async () => {
    const args = await prepareSubmission({ attachments: TWO_ATTACHMENTS })
    storage.failAfterOneV1Upload()
    const result = await createMultiRespondentFormSubmission(args)
    expect({
      error: result._unsafeUnwrapErr(),
      uploadedAttachments: storage.objectsIn(
        AwsConfig.submissionHistoryV1AttachmentS3Bucket,
      ).length,
      ...(await getSubmissionAndSnapshotCounts(String(args.form._id))),
    }).toEqual({
      error: expect.any(AttachmentUploadError),
      uploadedAttachments: 1,
      savedSubmissions: 0,
      storedSnapshots: 0,
    })
  })

  it('saves the submission and snapshot only after every attachment has finished uploading', async () => {
    const args = await prepareSubmission({ attachments: TWO_ATTACHMENTS })
    const upload = storage.pauseAfterOneV1Upload()
    const creation = createMultiRespondentFormSubmission(args)
    try {
      await Promise.race([
        upload.started,
        creation.then(() => {
          throw new Error(
            'Submission creation finished before the V1 upload was released',
          )
        }),
      ])
      expect(
        await getSubmissionAndSnapshotCounts(String(args.form._id)),
      ).toEqual({
        savedSubmissions: 0,
        storedSnapshots: 0,
      })
    } finally {
      upload.release()
    }
    const { submission } = (await creation)._unsafeUnwrap()
    const retrieved = await retrieveSubmission(String(submission._id))
    const snapshot = await retrieveSnapshot(String(submission._id))
    expect({
      submissionId: String(retrieved._id),
      attachments: Object.keys(snapshot.attachmentMetadata ?? {}),
    }).toEqual({
      submissionId: String(submission._id),
      attachments: [attachmentId, SECOND_ATTACHMENT.id],
    })
  })

  describe('controller attachment delivery', () => {
    it('accepts a submission and sends its decryptable attachments to the webhook consumer', async () => {
      const args = await prepareSubmission({ attachments: TWO_ATTACHMENTS })
      const response = await submitThroughController(args)

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        message: 'Form submission successful.',
      })
      expect(await downloadAndDecryptAttachments(receivedWebhook())).toEqual({
        [attachmentId]: ATTACHMENT_PLAINTEXT,
        [SECOND_ATTACHMENT.id]: Buffer.from([0, 255, 128, 1]),
      })
    })

    it('returns an error without sending a webhook when attachment encryption fails', async () => {
      const args = await prepareSubmission()
      jest
        .spyOn(formsgSdk.crypto, 'encryptFile')
        .mockRejectedValueOnce(new Error('encryption failed'))

      const response = await submitThroughController(args)

      expect({
        status: response.status,
        messageKey: response.body.messageKey,
        webhookAttempts: MockAxios.post.mock.calls.length,
      }).toEqual({
        status: 500,
        messageKey: 'features.publicForm.backendErrors.submission.saveFailed',
        webhookAttempts: 0,
      })
    })

    it('returns an error without sending a webhook when an attachment upload fails', async () => {
      const args = await prepareSubmission({ attachments: TWO_ATTACHMENTS })
      storage.failAfterOneV1Upload()

      const response = await submitThroughController(args)

      expect({
        status: response.status,
        messageKey: response.body.messageKey,
        webhookAttempts: MockAxios.post.mock.calls.length,
      }).toEqual({
        status: 400,
        messageKey:
          'features.publicForm.backendErrors.submission.files.uploadFailed',
        webhookAttempts: 0,
      })
    })
  })
})
