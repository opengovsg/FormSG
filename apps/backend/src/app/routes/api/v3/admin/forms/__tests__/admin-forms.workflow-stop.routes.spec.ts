import { createAuthedSession } from '__tests__/integration/helpers/express-auth'
import { setupApp } from '__tests__/integration/helpers/express-setup'
import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import { ObjectId } from 'bson'
import { Router } from 'express'
import {
  FormResponseMode,
  SubmissionType,
  WorkflowEventType,
  WorkflowStatus,
  WorkflowType,
} from 'formsg-shared/types'
import { WORKFLOW_ACTIONS_CUTOFF } from 'formsg-shared/utils/workflow-actions'
import mongoose from 'mongoose'
import supertest, { Session } from 'supertest-session'

import { getMultirespondentFormModel } from 'src/app/models/form.server.model'
import { getMultirespondentSubmissionModel } from 'src/app/models/submission.server.model'
import getWorkflowEventModel from 'src/app/models/workflow_event.server.model'
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

let isFlagOn = true

const routerWithGrowthbook = Router()
routerWithGrowthbook.use((req, _res, next) => {
  ;(req as unknown as { growthbook: { isOn: () => boolean } }).growthbook = {
    isOn: () => isFlagOn,
  }
  next()
})
routerWithGrowthbook.use(AdminFormsRouter)

const app = setupApp('/admin/forms', routerWithGrowthbook, {
  setupWithAuth: true,
})

const MultirespondentFormModel = getMultirespondentFormModel(mongoose)
const MultirespondentSubmission = getMultirespondentSubmissionModel(mongoose)
const WorkflowEvent = getWorkflowEventModel(mongoose)

const step = (email: string) => ({
  _id: new ObjectId(),
  workflow_type: WorkflowType.Static,
  emails: [email],
  edit: [],
})

describe('POST /admin/forms/:formId/submissions/:submissionId/stop', () => {
  let request: Session
  let defaultUser: IUserSchema

  beforeAll(async () => await dbHandler.connect())
  beforeEach(async () => {
    request = supertest(app)
    const { user } = await dbHandler.insertFormCollectionReqs()
    request = await createAuthedSession(user.email, request)
    defaultUser = user
    isFlagOn = true
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
      publicKey: 'mock-public-key',
      workflow: [step('one@example.com'), step('two@example.com')],
      ...overrides,
    })

  const createSubmission = (
    formId: unknown,
    {
      created = new Date(WORKFLOW_ACTIONS_CUTOFF.getTime() + 1000),
      submittedSteps = [
        {
          isApproval: false,
          submittedAt: new Date().toISOString(),
          nextStepRecipientEmails: ['two@example.com'],
        },
      ],
    }: {
      created?: Date
      submittedSteps?: Record<string, unknown>[]
    } = {},
  ) =>
    MultirespondentSubmission.create({
      form: formId,
      submissionType: SubmissionType.Multirespondent,
      form_fields: [],
      form_logics: [],
      workflow: [step('one@example.com'), step('two@example.com')],
      submissionPublicKey: 'pk',
      encryptedSubmissionSecretKey: 'esk',
      encryptedContent: 'ec',
      version: 3,
      workflowStep: submittedSteps.length - 1,
      submittedSteps,
      created,
    })

  const stop = (formId: unknown, submissionId: unknown, emails: unknown) =>
    request
      .post(`/admin/forms/${formId}/submissions/${submissionId}/stop`)
      .send({ emails })

  it('stops the workflow, records the event and emails the chosen people', async () => {
    const sendSpy = jest.spyOn(MailService, 'sendMrfWorkflowStoppedEmail')
    const form = await createForm()
    const submission = await createSubmission(form._id)

    const response = await stop(form._id, submission._id, [
      'Records@Example.com',
    ])

    expect(response.status).toEqual(200)
    expect(response.body.stoppedAt).toEqual(expect.any(String))
    const stored = await MultirespondentSubmission.findById(submission._id)
    expect(stored?.stoppedAt).toBeInstanceOf(Date)
    expect(String(stored?.stoppedBy)).toEqual(String(defaultUser._id))
    const events = await WorkflowEvent.find({ submissionId: submission._id })
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({
      type: WorkflowEventType.Stopped,
      actorEmail: defaultUser.email,
      stepNumber: 2,
      emails: ['records@example.com'],
    })
    expect(sendSpy).toHaveBeenCalledWith(
      expect.objectContaining({ emails: ['records@example.com'] }),
    )
  })

  it('sends no email when nobody is chosen', async () => {
    const sendSpy = jest.spyOn(MailService, 'sendMrfWorkflowStoppedEmail')
    const form = await createForm()
    const submission = await createSubmission(form._id)

    const response = await stop(form._id, submission._id, [])

    expect(response.status).toEqual(200)
    expect(sendSpy).not.toHaveBeenCalled()
  })

  it('returns 403 with the flag off', async () => {
    isFlagOn = false
    const form = await createForm()
    const submission = await createSubmission(form._id)

    const response = await stop(form._id, submission._id, [])

    expect(response.status).toEqual(403)
    const stored = await MultirespondentSubmission.findById(submission._id)
    expect(stored?.stoppedAt).toBeUndefined()
  })

  it('returns 403 for a submission created before the cutoff', async () => {
    const form = await createForm()
    const submission = await createSubmission(form._id, {
      created: new Date(WORKFLOW_ACTIONS_CUTOFF.getTime() - 1000),
    })

    const response = await stop(form._id, submission._id, [])

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

    const response = await stop(form._id, submission._id, [])

    expect(response.status).toEqual(403)
  })

  it('lets an editor collaborator stop the workflow', async () => {
    const owner = await dbHandler.insertUser({
      agencyId: defaultUser.agency as never,
      mailName: 'owner',
    })
    const form = await createForm({
      admin: owner._id,
      permissionList: [{ email: defaultUser.email, write: true }],
    })
    const submission = await createSubmission(form._id)

    const response = await stop(form._id, submission._id, [])

    expect(response.status).toEqual(200)
  })

  it('returns 409 for a workflow that is no longer pending', async () => {
    const form = await createForm()
    const submission = await createSubmission(form._id, {
      submittedSteps: [
        { isApproval: false, submittedAt: new Date().toISOString() },
        {
          isApproval: true,
          status: WorkflowStatus.REJECTED,
          submittedAt: new Date().toISOString(),
        },
      ],
    })

    const response = await stop(form._id, submission._id, [])

    expect(response.status).toEqual(409)
  })

  it('returns 400 for an invalid email', async () => {
    const form = await createForm()
    const submission = await createSubmission(form._id)

    const response = await stop(form._id, submission._id, ['not-an-email'])

    expect(response.status).toEqual(400)
  })
})
