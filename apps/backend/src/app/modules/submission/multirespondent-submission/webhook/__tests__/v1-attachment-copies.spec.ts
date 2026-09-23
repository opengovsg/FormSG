import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import axios, { AxiosResponse } from 'axios'
import { ObjectId } from 'bson'
import { featureFlags } from 'formsg-shared/constants/feature-flags'
import {
  BasicField,
  FormAuthType,
  FormWorkflowStepDto,
  WorkflowType,
} from 'formsg-shared/types'
import mongoose from 'mongoose'
import { okAsync } from 'neverthrow'

import { aws as AwsConfig } from 'src/app/config/config'
import formsgSdk from 'src/app/config/formsg-sdk'
import getFormModel from 'src/app/models/form.server.model'
import {
  createMultiRespondentFormSubmission,
  performMultiRespondentPostSubmissionCreateActions,
} from 'src/app/modules/submission/multirespondent-submission/multirespondent-submission.service'
import * as WebhookValidationModule from 'src/app/modules/webhook/webhook.validation'
import * as SubmissionService from 'src/app/modules/submission/submission.service'
import { s3Operations } from 'src/app/utils/aws-s3'
import { IPopulatedMultirespondentForm } from 'src/types'
import { MultirespondentSubmissionDto } from 'src/types/api'
import { WebhookData, WebhookView } from 'src/types/submission'

import { SubmissionSnapshot } from '../submission-snapshot.schema'
import * as SnapshotStoreModule from '../submission-snapshot.store'

jest.mock('axios')
const MockAxios = jest.mocked(axios)

jest.mock('src/app/modules/webhook/webhook.validation')
const MockWebhookValidation = jest.mocked(WebhookValidationModule)

jest.mock('../submission-snapshot.store')
const MockSnapshotStore = jest.mocked(SnapshotStoreModule)

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
): Promise<IPopulatedMultirespondentForm> => {
  formsBuilt += 1
  const { form } = await dbHandler.insertMultirespondentForm({
    mailName: `admin-${formsBuilt}`,
    formOptions: {
      title: 'Converged storage-mode form',
      authType: FormAuthType.NIL,
      publicKey: formKeypair.publicKey,
      form_fields: FORM_FIELDS,
      form_logics: [],
      workflow: [step()],
      webhook,
    } as never,
  })

  const populated = await getFormModel(mongoose).getFullFormById(
    String(form._id),
  )
  return populated as unknown as IPopulatedMultirespondentForm
}

/**
 * The native attachment objects a submission always writes: encrypted to the
 * submission key, which a V1 consumer cannot open.
 */
const buildNativeEncryptedAttachments = async (
  submissionPublicKey: string,
) => ({
  [attachmentId]: {
    encryptedFile: await formsgSdk.cryptoV3.encryptFile(
      new Uint8Array(ATTACHMENT_PLAINTEXT),
      submissionPublicKey,
    ),
  },
})

const buildPayload = async (): Promise<MultirespondentSubmissionDto> => {
  const submissionKeypair = formsgSdk.crypto.generate()
  return {
    submissionPublicKey: submissionKeypair.publicKey,
    encryptedSubmissionSecretKey: 'wrapped-read-key-v4',
    encryptedContent: 'v4-encrypted-content',
    verifiedContent: undefined,
    submissionSecretKey: submissionKeypair.secretKey,
    version: 4,
    workflowStep: 0,
    attachments: await buildNativeEncryptedAttachments(
      submissionKeypair.publicKey,
    ),
    responses: {
      [shortTextId]: {
        fieldType: BasicField.ShortText,
        answer: { value: 'Tan Ah Kow' },
      },
      [attachmentId]: {
        fieldType: BasicField.Attachment,
        answer: {
          value: ATTACHMENT_FILENAME,
          filename: ATTACHMENT_FILENAME,
          content: ATTACHMENT_PLAINTEXT,
          hasBeenScanned: true,
          md5Hash: 'mock-md5',
        },
      },
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

type PutCall = { Bucket?: string; Key?: string; Body?: unknown }

describe('[GATE] V1 attachment form-key copies', () => {
  let putCalls: PutCall[]
  let signCalls: { Bucket?: string; Key?: string }[]

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
    putCalls = []
    signCalls = []
    MockWebhookValidation.validateWebhookUrl.mockResolvedValue(undefined)
    MockAxios.post.mockResolvedValue(MOCK_AXIOS_RESPONSE)
    MockSnapshotStore.writeSnapshot.mockReturnValue(
      okAsync({ token: 'tok-v1', key: 'key-v1' }),
    )
    jest.spyOn(s3Operations, 'putObject').mockImplementation(async (params) => {
      putCalls.push({
        Bucket: params.Bucket,
        Key: params.Key,
        Body: params.Body,
      })
      return {} as never
    })
    jest
      .spyOn(s3Operations, 'getSignedUrl')
      .mockImplementation(async ({ Bucket, Key }) => {
        signCalls.push({ Bucket, Key })
        return `https://s3.example/${Bucket}/${Key}?X-Amz-Signature=sig`
      })
  })

  const submit = async (
    webhookUrl: string,
  ): Promise<{
    body?: WebhookData
    writtenSnapshots: SubmissionSnapshot[]
  }> => {
    const form = await buildForm({ url: webhookUrl, isRetryEnabled: true })
    const growthbook = growthbookWith(true)
    const payload = await buildPayload()

    const created = await createMultiRespondentFormSubmission({
      form,
      encryptedPayload: payload,
      logMeta: { action: 'test' },
      growthbook,
    })
    expect(created.isOk()).toBe(true)
    const { submission, snapshot } = created._unsafeUnwrap()

    await performMultiRespondentPostSubmissionCreateActions({
      submission,
      snapshot,
      submissionId: submission._id.toString(),
      form,
      encryptedPayload: payload,
      logMeta: {} as never,
      growthbook,
    })
    await flushPromises()

    return {
      body:
        MockAxios.post.mock.calls.length > 0
          ? (MockAxios.post.mock.calls[0][1] as WebhookView).data
          : undefined,
      writtenSnapshots: MockSnapshotStore.writeSnapshot.mock.calls.map(
        (call) => call[0],
      ),
    }
  }

  const putTo = (bucket: string) =>
    putCalls.filter((call) => call.Bucket === bucket)

  it('should deliver a presigned URL per attachment, resolving against the V1 attachment bucket', async () => {
    const { body } = await submit(GENERIC_URL)

    const v1Puts = putTo(AwsConfig.submissionHistoryV1AttachmentS3Bucket)
    expect(v1Puts).toHaveLength(1)
    expect(signCalls).toEqual([
      {
        Bucket: AwsConfig.submissionHistoryV1AttachmentS3Bucket,
        Key: v1Puts[0].Key,
      },
    ])
    expect(body!.attachmentDownloadUrls).toEqual({
      [attachmentId]: `https://s3.example/${AwsConfig.submissionHistoryV1AttachmentS3Bucket}/${v1Puts[0].Key}?X-Amz-Signature=sig`,
    })
  })

  it('should store a copy the FORM secret key opens, through the storage-mode class', async () => {
    const storageClass = jest.spyOn(formsgSdk.crypto, 'encryptFile')
    const submissionClass = jest.spyOn(formsgSdk.cryptoV3, 'encryptFile')

    await submit(GENERIC_URL)

    // The class, not only the key: the right key through the wrong class
    // produces an envelope an unmodified consumer cannot read, and nothing
    // server-side would notice.
    expect(storageClass).toHaveBeenCalledWith(
      expect.anything(),
      formKeypair.publicKey,
    )
    expect(submissionClass).not.toHaveBeenCalledWith(
      expect.anything(),
      formKeypair.publicKey,
    )

    const [v1Put] = putTo(AwsConfig.submissionHistoryV1AttachmentS3Bucket)
    const stored = JSON.parse(String(v1Put.Body)) as {
      encryptedFile: {
        submissionPublicKey: string
        nonce: string
        binary: string
      }
    }

    // A consumer reads the object exactly as it reads a storage-mode
    // attachment: base64-decode the binary, then decrypt with the form key.
    const recovered = await formsgSdk.crypto.decryptFile(
      formKeypair.secretKey,
      {
        ...stored.encryptedFile,
        binary: new Uint8Array(
          Buffer.from(stored.encryptedFile.binary, 'base64'),
        ),
      },
    )
    expect(recovered).not.toBeNull()
    expect(Buffer.from(recovered!)).toEqual(ATTACHMENT_PLAINTEXT)
  })

  it('should keep the native object out of the V1 consumer’s reach', async () => {
    await submit(GENERIC_URL)

    const nativePuts = putTo(AwsConfig.attachmentS3Bucket)
    expect(nativePuts).toHaveLength(1)
    expect(signCalls.map((call) => call.Key)).not.toContain(nativePuts[0].Key)
  })

  it('should record the V1 copies’ keys on the V1 snapshot', async () => {
    const { writtenSnapshots } = await submit(GENERIC_URL)

    const [v1Put] = putTo(AwsConfig.submissionHistoryV1AttachmentS3Bucket)
    const [snapshot] = writtenSnapshots
    expect(snapshot.contentFormat).toBe('v1')
    expect(snapshot.attachmentMetadata).toEqual({ [attachmentId]: v1Put.Key })
  })

  it('should produce the copy without scanning the attachment a second time', async () => {
    const scan = jest.spyOn(
      SubmissionService,
      'triggerGuardDutyScanThenDownloadCleanFileChainV4',
    )

    await submit(GENERIC_URL)

    // The plaintext reaching the submit path has already been through the
    // scanner; the V1 copy is made from it, not from a fresh retrieval.
    expect(scan).not.toHaveBeenCalled()
    expect(putTo(AwsConfig.submissionHistoryV1AttachmentS3Bucket)).toHaveLength(
      1,
    )
  })

  it('should leave a plumber V4 delivery on the native attachment bucket', async () => {
    const { body } = await submit(PLUMBER_URL)

    expect(putTo(AwsConfig.submissionHistoryV1AttachmentS3Bucket)).toHaveLength(
      0,
    )
    const [nativePut] = putTo(AwsConfig.attachmentS3Bucket)
    expect(signCalls).toEqual([
      { Bucket: AwsConfig.attachmentS3Bucket, Key: nativePut.Key },
    ])
    expect(Object.keys(body!.attachmentDownloadUrls)).toEqual([attachmentId])
  })
})
