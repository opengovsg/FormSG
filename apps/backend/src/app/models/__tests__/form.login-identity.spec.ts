import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import {
  BasicField,
  CorppassAttribute,
  FormAuthType,
  FormField,
  FormResponseMode,
  FormStatus,
  MyInfoAttribute,
} from 'formsg-shared/types'
import { createLoginIdentityField } from 'formsg-shared/utils/login-identity'
import mongoose, { Types } from 'mongoose'

import {
  getEncryptedFormModel,
  getMultirespondentFormModel,
} from 'src/app/models/form.server.model'

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

  it('rejects an NRIC identity field on a Corppass form', async () => {
    await expect(
      EncryptedForm.create(
        storageForm({
          authType: FormAuthType.CP,
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

  it('opens an MRF form whose Step 1 does not own the identity field', async () => {
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
  })
})
