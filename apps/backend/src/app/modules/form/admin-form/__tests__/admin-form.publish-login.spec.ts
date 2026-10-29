import { ObjectId } from 'bson'
import {
  BasicField,
  CorppassAttribute,
  FormAuthType,
  FormResponseMode,
  FormStatus,
  PaymentChannel,
  WorkflowType,
} from 'formsg-shared/types'
import mongoose from 'mongoose'

import {
  getEncryptedFormModel,
  getMultirespondentFormModel,
} from 'src/app/models/form.server.model'
import { MalformedParametersError } from 'src/app/modules/core/core.errors'
import { IPopulatedForm } from 'src/types'

import { FormChangedWhileEditingError } from '../admin-form.errors'
import { updateFormSettings } from '../admin-form.service'

const StorageForm = getEncryptedFormModel(mongoose)
const MrfForm = getMultirespondentFormModel(mongoose)
const fieldId = new ObjectId()
const providerField = {
  _id: fieldId,
  title: 'Company registration',
  fieldType: BasicField.Uen,
  corppass: { attr: CorppassAttribute.Uen },
}
const form = (overrides: Record<string, unknown> = {}) =>
  ({
    _id: new ObjectId(),
    status: FormStatus.Private,
    responseMode: FormResponseMode.Multirespondent,
    authType: FormAuthType.NIL,
    isSubmitterIdCollectionEnabled: false,
    form_fields: [providerField],
    workflow: [
      {
        _id: new ObjectId(),
        workflow_type: WorkflowType.Static,
        emails: [],
        edit: [],
      },
    ],
    webhook: { url: '' },
    payments_channel: { channel: PaymentChannel.Unconnected },
    payments_field: { enabled: false },
    ...overrides,
  }) as unknown as IPopulatedForm

const mockWrite = (
  model: typeof StorageForm | typeof MrfForm,
  result: unknown,
) =>
  jest
    .spyOn(model, 'findOneAndUpdate')
    .mockReturnValue({ exec: async () => result } as never)

describe('authentication publication gate', () => {
  afterEach(() => jest.restoreAllMocks())
  it.each([
    [FormResponseMode.Multirespondent, MrfForm],
    [FormResponseMode.Encrypt, StorageForm],
  ])(
    'refuses unassigned Corppass fields before the %s publication query',
    async (responseMode, model) => {
      const write = mockWrite(model, null)
      const result = await updateFormSettings(form({ responseMode }), {
        status: FormStatus.Public,
      })
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(MalformedParametersError)
      expect(result._unsafeUnwrapErr().message).toContain(
        '"Company registration" needs a step with Corppass',
      )
      expect(write).not.toHaveBeenCalled()
    },
  )
  it('rejects a provider switch that would orphan flat fields without confirmed deletion', async () => {
    const write = mockWrite(StorageForm, null)
    const result = await updateFormSettings(
      form({
        responseMode: FormResponseMode.Encrypt,
        authType: FormAuthType.CP,
      }),
      { authType: FormAuthType.MyInfo },
    )
    expect(result._unsafeUnwrapErr().message).toBe(
      'UEN fields need Corppass login.',
    )
    expect(write).not.toHaveBeenCalled()
  })
  it('compares the authentication configuration it checked before publishing', async () => {
    const original = form({
      authType: FormAuthType.CP,
      workflow: [
        {
          _id: new ObjectId(),
          workflow_type: WorkflowType.Static,
          emails: [],
          edit: [fieldId],
        },
      ],
    })
    const write = mockWrite(MrfForm, {
      getSettings: () => ({ status: FormStatus.Public }),
    })
    const result = await updateFormSettings(original, {
      status: FormStatus.Public,
    })
    expect(result.isOk()).toBe(true)
    expect(write).toHaveBeenCalledWith(
      expect.objectContaining({
        status: FormStatus.Private,
        authType: FormAuthType.CP,
        'form_fields.0._id': fieldId,
        'form_fields.0.corppass.attr': CorppassAttribute.Uen,
        'workflow.0.edit': [fieldId],
      }),
      expect.anything(),
      expect.anything(),
    )
  })
  it('reports a stale publication if the checked configuration no longer matches', async () => {
    mockWrite(StorageForm, null)
    const original = form({
      responseMode: FormResponseMode.Encrypt,
      authType: FormAuthType.CP,
    })
    const result = await updateFormSettings(original, {
      status: FormStatus.Public,
    })
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(
      FormChangedWhileEditingError,
    )
  })
  it('refuses a later Corppass step without an e-service ID', async () => {
    const write = mockWrite(MrfForm, null)
    const result = await updateFormSettings(
      form({
        form_fields: [],
        workflow: [
          {
            _id: new ObjectId(),
            workflow_type: WorkflowType.Static,
            emails: [],
            edit: [],
          },
          {
            _id: new ObjectId(),
            workflow_type: WorkflowType.Static,
            emails: ['two@example.com'],
            edit: [],
            auth: { auth_type: FormAuthType.CP },
          },
        ],
      }),
      { status: FormStatus.Public },
    )
    expect(result._unsafeUnwrapErr().message).toContain(
      'Add an e-service ID to every Corppass step',
    )
    expect(write).not.toHaveBeenCalled()
  })
})
