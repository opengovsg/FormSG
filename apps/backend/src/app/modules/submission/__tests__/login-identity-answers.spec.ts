import {
  BasicField,
  CorppassAttribute,
  MyInfoAttribute,
} from 'formsg-shared/types'

import { MyInfoHashDidNotMatchError } from '../../myinfo/myinfo.errors'
import {
  checkLoginIdentityAnswers,
  prefixLoginIdentityQuestions,
} from '../login-identity-answers'

jest.mock('../../spcp/spcp.oidc.service/spcp.oidc.service.sp')
jest.mock('../../spcp/spcp.oidc.service/spcp.oidc.service.cp')

const nricField = {
  _id: 'nric',
  fieldType: BasicField.Nric,
  myInfo: { attr: MyInfoAttribute.UinFin },
}
const uidField = {
  _id: 'uid',
  fieldType: BasicField.Nric,
  corppass: { attr: CorppassAttribute.Uid },
}
const uenField = {
  _id: 'uen',
  fieldType: BasicField.Uen,
  corppass: { attr: CorppassAttribute.Uen },
}
const typedNricField = { _id: 'typed', fieldType: BasicField.Nric }

describe('checkLoginIdentityAnswers', () => {
  const answersOf =
    (answers: Record<string, unknown>) =>
    (fieldId: string): unknown =>
      answers[fieldId]

  it('returns the identity fields whose answers match the login', () => {
    const result = checkLoginIdentityAnswers(
      [uidField, uenField, typedNricField],
      answersOf({ uid: 'foreign12345', uen: '201912345A', typed: 'S9999999Z' }),
      {
        [CorppassAttribute.Uid]: 'FOREIGN12345',
        [CorppassAttribute.Uen]: '201912345A',
      },
    )
    expect(result._unsafeUnwrap()).toEqual(['uid', 'uen'])
  })

  it('rejects an answer that differs from the login', () => {
    const result = checkLoginIdentityAnswers(
      [nricField],
      answersOf({ nric: 'S0000002G' }),
      { [MyInfoAttribute.UinFin]: 'S0000001I' },
    )
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(MyInfoHashDidNotMatchError)
  })

  it('rejects an answer when the login has no such identity', () => {
    const result = checkLoginIdentityAnswers(
      [uidField],
      answersOf({ uid: 'FOREIGN12345' }),
      {},
    )
    expect(result.isErr()).toBe(true)
  })

  it('leaves empty answers to required-field validation', () => {
    const result = checkLoginIdentityAnswers(
      [nricField, uenField],
      answersOf({ nric: '' }),
      {},
    )
    expect(result._unsafeUnwrap()).toEqual([])
  })
})

describe('prefixLoginIdentityQuestions', () => {
  it('marks verified Singpass and Corppass identity answers [Myinfo]', () => {
    const responses = [
      { _id: 'nric', question: 'NRIC/FIN' },
      { _id: 'uid', question: 'NRIC/FIN' },
      { _id: 'uen', question: 'UEN' },
      { _id: 'typed', question: 'Your NRIC' },
    ]
    prefixLoginIdentityQuestions(
      responses,
      [nricField, uidField, uenField, typedNricField],
      ['nric', 'uid', 'uen'],
    )
    expect(responses.map(({ question }) => question)).toEqual([
      '[Myinfo] NRIC/FIN',
      '[Myinfo] NRIC/FIN',
      '[Myinfo] UEN',
      'Your NRIC',
    ])
  })

  it('leaves unverified answers unmarked', () => {
    const responses = [{ _id: 'uen', question: 'UEN' }]
    prefixLoginIdentityQuestions(responses, [uenField], [])
    expect(responses[0].question).toBe('UEN')
  })
})
