import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import axios, { AxiosResponse } from 'axios'
import { ObjectId } from 'bson'
import { VIRUS_SCANNER_SUBMISSION_VERSION } from 'formsg-shared/constants'
import { featureFlags } from 'formsg-shared/constants/feature-flags'
import {
  BasicField,
  FormAuthType,
  FormWorkflowStepDto,
  SubmissionType,
  WorkflowType,
} from 'formsg-shared/types'
import mongoose from 'mongoose'
import { okAsync } from 'neverthrow'

import formsgSdk from 'src/app/config/formsg-sdk'
import getFormModel from 'src/app/models/form.server.model'
import {
  getEncryptSubmissionModel,
  getMultirespondentSubmissionModel,
} from 'src/app/models/submission.server.model'
import { ApplicationError, ErrorCodes } from 'src/app/modules/core/core.errors'
import {
  createMultiRespondentFormSubmission,
  performMultiRespondentPostSubmissionCreateActions,
} from 'src/app/modules/submission/multirespondent-submission/multirespondent-submission.service'
import * as WebhookValidationModule from 'src/app/modules/webhook/webhook.validation'
import { IPopulatedMultirespondentForm } from 'src/types'
import { MultirespondentSubmissionDto } from 'src/types/api'
import { WebhookData, WebhookView } from 'src/types/submission'

import { SubmissionSnapshot } from '../submission-snapshot.schema'
import * as SnapshotStoreModule from '../submission-snapshot.store'
import { STORAGE_SHAPED_PAYLOAD_KEYS } from '../v1-payload'

jest.mock('axios')
const MockAxios = jest.mocked(axios)

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
const ZAPIER_URL = 'https://hooks.zapier.com/hooks/catch/1/x'
const PLUMBER_URL = 'https://plumber.gov.sg/webhooks/x'

const MultirespondentSubmissionModel =
  getMultirespondentSubmissionModel(mongoose)
const EncryptSubmissionModel = getEncryptSubmissionModel(mongoose)

const formId = new ObjectId()
const shortTextId = new ObjectId().toHexString()
const emailId = new ObjectId().toHexString()

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
    _id: emailId,
    fieldType: BasicField.Email,
    title: 'Your email',
    description: '',
    required: true,
    disabled: false,
    isVerifiable: false,
  },
]

const V4_RESPONSES = {
  [shortTextId]: {
    fieldType: BasicField.ShortText,
    answer: { value: '  Tan Ah Kow  ' },
  },
  [emailId]: {
    fieldType: BasicField.Email,
    answer: { value: 'tan@example.com' },
  },
}

const EXPECTED_V1_ARRAY = [
  {
    _id: shortTextId,
    question: 'Your name',
    answer: 'Tan Ah Kow',
    fieldType: BasicField.ShortText,
  },
  {
    _id: emailId,
    question: 'Your email',
    answer: 'tan@example.com',
    fieldType: BasicField.Email,
  },
]

const step = (emails: string[] = []): FormWorkflowStepDto =>
  ({
    _id: new ObjectId().toHexString(),
    workflow_type: WorkflowType.Static,
    emails,
    edit: [shortTextId],
  }) as FormWorkflowStepDto

let formKeypair: { publicKey: string; secretKey: string }
let formsBuilt = 0

const buildForm = async ({
  workflow,
  webhook,
  formFields = FORM_FIELDS,
  authType = FormAuthType.NIL,
}: {
  workflow: FormWorkflowStepDto[]
  webhook: Record<string, unknown>
  formFields?: Record<string, unknown>[]
  authType?: FormAuthType
}): Promise<IPopulatedMultirespondentForm> => {
  formsBuilt += 1
  const { form } = await dbHandler.insertMultirespondentForm({
    mailName: `admin-${formsBuilt}`,
    formOptions: {
      title: 'Converged storage-mode form',
      authType,
      publicKey: formKeypair.publicKey,
      form_fields: formFields,
      form_logics: [],
      workflow,
      webhook,
    } as never,
  })

  const populated = await getFormModel(mongoose).getFullFormById(
    String(form._id),
  )
  return populated as unknown as IPopulatedMultirespondentForm
}

const buildPayload = (
  overrides: Partial<MultirespondentSubmissionDto> = {},
): MultirespondentSubmissionDto =>
  ({
    submissionPublicKey: 'submission-public-key',
    encryptedSubmissionSecretKey: 'wrapped-read-key-v4',
    encryptedContent: 'v4-encrypted-content',
    verifiedContent: undefined,
    submissionSecretKey: 'submission-secret-key',
    version: 4,
    workflowStep: 0,
    responses: V4_RESPONSES,
    mrfVersion: 2,
    ...overrides,
  }) as unknown as MultirespondentSubmissionDto

const growthbookWith = (enableMrfWebhooks: boolean) =>
  ({
    isOn: jest.fn(
      (flag: string) =>
        flag === featureFlags.enableMrfWebhooks && enableMrfWebhooks,
    ),
    getFeatureValue: jest.fn((_flag: string, def: unknown) => def),
  }) as never

const flushPromises = () => new Promise((resolve) => setImmediate(resolve))

const serialisedKeysOf = (data: unknown): string[] =>
  Object.keys(JSON.parse(JSON.stringify(data)) as Record<string, unknown>)

const submitAndCapturePostedBody = async ({
  workflow,
  webhook,
  enableMrfWebhooks = true,
  dropSnapshot = false,
  payloadOverrides = {},
}: {
  workflow: FormWorkflowStepDto[]
  webhook: Record<string, unknown>
  enableMrfWebhooks?: boolean
  dropSnapshot?: boolean
  payloadOverrides?: Partial<MultirespondentSubmissionDto>
}): Promise<{
  body?: WebhookData
  writtenSnapshots: SubmissionSnapshot[]
}> => {
  const form = await buildForm({ workflow, webhook })
  const growthbook = growthbookWith(enableMrfWebhooks)

  const created = await createMultiRespondentFormSubmission({
    form,
    encryptedPayload: buildPayload(payloadOverrides),
    logMeta: { action: 'test' },
    growthbook,
  })
  expect(created.isOk()).toBe(true)
  const { submission, snapshot } = created._unsafeUnwrap()

  await performMultiRespondentPostSubmissionCreateActions({
    submission,
    snapshot: dropSnapshot ? undefined : snapshot,
    submissionId: submission._id.toString(),
    form,
    encryptedPayload: buildPayload(payloadOverrides),
    logMeta: {} as never,
    growthbook,
  })
  await flushPromises()

  const writtenSnapshots = MockSnapshotStore.writeSnapshot.mock.calls.map(
    (call) => call[0],
  )
  const body =
    MockAxios.post.mock.calls.length > 0
      ? (MockAxios.post.mock.calls[0][1] as WebhookView).data
      : undefined

  return { body, writtenSnapshots }
}

describe('[GATE] generic V1 initial send', () => {
  beforeAll(async () => {
    await dbHandler.connect()
    formKeypair = formsgSdk.crypto.generate()
  })
  afterEach(async () => {
    await dbHandler.clearDatabase()
    jest.clearAllMocks()
    formsBuilt = 0
  })
  afterAll(async () => await dbHandler.closeDatabase())

  beforeEach(() => {
    MockWebhookValidation.validateWebhookUrl.mockResolvedValue(undefined)
    MockAxios.post.mockResolvedValue(MOCK_AXIOS_RESPONSE)
    MockSnapshotStore.writeSnapshot.mockReturnValue(
      okAsync({ token: 'tok-v1', key: 'key-v1' }),
    )
  })

  describe('the payload a consumer receives', () => {
    it('should carry exactly the key set a real storage-mode payload carries', async () => {
      const storageRow = await EncryptSubmissionModel.create({
        submissionType: SubmissionType.Encrypt,
        form: formId,
        encryptedContent: 'storage-mode-encrypted-content',
        version: VIRUS_SCANNER_SUBMISSION_VERSION,
      })
      const storageKeys = serialisedKeysOf(
        (await storageRow.getWebhookView())?.data,
      )

      const { body } = await submitAndCapturePostedBody({
        workflow: [step()],
        webhook: { url: GENERIC_URL, isRetryEnabled: true },
      })

      expect(body).toBeDefined()
      expect(serialisedKeysOf(body)).toEqual(storageKeys)

      expect(storageKeys).toEqual(
        STORAGE_SHAPED_PAYLOAD_KEYS.filter((key) => key !== 'verifiedContent'),
      )
    })

    it('should decrypt to the original answers with the FORM secret key', async () => {
      const { body } = await submitAndCapturePostedBody({
        workflow: [step()],
        webhook: { url: GENERIC_URL, isRetryEnabled: true },
      })

      const recovered = formsgSdk.crypto.decrypt(formKeypair.secretKey, {
        encryptedContent: body!.encryptedContent,
        version: VIRUS_SCANNER_SUBMISSION_VERSION,
      })
      expect(recovered?.responses).toEqual(EXPECTED_V1_ARRAY)
    })

    it('should carry no key, no step token and no workflow metadata', async () => {
      const { body } = await submitAndCapturePostedBody({
        workflow: [step(['approver@example.gov.sg'])],
        webhook: { url: GENERIC_URL, isRetryEnabled: true },
      })

      expect(body).not.toHaveProperty('encryptedSubmissionSecretKey')
      expect(body).not.toHaveProperty('workflowContent')
      expect(body).not.toHaveProperty('encryptedStepToken')
      expect(JSON.stringify(body)).not.toContain('approver@example.gov.sg')
    })

    it('should carry the [Myinfo] question prefix for a read-only MyInfo field', async () => {
      const myInfoForm = await buildForm({
        workflow: [step()],
        webhook: { url: GENERIC_URL, isRetryEnabled: true },
        authType: FormAuthType.MyInfo,
        formFields: [
          { ...FORM_FIELDS[0], myInfo: { attr: 'name' } },
          FORM_FIELDS[1],
        ],
      })
      const growthbook = growthbookWith(true)
      const payload = buildPayload({
        myInfoReadOnlyFields: [shortTextId],
      } as Partial<MultirespondentSubmissionDto>)

      const created = await createMultiRespondentFormSubmission({
        form: myInfoForm,
        encryptedPayload: payload,
        logMeta: { action: 'test' },
        growthbook,
      })
      const { submission, snapshot } = created._unsafeUnwrap()
      await performMultiRespondentPostSubmissionCreateActions({
        submission,
        snapshot,
        submissionId: submission._id.toString(),
        form: myInfoForm,
        encryptedPayload: payload,
        logMeta: {} as never,
        growthbook,
      })
      await flushPromises()

      const body = (MockAxios.post.mock.calls[0][1] as WebhookView).data
      const recovered = formsgSdk.crypto.decrypt(formKeypair.secretKey, {
        encryptedContent: body.encryptedContent,
        version: VIRUS_SCANNER_SUBMISSION_VERSION,
      })
      expect(recovered?.responses.map((entry) => entry.question)).toEqual([
        '[Myinfo] Your name',
        'Your email',
      ])
    })

    it('should omit the row\u2019s verified content, which no form secret key can open', async () => {
      const { body } = await submitAndCapturePostedBody({
        workflow: [step()],
        webhook: { url: GENERIC_URL, isRetryEnabled: true },
        payloadOverrides: {
          verifiedContent: 'SUBMISSION-KEY-VERIFIED-CONTENT',
        } as Partial<MultirespondentSubmissionDto>,
      })

      expect(body!.verifiedContent).toBeUndefined()
      expect(JSON.stringify(body)).not.toContain(
        'SUBMISSION-KEY-VERIFIED-CONTENT',
      )
      const recovered = formsgSdk.crypto.decrypt(formKeypair.secretKey, {
        encryptedContent: body!.encryptedContent,
        verifiedContent: body!.verifiedContent,
        version: VIRUS_SCANNER_SUBMISSION_VERSION,
      })
      expect(recovered?.responses).toEqual(EXPECTED_V1_ARRAY)
    })

    it('should omit the row\u2019s attachment keys, which point at submission-key objects', async () => {
      const { body } = await submitAndCapturePostedBody({
        workflow: [step()],
        webhook: { url: GENERIC_URL, isRetryEnabled: true },
      })

      expect(body!.attachmentDownloadUrls).toEqual({})
    })

    it('should be labelled with the version storage mode sends', async () => {
      const { body } = await submitAndCapturePostedBody({
        workflow: [],
        webhook: { url: GENERIC_URL, isRetryEnabled: true },
      })

      expect(body!.version).toBe(VIRUS_SCANNER_SUBMISSION_VERSION)
    })
  })

  describe('eligibility', () => {
    it.each<{
      name: string
      workflow: FormWorkflowStepDto[]
      url: string
      enableMrfWebhooks: boolean
      expectSent: boolean
    }>([
      {
        name: 'no workflow delivers',
        workflow: [],
        url: GENERIC_URL,
        enableMrfWebhooks: true,
        expectSent: true,
      },
      {
        name: 'exactly one step delivers',
        workflow: [step()],
        url: GENERIC_URL,
        enableMrfWebhooks: true,
        expectSent: true,
      },
      {
        name: 'zapier routes as generic and delivers',
        workflow: [step()],
        url: ZAPIER_URL,
        enableMrfWebhooks: true,
        expectSent: true,
      },
      {
        name: 'two steps deliver nothing',
        workflow: [step(), step()],
        url: GENERIC_URL,
        enableMrfWebhooks: true,
        expectSent: false,
      },
      {
        name: 'three steps deliver nothing',
        workflow: [step(), step(), step()],
        url: GENERIC_URL,
        enableMrfWebhooks: true,
        expectSent: false,
      },
      {
        name: 'the flag off delivers nothing',
        workflow: [step()],
        url: GENERIC_URL,
        enableMrfWebhooks: false,
        expectSent: false,
      },
      {
        name: 'the flag off delivers nothing to zapier either',
        workflow: [step()],
        url: ZAPIER_URL,
        enableMrfWebhooks: false,
        expectSent: false,
      },
    ])('$name', async ({ workflow, url, enableMrfWebhooks, expectSent }) => {
      const { body } = await submitAndCapturePostedBody({
        workflow,
        webhook: { url, isRetryEnabled: true },
        enableMrfWebhooks,
      })

      expect(body !== undefined).toBe(expectSent)
    })

    it('should judge eligibility on the row’s own workflow, not the form as later edited', async () => {
      const form = await buildForm({
        workflow: [step()],
        webhook: { url: GENERIC_URL, isRetryEnabled: true },
      })
      const growthbook = growthbookWith(true)
      const created = await createMultiRespondentFormSubmission({
        form,
        encryptedPayload: buildPayload(),
        logMeta: { action: 'test' },
        growthbook,
      })
      const { submission, snapshot } = created._unsafeUnwrap()

      await performMultiRespondentPostSubmissionCreateActions({
        submission,
        snapshot,
        submissionId: submission._id.toString(),
        form: await buildForm({
          workflow: [step(), step(), step()],
          webhook: { url: GENERIC_URL, isRetryEnabled: true },
        }),
        encryptedPayload: buildPayload(),
        logMeta: {} as never,
        growthbook,
      })
      await flushPromises()

      expect(MockAxios.post).toHaveBeenCalledTimes(1)
    })
  })

  describe('the snapshot', () => {
    it('should write exactly one object, in the V1 shape, and no V4 object', async () => {
      const { writtenSnapshots } = await submitAndCapturePostedBody({
        workflow: [step()],
        webhook: { url: GENERIC_URL, isRetryEnabled: true },
      })

      expect(writtenSnapshots).toHaveLength(1)
      expect(writtenSnapshots[0].contentFormat).toBe('v1')
      expect(writtenSnapshots[0]).not.toHaveProperty(
        'encryptedSubmissionSecretKey',
      )
      expect(writtenSnapshots.some((snap) => snap.contentFormat === 'v4')).toBe(
        false,
      )
    })

    it('should record the token under the shape it was written in', async () => {
      const form = await buildForm({
        workflow: [step()],
        webhook: { url: GENERIC_URL, isRetryEnabled: true },
      })
      const created = await createMultiRespondentFormSubmission({
        form,
        encryptedPayload: buildPayload(),
        logMeta: { action: 'test' },
        growthbook: growthbookWith(true),
      })

      const saved = await MultirespondentSubmissionModel.findById(
        created._unsafeUnwrap().submission._id,
      )
      const tokens = saved?.submittedSteps?.[0]?.snapshotTokens
      expect(tokens?.v1).toBe('tok-v1')
      expect(tokens?.v4).toBeUndefined()
    })

    it('should write no snapshot when retries are disabled, exactly as for V4', async () => {
      const { writtenSnapshots, body } = await submitAndCapturePostedBody({
        workflow: [step()],
        webhook: { url: GENERIC_URL, isRetryEnabled: false },
      })

      expect(writtenSnapshots).toHaveLength(0)
      expect(body).toBeDefined()
      const recovered = formsgSdk.crypto.decrypt(formKeypair.secretKey, {
        encryptedContent: body!.encryptedContent,
        version: VIRUS_SCANNER_SUBMISSION_VERSION,
      })
      expect(recovered?.responses).toEqual(EXPECTED_V1_ARRAY)
    })

    it('should write no snapshot with the flag off', async () => {
      const { writtenSnapshots } = await submitAndCapturePostedBody({
        workflow: [step()],
        webhook: { url: GENERIC_URL, isRetryEnabled: true },
        enableMrfWebhooks: false,
      })

      expect(writtenSnapshots).toHaveLength(0)
    })
  })

  describe('fail-loud', () => {
    it('should POST nothing when a V1 delivery has no snapshot, never falling back to the live row', async () => {
      const { body } = await submitAndCapturePostedBody({
        workflow: [step()],
        webhook: { url: GENERIC_URL, isRetryEnabled: true },
        dropSnapshot: true,
      })

      expect(body).toBeUndefined()
      expect(MockAxios.post).not.toHaveBeenCalled()

      const loggedCodes = mockLogger.error.mock.calls.map(
        (call) =>
          (call[0] as { error?: ApplicationError }).error?.code as
            | number
            | undefined,
      )
      expect(loggedCodes).toContain(
        ErrorCodes.SUBMISSION_MRF_V1_SNAPSHOT_REQUIRED,
      )
    })
  })

  describe('plumber is untouched', () => {
    it('should still receive the native V4 payload, with its wrapped read key', async () => {
      MockSnapshotStore.writeSnapshot.mockReturnValue(
        okAsync({ token: 'tok-v4', key: 'key-v4' }),
      )

      const { body, writtenSnapshots } = await submitAndCapturePostedBody({
        workflow: [step()],
        webhook: { url: PLUMBER_URL, isRetryEnabled: true },
      })

      expect(writtenSnapshots[0].contentFormat).toBe('v4')
      expect(body!.version).toBe(4)
      expect(body).toHaveProperty('encryptedSubmissionSecretKey')
      expect(body).toHaveProperty('workflowContent')
    })

    it('should receive it on a multi-step form, which the V1 shape could not represent', async () => {
      const { body } = await submitAndCapturePostedBody({
        workflow: [step(), step(), step()],
        webhook: { url: PLUMBER_URL, isRetryEnabled: true },
      })

      expect(body).toBeDefined()
    })
  })

  describe('the row', () => {
    it('should stay V4-native regardless of webhookContentFormat', async () => {
      const form = await buildForm({
        workflow: [step()],
        webhook: { url: GENERIC_URL, isRetryEnabled: true },
      })
      const created = await createMultiRespondentFormSubmission({
        form,
        encryptedPayload: buildPayload(),
        logMeta: { action: 'test' },
        growthbook: growthbookWith(true),
      })

      const saved = await MultirespondentSubmissionModel.findById(
        created._unsafeUnwrap().submission._id,
      )
      expect(saved?.mrfVersion).toBe(2)
      expect(saved?.encryptedContent).toBe('v4-encrypted-content')
      expect(saved?.submissionPublicKey).toBe('submission-public-key')
    })
  })
})
