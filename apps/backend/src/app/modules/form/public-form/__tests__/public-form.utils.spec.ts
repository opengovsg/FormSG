import {
  BasicField,
  CorppassAttribute,
  FormAuthType,
  FormFieldDto,
  FormResponseMode,
  MyInfoAttribute,
} from 'formsg-shared/types'

import { IPopulatedForm } from 'src/types'

import {
  getLoginIdentityValues,
  getStepOneMyInfoAttrs,
  getStepOneMyInfoFields,
  mergePrefilledFields,
  prefillLoginIdentityFields,
} from '../public-form.utils'

const field = (overrides: Record<string, unknown>) =>
  ({
    _id: 'field',
    title: 'Question',
    description: '',
    required: true,
    disabled: false,
    ...overrides,
  }) as unknown as FormFieldDto

describe('public-form.utils', () => {
  describe('getLoginIdentityValues', () => {
    it('provides NRIC/FIN for MyInfo logins only', () => {
      expect(
        getLoginIdentityValues(FormAuthType.MyInfo, { userName: 'S1234567D' }),
      ).toEqual({ [MyInfoAttribute.UinFin]: 'S1234567D' })
      expect(
        getLoginIdentityValues(FormAuthType.SP, { userName: 'S1234567D' }),
      ).toEqual({})
    })

    it('provides UEN and UID for Corppass logins', () => {
      expect(
        getLoginIdentityValues(FormAuthType.CP, {
          userName: '201912345Z',
          userInfo: 'S1234567D',
        }),
      ).toEqual({
        [CorppassAttribute.Uen]: '201912345Z',
        [CorppassAttribute.Uid]: 'S1234567D',
      })
    })

    it('provides nothing without a login', () => {
      expect(getLoginIdentityValues(FormAuthType.MyInfo, undefined)).toEqual({})
    })
  })

  describe('prefillLoginIdentityFields', () => {
    it('fills and locks login identity fields only', () => {
      const identityField = field({
        fieldType: BasicField.Uen,
        corppass: { attr: CorppassAttribute.Uen },
      })
      const typedUen = field({ _id: 'typed', fieldType: BasicField.Uen })

      const [filled, untouched] = prefillLoginIdentityFields(
        [identityField, typedUen],
        { [CorppassAttribute.Uen]: '201912345Z' },
      )

      expect(filled).toMatchObject({ fieldValue: '201912345Z', disabled: true })
      expect(untouched).toBe(typedUen)
    })

    it('leaves a field that Step 1 does not own empty', () => {
      const identityField = field({
        fieldType: BasicField.Nric,
        myInfo: { attr: MyInfoAttribute.UinFin },
      })

      const [unowned] = prefillLoginIdentityFields(
        [identityField],
        { [MyInfoAttribute.UinFin]: 'S1234567D' },
        [{ edit: [] }],
      )

      expect(unowned).toBe(identityField)
    })
  })

  describe('mergePrefilledFields', () => {
    it('keeps every field and swaps in the prefilled ones', () => {
      const section = { _id: 'a', fieldType: 'section' }
      const name = { _id: 'b', fieldType: 'textfield' }
      const laterStep = { _id: 'c', fieldType: 'textfield' }
      const prefilledName = { ...name, fieldValue: 'TAN AH KOW' }

      const merged = mergePrefilledFields(
        [section, name, laterStep],
        [prefilledName],
      )

      expect(merged).toEqual([section, prefilledName, laterStep])
    })
  })

  describe('Step 1 Myinfo scope', () => {
    const stepOneField = {
      _id: 'a',
      fieldType: 'textfield',
      myInfo: { attr: MyInfoAttribute.Name },
    }
    const laterField = {
      _id: 'b',
      fieldType: 'textfield',
      myInfo: { attr: MyInfoAttribute.Sex },
    }
    const makeForm = (laterStepAuth?: { auth_type: FormAuthType }) =>
      ({
        responseMode: FormResponseMode.Multirespondent,
        toJSON: () => ({ form_fields: [stepOneField, laterField] }),
        getUniqueMyInfoAttrs: () => [MyInfoAttribute.Name, MyInfoAttribute.Sex],
        workflow: [
          { edit: ['a'] },
          { edit: ['b'], ...(laterStepAuth ? { auth: laterStepAuth } : {}) },
        ],
      }) as unknown as IPopulatedForm

    it('keeps every Myinfo field on Step 1 without a later-step login', () => {
      const form = makeForm()

      expect(getStepOneMyInfoFields(form)).toEqual([stepOneField, laterField])
      expect(getStepOneMyInfoAttrs(form)).toEqual([
        MyInfoAttribute.Name,
        MyInfoAttribute.Sex,
      ])
    })

    it('limits Step 1 to its own fields when a later step logs in', () => {
      const form = makeForm({ auth_type: FormAuthType.MyInfo })

      expect(getStepOneMyInfoFields(form)).toEqual([stepOneField])
      expect(getStepOneMyInfoAttrs(form)).toEqual([MyInfoAttribute.Name])
    })

    it('still requests uinfin for a Step 1 login NRIC/FIN field when a later step logs in', () => {
      const nricField = {
        _id: 'c',
        fieldType: BasicField.Nric,
        myInfo: { attr: MyInfoAttribute.UinFin },
      }
      const form = {
        responseMode: FormResponseMode.Multirespondent,
        toJSON: () => ({ form_fields: [nricField, stepOneField, laterField] }),
        workflow: [
          { edit: ['a', 'c'] },
          { edit: ['b'], auth: { auth_type: FormAuthType.MyInfo } },
        ],
      } as unknown as IPopulatedForm

      // Same list the form-level login requests for these fields
      expect(getStepOneMyInfoAttrs(form)).toEqual([
        MyInfoAttribute.UinFin,
        MyInfoAttribute.Name,
      ])
    })
  })
})
