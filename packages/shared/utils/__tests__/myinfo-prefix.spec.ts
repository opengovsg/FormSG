import { BasicField, FormFieldDto, MyInfoAttribute } from '../../types'
import { FlattenedV1Response } from '../flatten-v4-to-v1'
import {
  applyMyInfoPrefix,
  applyMyInfoPrefixToFormFields,
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

// Simulate non-primitive IDs without coupling these tests to Mongoose.
const objectIdShaped = (hex: string) =>
  ({ toString: () => hex, toHexString: () => hex }) as unknown as string

const stringWrapper = (hex: string) => Object(hex) as string

describe('shouldPrefixMyInfoQuestion', () => {
  it('returns true for a read-only MyInfo field', () => {
    expect(
      shouldPrefixMyInfoQuestion(myInfoEntry(), new Set([MYINFO_ID])),
    ).toBe(true)
  })

  it('returns false for a MyInfo field that is not read-only', () => {
    expect(shouldPrefixMyInfoQuestion(myInfoEntry(), new Set())).toBe(false)
  })

  it('returns false for a non-MyInfo field even when its ID is marked read-only', () => {
    expect(shouldPrefixMyInfoQuestion(plainEntry(), new Set([PLAIN_ID]))).toBe(
      false,
    )
  })

  it('matches an ObjectId field ID to its read-only string ID', () => {
    // findEncryptedSubmissionById does not lean(); nested form_fields keep
    // ObjectId _ids, while myInfoReadOnlyFields is stored as [String].
    expect(
      shouldPrefixMyInfoQuestion(
        { ...myInfoEntry(), _id: objectIdShaped(MYINFO_ID) },
        new Set([MYINFO_ID]),
      ),
    ).toBe(true)
  })
})

describe('applyMyInfoPrefix', () => {
  it('adds [Myinfo] to read-only MyInfo questions and leaves other questions unchanged', () => {
    const result = applyMyInfoPrefix(
      [myInfoEntry(), plainEntry()],
      [MYINFO_ID, PLAIN_ID],
    )
    expect(result.map((entry) => entry.question)).toEqual([
      '[Myinfo] Name',
      'Favourite colour',
    ])
  })

  it('leaves questions unchanged when no fields are read-only', () => {
    const input = [myInfoEntry(), plainEntry()]
    expect(JSON.stringify(applyMyInfoPrefix(input, []))).toBe(
      JSON.stringify(input),
    )
  })

  it('does not change the original responses when adding a prefix', () => {
    const input = [myInfoEntry()]
    const before = JSON.stringify(input)
    applyMyInfoPrefix(input, [MYINFO_ID])
    expect(JSON.stringify(input)).toBe(before)
  })

  it('preserves response property order for webhook serialization', () => {
    const [prefixed] = applyMyInfoPrefix([myInfoEntry()], [MYINFO_ID])
    expect(Object.keys(prefixed)).toEqual(Object.keys(myInfoEntry()))
  })

  it('prefixes questions when read-only IDs are supplied as a Set', () => {
    const [prefixed] = applyMyInfoPrefix([myInfoEntry()], new Set([MYINFO_ID]))
    expect(prefixed.question).toBe('[Myinfo] Name')
  })

  it('matches a string field ID to an ObjectId in the read-only array', () => {
    const [prefixed] = applyMyInfoPrefix(
      [myInfoEntry()],
      [objectIdShaped(MYINFO_ID)],
    )
    expect(prefixed.question).toBe('[Myinfo] Name')
  })

  it('matches a string field ID to an ObjectId in the read-only Set', () => {
    const [prefixed] = applyMyInfoPrefix(
      [myInfoEntry()],
      new Set([objectIdShaped(MYINFO_ID)]),
    )
    expect(prefixed.question).toBe('[Myinfo] Name')
  })

  it('matches a string field ID to a boxed String in the read-only Set', () => {
    const [prefixed] = applyMyInfoPrefix(
      [myInfoEntry()],
      new Set([stringWrapper(MYINFO_ID)]),
    )
    expect(prefixed.question).toBe('[Myinfo] Name')
  })
})

describe('applyMyInfoPrefixToFormFields', () => {
  it('adds [Myinfo] to read-only MyInfo titles and leaves other titles unchanged', () => {
    const result = applyMyInfoPrefixToFormFields(
      [myInfoField(), plainField()],
      [MYINFO_ID, PLAIN_ID],
    )
    expect(result.map((field) => field.title)).toEqual([
      '[Myinfo] Name',
      'Favourite colour',
    ])
  })

  it('leaves titles unchanged when no fields are read-only', () => {
    const input = [myInfoField(), plainField()]
    expect(JSON.stringify(applyMyInfoPrefixToFormFields(input, []))).toBe(
      JSON.stringify(input),
    )
  })

  it('does not change the original form fields when adding a prefix', () => {
    const input = [myInfoField()]
    const before = JSON.stringify(input)
    applyMyInfoPrefixToFormFields(input, [MYINFO_ID])
    expect(JSON.stringify(input)).toBe(before)
  })

  it('prefixes titles when the read-only Set contains ObjectIds', () => {
    const [field] = applyMyInfoPrefixToFormFields(
      [myInfoField()],
      new Set([objectIdShaped(MYINFO_ID)]),
    )
    expect(field.title).toBe('[Myinfo] Name')
  })
})
