import { createAuthedSession } from '__tests__/integration/helpers/express-auth'
import { setupApp } from '__tests__/integration/helpers/express-setup'
import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import { ObjectId } from 'bson'
import { Router } from 'express'
import {
  FormResponseMode,
  SubmissionType,
  WorkflowEventType,
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

describe('POST /admin/forms/:formId/submissions/:submissionId/assignees', () => {
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
    created = new Date(WORKFLOW_ACTIONS_CUTOFF.getTime() + 1000),
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
      workflowStep: 0,
      submittedSteps: [
        {
          isApproval: false,
          submittedAt: new Date().toISOString(),
          nextStepRecipientEmails: ['two@example.com'],
        },
      ],
      created,
    })

  const addAssignees = (
    formId: unknown,
    submissionId: unknown,
    emails: unknown,
  ) =>
    request
      .post(`/admin/forms/${formId}/submissions/${submissionId}/assignees`)
      .send({
        emails,
        submissionSecretKey: 'mock-key',
        stepToken: 'mock-token',
      })

  it('adds the people and emails them the step link without answers', async () => {
    const sendSpy = jest.spyOn(MailService, 'sendMRFWorkflowStepEmail')
    const form = await createForm()
    const submission = await createSubmission(form._id)

    const response = await addAssignees(form._id, submission._id, [
      'New@Example.com',
    ])

    expect(response.status).toEqual(200)
    expect(response.body).toEqual({
      stepNumber: 2,
      emails: ['new@example.com'],
    })
    const events = await WorkflowEvent.find({ submissionId: submission._id })
    expect(events[0]).toMatchObject({
      type: WorkflowEventType.AssigneesAdded,
      stepNumber: 2,
      emails: ['new@example.com'],
    })
    expect(sendSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        emails: ['new@example.com'],
        responseUrl: expect.stringContaining('key=mock-key'),
      }),
    )
    expect(sendSpy.mock.calls[0][0]).not.toHaveProperty('formQuestionAnswers')
    expect(sendSpy.mock.calls[0][0]).not.toHaveProperty('isReminder')
  })

  it('returns 400 for someone already on the step', async () => {
    const form = await createForm()
    const submission = await createSubmission(form._id)

    const response = await addAssignees(form._id, submission._id, [
      'two@example.com',
    ])

    expect(response.status).toEqual(400)
    expect(response.body.message).toEqual(
      'two@example.com is already assigned to this step.',
    )
  })

  it('returns 400 with no one to add', async () => {
    const form = await createForm()
    const submission = await createSubmission(form._id)

    const response = await addAssignees(form._id, submission._id, [])

    expect(response.status).toEqual(400)
  })

  it('returns 403 with the flag off', async () => {
    isFlagOn = false
    const form = await createForm()
    const submission = await createSubmission(form._id)

    const response = await addAssignees(form._id, submission._id, [
      'new@example.com',
    ])

    expect(response.status).toEqual(403)
  })

  it('returns 403 for a submission created before the cutoff', async () => {
    const form = await createForm()
    const submission = await createSubmission(
      form._id,
      new Date(WORKFLOW_ACTIONS_CUTOFF.getTime() - 1000),
    )

    const response = await addAssignees(form._id, submission._id, [
      'new@example.com',
    ])

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

    const response = await addAssignees(form._id, submission._id, [
      'new@example.com',
    ])

    expect(response.status).toEqual(403)
    await expect(
      WorkflowEvent.countDocuments({ submissionId: submission._id }),
    ).resolves.toBe(0)
  })
})
