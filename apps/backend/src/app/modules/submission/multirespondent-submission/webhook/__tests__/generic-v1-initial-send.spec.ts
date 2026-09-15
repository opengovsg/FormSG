/**
 * [GATE] The primary seam for #9975: the outbound webhook POST body.
 *
 * The HTTP client is mocked and the real MRF post-submission action is driven,
 * so what is asserted is what a consumer would actually receive. A wrong V1
 * payload still encrypts cleanly and still returns 200 — nothing but the body
 * itself can tell us it is right.
 */
import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import axios, { AxiosResponse } from 'axios'
import { ObjectId } from 'bson'
import { VIRUS_SCANNER_SUBMISSION_VERSION } from 'formsg-shared/constants'
import { featureFlags } from 'formsg-shared/constants/feature-flags'
import {
  BasicField,
  FormAuthType,
  FormResponseMode,
  FormWorkflowStepDto,
  SubmissionType,
  WorkflowType,
} from 'formsg-shared/types'
import mongoose from 'mongoose'
import { okAsync } from 'neverthrow'

import formsgSdk from 'src/app/config/formsg-sdk'
import { getMultirespondentSubmissionModel } from 'src/app/models/submission.server.model'
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

/**
 * What a storage-mode form would put on the wire for the same answers: the
 * trim on the single answer and the verifiable field's present-but-undefined
 * `signature` are the shared value rules, not this ticket's invention.
 */
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

const buildForm = ({
  workflow,
  webhook,
}: {
  workflow: FormWorkflowStepDto[]
  webhook: Record<string, unknown>
}): IPopulatedMultirespondentForm =>
  ({
    _id: formId,
    title: 'Converged storage-mode form',
    authType: FormAuthType.NIL,
    responseMode: FormResponseMode.Multirespondent,
    publicKey: formKeypair.publicKey,
    form_fields: FORM_FIELDS,
    form_logics: [],
    workflow,
    isSingleSubmission: false,
    webhook,
    admin: { _id: new ObjectId(), email: 'admin@example.gov.sg' },
    emails: [],
    stepsToNotify: [],
    getUniqueMyInfoAttrs: jest.fn().mockReturnValue([]),
  }) as unknown as IPopulatedMultirespondentForm

const buildPayload = (): MultirespondentSubmissionDto =>
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

/**
 * Runs the real submit path and then the real post-submission action, and
 * returns the body that was POSTed (or undefined if nothing was sent).
 *
 * Both halves matter: the copy is produced and snapshotted at submit, and the
 * send is served from that same in-memory copy.
 */
const submitAndCapturePostedBody = async ({
  workflow,
  webhook,
  enableMrfWebhooks = true,
  dropSnapshot = false,
}: {
  workflow: FormWorkflowStepDto[]
  webhook: Record<string, unknown>
  enableMrfWebhooks?: boolean
  dropSnapshot?: boolean
}): Promise<{
  body?: WebhookData
  writtenSnapshots: SubmissionSnapshot[]
}> => {
  const form = buildForm({ workflow, webhook })
  const growthbook = growthbookWith(enableMrfWebhooks)

  const created = await createMultiRespondentFormSubmission({
    form,
    encryptedPayload: buildPayload(),
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
    encryptedPayload: buildPayload(),
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
    it('should carry exactly the key set a storage-mode payload carries', async () => {
      // Act
      const { body } = await submitAndCapturePostedBody({
        workflow: [step()],
        webhook: { url: GENERIC_URL, isRetryEnabled: true },
      })

      // Assert: the delivered bytes are the JSON, so compare what survives it.
      // `verifiedContent` is undefined on this unauthenticated form and
      // serialisation drops it, exactly as it does in storage mode.
      expect(body).toBeDefined()
      const deliveredKeys = Object.keys(
        JSON.parse(JSON.stringify(body)) as Record<string, unknown>,
      )
      expect(deliveredKeys).toEqual(
        STORAGE_SHAPED_PAYLOAD_KEYS.filter((key) => key !== 'verifiedContent'),
      )
    })

    it('should decrypt to the original answers with the FORM secret key', async () => {
      const { body } = await submitAndCapturePostedBody({
        workflow: [step()],
        webhook: { url: GENERIC_URL, isRetryEnabled: true },
      })

      // The consumer's own tooling: the storage-mode class and the form secret
      // key it already holds. Round-trip recovery, not byte-equality, because
      // the nonce is random per encrypt.
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
      // Workflow metadata carries respondent addresses unstripped; omitting
      // the key is what keeps them off the wire entirely.
      expect(JSON.stringify(body)).not.toContain('approver@example.gov.sg')
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
      // Arrange: a submission made on a single-step form.
      const form = buildForm({
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

      // Act: the admin then adds two steps, and the send runs against the
      // edited form definition.
      await performMultiRespondentPostSubmissionCreateActions({
        submission,
        snapshot,
        submissionId: submission._id.toString(),
        form: buildForm({
          workflow: [step(), step(), step()],
          webhook: { url: GENERIC_URL, isRetryEnabled: true },
        }),
        encryptedPayload: buildPayload(),
        logMeta: {} as never,
        growthbook,
      })
      await flushPromises()

      // Assert: the row said one step, so it is delivered.
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
      // No wrapped read key is stored for a consumer class forbidden from
      // receiving one.
      expect(writtenSnapshots[0]).not.toHaveProperty(
        'encryptedSubmissionSecretKey',
      )
      expect(
        writtenSnapshots.some((snap) => snap.contentFormat === 'v4'),
      ).toBe(false)
    })

    it('should record the token under the shape it was written in', async () => {
      const form = buildForm({
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

      // PIN-16 keeps the retry term for both shapes at this site: the initial
      // send is served from the in-memory copy, so a snapshot written here
      // would be an object nothing ever reads.
      expect(writtenSnapshots).toHaveLength(0)
      // The delivery still happens, though. Persisting the copy and making
      // one are separate decisions: the copy is what this very request sends.
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
      // The row holds ciphertext under a submission key the server cannot
      // open, so it is never a valid V1 payload. Delivering it would hand the
      // consumer content its form secret key cannot decrypt.
      const { body } = await submitAndCapturePostedBody({
        workflow: [step()],
        webhook: { url: GENERIC_URL, isRetryEnabled: true },
        dropSnapshot: true,
      })

      expect(body).toBeUndefined()
      expect(MockAxios.post).not.toHaveBeenCalled()
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
    it('should stay V4-native whatever the wire shape', async () => {
      const form = buildForm({
        workflow: [step()],
        webhook: { url: GENERIC_URL, isRetryEnabled: true },
      })
      const created = await createMultiRespondentFormSubmission({
        form,
        encryptedPayload: buildPayload(),
        logMeta: { action: 'test' },
        growthbook: growthbookWith(true),
      })

      // Adding a webhook must not cost the admin answer-object provenance in
      // their own response view and downloads.
      const saved = await MultirespondentSubmissionModel.findById(
        created._unsafeUnwrap().submission._id,
      )
      expect(saved?.mrfVersion).toBe(2)
      expect(saved?.encryptedContent).toBe('v4-encrypted-content')
      expect(saved?.submissionPublicKey).toBe('submission-public-key')
    })
  })
})
