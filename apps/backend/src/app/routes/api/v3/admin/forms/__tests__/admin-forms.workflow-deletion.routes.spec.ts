import { createAuthedSession } from '__tests__/integration/helpers/express-auth'
import { setupApp } from '__tests__/integration/helpers/express-setup'
import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import { ObjectId } from 'bson'
import { Router } from 'express'
import { FormResponseMode, FormStatus, WorkflowType } from 'formsg-shared/types'
import mongoose from 'mongoose'
import supertest, { Session } from 'supertest-session'

import getFormModel, {
  getMultirespondentFormModel,
} from 'src/app/models/form.server.model'
import { IUserSchema } from 'src/types'

import { AdminFormsRouter } from '../admin-forms.routes'

jest.mock('src/app/utils/limit-rate')
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue(true),
  }),
}))
jest.mock('src/app/modules/spcp/spcp.oidc.client.ts')

let rolloutEmails: string[] = []

const routerWithGrowthbook = Router()
routerWithGrowthbook.use((req, _res, next) => {
  let attributes: Record<string, unknown> = {}
  ;(
    req as unknown as {
      growthbook: {
        getAttributes: () => Record<string, unknown>
        setAttributes: (next: Record<string, unknown>) => void
        isOn: () => boolean
      }
    }
  ).growthbook = {
    getAttributes: () => attributes,
    setAttributes: (next) => {
      attributes = next
    },
    isOn: () =>
      typeof attributes.adminEmail === 'string' &&
      rolloutEmails.includes(attributes.adminEmail),
  }
  next()
})
routerWithGrowthbook.use(AdminFormsRouter)

const FormModel = getFormModel(mongoose)
const MultirespondentFormModel = getMultirespondentFormModel(mongoose)

const app = setupApp('/admin/forms', routerWithGrowthbook, {
  setupWithAuth: true,
})

const step = (email: string) => ({
  _id: new ObjectId(),
  workflow_type: WorkflowType.Static,
  emails: [email],
  edit: [],
})

/**
 * Route-level coverage for workflow deletion. The service is tested directly
 * elsewhere; what these add is the wiring — that the route exists, reaches the
 * right handler, and that the closed-form guard surfaces as a 409 rather than
 * whatever a generic error mapping would have produced.
 */
describe('admin-form.workflow-deletion.routes', () => {
  let request: Session
  let defaultUser: IUserSchema

  beforeAll(async () => await dbHandler.connect())
  beforeEach(async () => {
    request = supertest(app)
    const { user } = await dbHandler.insertFormCollectionReqs()
    request = await createAuthedSession(user.email, request)
    defaultUser = user
    rolloutEmails = [user.email]
  })
  afterEach(async () => {
    await dbHandler.clearDatabase()
    jest.restoreAllMocks()
    rolloutEmails = []
  })
  afterAll(async () => await dbHandler.closeDatabase())

  const createMrfForm = (status: FormStatus) =>
    MultirespondentFormModel.create({
      title: 'mrf with a workflow',
      admin: defaultUser._id,
      responseMode: FormResponseMode.Multirespondent,
      publicKey: 'mock-public-key',
      status,
      workflow: [step('one@example.com'), step('two@example.com')],
    })

  describe('DELETE /admin/forms/:formId/workflow', () => {
    it('should return 200 and clear the workflow when the form is closed', async () => {
      const form = await createMrfForm(FormStatus.Private)

      const response = await request.delete(`/admin/forms/${form._id}/workflow`)

      expect(response.status).toEqual(200)
      expect(response.body).toEqual([])
      const stored = await FormModel.findById(form._id)
      expect((stored as never as { workflow: unknown[] }).workflow).toEqual([])
    })

    it('should return 409 and change nothing when the form is open', async () => {
      const form = await createMrfForm(FormStatus.Public)

      const response = await request.delete(`/admin/forms/${form._id}/workflow`)

      expect(response.status).toEqual(409)
      const stored = await FormModel.findById(form._id)
      expect(
        (stored as never as { workflow: unknown[] }).workflow,
      ).toHaveLength(2)
    })

    // With the flag off the endpoint does not exist as far as anyone outside
    // the rollout is concerned.
    it('should return 404 when the admin is not in the rollout', async () => {
      rolloutEmails = []
      const form = await createMrfForm(FormStatus.Private)

      const response = await request.delete(`/admin/forms/${form._id}/workflow`)

      expect(response.status).toEqual(404)
      const stored = await FormModel.findById(form._id)
      expect(
        (stored as never as { workflow: unknown[] }).workflow,
      ).toHaveLength(2)
    })

    it('should return 404 when only another admin is in the rollout', async () => {
      rolloutEmails = ['someone-else@example.com']
      const form = await createMrfForm(FormStatus.Private)

      const response = await request.delete(`/admin/forms/${form._id}/workflow`)

      expect(response.status).toEqual(404)
      const stored = await FormModel.findById(form._id)
      expect(
        (stored as never as { workflow: unknown[] }).workflow,
      ).toHaveLength(2)
    })

    it('should return 401 when not logged in', async () => {
      const form = await createMrfForm(FormStatus.Private)

      const response = await supertest(app).delete(
        `/admin/forms/${form._id}/workflow`,
      )

      expect(response.status).toEqual(401)
    })
  })

  describe('DELETE /admin/forms/:formId/workflow/:stepNumber', () => {
    it('should refuse to delete step 1', async () => {
      const form = await createMrfForm(FormStatus.Private)

      const response = await request.delete(
        `/admin/forms/${form._id}/workflow/0`,
      )

      expect(response.status).toEqual(400)
      const stored = await FormModel.findById(form._id)
      expect(
        (stored as never as { workflow: unknown[] }).workflow,
      ).toHaveLength(2)
    })

    // Flag off restores today's behaviour exactly, bug included. That is what
    // makes the flag a clean rollback rather than a partial one.
    it('should fall back to the old behaviour when the admin is not in the rollout', async () => {
      rolloutEmails = []
      const form = await createMrfForm(FormStatus.Private)

      const response = await request.delete(
        `/admin/forms/${form._id}/workflow/0`,
      )

      expect(response.status).toEqual(200)
      expect(response.body).toHaveLength(1)
    })

    it('should still delete a later step', async () => {
      const form = await createMrfForm(FormStatus.Private)

      const response = await request.delete(
        `/admin/forms/${form._id}/workflow/1`,
      )

      expect(response.status).toEqual(200)
      expect(response.body).toHaveLength(1)
    })
  })
})
