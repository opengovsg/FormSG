import { createAuthedSession } from '__tests__/integration/helpers/express-auth'
import { setupApp } from '__tests__/integration/helpers/express-setup'
import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import { Router } from 'express'
import { FORMAT_FOR_NEW_GENERIC_WEBHOOKS } from 'formsg-shared/types'
import mongoose from 'mongoose'
import supertest, { Session } from 'supertest-session'

import getFormModel from 'src/app/models/form.server.model'
import * as AdminFormController from 'src/app/modules/form/admin-form/admin-form.controller'
import * as WebhookValidationModule from 'src/app/modules/webhook/webhook.validation'

import { AdminFormsRouter } from '../admin-forms.routes'

jest.mock('src/app/modules/spcp/spcp.oidc.client.ts')
// RATIONALE: The mongoose `webhook.url` validator resolves the host over DNS to reject
// private addresses. These specs are about what gets stored alongside the URL,
// not about that check, so it is stubbed to keep them offline and
// deterministic.
jest.mock('src/app/modules/webhook/webhook.validation')

const FormModel = getFormModel(mongoose)

const MockWebhookValidation = jest.mocked(WebhookValidationModule)

const WEBHOOK_URL = 'https://example.gov.sg/hook'
const ANOTHER_WEBHOOK_URL = 'https://example.gov.sg/other-hook'
const PLUMBER_WEBHOOK_URL = 'https://plumber.gov.sg/webhooks/abc'
const ZAPIER_WEBHOOK_URL = 'https://hooks.zapier.com/hooks/catch/123/abc'

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

// Every value, valid enum member or not. None of them may be settable while
// the term has no meaning a caller can rely on.
const REFUSED_VALUES = ['v1', 'v4', 'v2', 'V1', '', 'plumber']

describe('webhook.webhookFormat', () => {
  beforeAll(async () => await dbHandler.connect())
  beforeEach(() => {
    MockWebhookValidation.validateWebhookUrl.mockResolvedValue(undefined)
  })
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

  describe('is not settable — PATCH /admin/forms/:formId/settings', () => {
    let request: Session
    beforeEach(() => {
      request = supertest(settingsApp)
    })

    it.each(REFUSED_VALUES)(
      'refuses webhookFormat %p and stores nothing',
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

    it('refuses webhookFormat even beside a term it does accept', async () => {
      // A caller that sends the whole webhook object back must not have the
      // rest of its update applied while the unknown term is dropped.
      const { form, user } = await dbHandler.insertMultirespondentForm()
      const session = await createAuthedSession(user.email, request)

      const response = await session
        .patch(`/admin/forms/${form._id}/settings`)
        .send({ webhook: { isRetryEnabled: true, webhookFormat: 'v1' } })

      expect(response.status).toEqual(400)
      const webhook = await readWebhookFromDb(form._id)
      expect(webhook).not.toHaveProperty('webhookFormat')
      expect(webhook).not.toEqual(
        expect.objectContaining({ isRetryEnabled: true }),
      )
    })

    it('still accepts the webhook terms that are settable', async () => {
      const { form, user } = await dbHandler.insertMultirespondentForm()
      const session = await createAuthedSession(user.email, request)

      const response = await session
        .patch(`/admin/forms/${form._id}/settings`)
        .send({ webhook: { isRetryEnabled: true } })

      expect(response.status).toEqual(200)
      const webhook = await readWebhookFromDb(form._id)
      expect(webhook).toEqual(expect.objectContaining({ isRetryEnabled: true }))
      expect(webhook).not.toHaveProperty('webhookFormat')
    })
  })

  // WIRING ONLY. The behaviour above and below is proven once, against
  // `/settings`, because the two routes cannot diverge: they share the same
  // `webhookSettingsValidator` object and both controllers call the same
  // `AdminFormService.updateFormSettings`. Re-running every case here would
  // double the slowest tests in the file to re-prove one validator and one
  // service function.
  //
  // What is NOT shared is that `/webhooksettings` is mounted on the public
  // API router with its own handler chain, so these two pin that it reaches
  // the same chain — one refusal and one write. If they ever disagree with
  // the `/settings` results, the routes have diverged and the rest of this
  // file stops covering both.
  describe('reaches the same chain — PATCH /admin/forms/:formId/webhooksettings', () => {
    let request: Session
    beforeEach(() => {
      request = supertest(webhookSettingsApp)
    })

    it('refuses webhookFormat and stores nothing', async () => {
      const { form, user } = await dbHandler.insertMultirespondentForm()
      const session = await createAuthedSession(user.email, request)

      const response = await session
        .patch(`/admin/forms/${form._id}/webhooksettings`)
        .send({ webhook: { webhookFormat: 'v1' } })

      expect(response.status).toEqual(400)
      await expect(readWebhookFromDb(form._id)).resolves.not.toHaveProperty(
        'webhookFormat',
      )
    })

    it('sets the format when a generic URL is set', async () => {
      const { form, user } = await dbHandler.insertMultirespondentForm()
      const session = await createAuthedSession(user.email, request)

      const response = await session
        .patch(`/admin/forms/${form._id}/webhooksettings`)
        .send({ webhook: { url: WEBHOOK_URL } })

      expect(response.status).toEqual(200)
      await expect(readWebhookFromDb(form._id)).resolves.toEqual(
        expect.objectContaining({
          url: WEBHOOK_URL,
          webhookFormat: FORMAT_FOR_NEW_GENERIC_WEBHOOKS,
        }),
      )
    })
  })

  describe('is set by PATCH /admin/forms/:formId/settings', () => {
    const path = 'settings'
    let request: Session
    beforeEach(() => {
      request = supertest(settingsApp)
    })

    const patchWebhook = async (
      formId: unknown,
      webhook: Record<string, unknown>,
      session: Session,
    ) =>
      session.patch(`/admin/forms/${String(formId)}/${path}`).send({ webhook })

    // Both URL families narrow to the `'generic'` consumer class, and the
    // consumer class is what decides whether the term is read — so both have
    // to record it. Zapier is the one easily lost: it is `'zapier'` in the URL
    // family and only becomes `'generic'` through `toConsumerType`.
    it.each([
      { name: 'a plain generic URL', url: WEBHOOK_URL },
      { name: 'a zapier URL', url: ZAPIER_WEBHOOK_URL },
    ])(
      'sets FORMAT_FOR_NEW_GENERIC_WEBHOOKS when $name is first set',
      async ({ url }) => {
        const { form, user } = await dbHandler.insertMultirespondentForm()
        const session = await createAuthedSession(user.email, request)

        const response = await patchWebhook(form._id, { url }, session)

        expect(response.status).toEqual(200)
        await expect(readWebhookFromDb(form._id)).resolves.toEqual(
          expect.objectContaining({
            url,
            webhookFormat: FORMAT_FOR_NEW_GENERIC_WEBHOOKS,
          }),
        )
      },
    )

    it('does not set webhookFormat when a plumber URL is set', async () => {
      const { form, user } = await dbHandler.insertMultirespondentForm()
      const session = await createAuthedSession(user.email, request)

      const response = await patchWebhook(
        form._id,
        { url: PLUMBER_WEBHOOK_URL },
        session,
      )

      expect(response.status).toEqual(200)
      const webhook = await readWebhookFromDb(form._id)
      expect(webhook).toEqual(
        expect.objectContaining({ url: PLUMBER_WEBHOOK_URL }),
      )
      expect(webhook).not.toHaveProperty('webhookFormat')
    })

    it('keeps the format when one generic URL replaces another', async () => {
      // An ordinary URL edit leaves the consumer on the content format it was
      // built against.
      const { form, user } = await dbHandler.insertMultirespondentForm()
      const session = await createAuthedSession(user.email, request)
      await patchWebhook(form._id, { url: WEBHOOK_URL }, session)

      const response = await patchWebhook(
        form._id,
        { url: ANOTHER_WEBHOOK_URL },
        session,
      )

      expect(response.status).toEqual(200)
      await expect(readWebhookFromDb(form._id)).resolves.toEqual(
        expect.objectContaining({
          url: ANOTHER_WEBHOOK_URL,
          webhookFormat: FORMAT_FOR_NEW_GENERIC_WEBHOOKS,
        }),
      )
    })

    it('sets the format when a plumber URL is replaced by a generic one and webhookFormat is initially unset', async () => {
      const { form, user } = await dbHandler.insertMultirespondentForm()
      const session = await createAuthedSession(user.email, request)
      await patchWebhook(form._id, { url: PLUMBER_WEBHOOK_URL }, session)

      const response = await patchWebhook(
        form._id,
        { url: WEBHOOK_URL },
        session,
      )

      expect(response.status).toEqual(200)
      await expect(readWebhookFromDb(form._id)).resolves.toEqual(
        expect.objectContaining({
          url: WEBHOOK_URL,
          webhookFormat: FORMAT_FOR_NEW_GENERIC_WEBHOOKS,
        }),
      )
    })

    it('leaves the format alone when a generic URL is replaced by a plumber one', async () => {
      // RATIONALE: Plumber never reads the term, so the value left behind is inert.
      // It stays behind so it is remembered if the admin goes back to generic url.
      const { form, user } = await dbHandler.insertMultirespondentForm()
      const session = await createAuthedSession(user.email, request)
      await patchWebhook(form._id, { url: WEBHOOK_URL }, session)

      const response = await patchWebhook(
        form._id,
        { url: PLUMBER_WEBHOOK_URL },
        session,
      )

      expect(response.status).toEqual(200)
      await expect(readWebhookFromDb(form._id)).resolves.toEqual(
        expect.objectContaining({
          url: PLUMBER_WEBHOOK_URL,
          webhookFormat: FORMAT_FOR_NEW_GENERIC_WEBHOOKS,
        }),
      )
    })

    // RATIONALE: When the url is replaced or cleared, the admin likely still uses the same format unless they explicitly toggle it.
    it('leaves the format in place when the URL is cleared', async () => {
      const { form, user } = await dbHandler.insertMultirespondentForm()
      const session = await createAuthedSession(user.email, request)
      await patchWebhook(form._id, { url: WEBHOOK_URL }, session)

      const response = await patchWebhook(form._id, { url: '' }, session)

      expect(response.status).toEqual(200)
      await expect(readWebhookFromDb(form._id)).resolves.toEqual(
        expect.objectContaining({
          url: '',
          webhookFormat: FORMAT_FOR_NEW_GENERIC_WEBHOOKS,
        }),
      )
    })

    it('does not set the format when the URL is set to empty on a form that never had one', async () => {
      const { form, user } = await dbHandler.insertMultirespondentForm()
      const session = await createAuthedSession(user.email, request)

      const response = await patchWebhook(form._id, { url: '' }, session)

      expect(response.status).toEqual(200)
      await expect(readWebhookFromDb(form._id)).resolves.not.toHaveProperty(
        'webhookFormat',
      )
    })

    it('does not set the format when an unrelated webhook term is updated', async () => {
      const { form, user } = await dbHandler.insertMultirespondentForm()
      const session = await createAuthedSession(user.email, request)

      const response = await patchWebhook(
        form._id,
        { isRetryEnabled: true },
        session,
      )

      expect(response.status).toEqual(200)
      await expect(readWebhookFromDb(form._id)).resolves.not.toHaveProperty(
        'webhookFormat',
      )
    })
  })
})
