import { BasicField, FormFieldDto, MyInfoAttribute } from '../../types'
import { FlattenedV1Response } from '../flatten-v4-to-v1'
import {
  applyMyInfoPrefix,
  applyMyInfoPrefixToFormFields,
  MYINFO_QUESTION_PREFIX,
  shouldPrefixMyInfoQuestion,
} from '../myinfo-prefix'

const MYINFO_ID = 'aaaaaaaaaaaaaaaaaaaaaaaa'
const PLAIN_ID = 'bbbbbbbbbbbbbbbbbbbbbbbb'

const myInfoEntry = (): FlattenedV1Response =>
  ({
    _id: MYINFO_ID,
    fieldType: BasicField.ShortText,
    question: 'Name',
    answer: 'PHUA CHU KANG',
    myInfo: { attr: MyInfoAttribute.Name },
  }) as unknown as FlattenedV1Response

const plainEntry = (): FlattenedV1Response =>
  ({
    _id: PLAIN_ID,
    fieldType: BasicField.ShortText,
    question: 'Favourite colour',
    answer: 'blue',
  }) as unknown as FlattenedV1Response

const myInfoField = (): FormFieldDto =>
  ({
    _id: MYINFO_ID,
    fieldType: BasicField.ShortText,
    title: 'Name',
    myInfo: { attr: MyInfoAttribute.Name },
  }) as unknown as FormFieldDto

const plainField = (): FormFieldDto =>
  ({
    _id: PLAIN_ID,
    fieldType: BasicField.ShortText,
    title: 'Favourite colour',
  }) as unknown as FormFieldDto

describe('MYINFO_QUESTION_PREFIX', () => {
  it('carries the trailing space that is part of the literal', () => {
    expect(MYINFO_QUESTION_PREFIX).toBe('[Myinfo] ')
  })
})

describe('shouldPrefixMyInfoQuestion', () => {
  it('is true only when the field has an attr and is in the read-only set', () => {
    expect(
      shouldPrefixMyInfoQuestion(myInfoEntry(), new Set([MYINFO_ID])),
    ).toBe(true)
  })

  it('is false for a MyInfo field outside the read-only set', () => {
    expect(shouldPrefixMyInfoQuestion(myInfoEntry(), new Set())).toBe(false)
  })

  it('is false for a non-MyInfo field even if its id is in the set', () => {
    expect(shouldPrefixMyInfoQuestion(plainEntry(), new Set([PLAIN_ID]))).toBe(
      false,
    )
  })
})

describe('applyMyInfoPrefix', () => {
  it('prefixes only the read-only MyInfo entries', () => {
    const result = applyMyInfoPrefix(
      [myInfoEntry(), plainEntry()],
      [MYINFO_ID, PLAIN_ID],
    )
    expect(result.map((entry) => entry.question)).toEqual([
      '[Myinfo] Name',
      'Favourite colour',
    ])
  })

  it('prefixes nothing when the read-only set is empty', () => {
    const input = [myInfoEntry(), plainEntry()]
    expect(JSON.stringify(applyMyInfoPrefix(input, []))).toBe(
      JSON.stringify(input),
    )
  })

  it('does not mutate its input', () => {
    const input = [myInfoEntry()]
    const before = JSON.stringify(input)
    applyMyInfoPrefix(input, [MYINFO_ID])
    expect(JSON.stringify(input)).toBe(before)
  })

  it('preserves key order, which byte parity depends on', () => {
    const [prefixed] = applyMyInfoPrefix([myInfoEntry()], [MYINFO_ID])
    expect(Object.keys(prefixed)).toEqual(Object.keys(myInfoEntry()))
  })

  it('accepts a Set as well as an array of ids', () => {
    const [prefixed] = applyMyInfoPrefix([myInfoEntry()], new Set([MYINFO_ID]))
    expect(prefixed.question).toBe('[Myinfo] Name')
  })
})

describe('applyMyInfoPrefixToFormFields', () => {
  it('prefixes the title of only the read-only MyInfo fields', () => {
    const result = applyMyInfoPrefixToFormFields(
      [myInfoField(), plainField()],
      [MYINFO_ID, PLAIN_ID],
    )
    expect(result.map((field) => field.title)).toEqual([
      '[Myinfo] Name',
      'Favourite colour',
    ])
  })

  it('prefixes nothing when the read-only set is empty', () => {
    const input = [myInfoField(), plainField()]
    expect(JSON.stringify(applyMyInfoPrefixToFormFields(input, []))).toBe(
      JSON.stringify(input),
    )
  })

  it('does not mutate its input', () => {
    const input = [myInfoField()]
    const before = JSON.stringify(input)
    applyMyInfoPrefixToFormFields(input, [MYINFO_ID])
    expect(JSON.stringify(input)).toBe(before)
  })

  it('applies the same rule as the wire sibling, over the same ids', () => {
    const readOnly = [MYINFO_ID]
    const [wire] = applyMyInfoPrefix([myInfoEntry()], readOnly)
    const [served] = applyMyInfoPrefixToFormFields([myInfoField()], readOnly)
    expect(wire.question).toBe(served.title)
  })
})
