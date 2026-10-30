import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import {
  BasicField,
  CorppassAttribute,
  FormAuthType,
  FormField,
  FormFieldDto,
  FormResponseMode,
  FormStatus,
  MyInfoAttribute,
  WorkflowType,
} from 'formsg-shared/types'
import { createLoginIdentityField } from 'formsg-shared/utils/login-identity'
import mongoose, { Types } from 'mongoose'

import {
  getEncryptedFormModel,
  getMultirespondentFormModel,
} from 'src/app/models/form.server.model'
import {
  convertSubmitterIdCollection,
  updateFormSettings,
  updateFormWorkflowStep,
} from 'src/app/modules/form/admin-form/admin-form.service'
import { IPopulatedForm } from 'src/types'

const EncryptedForm = getEncryptedFormModel(mongoose)
const MultirespondentForm = getMultirespondentFormModel(mongoose)

const nricIdentityField = {
  _id: new Types.ObjectId(),
  fieldType: BasicField.Nric,
  title: 'NRIC/FIN',
  myInfo: { attr: MyInfoAttribute.UinFin },
}
const uenIdentityField = {
  fieldType: BasicField.Uen,
  title: 'UEN',
  corppass: { attr: CorppassAttribute.Uen },
}

describe('Form login identity fields', () => {
  let adminId: Types.ObjectId

  beforeAll(async () => await dbHandler.connect())
  beforeEach(async () => {
    const { user } = await dbHandler.insertFormCollectionReqs()
    adminId = user._id
  })
  afterEach(async () => await dbHandler.clearDatabase())
  afterAll(async () => await dbHandler.closeDatabase())

  const storageForm = (overrides: Record<string, unknown>) => ({
    title: 'Login identity form',
    admin: adminId,
    publicKey: 'mockPublicKey',
    responseMode: FormResponseMode.Encrypt,
    ...overrides,
  })

  it('records uinfin for the NRIC/FIN field alongside MyInfo data attributes', async () => {
    const form = await EncryptedForm.create(
      storageForm({
        authType: FormAuthType.MyInfo,
        form_fields: [
          nricIdentityField,
          {
            fieldType: BasicField.ShortText,
            title: 'Name',
            myInfo: { attr: MyInfoAttribute.Name },
          },
        ],
      }),
    )

    expect(form.form_fields?.[0].myInfo?.attr).toBe(MyInfoAttribute.UinFin)
    expect(form.getUniqueMyInfoAttrs()).toEqual([
      MyInfoAttribute.UinFin,
      MyInfoAttribute.Name,
    ])
  })

  it('rejects an NRIC identity field on a published Corppass form', async () => {
    await expect(
      EncryptedForm.create(
        storageForm({
          authType: FormAuthType.CP,
          status: FormStatus.Public,
          esrvcId: 'test-service',
          form_fields: [nricIdentityField],
        }),
      ),
    ).rejects.toThrow('NRIC/FIN fields need Singpass login.')
  })

  it('rejects an identity field while the legacy collection toggle is on', async () => {
    await expect(
      EncryptedForm.create(
        storageForm({
          authType: FormAuthType.CP,
          isSubmitterIdCollectionEnabled: true,
          form_fields: [uenIdentityField],
        }),
      ),
    ).rejects.toThrow(mongoose.Error.ValidationError)
  })

  it('rejects the NRIC/FIN MyInfo attribute on other field types', async () => {
    await expect(
      EncryptedForm.create(
        storageForm({
          authType: FormAuthType.MyInfo,
          form_fields: [
            {
              fieldType: BasicField.ShortText,
              title: 'NRIC',
              myInfo: { attr: MyInfoAttribute.UinFin },
            },
          ],
        }),
      ),
    ).rejects.toThrow(mongoose.Error.ValidationError)
  })

  it('leaves new identity fields out of MRF Step 1', async () => {
    const existingId = new Types.ObjectId()
    const form = await MultirespondentForm.create({
      ...storageForm({ authType: FormAuthType.MyInfo }),
      responseMode: FormResponseMode.Multirespondent,
      form_fields: [
        { _id: existingId, fieldType: BasicField.Nric, title: 'Typed NRIC' },
      ],
      workflow: [{ workflow_type: 'static', emails: [], edit: [existingId] }],
    })

    await form.insertFormField({
      ...createLoginIdentityField(MyInfoAttribute.UinFin),
      _id: nricIdentityField._id,
    } as unknown as FormField)
    const reloaded = await MultirespondentForm.findById(form._id).orFail()
    expect(reloaded.form_fields?.map(({ _id }) => String(_id))).toEqual([
      existingId.toString(),
      nricIdentityField._id.toString(),
    ])
    expect(reloaded.workflow[0].edit.map(String)).toEqual([
      existingId.toString(),
    ])
  })

  it('allows an unassigned MRF identity field when its provider exists', async () => {
    const form = await MultirespondentForm.create({
      ...storageForm({
        authType: FormAuthType.MyInfo,
        // A form with a login stays closed until it has an e-service ID.
        esrvcId: 'mockEsrvcId',
        form_fields: [nricIdentityField],
      }),
      responseMode: FormResponseMode.Multirespondent,
      workflow: [],
    })
    form.status = FormStatus.Public
    form.set('workflow', [{ workflow_type: 'static', emails: [], edit: [] }])

    await expect(form.save()).resolves.toBeDefined()
    form.set('workflow', [
      { workflow_type: 'static', emails: [], edit: [nricIdentityField._id] },
    ])
    form.$markValid('form_fields')
    await expect(form.save()).resolves.toBeDefined()
  })

  it('rejects providerless authentication fields even in a closed draft', async () => {
    await expect(
      EncryptedForm.create(
        storageForm({
          authType: FormAuthType.NIL,
          form_fields: [nricIdentityField, uenIdentityField],
        }),
      ),
    ).rejects.toThrow('needs a step with')
  })

  it('publishes a valid mixed-provider workflow through the checked settings update', async () => {
    const myInfoId = new Types.ObjectId()
    const corppassId = new Types.ObjectId()
    const form = await MultirespondentForm.create({
      ...storageForm({
        authType: FormAuthType.MyInfo,
        esrvcId: 'test-service',
      }),
      responseMode: FormResponseMode.Multirespondent,
      form_fields: [
        { ...nricIdentityField, _id: myInfoId },
        { ...uenIdentityField, _id: corppassId },
      ],
      workflow: [
        { workflow_type: 'static', emails: [], edit: [myInfoId] },
        {
          workflow_type: 'static',
          emails: ['approver@example.com'],
          edit: [corppassId],
          auth: { auth_type: FormAuthType.CP, esrvc_id: 'step-service' },
        },
      ],
    })
    const result = await updateFormSettings(form as unknown as IPopulatedForm, {
      status: FormStatus.Public,
    })
    if (result.isErr()) throw result.error
    expect(result._unsafeUnwrap().status).toBe(FormStatus.Public)
    expect((await MultirespondentForm.findById(form._id).orFail()).status).toBe(
      FormStatus.Public,
    )
  })

  it('refuses a stale private field addition after publication', async () => {
    const form = await EncryptedForm.create(
      storageForm({ authType: FormAuthType.CP, form_fields: [] }),
    )
    await EncryptedForm.updateOne(
      { _id: form._id },
      { status: FormStatus.Public },
    )
    await expect(
      form.insertFormField(uenIdentityField as FormField),
    ).rejects.toBeInstanceOf(mongoose.Error.VersionError)
    expect(
      (await EncryptedForm.findById(form._id).orFail()).form_fields,
    ).toHaveLength(0)
  })

  it('refuses a stale public field conversion after a concurrent workflow unassignment', async () => {
    const fieldId = new Types.ObjectId()
    const retainedId = new Types.ObjectId()
    const form = await MultirespondentForm.create({
      ...storageForm({
        authType: FormAuthType.MyInfo,
        esrvcId: 'test-service',
        status: FormStatus.Public,
      }),
      responseMode: FormResponseMode.Multirespondent,
      form_fields: [
        { _id: fieldId, fieldType: BasicField.ShortText, title: 'Name' },
        { _id: retainedId, fieldType: BasicField.ShortText, title: 'Reason' },
      ],
      workflow: [
        {
          workflow_type: WorkflowType.Static,
          emails: [],
          edit: [fieldId, retainedId],
        },
      ],
    })
    const staleFieldEditor = await MultirespondentForm.findById(
      form._id,
    ).orFail()
    const workflowResult = await updateFormWorkflowStep(
      form as unknown as IPopulatedForm,
      0,
      {
        workflow_type: WorkflowType.Static,
        emails: [],
        edit: [String(retainedId)],
      },
      { isStepLoginEnabled: true },
    )
    if (workflowResult.isErr()) throw workflowResult.error

    const staleField = staleFieldEditor.form_fields[0].toObject()
    await expect(
      staleFieldEditor.updateFormFieldById(String(fieldId), {
        ...staleField,
        myInfo: { attr: MyInfoAttribute.Name },
      } as FormFieldDto),
    ).rejects.toBeInstanceOf(mongoose.Error.VersionError)

    const reloaded = await MultirespondentForm.findById(form._id).orFail()
    expect(reloaded.status).toBe(FormStatus.Public)
    expect(reloaded.form_fields[0].myInfo?.attr).toBeUndefined()
    expect(reloaded.workflow[0].edit.map(String)).toEqual([String(retainedId)])
  })

  it('allows a public field conversion when its authentication configuration is unchanged', async () => {
    const fieldId = new Types.ObjectId()
    const form = await MultirespondentForm.create({
      ...storageForm({
        authType: FormAuthType.MyInfo,
        esrvcId: 'test-service',
        status: FormStatus.Public,
      }),
      responseMode: FormResponseMode.Multirespondent,
      form_fields: [
        { _id: fieldId, fieldType: BasicField.ShortText, title: 'Name' },
      ],
      workflow: [
        { workflow_type: WorkflowType.Static, emails: [], edit: [fieldId] },
      ],
    })
    await expect(
      form.updateFormFieldById(String(fieldId), {
        ...form.form_fields[0].toObject(),
        myInfo: { attr: MyInfoAttribute.Name },
      } as FormFieldDto),
    ).resolves.toBeDefined()
    expect(
      (await MultirespondentForm.findById(form._id).orFail()).form_fields[0]
        .myInfo?.attr,
    ).toBe(MyInfoAttribute.Name)
  })

  it('saves a legacy conversion against its configuration before flag and workflow changes', async () => {
    const form = await MultirespondentForm.create({
      ...storageForm({
        authType: FormAuthType.CP,
        isSubmitterIdCollectionEnabled: true,
      }),
      responseMode: FormResponseMode.Multirespondent,
      form_fields: [],
      workflow: [{ workflow_type: WorkflowType.Static, emails: [], edit: [] }],
    })
    const result = await convertSubmitterIdCollection(
      form as unknown as IPopulatedForm,
    )
    if (result.isErr()) throw result.error
    const reloaded = await MultirespondentForm.findById(form._id).orFail()
    expect(reloaded.isSubmitterIdCollectionEnabled).toBe(false)
    expect(reloaded.form_fields).toHaveLength(2)
    expect(reloaded.workflow[0].edit.map(String)).toEqual(
      reloaded.form_fields.map(({ _id }) => String(_id)),
    )
  })

  it('clears temporary guards between consecutive field additions on one document', async () => {
    const form = await EncryptedForm.create(
      storageForm({ authType: FormAuthType.NIL, form_fields: [] }),
    )
    await form.insertFormField({
      fieldType: BasicField.ShortText,
      title: 'First',
    } as FormField)
    await form.insertFormField({
      fieldType: BasicField.ShortText,
      title: 'Second',
    } as FormField)
    expect(
      (await EncryptedForm.findById(form._id).orFail()).form_fields,
    ).toHaveLength(2)
    expect(form.$where).toBeUndefined()
  })

  describe('login field limit', () => {
    const myInfoDataFields = (count: number) =>
      Array.from({ length: count }, () => ({
        fieldType: BasicField.ShortText,
        title: 'Name',
        myInfo: { attr: MyInfoAttribute.Name },
      }))

    it('accepts 50 login fields on a MyInfo form', async () => {
      await expect(
        EncryptedForm.create(
          storageForm({
            authType: FormAuthType.MyInfo,
            form_fields: [nricIdentityField, ...myInfoDataFields(49)],
          }),
        ),
      ).resolves.toBeDefined()
    })

    it('counts identity fields towards the limit', async () => {
      await expect(
        EncryptedForm.create(
          storageForm({
            authType: FormAuthType.MyInfo,
            form_fields: [nricIdentityField, ...myInfoDataFields(50)],
          }),
        ),
      ).rejects.toThrow(
        'Forms can have at most 50 Myinfo, NRIC/FIN and UEN fields.',
      )
    })

    it('applies the same limit to Corppass identity fields', async () => {
      await expect(
        EncryptedForm.create(
          storageForm({
            authType: FormAuthType.CP,
            form_fields: Array.from({ length: 51 }, () => uenIdentityField),
          }),
        ),
      ).rejects.toThrow(
        'Forms can have at most 50 Myinfo, NRIC/FIN and UEN fields.',
      )
    })

    it('does not count NRIC and UEN fields the respondent types', async () => {
      await expect(
        EncryptedForm.create(
          storageForm({
            authType: FormAuthType.MyInfo,
            form_fields: [
              nricIdentityField,
              ...myInfoDataFields(49),
              { fieldType: BasicField.Nric, title: 'Typed NRIC' },
              { fieldType: BasicField.Uen, title: 'Typed UEN' },
            ],
          }),
        ),
      ).resolves.toBeDefined()
    })

    it('requires Singpass login for published MyInfo data fields', async () => {
      await expect(
        EncryptedForm.create(
          storageForm({
            authType: FormAuthType.CP,
            status: FormStatus.Public,
            esrvcId: 'test-service',
            form_fields: myInfoDataFields(1),
          }),
        ),
      ).rejects.toThrow('"Name" needs a step with Singpass authentication.')
    })
  })
})
