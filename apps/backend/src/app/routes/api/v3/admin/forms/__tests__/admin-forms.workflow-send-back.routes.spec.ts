import { createAuthedSession } from '__tests__/integration/helpers/express-auth'
import { setupApp } from '__tests__/integration/helpers/express-setup'
import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import { ObjectId } from 'bson'
import { Router } from 'express'
import { featureFlags } from 'formsg-shared/constants'
import {
  FormResponseMode,
  SubmissionType,
  WorkflowEventType,
  WorkflowType,
} from 'formsg-shared/types'
import mongoose from 'mongoose'
import supertest, { Session } from 'supertest-session'

import formsgSdk from 'src/app/config/formsg-sdk'
import { getMultirespondentFormModel } from 'src/app/models/form.server.model'
import { getMultirespondentSubmissionModel } from 'src/app/models/submission.server.model'
import * as StepToken from 'src/app/modules/submission/multirespondent-submission/step-token'
import MailService from 'src/app/services/mail/mail.service'
import { IUserSchema } from 'src/types'

import { AdminFormsRouter } from '../admin-forms.routes'

jest.mock('src/app/utils/limit-rate')
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue(true),
  }),
}))
jest.mock('src/app/modules/spcp/spcp.oidc.client.ts')

let flagsOn: string[] = []

const routerWithGrowthbook = Router()
routerWithGrowthbook.use((req, _res, next) => {
  ;(req as unknown as { growthbook: unknown }).growthbook = {
    isOn: (flag: string) => flagsOn.includes(flag),
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

describe('POST /admin/forms/:formId/submissions/:submissionId/send-back', () => {
  let request: Session
  let defaultUser: IUserSchema

  beforeAll(async () => await dbHandler.connect())
  beforeEach(async () => {
    request = supertest(app)
    const { user } = await dbHandler.insertFormCollectionReqs()
    request = await createAuthedSession(user.email, request)
    defaultUser = user
    flagsOn = [featureFlags.workflowActionsSendBack]
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

  const createForm = (overrides: Record<string, unknown> = {}) =>
    MultirespondentFormModel.create({
      title: 'mrf form',
      admin: defaultUser._id,
      responseMode: FormResponseMode.Multirespondent,
      publicKey,
      workflow,
      ...overrides,
    })

  const createSubmission = (formId: unknown) =>
    MultirespondentSubmission.create({
      form: formId,
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

  const sendBack = (
    formId: unknown,
    submissionId: unknown,
    body: Record<string, unknown> = {},
  ) =>
    request
      .post(`/admin/forms/${formId}/submissions/${submissionId}/send-back`)
      .send({
        targetStepNumber: 2,
        expectedStepNumber: 4,
        submissionSecretKey: 'submission-secret-key',
        remarks: 'Please fix the dates',
        ...body,
      })

  it('sends the workflow back and emails the step a new link with the remarks', async () => {
    const sendSpy = jest.spyOn(MailService, 'sendMrfWorkflowSentBackEmail')
    const form = await createForm()
    const submission = await createSubmission(form._id)

    const response = await sendBack(form._id, submission._id)

    expect(response.status).toEqual(200)
    expect(response.body).toEqual({
      stepNumber: 2,
      emails: ['two@example.com'],
    })
    const stored = await MultirespondentSubmission.findById(submission._id)
    expect(stored?.submittedSteps).toHaveLength(1)
    expect(stored?.workflowEvents?.at(-1)).toMatchObject({
      type: WorkflowEventType.SentBack,
      actorEmail: defaultUser.email,
      stepNumber: 2,
      fromStepNumber: 4,
      remarks: 'Please fix the dates',
    })
    expect(sendSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        emails: ['two@example.com'],
        remarks: 'Please fix the dates',
        responseUrl: expect.stringContaining('key=submission-secret-key'),
      }),
    )
    const { responseUrl } = sendSpy.mock.calls[0][0]
    const token = new URL(responseUrl).searchParams.get('token')
    expect(token).toBeTruthy()
    expect(StepToken.verify(token!, stored!.stepTokenHash!)).toBe(true)
  })

  it('leaves the remarks out when none are given', async () => {
    const sendSpy = jest.spyOn(MailService, 'sendMrfWorkflowSentBackEmail')
    const form = await createForm()
    const submission = await createSubmission(form._id)

    const response = await sendBack(form._id, submission._id, { remarks: '  ' })

    expect(response.status).toEqual(200)
    expect(sendSpy.mock.calls[0][0].remarks).toBeUndefined()
  })

  it.each([
    ['step 1', { targetStepNumber: 1 }],
    ['the pending step', { targetStepNumber: 4 }],
    ['remarks that are too long', { remarks: 'x'.repeat(1001) }],
    ['no secret key', { submissionSecretKey: undefined }],
  ])('returns 400 for %s', async (_label, body) => {
    const form = await createForm()
    const submission = await createSubmission(form._id)

    const response = await sendBack(form._id, submission._id, body)

    expect(response.status).toEqual(400)
  })

  it('returns 409 when the page saw an earlier pending step', async () => {
    const form = await createForm()
    const submission = await createSubmission(form._id)

    const response = await sendBack(form._id, submission._id, {
      expectedStepNumber: 3,
    })

    expect(response.status).toEqual(409)
  })

  it('works with only the send back flag on', async () => {
    const form = await createForm()
    const submission = await createSubmission(form._id)

    expect((await sendBack(form._id, submission._id)).status).toEqual(200)
  })

  it('returns 403 with only the workflow actions flag on', async () => {
    flagsOn = [featureFlags.workflowActions]
    const form = await createForm()
    const submission = await createSubmission(form._id)

    const response = await sendBack(form._id, submission._id)

    expect(response.status).toEqual(403)
    const stored = await MultirespondentSubmission.findById(submission._id)
    expect(stored?.submittedSteps).toHaveLength(3)
  })

  it('returns 403 for a read-only collaborator', async () => {
    const owner = await dbHandler.insertUser({
      agencyId: defaultUser.agency as never,
      mailName: 'owner',
    })
    const form = await createForm({
      admin: owner._id,
      permissionList: [{ email: defaultUser.email, write: false }],
    })
    const submission = await createSubmission(form._id)

    const response = await sendBack(form._id, submission._id)

    expect(response.status).toEqual(403)
  })
})
