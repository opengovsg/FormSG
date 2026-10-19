import {
  BasicField,
  CorppassAttribute,
  FormFieldDto,
  MyInfoAttribute,
} from 'formsg-shared/types'

import { getFieldColumnHeader, getVerifiedQuestionLabel } from './questionLabel'

const field = (overrides: Record<string, unknown>) =>
  ({
    _id: 'field-id',
    fieldType: BasicField.ShortText,
    title: 'Name',
    ...overrides,
  }) as FormFieldDto

describe('getVerifiedQuestionLabel', () => {
  it('marks a verified question', () => {
    expect(getVerifiedQuestionLabel('Email', true, 'Verified')).toBe(
      '[Verified] Email',
    )
  })

  it('leaves an unverified question as is', () => {
    expect(getVerifiedQuestionLabel('Email', false, 'Verified')).toBe('Email')
  })
})

describe('getFieldColumnHeader', () => {
  it('uses the title of an ordinary field', () => {
    expect(getFieldColumnHeader(field({}), 'Verified')).toBe('Name')
  })

  it('prefixes a MyInfo field as the drawer does', () => {
    expect(
      getFieldColumnHeader(
        field({ myInfo: { attr: MyInfoAttribute.Name } }),
        'Verified',
      ),
    ).toBe('[Myinfo] Name')
  })

  it('prefixes the MyInfo NRIC/FIN login identity field', () => {
    expect(
      getFieldColumnHeader(
        field({
          fieldType: BasicField.Nric,
          title: 'NRIC/FIN',
          myInfo: { attr: MyInfoAttribute.UinFin },
        }),
        'Verified',
      ),
    ).toBe('[Myinfo] NRIC/FIN')
  })

  it('prefixes a Corppass login identity field as Myinfo', () => {
    expect(
      getFieldColumnHeader(
        field({
          fieldType: BasicField.Uen,
          title: 'UEN',
          corppass: { attr: CorppassAttribute.Uen },
        }),
        'Verified',
      ),
    ).toBe('[Myinfo] UEN')
  })

  it('marks a verifiable field', () => {
    expect(
      getFieldColumnHeader(
        field({
          fieldType: BasicField.Email,
          title: 'Email',
          isVerifiable: true,
        }),
        'Verified',
      ),
    ).toBe('[Verified] Email')
  })

  it('does not mark a field that is not verifiable', () => {
    expect(
      getFieldColumnHeader(
        field({
          fieldType: BasicField.Email,
          title: 'Email',
          isVerifiable: false,
        }),
        'Verified',
      ),
    ).toBe('Email')
  })

  it('puts the verified mark before the MyInfo prefix, as the drawer does', () => {
    expect(
      getFieldColumnHeader(
        field({
          fieldType: BasicField.Mobile,
          title: 'Mobile number',
          isVerifiable: true,
          myInfo: { attr: MyInfoAttribute.MobileNo },
        }),
        'Verified',
      ),
    ).toBe('[Verified] [Myinfo] Mobile number')
  })
})
