import {
  createAuthedSession,
  logoutSession,
} from '__tests__/integration/helpers/express-auth'
import { setupApp } from '__tests__/integration/helpers/express-setup'
import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import { ObjectId } from 'bson'
import { ResultsEventType } from 'formsg-shared/types'
import mongoose, { Types } from 'mongoose'
import supertest, { Session } from 'supertest-session'

import { getEncryptedFormModel } from 'src/app/models/form.server.model'
import getResultsEventModel from 'src/app/models/results_event.server.model'
import { IFormDocument, IUserSchema } from 'src/types'

import { AdminFormsRouter } from '../admin-forms.routes'

jest.mock('src/app/utils/limit-rate')
jest.mock('src/app/modules/spcp/spcp.oidc.client.ts')

const EncryptFormModel = getEncryptedFormModel(mongoose)
const ResultsEventModel = getResultsEventModel(mongoose)

const app = setupApp('/admin/forms', AdminFormsRouter, {
  setupWithAuth: true,
})

describe('admin-forms.results-events.routes', () => {
  let request: Session
  let defaultUser: IUserSchema
  let form: IFormDocument

  beforeAll(async () => await dbHandler.connect())
  beforeEach(async () => {
    request = supertest(app)
    const { user } = await dbHandler.insertFormCollectionReqs()
    request = await createAuthedSession(user.email, request)
    defaultUser = user
    form = (await EncryptFormModel.create({
      title: 'results events form',
      admin: defaultUser._id,
      publicKey: 'does not matter',
    })) as IFormDocument
  })
  afterEach(async () => {
    await dbHandler.clearDatabase()
    jest.restoreAllMocks()
  })
  afterAll(async () => await dbHandler.closeDatabase())

  describe('POST /admin/forms/:formId/results-events', () => {
    const post = (formId: string, body: object) =>
      request.post(`/admin/forms/${formId}/results-events`).send(body)

    it('should return 204 and store a bulk download event', async () => {
      const savedViewId = new Types.ObjectId().toHexString()

      const response = await post(form._id, {
        type: ResultsEventType.Download,
        dashboardVersion: 'v2',
        formats: ['csv', 'pdf'],
        scope: 'bulk',
        savedViewId,
        isSavedViewModified: true,
        responsesCount: 42,
      })

      expect(response.status).toEqual(204)
      const events = await ResultsEventModel.find().lean()
      expect(events).toEqual([
        expect.objectContaining({
          type: ResultsEventType.Download,
          form: form._id,
          admin: defaultUser._id,
          dashboardVersion: 'v2',
          formats: ['csv', 'pdf'],
          scope: 'bulk',
          savedViewId: new Types.ObjectId(savedViewId),
          isSavedViewModified: true,
          responsesCount: 42,
          created: expect.any(Date),
        }),
      ])
    })

    it('should return 204 and store a version toggle event', async () => {
      const response = await post(form._id, {
        type: ResultsEventType.VersionToggled,
        from: 'v2',
        to: 'v1',
      })

      expect(response.status).toEqual(204)
      const events = await ResultsEventModel.find().lean()
      expect(events).toEqual([
        expect.objectContaining({
          type: ResultsEventType.VersionToggled,
          from: 'v2',
          to: 'v1',
        }),
      ])
    })

    it('should store the saved view age when a saved view is applied', async () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      const savedViewId = ObjectId.createFromTime(
        Math.floor(twoDaysAgo.getTime() / 1000),
      ).toHexString()

      const response = await post(form._id, {
        type: ResultsEventType.SavedViewApplied,
        savedViewId,
      })

      expect(response.status).toEqual(204)
      const [event] = await ResultsEventModel.find().lean()
      expect(event.savedViewAgeMs).toBeGreaterThanOrEqual(
        2 * 24 * 60 * 60 * 1000 - 1000,
      )
    })

    it('should reject a client-supplied saved view age', async () => {
      const response = await post(form._id, {
        type: ResultsEventType.SavedViewCreated,
        savedViewId: new Types.ObjectId().toHexString(),
        savedViewAgeMs: 999999999,
      })

      expect(response.status).toEqual(400)
      expect(await ResultsEventModel.countDocuments()).toEqual(0)
    })

    it('should return 400 when the body matches no event shape', async () => {
      const response = await post(form._id, {
        type: ResultsEventType.Download,
        dashboardVersion: 'v3',
        formats: [],
        scope: 'bulk',
      })

      expect(response.status).toEqual(400)
      expect(await ResultsEventModel.countDocuments()).toEqual(0)
    })

    it('should return 400 for an unknown event type', async () => {
      const response = await post(form._id, { type: 'results.unknown' })

      expect(response.status).toEqual(400)
    })

    it('should return 401 when user is not logged in', async () => {
      await logoutSession(request)

      const response = await post(form._id, {
        type: ResultsEventType.VersionToggled,
        from: 'v2',
        to: 'v1',
      })

      expect(response.status).toEqual(401)
    })

    it('should return 403 when user does not have read permissions for form', async () => {
      const anotherUser = (
        await dbHandler.insertFormCollectionReqs({
          userId: new Types.ObjectId(),
          mailName: 'some-user',
          shortName: 'someUser',
        })
      ).user
      const inaccessibleForm = await EncryptFormModel.create({
        title: 'Collab form',
        publicKey: 'some public key',
        admin: anotherUser._id,
        permissionList: [],
      })

      const response = await post(inaccessibleForm._id, {
        type: ResultsEventType.VersionToggled,
        from: 'v2',
        to: 'v1',
      })

      expect(response.status).toEqual(403)
      expect(await ResultsEventModel.countDocuments()).toEqual(0)
    })

    it('should return 404 when form does not exist', async () => {
      const response = await post(new Types.ObjectId().toHexString(), {
        type: ResultsEventType.VersionToggled,
        from: 'v2',
        to: 'v1',
      })

      expect(response.status).toEqual(404)
    })
  })
})
