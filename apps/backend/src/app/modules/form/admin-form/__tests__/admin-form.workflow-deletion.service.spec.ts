import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import { ObjectId } from 'bson'
import {
  BasicField,
  FormAuthType,
  FormResponseMode,
  FormStatus,
  FormWorkflowDto,
  MyInfoAttribute,
  WorkflowType,
} from 'formsg-shared/types'
import { merge } from 'lodash'
import mongoose from 'mongoose'

import getFormModel, {
  getMultirespondentFormModel,
} from 'src/app/models/form.server.model'
import {
  FormInvalidResponseModeError,
  FormOpenToResponsesError,
} from 'src/app/modules/form/form.errors'
import { IPopulatedForm, IPopulatedUser } from 'src/types'

import { FormChangedWhileEditingError } from '../admin-form.errors'
import {
  deleteFormWorkflow,
  deleteFormWorkflowStep,
  updateFormWorkflowStep,
} from '../admin-form.service'

const FormModel = getFormModel(mongoose)
const MultirespondentFormModel = getMultirespondentFormModel(mongoose)

const MOCK_ADMIN_ID = new ObjectId().toHexString()

const step = (email: string) => ({
  _id: new ObjectId(),
  workflow_type: WorkflowType.Static,
  emails: [email],
  edit: [],
})

/**
 * Deleting a workflow is unrecoverable and total, so these cover the two things
 * that stop it happening by accident: the form has to be closed first, and
 * deleting step 1 has to mean this rather than silently promoting step 2.
 */
describe('workflow deletion', () => {
  let populatedAdmin: IPopulatedUser

  beforeAll(async () => await dbHandler.connect())
  beforeEach(async () => {
    const preloaded = await dbHandler.insertFormCollectionReqs({
      userId: MOCK_ADMIN_ID,
    })
    populatedAdmin = merge(preloaded.user, {
      agency: preloaded.agency,
    }) as IPopulatedUser
  })
  afterEach(async () => await dbHandler.clearDatabase())
  afterAll(async () => await dbHandler.closeDatabase())

  const createMrfForm = async (status: FormStatus, stepCount = 3) => {
    const form = await MultirespondentFormModel.create({
      title: 'mrf with a workflow',
      admin: populatedAdmin._id,
      responseMode: FormResponseMode.Multirespondent,
      publicKey: 'mock-public-key',
      status,
      workflow: Array.from({ length: stepCount }, (_, i) =>
        step(`step${i}@example.com`),
      ),
    })
    return merge(form, { admin: populatedAdmin }) as unknown as IPopulatedForm
  }

  // Step 1 has the given login; Step 2 logs in with Singpass and fills a
  // Myinfo field.
  const createMrfFormWithSingpassStepTwo = async (
    stepOneAuthType: FormAuthType,
  ) => {
    const myInfoFieldId = new ObjectId()
    const form = await MultirespondentFormModel.create({
      title: 'mrf with step login',
      admin: populatedAdmin._id,
      responseMode: FormResponseMode.Multirespondent,
      publicKey: 'mock-public-key',
      status: FormStatus.Private,
      authType: stepOneAuthType,
      form_fields: [
        {
          _id: myInfoFieldId,
          fieldType: BasicField.ShortText,
          title: 'Name',
          myInfo: { attr: MyInfoAttribute.Name },
        },
      ],
      workflow: [
        step('step0@example.com'),
        {
          ...step('step1@example.com'),
          edit: [myInfoFieldId],
          auth: { auth_type: FormAuthType.MyInfo },
        },
      ],
    })
    return merge(form, { admin: populatedAdmin }) as unknown as IPopulatedForm
  }

  it.each(['workflow', 'step'] as const)(
    'refuses a stale private %s deletion after publication',
    async (operation) => {
      const form = await createMrfForm(FormStatus.Private, 2)
      await FormModel.updateOne(
        { _id: form._id },
        { status: FormStatus.Public },
      )
      const result =
        operation === 'workflow'
          ? await deleteFormWorkflow(form)
          : await deleteFormWorkflowStep(form, 1)
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        FormChangedWhileEditingError,
      )
      expect(
        (await MultirespondentFormModel.findById(form._id).orFail()).workflow,
      ).toHaveLength(2)
    },
  )

  describe('deleteFormWorkflow', () => {
    it('allows deleting a closed workflow while Myinfo fields stay in the draft', async () => {
      const form = await createMrfFormWithSingpassStepTwo(FormAuthType.NIL)

      const actual = await deleteFormWorkflow(form)
      if (actual.isErr()) throw actual.error
      expect(actual._unsafeUnwrap()).toEqual([])
      const stored = await FormModel.findById(form._id)
      expect(
        (stored as never as { workflow: unknown[] }).workflow,
      ).toHaveLength(0)
      expect(stored?.form_fields).toHaveLength(1)
    })

    it('should allow deletion when Step 1 can fill the Myinfo fields', async () => {
      const form = await createMrfFormWithSingpassStepTwo(FormAuthType.MyInfo)

      const actual = await deleteFormWorkflow(form)

      if (actual.isErr()) throw actual.error
      expect(actual._unsafeUnwrap()).toEqual([])
    })

    it('should clear every step, not only the first', async () => {
      const form = await createMrfForm(FormStatus.Private)

      const actual = await deleteFormWorkflow(form)

      if (actual.isErr()) throw actual.error
      expect(actual._unsafeUnwrap()).toEqual([])
      const stored = await FormModel.findById(form._id)
      expect((stored as never as { workflow: unknown[] }).workflow).toEqual([])
    })

    // Respondents may be part-way through a workflow right now, and pulling it
    // out from under them mid-submission is not something an admin can undo.
    it('should refuse while the form is open to responses', async () => {
      const form = await createMrfForm(FormStatus.Public)

      const actual = await deleteFormWorkflow(form)

      expect(actual._unsafeUnwrapErr()).toBeInstanceOf(FormOpenToResponsesError)
      const stored = await FormModel.findById(form._id)
      expect(
        (stored as never as { workflow: unknown[] }).workflow,
      ).toHaveLength(3)
    })

    it.each([FormStatus.Private, FormStatus.Archived])(
      'should allow deletion when the form is %s',
      async (status) => {
        const form = await createMrfForm(status)

        const actual = await deleteFormWorkflow(form)

        if (actual.isErr()) throw actual.error
        expect(actual._unsafeUnwrap()).toEqual([])
      },
    )

    it('should refuse for a form that is not multi-respondent', async () => {
      const form = await createMrfForm(FormStatus.Private)
      const notMrf = merge({}, form, {
        responseMode: FormResponseMode.Encrypt,
      }) as IPopulatedForm

      const actual = await deleteFormWorkflow(notMrf)

      expect(actual._unsafeUnwrapErr()).toBeInstanceOf(
        FormInvalidResponseModeError,
      )
    })

    it('should be a no-op rather than an error on an empty workflow', async () => {
      const form = await createMrfForm(FormStatus.Private, 0)

      const actual = await deleteFormWorkflow(form)

      if (actual.isErr()) throw actual.error
      expect(actual._unsafeUnwrap()).toEqual([])
    })
  })

  // Refusing to delete step 1 is flagged behaviour and lives in the controller,
  // where the flag can be read; it is covered by the route spec.
  describe('deleteFormWorkflowStep', () => {
    it('requires confirmation to delete the last Singpass step and its fields', async () => {
      const form = await createMrfFormWithSingpassStepTwo(FormAuthType.NIL)

      expect((await deleteFormWorkflowStep(form, 1)).isErr()).toBe(true)
      const actual = await deleteFormWorkflowStep(form, 1, {
        delete_auth_field_ids: form.form_fields.map((field) =>
          String(field._id),
        ),
        expected_last_modified: form.lastModified?.toISOString(),
      })
      if (actual.isErr()) throw actual.error
      expect(actual._unsafeUnwrap()).toHaveLength(1)
      expect(
        (await FormModel.findById(form._id).orFail()).form_fields,
      ).toHaveLength(0)
    })

    it('should still delete a later step', async () => {
      const form = await createMrfForm(FormStatus.Private)

      const actual = await deleteFormWorkflowStep(form, 1)

      expect(actual._unsafeUnwrap()).toHaveLength(2)
    })

    // Unlike deleting the workflow, shortening one is recoverable by adding the
    // step back, so it is not gated on the form being closed.
    it('should delete a later step even while the form is open', async () => {
      const form = await createMrfForm(FormStatus.Public)

      const actual = await deleteFormWorkflowStep(form, 1)

      expect(actual._unsafeUnwrap()).toHaveLength(2)
    })
  })
})

// Guided destructive changes operate on one form document; response records are never touched.
describe('guided authentication workflow changes', () => {
  beforeAll(async () => await dbHandler.connect())
  afterEach(async () => await dbHandler.clearDatabase())
  afterAll(async () => await dbHandler.closeDatabase())
  const makeMixedForm = async () => {
    const { user } = await dbHandler.insertFormCollectionReqs()
    const singpassId = new ObjectId()
    const corppassId = new ObjectId()
    const plainId = new ObjectId()
    const form = await MultirespondentFormModel.create({
      title: 'mixed authentication workflow',
      admin: user._id,
      responseMode: FormResponseMode.Multirespondent,
      publicKey: 'mock',
      status: FormStatus.Private,
      authType: FormAuthType.MyInfo,
      isSingleSubmission: true,
      whitelistedSubmitterIds: {
        isWhitelistEnabled: true,
        encryptedWhitelistedSubmitterIds: new ObjectId(),
      },
      form_fields: [
        {
          _id: singpassId,
          fieldType: BasicField.ShortText,
          title: 'Verified name',
          myInfo: { attr: MyInfoAttribute.Name },
        },
        {
          _id: corppassId,
          fieldType: BasicField.Uen,
          title: 'Company',
          corppass: { attr: 'uen' },
        },
        { _id: plainId, fieldType: BasicField.Number, title: 'Reason' },
      ],
      form_logics: [
        {
          logicType: 'showFields',
          conditions: [{ field: plainId, state: 'is equals to', value: 1 }],
          show: [singpassId, plainId],
        },
      ],
      workflow: [
        { ...step(''), edit: [singpassId, plainId] },
        {
          ...step('approver@example.com'),
          edit: [corppassId],
          auth: { auth_type: FormAuthType.CP, esrvc_id: 'company-service' },
        },
        { workflow_type: WorkflowType.Dynamic, field: singpassId, edit: [] },
      ],
    })
    return {
      form: form as unknown as IPopulatedForm,
      singpassId: String(singpassId),
      corppassId: String(corppassId),
      plainId: String(plainId),
    }
  }
  const confirm = (form: IPopulatedForm, ids: string[]) => ({
    delete_auth_field_ids: ids,
    expected_last_modified: form.lastModified?.toISOString(),
  })

  it('retains legacy Singpass when it is selected from a mixed legacy workflow', async () => {
    const { user } = await dbHandler.insertFormCollectionReqs()
    const form = await MultirespondentFormModel.create({
      title: 'legacy mixed workflow',
      admin: user._id,
      responseMode: FormResponseMode.Multirespondent,
      publicKey: 'mock',
      status: FormStatus.Private,
      authType: FormAuthType.SP,
      esrvcId: 'legacy-service',
      isSingleSubmission: true,
      workflow: [
        step(''),
        {
          ...step('approver@example.com'),
          auth: { auth_type: FormAuthType.CP, esrvc_id: 'company-service' },
        },
      ],
    })
    const result = await deleteFormWorkflow(form as unknown as IPopulatedForm, {
      retained_auth_type: FormAuthType.MyInfo,
      expected_last_modified: form.lastModified?.toISOString(),
    })
    if (result.isErr()) throw result.error
    const saved = await MultirespondentFormModel.findById(form._id).orFail()
    expect(saved.authType).toBe(FormAuthType.SP)
    expect(saved.esrvcId).toBe('legacy-service')
    expect(saved.isSingleSubmission).toBe(true)
  })
  it('accepts a historical field with missing optional defaults without a false conflict', async () => {
    const { form, corppassId } = await makeMixedForm()
    await MultirespondentFormModel.collection.updateOne(
      { _id: form._id },
      {
        $unset: {
          'form_fields.0.globalId': '',
          'form_fields.0.ValidationOptions': '',
          'form_fields.0.allowPrefill': '',
        },
      },
    )
    const fresh = await MultirespondentFormModel.findById(form._id).orFail()
    const result = await deleteFormWorkflow(
      fresh as unknown as IPopulatedForm,
      {
        retained_auth_type: FormAuthType.MyInfo,
        ...confirm(fresh as unknown as IPopulatedForm, [corppassId]),
      },
    )
    if (result.isErr()) throw result.error
    expect(
      (await MultirespondentFormModel.findById(form._id).orFail()).workflow,
    ).toEqual([])
  })
  it('switching the final Singpass step removes its definitions and resets affected routing in the same write', async () => {
    const { form, singpassId, plainId } = await makeMixedForm()
    const workflow = (form as unknown as { workflow: FormWorkflowDto }).workflow
    const result = await updateFormWorkflowStep(
      form,
      0,
      {
        ...workflow[0],
        edit: [plainId],
        first_step_login: { auth_type: FormAuthType.NIL },
        ...confirm(form, [singpassId]),
      },
      true,
    )
    if (result.isErr()) throw result.error
    const saved = await MultirespondentFormModel.findById(form._id).orFail()
    expect(saved.authType).toBe(FormAuthType.NIL)
    expect(saved.form_fields.map((field) => String(field._id))).not.toContain(
      singpassId,
    )
    expect(saved.workflow[2].workflow_type).toBe(WorkflowType.Static)
    expect(saved.workflow[2].get('emails')).toEqual([])
    expect(saved.workflow[2].get('field')).toBeUndefined()
  })
  it.each([false, true])(
    'merges legacy and modern Singpass configurations while preserving restrictions (Corppass present: %s)',
    async (hasCorppass) => {
      const { form, corppassId, singpassId, plainId } = await makeMixedForm()
      const rawWorkflow = (form as unknown as { workflow: FormWorkflowDto })
        .workflow
      await MultirespondentFormModel.updateOne(
        { _id: form._id },
        {
          $set: {
            authType: FormAuthType.SP,
            esrvcId: 'legacy-service',
            workflow: [
              { ...rawWorkflow[0], edit: [plainId] },
              {
                ...step('person@example.com'),
                edit: [singpassId],
                auth: { auth_type: FormAuthType.MyInfo },
              },
              ...(hasCorppass ? [rawWorkflow[1]] : []),
            ],
            ...(hasCorppass
              ? {}
              : {
                  form_fields: form.form_fields.filter(
                    (field) => String(field._id) !== corppassId,
                  ),
                }),
          },
        },
      )
      const fresh = await MultirespondentFormModel.findById(form._id).orFail()
      const result = await deleteFormWorkflow(
        fresh as unknown as IPopulatedForm,
        {
          ...(hasCorppass
            ? { retained_auth_type: FormAuthType.MyInfo as const }
            : {}),
          ...confirm(
            fresh as unknown as IPopulatedForm,
            hasCorppass ? [corppassId] : [],
          ),
        },
      )
      if (result.isErr()) throw result.error
      const saved = await MultirespondentFormModel.findById(form._id).orFail()
      expect(saved.authType).toBe(FormAuthType.MyInfo)
      expect(saved.isSingleSubmission).toBe(true)
      expect(saved.getWhitelistedSubmitterIds().isWhitelistEnabled).toBe(true)
      expect(
        saved.form_fields.some((field) => !!field.get('myInfo.attr')),
      ).toBe(true)
    },
  )
  it('requires provider selection and the exact reviewed deletion set', async () => {
    const { form, singpassId } = await makeMixedForm()
    expect((await deleteFormWorkflow(form)).isErr()).toBe(true)
    expect(
      (
        await deleteFormWorkflow(form, { retained_auth_type: FormAuthType.CP })
      ).isErr(),
    ).toBe(true)
    expect(
      (
        await deleteFormWorkflow(form, {
          retained_auth_type: FormAuthType.CP,
          ...confirm(form, [singpassId, 'not-a-field']),
        })
      ).isErr(),
    ).toBe(true)
    expect(
      (await MultirespondentFormModel.findById(form._id).orFail()).workflow,
    ).toHaveLength(3)
  })
  it('retains chosen Corppass, deletes Singpass definitions/references, and resets old identity restrictions atomically', async () => {
    const { form, singpassId, corppassId, plainId } = await makeMixedForm()
    const result = await deleteFormWorkflow(form, {
      retained_auth_type: FormAuthType.CP,
      ...confirm(form, [singpassId]),
    })
    if (result.isErr()) throw result.error
    const saved = await MultirespondentFormModel.findById(form._id).orFail()
    expect(saved.workflow).toEqual([])
    expect(saved.authType).toBe(FormAuthType.CP)
    expect(saved.esrvcId).toBe('company-service')
    expect(saved.form_fields.map((field) => String(field._id))).toEqual([
      corppassId,
      plainId,
    ])
    expect(saved.form_logics).toHaveLength(1)
    expect(saved.form_logics[0].get('show').map(String)).toEqual([plainId])
    expect(saved.isSingleSubmission).toBe(false)
    expect(saved.getWhitelistedSubmitterIds()).toEqual(
      expect.objectContaining({ isWhitelistEnabled: false }),
    )
  })
  it('preserves Step 1 restrictions if its provider is retained', async () => {
    const { form, corppassId } = await makeMixedForm()
    const result = await deleteFormWorkflow(form, {
      retained_auth_type: FormAuthType.MyInfo,
      ...confirm(form, [corppassId]),
    })
    if (result.isErr()) throw result.error
    const saved = await MultirespondentFormModel.findById(form._id).orFail()
    expect(saved.isSingleSubmission).toBe(true)
    expect(saved.getWhitelistedSubmitterIds().isWhitelistEnabled).toBe(true)
  })
  it('requires selecting one existing Corppass e-service ID when they differ', async () => {
    const { form, singpassId } = await makeMixedForm()
    const workflow = (form as unknown as { workflow: FormWorkflowDto }).workflow
    workflow.push({
      ...step('other@example.com'),
      auth: { auth_type: FormAuthType.CP, esrvc_id: 'second-service' },
    })
    await form.save()
    expect(
      (
        await deleteFormWorkflow(form, {
          retained_auth_type: FormAuthType.CP,
          ...confirm(form, [singpassId]),
        })
      ).isErr(),
    ).toBe(true)
    expect(
      (
        await deleteFormWorkflow(form, {
          retained_auth_type: FormAuthType.CP,
          retained_esrvc_id: 'invented-service',
          ...confirm(form, [singpassId]),
        })
      ).isErr(),
    ).toBe(true)
    const result = await deleteFormWorkflow(form, {
      retained_auth_type: FormAuthType.CP,
      retained_esrvc_id: 'second-service',
      ...confirm(form, [singpassId]),
    })
    if (result.isErr()) throw result.error
    expect(
      (await MultirespondentFormModel.findById(form._id).orFail()).esrvcId,
    ).toBe('second-service')
  })
  it('deleting the last provider step deletes its fields only after confirmation', async () => {
    const { form, corppassId } = await makeMixedForm()
    const result = await deleteFormWorkflowStep(
      form,
      1,
      confirm(form, [corppassId]),
    )
    if (result.isErr()) throw result.error
    const saved = await MultirespondentFormModel.findById(form._id).orFail()
    expect(saved.workflow).toHaveLength(2)
    expect(saved.form_fields.map((field) => String(field._id))).not.toContain(
      corppassId,
    )
  })
  it('rejects confirmation made before a same-ID field rename', async () => {
    const { form, singpassId } = await makeMixedForm()
    const oldConfirmation = confirm(form, [singpassId])
    await MultirespondentFormModel.updateOne(
      { _id: form._id },
      {
        $set: {
          'form_fields.0.title': 'Renamed since review',
          lastModified: new Date(Date.now() + 1000),
        },
      },
    )
    const fresh = await MultirespondentFormModel.findById(form._id).orFail()
    const result = await deleteFormWorkflow(
      fresh as unknown as IPopulatedForm,
      { retained_auth_type: FormAuthType.CP, ...oldConfirmation },
    )
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(
      FormChangedWhileEditingError,
    )
    expect(
      (await MultirespondentFormModel.findById(form._id).orFail()).form_fields,
    ).toHaveLength(3)
  })
  it('rejects a stale server snapshot before deleting anything', async () => {
    const { form, singpassId } = await makeMixedForm()
    await MultirespondentFormModel.updateOne(
      { _id: form._id },
      { $set: { 'form_fields.0.title': 'Concurrent rename' } },
    )
    const result = await deleteFormWorkflow(form, {
      retained_auth_type: FormAuthType.CP,
      ...confirm(form, [singpassId]),
    })
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(
      FormChangedWhileEditingError,
    )
    expect(
      (await MultirespondentFormModel.findById(form._id).orFail()).workflow,
    ).toHaveLength(3)
  })
})
