import { BasicField } from '../../types/field'
import { validateResponses } from '../validate-responses'

/**
 * `validateResponses` is the last step of the storage-mode V1 producer, and it
 * is what fixes an entry's delivered byte shape: `.parse` strips unknown keys,
 * rejects missing ones, and rebuilds the object from the schema's own key
 * order.
 *
 * Assertions here are on `JSON.stringify`, not `Object.keys`, because a
 * verifiable field carries `signature: undefined` as a *present* key that
 * `JSON.stringify` drops — the two disagree, and the delivered bytes are the
 * JSON.
 */
describe('validateResponses', () => {
  const shortTextEntry = {
    _id: '000000000000000000000001',
    question: 'Your name',
    answer: 'Ada',
    fieldType: BasicField.ShortText,
  }

  it('rejects a payload that is not an array', () => {
    expect(() => validateResponses({})).toThrow('Input submission is malformed')
  })

  it('rejects an entry that is not shaped like a response', () => {
    expect(() => validateResponses([{ answer: 'Ada' }])).toThrow(
      'Input shape not a response',
    )
  })

  it('rejects an unknown fieldType', () => {
    expect(() =>
      validateResponses([{ ...shortTextEntry, fieldType: 'not_a_field_type' }]),
    ).toThrow('Invalid fieldType provided for response validation')
  })

  it('strips a key the schema does not declare', () => {
    // `isVisible` is set by the frontend's hidden-input filter and must never
    // reach the wire. `myInfo` is *not* a good example here: the MyInfo-able
    // schemas declare it, so it survives.
    const [entry] = validateResponses([{ ...shortTextEntry, isVisible: true }])

    expect(JSON.stringify(entry)).toBe(
      '{"_id":"000000000000000000000001","question":"Your name","answer":"Ada","fieldType":"textfield"}',
    )
  })

  it('throws when a required key is missing', () => {
    const withoutAnswer: Record<string, unknown> = { ...shortTextEntry }
    delete withoutAnswer.answer

    expect(() => validateResponses([withoutAnswer])).toThrow()
  })

  it("emits the schema's key order, not the order the input was built in", () => {
    const [entry] = validateResponses([
      {
        fieldType: BasicField.ShortText,
        answer: 'Ada',
        question: 'Your name',
        _id: '000000000000000000000001',
      },
    ])

    expect(JSON.stringify(entry)).toBe(
      '{"_id":"000000000000000000000001","question":"Your name","answer":"Ada","fieldType":"textfield"}',
    )
  })

  it('drops an absent verifiable signature from the delivered bytes while keeping the key present', () => {
    const [entry] = validateResponses([
      {
        _id: '000000000000000000000002',
        question: 'Your email',
        answer: 'ada@example.com',
        signature: undefined,
        fieldType: BasicField.Email,
      },
    ])

    expect('signature' in entry).toBe(true)
    expect(JSON.stringify(entry)).toBe(
      '{"_id":"000000000000000000000002","question":"Your email","answer":"ada@example.com","fieldType":"email"}',
    )
  })

  it('validates every entry in the array', () => {
    expect(
      validateResponses([
        shortTextEntry,
        {
          _id: '000000000000000000000003',
          question: 'A section',
          answer: '',
          isHeader: true,
          fieldType: BasicField.Section,
        },
      ]),
    ).toHaveLength(2)
  })
})
