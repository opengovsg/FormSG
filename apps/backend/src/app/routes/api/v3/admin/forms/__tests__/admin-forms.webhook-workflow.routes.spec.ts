import { createAuthedSession } from '__tests__/integration/helpers/express-auth'
import { setupApp } from '__tests__/integration/helpers/express-setup'
import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import { Router } from 'express'
import {
  FormStatus,
  FormWorkflowStep,
  FormWorkflowStepDto,
  WorkflowType,
} from 'formsg-shared/types'
import mongoose from 'mongoose'
import supertest from 'supertest-session'

import getFormModel from 'src/app/models/form.server.model'
import * as AdminFormController from 'src/app/modules/form/admin-form/admin-form.controller'
import * as AdminFormService from 'src/app/modules/form/admin-form/admin-form.service'
import * as WebhookValidation from 'src/app/modules/webhook/webhook.validation'
import { IPopulatedForm } from 'src/types'

import { AdminFormsRouter } from '../admin-forms.routes'

jest.mock('src/app/modules/spcp/spcp.oidc.client.ts')
jest.mock('src/app/utils/limit-rate')
// URL validation performs DNS lookups; keep that external boundary offline.
jest.mock('src/app/modules/webhook/webhook.validation')

const FormModel = getFormModel(mongoose)
// Mirror the public API's webhook settings handler, as in the webhook-format specs.
const router = Router()
router.patch(
  '/:formId([a-fA-F0-9]{24})/webhooksettings',
  ...(AdminFormController.handleUpdateWebhookSettings as never[]),
)
router.use(AdminFormsRouter)
const app = setupApp('/admin/forms', router, { setupWithAuth: true })
const step = (): FormWorkflowStep => ({
  workflow_type: WorkflowType.Static,
  emails: ['respondent@example.com'],
  edit: [],
})
const persistedStep = (): FormWorkflowStepDto => ({
  ...step(),
  _id: new mongoose.Types.ObjectId().toHexString(),
})
const genericUrl = 'https://example.gov.sg/webhook'
const urlCases = [
  { name: 'generic', url: genericUrl, restricted: true },
  {
    name: 'Zapier',
    url: 'https://hooks.zapier.com/hooks/catch/123/abc',
    restricted: true,
  },
  {
    name: 'Plumber',
    url: 'https://plumber.gov.sg/webhooks/abc',
    restricted: false,
  },
  { name: 'none', url: '', restricted: false },
]
const cases = urlCases.flatMap((consumer) =>
  [0, 1, 2, 3].map((count) => ({
    ...consumer,
    count,
    rejected: consumer.restricted && count >= 2,
  })),
)
const conflictMessage =
  'Non-Plumber webhooks cannot be used with workflows containing two or more steps.'

describe('webhook and workflow compatibility', () => {
  beforeAll(async () => await dbHandler.connect())
  beforeEach(() => {
    jest
      .mocked(WebhookValidation.validateWebhookUrl)
      .mockResolvedValue(undefined)
  })
  afterEach(async () => {
    await dbHandler.clearDatabase()
    jest.restoreAllMocks()
  })
  afterAll(async () => await dbHandler.closeDatabase())

  it.each(
    cases.flatMap((testCase) =>
      ['settings', 'webhooksettings'].map((endpoint) => ({
        ...testCase,
        endpoint,
      })),
    ),
  )(
    '$endpoint: $name webhook with $count steps',
    async ({ url, count, rejected, endpoint }) => {
      const { form, user } = await dbHandler.insertMultirespondentForm({
        formOptions: {
          status: FormStatus.Private,
          workflow: Array.from({ length: count }, persistedStep),
        },
      })
      const session = await createAuthedSession(user.email, supertest(app))
      const before = await FormModel.findById(form._id).lean()

      const response = await session
        .patch(`/admin/forms/${form._id}/${endpoint}`)
        .send({ webhook: { url } })

      expect(response.status).toBe(rejected ? 400 : 200)
      const stored = await FormModel.findById(form._id).lean()
      const savedSettings = expect.objectContaining({
        webhook: expect.objectContaining({ url }),
      })
      expect(response.body).toEqual(
        rejected ? { message: conflictMessage } : savedSettings,
      )
      expect(stored).toEqual(rejected ? before : savedSettings)
    },
  )

  it.each(cases)(
    'workflow: $name webhook with $count resulting steps',
    async ({ url, count, rejected }) => {
      const { form, user } = await dbHandler.insertMultirespondentForm({
        formOptions: {
          status: FormStatus.Private,
          workflow: Array.from(
            { length: count === 0 ? 1 : count - 1 },
            persistedStep,
          ),
          webhook: { url, isRetryEnabled: false },
        },
      })
      const session = await createAuthedSession(user.email, supertest(app))
      const before = await FormModel.findById(form._id).lean()

      const response =
        count === 0
          ? await session.delete(`/admin/forms/${form._id}/workflow/0`)
          : await session.post(`/admin/forms/${form._id}/workflow`).send(step())

      expect(response.status).toBe(rejected ? 400 : 200)
      const stored = await FormModel.findById(form._id).lean()
      const savedWorkflow = Array.from({ length: count }, () =>
        expect.objectContaining(step()),
      )
      const savedForm = expect.objectContaining({ workflow: savedWorkflow })
      expect(response.body).toEqual(
        rejected ? { message: conflictMessage } : savedWorkflow,
      )
      expect(stored).toEqual(rejected ? before : savedForm)
      expect(stored?.webhook?.url).toBe(url)
    },
  )
  it.each(cases.filter(({ count }) => count > 0))(
    'editing a step: $name webhook with $count steps',
    async ({ url, count, rejected }) => {
      const { form, user } = await dbHandler.insertMultirespondentForm({
        formOptions: {
          status: FormStatus.Private,
          workflow: Array.from({ length: count }, persistedStep),
          webhook: { url, isRetryEnabled: false },
        },
      })
      const session = await createAuthedSession(user.email, supertest(app))
      const before = await FormModel.findById(form._id).lean()
      const response = await session
        .put(`/admin/forms/${form._id}/workflow/0`)
        .send({
          ...step(),
          _id: String(form.workflow[0]._id),
          step_name: 'Updated step',
        })
      expect(response.status).toBe(rejected ? 400 : 200)
      const savedStep = expect.objectContaining({ step_name: 'Updated step' })
      const savedWorkflow = [
        savedStep,
        ...Array.from({ length: count - 1 }, () =>
          expect.objectContaining(step()),
        ),
      ]
      const savedForm = expect.objectContaining({ workflow: savedWorkflow })
      expect(response.body).toEqual(
        rejected ? { message: conflictMessage } : savedWorkflow,
      )
      expect(await FormModel.findById(form._id).lean()).toEqual(
        rejected ? before : savedForm,
      )
    },
  )

  it('rejects a stale settings save after another request adds a second step', async () => {
    const { form, user } = await dbHandler.insertMultirespondentForm({
      formOptions: { status: FormStatus.Private, workflow: [persistedStep()] },
    })
    const session = await createAuthedSession(user.email, supertest(app))
    const stale = await FormModel.findById(form._id).populate('admin').orFail()
    expect(
      (await session.post(`/admin/forms/${form._id}/workflow`).send(step()))
        .status,
    ).toBe(200)
    const result = await AdminFormService.updateFormSettings(
      stale as IPopulatedForm,
      { webhook: { url: genericUrl } },
    )
    expect(result.isErr()).toBe(true)
    expect(result._unsafeUnwrapErr().message).toBe(conflictMessage)
    const stored = await FormModel.findById(form._id).lean()
    expect(stored?.webhook?.url).not.toBe(genericUrl)
  })

  it('rejects a stale workflow save after another request sets a generic webhook', async () => {
    const { form, user } = await dbHandler.insertMultirespondentForm({
      formOptions: { status: FormStatus.Private, workflow: [persistedStep()] },
    })
    const session = await createAuthedSession(user.email, supertest(app))
    const stale = await FormModel.findById(form._id).populate('admin').orFail()
    expect(
      (
        await session
          .patch(`/admin/forms/${form._id}/settings`)
          .send({ webhook: { url: genericUrl } })
      ).status,
    ).toBe(200)
    const result = await AdminFormService.createWorkflowStep(
      stale as IPopulatedForm,
      { ...step(), _id: new mongoose.Types.ObjectId().toHexString() },
    )
    expect(result.isErr()).toBe(true)
    expect(result._unsafeUnwrapErr().message).toBe(conflictMessage)
    const stored = await FormModel.findById(form._id).lean()
    expect(stored).toHaveProperty('workflow', expect.any(Array))
    expect(
      (stored as unknown as { workflow: unknown[] }).workflow,
    ).toHaveLength(1)
  })

  it.each(['edit', 'delete'])(
    'rejects a stale step %s that would restore multiple steps after a generic URL is set',
    async (operation) => {
      const { form, user } = await dbHandler.insertMultirespondentForm({
        formOptions: {
          status: FormStatus.Private,
          workflow: [persistedStep(), persistedStep(), persistedStep()],
        },
      })
      const session = await createAuthedSession(user.email, supertest(app))
      const stale = await FormModel.findById(form._id)
        .populate('admin')
        .orFail()
      for (const index of [2, 1]) {
        expect(
          (await session.delete(`/admin/forms/${form._id}/workflow/${index}`))
            .status,
        ).toBe(200)
      }
      expect(
        (
          await session
            .patch(`/admin/forms/${form._id}/settings`)
            .send({ webhook: { url: genericUrl } })
        ).status,
      ).toBe(200)
      const result =
        operation === 'edit'
          ? await AdminFormService.updateFormWorkflowStep(
              stale as IPopulatedForm,
              1,
              { ...step(), _id: String(form.workflow[1]._id) },
            )
          : await AdminFormService.deleteFormWorkflowStep(
              stale as IPopulatedForm,
              1,
            )
      expect(result.isErr()).toBe(true)
      expect(result._unsafeUnwrapErr().message).toBe(conflictMessage)
      const stored = await FormModel.findById(form._id).lean()
      expect(
        (stored as unknown as { workflow: unknown[] }).workflow,
      ).toHaveLength(1)
    },
  )

  it.each(['clear', 'Plumber'])(
    'allows the rejected workflow save after replacing the generic URL with %s',
    async (replacement) => {
      const { form, user } = await dbHandler.insertMultirespondentForm({
        formOptions: {
          status: FormStatus.Private,
          workflow: [persistedStep()],
          webhook: { url: genericUrl, isRetryEnabled: false },
        },
      })
      const session = await createAuthedSession(user.email, supertest(app))
      const path = `/admin/forms/${form._id}`
      expect((await session.post(`${path}/workflow`).send(step())).status).toBe(
        400,
      )
      const url =
        replacement === 'clear' ? '' : 'https://plumber.gov.sg/webhooks/abc'
      expect(
        (await session.patch(`${path}/settings`).send({ webhook: { url } }))
          .status,
      ).toBe(200)
      const retry = await session.post(`${path}/workflow`).send(step())
      expect(retry.status).toBe(200)
      expect(retry.body).toHaveLength(2)
    },
  )

  it('allows the rejected webhook save after reducing the workflow to one step', async () => {
    const { form, user } = await dbHandler.insertMultirespondentForm({
      formOptions: {
        status: FormStatus.Private,
        workflow: [persistedStep(), persistedStep()],
      },
    })
    const session = await createAuthedSession(user.email, supertest(app))
    const path = `/admin/forms/${form._id}`
    expect(
      (
        await session
          .patch(`${path}/settings`)
          .send({ webhook: { url: genericUrl } })
      ).status,
    ).toBe(400)
    expect((await session.delete(`${path}/workflow/1`)).status).toBe(200)
    expect(
      (
        await session
          .patch(`${path}/settings`)
          .send({ webhook: { url: genericUrl } })
      ).status,
    ).toBe(200)
    expect((await FormModel.findById(form._id).lean())?.webhook?.url).toBe(
      genericUrl,
    )
  })

  it.each(urlCases)(
    'keeps storage-mode settings working for $name',
    async ({ url }) => {
      const { form, user } = await dbHandler.insertEncryptForm()
      const session = await createAuthedSession(user.email, supertest(app))
      const response = await session
        .patch(`/admin/forms/${form._id}/settings`)
        .send({ webhook: { url } })
      expect(response.status).toBe(200)
      expect((await FormModel.findById(form._id).lean())?.webhook?.url).toBe(
        url,
      )
    },
  )

  it('allows unrelated settings changes on an existing conflicting form', async () => {
    const { form, user } = await dbHandler.insertMultirespondentForm({
      formOptions: {
        status: FormStatus.Private,
        workflow: [persistedStep(), persistedStep()],
        webhook: { url: genericUrl, isRetryEnabled: false },
      },
    })
    const session = await createAuthedSession(user.email, supertest(app))
    const response = await session
      .patch(`/admin/forms/${form._id}/settings`)
      .send({ webhook: { isRetryEnabled: true } })
    expect(response.status).toBe(200)
    expect((await FormModel.findById(form._id).lean())?.webhook).toEqual(
      expect.objectContaining({ url: genericUrl, isRetryEnabled: true }),
    )
  })
})
