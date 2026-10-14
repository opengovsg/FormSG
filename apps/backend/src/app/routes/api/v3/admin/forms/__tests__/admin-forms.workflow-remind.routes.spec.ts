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
import mongoose from 'mongoose'
import supertest, { Session } from 'supertest-session'

import { getMultirespondentFormModel } from 'src/app/models/form.server.model'
import { getMultirespondentSubmissionModel } from 'src/app/models/submission.server.model'
import { MAX_REMINDERS_PER_STEP } from 'src/app/modules/submission/multirespondent-submission/multirespondent-submission.service'
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

const step = (email: string) => ({
  _id: new ObjectId(),
  workflow_type: WorkflowType.Static,
  emails: [email],
  edit: [],
})

describe('POST /admin/forms/:formId/submissions/:submissionId/remind', () => {
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

  const createForm = async (writeAccess?: boolean) => {
    const owner =
      writeAccess === undefined
        ? defaultUser
        : await dbHandler.insertUser({
            agencyId: defaultUser.agency as never,
            mailName: 'owner',
          })
    return MultirespondentFormModel.create({
      title: 'mrf form',
      admin: owner._id,
      responseMode: FormResponseMode.Multirespondent,
      publicKey: 'mock-public-key',
      workflow: [step('one@example.com'), step('two@example.com')],
      permissionList:
        writeAccess === undefined
          ? []
          : [{ email: defaultUser.email, write: writeAccess }],
    })
  }

  const createSubmission = (formId: unknown) =>
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
    })

  const remind = (formId: unknown, submissionId: unknown) =>
    request
      .post(`/admin/forms/${formId}/submissions/${submissionId}/remind`)
      .send({ submissionSecretKey: 'mock-key', stepToken: 'mock-token' })

  it('records who sent the reminder and who it went to', async () => {
    const form = await createForm()
    const submission = await createSubmission(form._id)

    const response = await remind(form._id, submission._id)

    expect(response.status).toEqual(200)
    const stored = await MultirespondentSubmission.findById(submission._id)
    expect(stored?.workflowEvents).toHaveLength(1)
    expect(stored?.workflowEvents?.[0]).toMatchObject({
      type: WorkflowEventType.ReminderSent,
      actorEmail: defaultUser.email,
      stepNumber: 2,
      emails: ['two@example.com'],
    })
  })

  it('lets a view-only collaborator remind, and records it', async () => {
    const form = await createForm(false)
    const submission = await createSubmission(form._id)

    const response = await remind(form._id, submission._id)

    expect(response.status).toEqual(200)
    const stored = await MultirespondentSubmission.findById(submission._id)
    expect(
      stored?.workflowEvents?.filter(
        ({ type }) => type === WorkflowEventType.ReminderSent,
      ),
    ).toHaveLength(1)
  })

  it('returns 400 once the step has had the maximum reminders', async () => {
    const form = await createForm()
    const submission = await createSubmission(form._id)
    const reminder = {
      type: WorkflowEventType.ReminderSent,
      actorId: defaultUser._id,
      actorEmail: defaultUser.email,
      stepNumber: 2,
      emails: ['two@example.com'],
      created: new Date(),
    }
    await MultirespondentSubmission.updateOne(
      { _id: submission._id },
      {
        $set: {
          workflowEvents: Array(MAX_REMINDERS_PER_STEP).fill(reminder),
        },
      },
    )

    const response = await remind(form._id, submission._id)

    expect(response.status).toEqual(400)
    expect(response.body.message).toEqual(
      `This step has already been sent the maximum of ${MAX_REMINDERS_PER_STEP} reminders.`,
    )
  })
})
