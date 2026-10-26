import {
  canConvertSubmitterIdCollection,
  getLoginIdentityAttr,
  getLoginIdentityConfigErrors,
  isSubmitterIdCollected,
} from '../login-identity'

import {
  BasicField,
  CorppassAttribute,
  FormAuthType,
  FormResponseMode,
  MyInfoAttribute,
} from '../../types'

const nricIdentity = {
  _id: 'nric',
  fieldType: BasicField.Nric,
  title: 'NRIC/FIN',
  myInfo: { attr: MyInfoAttribute.UinFin },
}
const uenIdentity = {
  _id: 'uen',
  fieldType: BasicField.Uen,
  title: 'UEN',
  corppass: { attr: CorppassAttribute.Uen },
}
const uidIdentity = {
  _id: 'uid',
  fieldType: BasicField.Nric,
  title: 'NRIC/FIN',
  corppass: { attr: CorppassAttribute.Uid },
}
const typedNric = { _id: 'typed', fieldType: BasicField.Nric, title: 'NRIC' }

const myInfoStorageForm = {
  authType: FormAuthType.MyInfo,
  responseMode: FormResponseMode.Encrypt,
  isSubmitterIdCollectionEnabled: false,
}

describe('getLoginIdentityAttr', () => {
  it('ignores ordinary fields and mismatched field types', () => {
    expect(
      getLoginIdentityAttr({ ...uidIdentity, fieldType: BasicField.ShortText }),
    ).toBeUndefined()
    expect(getLoginIdentityAttr(typedNric)).toBeUndefined()
    expect(
      getLoginIdentityAttr({
        fieldType: BasicField.ShortText,
        myInfo: { attr: MyInfoAttribute.Name },
      }),
    ).toBeUndefined()
    expect(
      getLoginIdentityAttr({ ...uenIdentity, fieldType: BasicField.ShortText }),
    ).toBeUndefined()
  })
})

describe('isSubmitterIdCollected', () => {
  const corppassForm = { ...myInfoStorageForm, authType: FormAuthType.CP }

  it('collects through the legacy toggle', () => {
    expect(
      isSubmitterIdCollected({
        ...corppassForm,
        isSubmitterIdCollectionEnabled: true,
      }),
    ).toBe(true)
  })

  it('collects through identity fields the login fills, not typed NRIC fields', () => {
    expect(
      isSubmitterIdCollected({ ...corppassForm, form_fields: [uenIdentity] }),
    ).toBe(true)
    expect(
      isSubmitterIdCollected({ ...corppassForm, form_fields: [typedNric] }),
    ).toBe(false)
    expect(
      isSubmitterIdCollected({ ...corppassForm, form_fields: [nricIdentity] }),
    ).toBe(false)
  })

  it('collects through a workflow only when Step 1 owns the field', () => {
    const mrfForm = {
      ...corppassForm,
      responseMode: FormResponseMode.Multirespondent,
      form_fields: [uenIdentity],
    }
    expect(
      isSubmitterIdCollected({ ...mrfForm, workflow: [{ edit: ['uen'] }] }),
    ).toBe(true)
    expect(
      isSubmitterIdCollected({ ...mrfForm, workflow: [{ edit: [] }] }),
    ).toBe(false)
  })
})

describe('canConvertSubmitterIdCollection', () => {
  it('needs the toggle on and a login', () => {
    expect(
      canConvertSubmitterIdCollection({
        ...myInfoStorageForm,
        isSubmitterIdCollectionEnabled: true,
      }),
    ).toBe(true)
    expect(canConvertSubmitterIdCollection(myInfoStorageForm)).toBe(false)
    expect(
      canConvertSubmitterIdCollection({
        ...myInfoStorageForm,
        isSubmitterIdCollectionEnabled: true,
        authType: FormAuthType.NIL,
      }),
    ).toBe(false)
  })
})

describe('getLoginIdentityConfigErrors', () => {
  it('accepts forms without login identity fields', () => {
    expect(
      getLoginIdentityConfigErrors({
        ...myInfoStorageForm,
        isSubmitterIdCollectionEnabled: true,
        form_fields: [typedNric],
      }),
    ).toEqual([])
  })

  it('accepts sources that match the login', () => {
    expect(
      getLoginIdentityConfigErrors({
        ...myInfoStorageForm,
        form_fields: [nricIdentity, typedNric],
      }),
    ).toEqual([])
    expect(
      getLoginIdentityConfigErrors({
        ...myInfoStorageForm,
        authType: FormAuthType.CP,
        form_fields: [uenIdentity, uidIdentity],
      }),
    ).toEqual([])
  })

  it('rejects a source the login does not provide', () => {
    expect(
      getLoginIdentityConfigErrors({
        ...myInfoStorageForm,
        authType: FormAuthType.CP,
        form_fields: [nricIdentity],
      }),
    ).toEqual(['NRIC/FIN fields need Singpass login.'])
    expect(
      getLoginIdentityConfigErrors({
        ...myInfoStorageForm,
        form_fields: [uenIdentity],
      }),
    ).toEqual(['UEN fields need Corppass login.'])
  })

  it('rejects the legacy toggle alongside a login identity field', () => {
    expect(
      getLoginIdentityConfigErrors({
        ...myInfoStorageForm,
        isSubmitterIdCollectionEnabled: true,
        form_fields: [nricIdentity],
      }),
    ).toEqual([
      'NRIC/FIN/UEN login fields and the "Collect NRIC/FIN/UENs" setting cannot both be used. Convert the setting, or remove the fields.',
    ])
  })

  it('rejects a Corppass UID field that is also a MyInfo field', () => {
    expect(
      getLoginIdentityConfigErrors({
        ...myInfoStorageForm,
        authType: FormAuthType.CP,
        form_fields: [
          { ...uidIdentity, myInfo: { attr: MyInfoAttribute.Name } },
        ],
      }),
    ).toEqual(["NRIC/FIN fields can't also be MyInfo fields."])
  })

  it('accepts repeated identity fields, like MyInfo fields', () => {
    expect(
      getLoginIdentityConfigErrors({
        ...myInfoStorageForm,
        authType: FormAuthType.CP,
        form_fields: [uidIdentity, { ...uidIdentity, _id: 'uid2' }],
      }),
    ).toEqual([])
  })

  describe('multi-respondent forms', () => {
    const mrfForm = {
      ...myInfoStorageForm,
      responseMode: FormResponseMode.Multirespondent,
      form_fields: [nricIdentity],
    }

    it('checks a later step identity field against that step login', () => {
      expect(
        getLoginIdentityConfigErrors({
          ...mrfForm,
          workflow: [{ edit: [] }, { edit: ['nric'] }],
        }),
      ).toEqual(['NRIC/FIN fields need Singpass login.'])
      expect(
        getLoginIdentityConfigErrors({
          ...mrfForm,
          authType: FormAuthType.NIL,
          workflow: [
            { edit: [] },
            { edit: ['nric'], auth: { auth_type: FormAuthType.MyInfo } },
          ],
        }),
      ).toEqual([])
      expect(
        getLoginIdentityConfigErrors({
          ...mrfForm,
          form_fields: [uenIdentity],
          workflow: [
            { edit: [] },
            { edit: ['uen'], auth: { auth_type: FormAuthType.MyInfo } },
          ],
        }),
      ).toEqual(['UEN fields need Corppass login.'])
    })

    it('accepts a field that no step owns', () => {
      expect(
        getLoginIdentityConfigErrors({ ...mrfForm, workflow: [{ edit: [] }] }),
      ).toEqual([])
    })
  })
})
