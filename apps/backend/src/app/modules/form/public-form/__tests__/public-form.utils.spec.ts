import {
  BasicField,
  CorppassAttribute,
  FormAuthType,
  FormFieldDto,
  MyInfoAttribute,
} from 'formsg-shared/types'

import {
  getLoginIdentityValues,
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
})
