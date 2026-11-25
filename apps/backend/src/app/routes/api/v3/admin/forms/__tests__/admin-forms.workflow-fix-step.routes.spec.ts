import { createAuthedSession } from '__tests__/integration/helpers/express-auth'
import { setupApp } from '__tests__/integration/helpers/express-setup'
import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import { ObjectId } from 'bson'
import { Router } from 'express'
import {
  featureFlags,
  WorkflowActionsSendBackMiscValue,
} from 'formsg-shared/constants'
import {
  FormResponseMode,
  SubmissionType,
  WorkflowType,
} from 'formsg-shared/types'
import mongoose from 'mongoose'
import supertest, { Session } from 'supertest-session'

import formsgSdk from 'src/app/config/formsg-sdk'
import { getMultirespondentFormModel } from 'src/app/models/form.server.model'
import { getMultirespondentSubmissionModel } from 'src/app/models/submission.server.model'
import * as StepToken from 'src/app/modules/submission/multirespondent-submission/step-token'
import { IUserSchema } from 'src/types'

import { AdminFormsRouter } from '../admin-forms.routes'

jest.mock('src/app/utils/limit-rate')
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue(true),
  }),
}))
jest.mock('src/app/modules/spcp/spcp.oidc.client.ts')

let sendBackMisc: string = WorkflowActionsSendBackMiscValue.BOTH

const routerWithGrowthbook = Router()
routerWithGrowthbook.use((req, _res, next) => {
  ;(req as unknown as { growthbook: unknown }).growthbook = {
    isOn: (flag: string) => flag === featureFlags.workflowActionsSendBack,
    getFeatureValue: (flag: string, fallback: string) =>
      flag === featureFlags.workflowActionsSendBackMisc
        ? sendBackMisc
        : fallback,
    getAttributes: () => ({}),
    setAttributes: async () => undefined,
  }
  next()
})
routerWithGrowthbook.use(AdminFormsRouter)

const app = setupApp('/admin/forms', routerWithGrowthbook, {
  setupWithAuth: true,
})

const MultirespondentFormModel = getMultirespondentFormModel(mongoose)
const MultirespondentSubmission = getMultirespondentSubmissionModel(mongoose)
const { publicKey } = formsgSdk.crypto.generate()

const step = (email: string) => ({
  _id: new ObjectId(),
  workflow_type: WorkflowType.Static,
  emails: [email],
  edit: [],
})

describe('POST /admin/forms/:formId/submissions/:submissionId/fix-step', () => {
  let request: Session
  let defaultUser: IUserSchema

  beforeAll(async () => await dbHandler.connect())
  beforeEach(async () => {
    request = supertest(app)
    const { user } = await dbHandler.insertFormCollectionReqs()
    request = await createAuthedSession(user.email, request)
    defaultUser = user
    sendBackMisc = WorkflowActionsSendBackMiscValue.BOTH
  })
  afterEach(async () => {
    await dbHandler.clearDatabase()
    jest.restoreAllMocks()
  })
  afterAll(async () => await dbHandler.closeDatabase())

  const workflow = [
    step('one@example.com'),
    step('two@example.com'),
    step('three@example.com'),
    step('four@example.com'),
  ]

  const createSubmission = async () => {
    const form = await MultirespondentFormModel.create({
      title: 'mrf form',
      admin: defaultUser._id,
      responseMode: FormResponseMode.Multirespondent,
      publicKey,
      workflow,
    })
    const submission = await MultirespondentSubmission.create({
      form: form._id,
      submissionType: SubmissionType.Multirespondent,
      form_fields: [],
      form_logics: [],
      workflow,
      submissionPublicKey: 'pk',
      encryptedSubmissionSecretKey: 'esk',
      encryptedContent: 'ec',
      version: 3,
      workflowStep: 2,
      submittedSteps: ['two', 'three', 'four'].map((name, index) => ({
        isApproval: false,
        submittedAt: `2026-10-08T0${index + 1}:00:00.000Z`,
        nextStepRecipientEmails: [`${name}@example.com`],
      })),
      stepTokenHash: StepToken.hash('old-token'),
    })
    return { formId: form._id, submissionId: submission._id }
  }

  const fixStep = (
    { formId, submissionId }: { formId: unknown; submissionId: unknown },
    body: Record<string, unknown> = {},
  ) =>
    request
      .post(`/admin/forms/${formId}/submissions/${submissionId}/fix-step`)
      .send({
        targetStepNumber: 2,
        expectedStepNumber: 4,
        submissionSecretKey: 'submission-secret-key',
        ...body,
      })

  it.each([
    WorkflowActionsSendBackMiscValue.FIX_STEP,
    WorkflowActionsSendBackMiscValue.BOTH,
  ])('reopens the step with %s', async (value) => {
    sendBackMisc = value
    const ids = await createSubmission()

    const response = await fixStep(ids)

    expect(response.status).toEqual(200)
    expect(response.body.stepNumber).toEqual(2)
  })

  it.each([
    WorkflowActionsSendBackMiscValue.OFF,
    WorkflowActionsSendBackMiscValue.CLEAR_ANSWERS,
  ])('returns 403 with %s', async (value) => {
    sendBackMisc = value
    const ids = await createSubmission()

    const response = await fixStep(ids)

    expect(response.status).toEqual(403)
    const stored = await MultirespondentSubmission.findById(ids.submissionId)
    expect(stored?.workflowEvents ?? []).toHaveLength(0)
  })

  it('returns 403 for clearing answers with FIX_STEP', async () => {
    sendBackMisc = WorkflowActionsSendBackMiscValue.FIX_STEP
    const ids = await createSubmission()

    const response = await fixStep(ids, { clearResponses: true })

    expect(response.status).toEqual(403)
  })
})
