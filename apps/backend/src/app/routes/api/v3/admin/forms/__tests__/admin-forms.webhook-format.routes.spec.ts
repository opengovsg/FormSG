import { createAuthedSession } from '__tests__/integration/helpers/express-auth'
import { setupApp } from '__tests__/integration/helpers/express-setup'
import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import { Router } from 'express'
import mongoose from 'mongoose'
import supertest, { Session } from 'supertest-session'

import getFormModel from 'src/app/models/form.server.model'
import * as AdminFormController from 'src/app/modules/form/admin-form/admin-form.controller'

import { AdminFormsRouter } from '../admin-forms.routes'

// Avoid async refresh calls
jest.mock('src/app/modules/spcp/spcp.oidc.client.ts')

const FormModel = getFormModel(mongoose)

/**
 * RATIONALE: `webhookFormat` has to survive two runtime layers that fail in
 * opposite ways — Joi rejects an unknown key with a 400, and mongoose's
 * default `strict: true` discards an undeclared path silently, with no error
 * and no log line. An in-memory assertion on the resolution function proves
 * neither, so these specs drive the real validators, the real controllers and
 * the real model, then re-read the document from the database.
 *
 * The `/webhooksettings` endpoint lives on the public API router behind
 * `authenticateApiKeyAndPlatform`, for which no integration test helper
 * exists. Its handler chain — the validator plus `_handleUpdateWebhookSettings`
 * — is mounted directly here instead, so everything under test is the real
 * code and only the API-key middleware is bypassed.
 */
const WebhookSettingsTestRouter = Router()
WebhookSettingsTestRouter.route(
  '/:formId([a-fA-F0-9]{24})/webhooksettings',
).patch(...(AdminFormController.handleUpdateWebhookSettings as never[]))

const settingsApp = setupApp('/admin/forms', AdminFormsRouter, {
  setupWithAuth: true,
})
const webhookSettingsApp = setupApp('/admin/forms', WebhookSettingsTestRouter, {
  setupWithAuth: true,
})

describe('webhookFormat wiring', () => {
  beforeAll(async () => await dbHandler.connect())
  afterEach(async () => {
    await dbHandler.clearDatabase()
    jest.restoreAllMocks()
  })
  afterAll(async () => await dbHandler.closeDatabase())

  const readWebhookFromDb = async (formId: unknown) => {
    const reread = await FormModel.findById(String(formId)).lean()
    // `.lean()` so the assertion sees the raw document as mongoose stored it,
    // not a hydrated doc with schema defaults filled in.
    return (reread as unknown as { webhook?: Record<string, unknown> }).webhook
  }

  describe('PATCH /admin/forms/:formId/settings', () => {
    let request: Session
    beforeEach(() => {
      request = supertest(settingsApp)
    })

    it("persists webhookFormat 'v1' and reads it back from the database", async () => {
      const { form, user } = await dbHandler.insertMultirespondentForm()
      const session = await createAuthedSession(user.email, request)

      const response = await session
        .patch(`/admin/forms/${form._id}/settings`)
        .send({ webhook: { webhookFormat: 'v1' } })

      expect(response.status).toEqual(200)
      await expect(readWebhookFromDb(form._id)).resolves.toEqual(
        expect.objectContaining({ webhookFormat: 'v1' }),
      )
    })

    it("rejects webhookFormat 'v4' rather than storing it", async () => {
      const { form, user } = await dbHandler.insertMultirespondentForm()
      const session = await createAuthedSession(user.email, request)

      const response = await session
        .patch(`/admin/forms/${form._id}/settings`)
        .send({ webhook: { webhookFormat: 'v4' } })

      expect(response.status).toEqual(400)
      await expect(readWebhookFromDb(form._id)).resolves.not.toHaveProperty(
        'webhookFormat',
      )
    })

    it.each(['v2', 'V1', '', 'plumber'])(
      'rejects webhookFormat %p rather than storing it',
      async (webhookFormat) => {
        const { form, user } = await dbHandler.insertMultirespondentForm()
        const session = await createAuthedSession(user.email, request)

        const response = await session
          .patch(`/admin/forms/${form._id}/settings`)
          .send({ webhook: { webhookFormat } })

        expect(response.status).toEqual(400)
        await expect(readWebhookFromDb(form._id)).resolves.not.toHaveProperty(
          'webhookFormat',
        )
      },
    )

    it('leaves webhookFormat absent on a form saved without it', async () => {
      const { form, user } = await dbHandler.insertMultirespondentForm()
      const session = await createAuthedSession(user.email, request)

      const response = await session
        .patch(`/admin/forms/${form._id}/settings`)
        .send({ webhook: { isRetryEnabled: true } })

      expect(response.status).toEqual(200)
      const webhook = await readWebhookFromDb(form._id)
      expect(webhook).toEqual(expect.objectContaining({ isRetryEnabled: true }))
      // Absent, not `'v1'`: no mongoose default, so existing rows need no
      // migration and absent stays indistinguishable from an explicit 'v1'.
      expect(webhook).not.toHaveProperty('webhookFormat')
    })
  })

  describe('PATCH /admin/forms/:formId/webhooksettings', () => {
    let request: Session
    beforeEach(() => {
      request = supertest(webhookSettingsApp)
    })

    it("persists webhookFormat 'v1' and reads it back from the database", async () => {
      const { form, user } = await dbHandler.insertMultirespondentForm()
      const session = await createAuthedSession(user.email, request)

      const response = await session
        .patch(`/admin/forms/${form._id}/webhooksettings`)
        .send({ webhook: { webhookFormat: 'v1' } })

      expect(response.status).toEqual(200)
      await expect(readWebhookFromDb(form._id)).resolves.toEqual(
        expect.objectContaining({ webhookFormat: 'v1' }),
      )
    })

    it("rejects webhookFormat 'v4' rather than storing it", async () => {
      const { form, user } = await dbHandler.insertMultirespondentForm()
      const session = await createAuthedSession(user.email, request)

      const response = await session
        .patch(`/admin/forms/${form._id}/webhooksettings`)
        .send({ webhook: { webhookFormat: 'v4' } })

      expect(response.status).toEqual(400)
      await expect(readWebhookFromDb(form._id)).resolves.not.toHaveProperty(
        'webhookFormat',
      )
    })
  })
})
