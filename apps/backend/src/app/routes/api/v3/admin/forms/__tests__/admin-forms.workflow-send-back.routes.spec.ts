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
import nacl from 'tweetnacl'
import { encodeBase64 } from 'tweetnacl-util'

import { getMultirespondentFormModel } from 'src/app/models/form.server.model'
import { getMultirespondentSubmissionModel } from 'src/app/models/submission.server.model'
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

const step = (email: string) => ({
  _id: new ObjectId(),
  workflow_type: WorkflowType.Static,
  emails: [email],
  edit: [],
})
const WORKFLOW = [
  step('one@example.com'),
  step('two@example.com'),
  step('three@example.com'),
  step('four@example.com'),
]

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

  const createForm = (overrides: Record<string, unknown> = {}) =>
    MultirespondentFormModel.create({
      title: 'mrf form',
      admin: defaultUser._id,
      responseMode: FormResponseMode.Multirespondent,
      publicKey: encodeBase64(nacl.box.keyPair().publicKey),
      workflow: WORKFLOW,
      ...overrides,
    })

  // Pending at step 4.
  const createSubmission = (formId: unknown) =>
    MultirespondentSubmission.create({
      form: formId,
      submissionType: SubmissionType.Multirespondent,
      form_fields: [],
      form_logics: [],
      workflow: WORKFLOW,
      submissionPublicKey: 'pk',
      encryptedSubmissionSecretKey: 'esk',
      encryptedContent: 'ec',
      version: 3,
      workflowStep: 2,
      submittedSteps: ['two', 'three', 'four'].map((name) => ({
        isApproval: false,
        submittedAt: new Date().toISOString(),
        nextStepRecipientEmails: [`${name}@example.com`],
      })),
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
        submissionSecretKey: 'mock-key',
        ...body,
      })

  it('sends the workflow back and emails the step a new link with the remarks', async () => {
    const sendSpy = jest.spyOn(MailService, 'sendMrfWorkflowSentBackEmail')
    const form = await createForm()
    const submission = await createSubmission(form._id)

    const response = await sendBack(form._id, submission._id, {
      remarks: 'Please fix the address',
    })

    expect(response.status).toEqual(200)
    expect(response.body).toEqual({
      stepNumber: 2,
      emails: ['two@example.com'],
    })
    const stored = await MultirespondentSubmission.findById(submission._id)
    expect(stored?.submittedSteps).toHaveLength(1)
    expect(stored?.workflowEvents?.[0]).toMatchObject({
      type: WorkflowEventType.SentBack,
      stepNumber: 2,
      fromStepNumber: 4,
      remarks: 'Please fix the address',
    })
    expect(sendSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        emails: ['two@example.com'],
        remarks: 'Please fix the address',
        responseUrl: expect.stringMatching(/key=mock-key&token=.+/),
      }),
    )
  })

  it('leaves the remarks out when none are given', async () => {
    const sendSpy = jest.spyOn(MailService, 'sendMrfWorkflowSentBackEmail')
    const form = await createForm()
    const submission = await createSubmission(form._id)

    const response = await sendBack(form._id, submission._id, { remarks: '' })

    expect(response.status).toEqual(200)
    expect(sendSpy.mock.calls[0][0].remarks).toBeUndefined()
    const stored = await MultirespondentSubmission.findById(submission._id)
    expect(stored?.workflowEvents?.[0].remarks).toBeUndefined()
  })

  it('returns 400 for step 1', async () => {
    const form = await createForm()
    const submission = await createSubmission(form._id)

    const response = await sendBack(form._id, submission._id, {
      targetStepNumber: 1,
    })

    expect(response.status).toEqual(400)
  })

  it('returns 400 for the pending step', async () => {
    const form = await createForm()
    const submission = await createSubmission(form._id)

    const response = await sendBack(form._id, submission._id, {
      targetStepNumber: 4,
    })

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

  it('sends back with only the send back flag on', async () => {
    const form = await createForm()
    const submission = await createSubmission(form._id)

    const response = await sendBack(form._id, submission._id)

    expect(response.status).toEqual(200)
  })

  it('returns 403 with only the workflow actions flag on', async () => {
    flagsOn = [featureFlags.workflowActions]
    const form = await createForm()
    const submission = await createSubmission(form._id)

    const response = await sendBack(form._id, submission._id)

    expect(response.status).toEqual(403)
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
    const stored = await MultirespondentSubmission.findById(submission._id)
    expect(stored?.submittedSteps).toHaveLength(3)
  })
})
