import { createAuthedSession } from '__tests__/integration/helpers/express-auth'
import { setupApp } from '__tests__/integration/helpers/express-setup'
import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import {
  BasicField,
  FormAuthType,
  FormStatus,
  MyInfoAttribute,
  WorkflowStepLoginInput,
  WorkflowType,
} from 'formsg-shared/types'
import { MongoMemoryReplSet } from 'mongodb-memory-server-core'
import mongoose from 'mongoose'
import supertest, { Session } from 'supertest-session'

import getFormModel from 'src/app/models/form.server.model'
import getFormWhitelistSubmitterIdsModel from 'src/app/models/form_whitelist.server.model'
import * as AdminFormService from 'src/app/modules/form/admin-form/admin-form.service'
import { encryptWhitelistCsvString } from 'src/app/modules/form/admin-form/admin-form.whitelist'
import { IMultirespondentForm, IPopulatedForm } from 'src/types'

import { AdminFormsRouter } from '../admin-forms.routes'

jest.mock('src/app/modules/spcp/spcp.oidc.client.ts')
jest.mock('src/app/utils/limit-rate')

const FormModel = getFormModel(mongoose)
const WhitelistModel = getFormWhitelistSubmitterIdsModel(mongoose)
const app = setupApp('/admin/forms', AdminFormsRouter, { setupWithAuth: true })

const UEN = '53244311W'
const NRIC = 'S7101844Z'
const MYINFO_FIELD_ID = new mongoose.Types.ObjectId()
const TEXT_FIELD_ID = new mongoose.Types.ObjectId()

const step = (emails: string[], edit: mongoose.Types.ObjectId[] = []) => ({
  _id: new mongoose.Types.ObjectId(),
  workflow_type: WorkflowType.Static,
  emails,
  edit,
})

const cpLogin = {
  auth_type: FormAuthType.CP,
  is_submitter_id_collection_enabled: true,
} satisfies WorkflowStepLoginInput

type StoredStep = {
  _id: mongoose.Types.ObjectId
  workflow_type: WorkflowType
  emails: string[]
  edit: mongoose.Types.ObjectId[]
  step_name?: string
  auth?: {
    auth_type: FormAuthType
    is_submitter_id_collection_enabled: boolean
    whitelisted_submitter_ids?: {
      isWhitelistEnabled: boolean
      encryptedWhitelistedSubmitterIds?: mongoose.Types.ObjectId
    }
  }
}
type StoredForm = {
  esrvcId?: string
  isSingleSubmission?: boolean
  workflow: StoredStep[]
  whitelistedSubmitterIds?: unknown
}

// Transactions need a replica set; the shared fixture is a standalone server.
let replSet: MongoMemoryReplSet

describe('workflow step login saves', () => {
  let session: Session
  let formId: string

  // lean() returns the stored document, including references hidden from JSON.
  const rawForm = async () =>
    (await FormModel.findById(formId).lean().orFail()) as unknown as StoredForm
  const rawStep = async (index: number) => (await rawForm()).workflow[index]
  const stepBody = (saved: StoredStep) => ({
    _id: String(saved._id),
    workflow_type: saved.workflow_type,
    emails: saved.emails,
    edit: saved.edit.map(String),
  })
  const putStep = async (index: number, body: Record<string, unknown>) =>
    session
      .put(`/admin/forms/${formId}/workflow/${index}`)
      .send({ ...stepBody(await rawStep(index)), ...body })

  beforeAll(async () => {
    replSet = await MongoMemoryReplSet.create({
      binary: { version: process.env.MONGO_BINARY_VERSION },
      replSet: { count: 1, storageEngine: 'wiredTiger' },
    })
    await mongoose.connect(replSet.getUri())
    // Create the collections and indexes before any transaction writes to
    // them, or a background index build can conflict with the first save.
    await Promise.all([FormModel.init(), WhitelistModel.init()])
  })

  beforeEach(async () => {
    const { form, user } = await dbHandler.insertMultirespondentForm({
      formOptions: {
        status: FormStatus.Private,
        authType: FormAuthType.NIL,
        form_fields: [
          { _id: TEXT_FIELD_ID, fieldType: BasicField.ShortText, title: 'Q' },
        ] as unknown as IMultirespondentForm['form_fields'],
        workflow: [
          step([]),
          step(['two@example.gov.sg']),
          step(['three@example.gov.sg']),
        ] as unknown as IMultirespondentForm['workflow'],
      },
    })
    formId = String(form._id)
    session = await createAuthedSession(user.email, supertest(app))
  })

  afterEach(async () => {
    await dbHandler.clearDatabase()
    jest.restoreAllMocks()
  })

  afterAll(async () => {
    await mongoose.disconnect()
    await replSet.stop()
  })

  it('saves login, e-service ID and a new list version together, hiding the reference from JSON', async () => {
    const response = await putStep(1, {
      auth: cpLogin,
      esrvc_id: 'example-service',
      whitelistCsvString: UEN,
    })

    expect(response.status).toBe(200)
    expect(response.body[1].auth).toEqual({
      ...cpLogin,
      whitelisted_submitter_ids: { isWhitelistEnabled: true },
    })
    const stored = await rawStep(1)
    const listId =
      stored.auth?.whitelisted_submitter_ids?.encryptedWhitelistedSubmitterIds
    expect(await WhitelistModel.findById(listId)).not.toBeNull()
    expect((await rawForm()).esrvcId).toBe('example-service')

    const adminView = await session.get(`/admin/forms/${formId}`)
    expect(JSON.stringify(adminView.body)).not.toContain(String(listId))
  })

  it('keeps a saved login when auth is omitted and removes it only on null', async () => {
    await putStep(1, {
      auth: cpLogin,
      esrvc_id: 'example-service',
      whitelistCsvString: UEN,
    })
    const saved = await rawStep(1)

    const omitted = await putStep(1, { emails: ['new@example.gov.sg'] })
    expect(omitted.status).toBe(200)
    expect((await rawStep(1)).auth).toEqual(saved.auth)

    const removed = await putStep(1, { auth: null })
    expect(removed.status).toBe(200)
    expect((await rawStep(1)).auth).toBeUndefined()
    // Removing a list only drops the reference; in-progress submissions may still use it.
    expect(
      await WhitelistModel.findById(
        saved.auth?.whitelisted_submitter_ids?.encryptedWhitelistedSubmitterIds,
      ),
    ).not.toBeNull()
  })

  it('drops the old list on a provider change and keeps it for the same provider', async () => {
    await putStep(1, {
      auth: cpLogin,
      esrvc_id: 'example-service',
      whitelistCsvString: UEN,
    })
    const saved = await rawStep(1)

    await putStep(1, {
      auth: { ...cpLogin, is_submitter_id_collection_enabled: false },
    })
    expect((await rawStep(1)).auth?.whitelisted_submitter_ids).toEqual(
      saved.auth?.whitelisted_submitter_ids,
    )

    await putStep(1, {
      auth: {
        auth_type: FormAuthType.MyInfo,
        is_submitter_id_collection_enabled: false,
      },
    })
    expect((await rawStep(1)).auth).toEqual({
      auth_type: FormAuthType.MyInfo,
      is_submitter_id_collection_enabled: false,
    })
  })

  it('leaves the other step and old versions intact when one list is replaced', async () => {
    await putStep(1, {
      auth: cpLogin,
      esrvc_id: 'example-service',
      whitelistCsvString: UEN,
    })
    await putStep(2, { auth: cpLogin, whitelistCsvString: UEN })
    const secondBefore = await rawStep(1)
    const thirdBefore = await rawStep(2)

    await putStep(2, { whitelistCsvString: NRIC })

    const thirdAfter = await rawStep(2)
    expect(thirdAfter.auth?.whitelisted_submitter_ids).not.toEqual(
      thirdBefore.auth?.whitelisted_submitter_ids,
    )
    expect((await rawStep(1)).auth).toEqual(secondBefore.auth)
    expect(await WhitelistModel.countDocuments({ formId })).toBe(3)
  })

  it('rejects client-supplied list references', async () => {
    const response = await putStep(1, {
      auth: {
        ...cpLogin,
        whitelisted_submitter_ids: {
          isWhitelistEnabled: true,
          encryptedWhitelistedSubmitterIds: String(
            new mongoose.Types.ObjectId(),
          ),
        },
      },
      esrvc_id: 'example-service',
    })

    expect(response.status).toBe(400)
    expect((await rawStep(1)).auth).toBeUndefined()
  })

  it('changes nothing when the list is invalid', async () => {
    const before = await rawForm()

    const response = await putStep(1, {
      auth: cpLogin,
      esrvc_id: 'example-service',
      whitelistCsvString: `${UEN},${UEN}`,
    })

    expect(response.status).toBe(422)
    expect(await rawForm()).toEqual(before)
    expect(await WhitelistModel.countDocuments()).toBe(0)
  })

  it('tells the admin which entry is invalid without putting it in the loggable error message', async () => {
    const invalidEntry = 'S7101844A'

    const response = await putStep(1, {
      auth: cpLogin,
      esrvc_id: 'example-service',
      whitelistCsvString: invalidEntry,
    })
    const error = encryptWhitelistCsvString(
      invalidEntry,
      'unused-public-key',
    )._unsafeUnwrapErr()

    expect(response.status).toBe(422)
    expect(response.body.message).toContain(invalidEntry)
    expect(error.message).not.toContain(invalidEntry)
  })

  it('rejects login changes on step 1 through step auth and while the form is open', async () => {
    const onFirstStep = await putStep(0, { auth: cpLogin })
    expect(onFirstStep.status).toBe(400)

    await FormModel.updateOne({ _id: formId }, { status: FormStatus.Public })
    const whileOpen = await putStep(1, {
      auth: cpLogin,
      esrvc_id: 'example-service',
    })
    expect(whileOpen.status).toBe(409)
    expect((await rawStep(1)).auth).toBeUndefined()
  })

  it('turns on single submission for a form stored without that field', async () => {
    // Older documents never had the field; Mongoose still hydrates it as false.
    await FormModel.collection.updateOne(
      { _id: new mongoose.Types.ObjectId(formId) },
      { $unset: { isSingleSubmission: '' } },
    )

    const response = await putStep(0, {
      first_step_login: {
        authType: FormAuthType.SP,
        isSingleSubmission: true,
      },
      esrvc_id: 'example-service',
    })

    expect(response.status).toBe(200)
    expect(await rawForm()).toMatchObject({ isSingleSubmission: true })
  })

  it('rejects a stale save and rolls back its list version', async () => {
    const stale = (await FormModel.findById(formId)
      .populate('admin')
      .orFail()) as unknown as IPopulatedForm
    await putStep(1, { step_name: 'Renamed by another admin' })

    const third = await rawStep(2)
    const result = await AdminFormService.updateFormWorkflowStep(stale, 2, {
      _id: String(third._id),
      workflow_type: WorkflowType.Static,
      emails: third.emails,
      edit: third.edit.map(String),
      auth: cpLogin,
      esrvc_id: 'example-service',
      whitelistCsvString: UEN,
    })

    expect(result._unsafeUnwrapErr().message).toBe(
      'This form changed while you were editing. Refresh and try again.',
    )
    expect((await rawStep(1)).step_name).toBe('Renamed by another admin')
    expect((await rawStep(2)).auth).toBeUndefined()
    expect(await WhitelistModel.countDocuments()).toBe(0)
  })

  it('assigns a MyInfo field to a later Singpass step and blocks removing its login', async () => {
    // A draft MyInfo field not yet assigned to any step.
    await FormModel.updateOne(
      { _id: formId },
      {
        $push: {
          form_fields: {
            _id: MYINFO_FIELD_ID,
            fieldType: BasicField.ShortText,
            title: 'Name',
            myInfo: { attr: MyInfoAttribute.Name },
          },
        },
      },
    )
    const saved = await putStep(1, {
      edit: [String(MYINFO_FIELD_ID)],
      auth: {
        auth_type: FormAuthType.MyInfo,
        is_submitter_id_collection_enabled: true,
      },
    })
    expect(saved.status).toBe(200)

    const removed = await putStep(1, { auth: null })
    expect(removed.status).toBe(400)

    const deleted = await session.delete(`/admin/forms/${formId}/workflow/1`)
    expect(deleted.status).toBe(400)
    expect(deleted.body.message).toBe(
      'Keep a Singpass step or remove the remaining MyInfo fields from the form.',
    )
  })

  it('downloads a later step list without the private key', async () => {
    await putStep(1, {
      auth: cpLogin,
      esrvc_id: 'example-service',
      whitelistCsvString: UEN,
    })

    const response = await session.get(
      `/admin/forms/${formId}/workflow/1/whitelist`,
    )

    expect(response.status).toBe(200)
    expect(response.body.encryptedWhitelistedSubmitterIds).toEqual({
      myPublicKey: expect.any(String),
      nonce: expect.any(String),
      cipherTexts: [expect.any(String)],
    })
  })

  it('saves a step 1 list through settings and refuses to clear the e-service ID of a Corppass step', async () => {
    const withList = await session
      .patch(`/admin/forms/${formId}/settings`)
      .send({ authType: FormAuthType.SP, whitelistCsvString: NRIC })
    expect(withList.status).toBe(200)
    expect(withList.body.whitelistedSubmitterIds).toEqual({
      isWhitelistEnabled: true,
    })
    expect(withList.body).not.toHaveProperty('whitelistCsvString')

    await putStep(1, { auth: cpLogin, esrvc_id: 'example-service' })
    const cleared = await session
      .patch(`/admin/forms/${formId}/settings`)
      .send({ esrvcId: '' })
    expect(cleared.status).toBe(400)
    expect((await rawForm()).esrvcId).toBe('example-service')
  })

  it('keeps earlier list versions when the legacy route clears the step 1 list', async () => {
    await session
      .patch(`/admin/forms/${formId}/settings`)
      .send({ authType: FormAuthType.SP, whitelistCsvString: NRIC })
    await putStep(1, {
      auth: cpLogin,
      esrvc_id: 'example-service',
      whitelistCsvString: UEN,
    })

    const response = await session
      .put(`/admin/forms/${formId}/settings/whitelist`)
      .send({ whitelistCsvString: null })

    expect(response.status).toBe(200)
    expect((await rawForm()).whitelistedSubmitterIds).toEqual({
      isWhitelistEnabled: false,
    })
    expect(await WhitelistModel.countDocuments({ formId })).toBe(2)
  })
})
