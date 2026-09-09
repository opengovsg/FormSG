import { CLIENT_CHECKBOX_OTHERS_INPUT_VALUE } from '../../constants/form'
import { BasicField } from '../../types/field'
import {
  computeAddressAnswerValue,
  computeAttachmentAnswerValue,
  computeCheckboxAnswerValue,
  computeChildrenAnswerValue,
  computeDateAnswerValue,
  computeRadioAnswerValue,
  computeSectionAnswerValue,
  computeSignatureAnswerValue,
  computeSingleAnswerValue,
  computeTableAnswerValue,
  computeVerifiableAnswerValue,
  computeYesNoAnswerValue,
  throwUnsupportedFieldType,
} from '../response-value-rules'

/**
 * The per-field-type value rules that decide what a storage-mode V1 entry's
 * answer keys contain.
 *
 * The expected values below are the bytes measured on the pre-hoist frontend
 * `transformInputsToOutputs` (see #9974's baseline table), so this suite can
 * disagree with the implementation rather than restating it.
 *
 * Assertions are on `JSON.stringify`, never `Object.keys`: a verifiable field
 * carries `signature: undefined` as a *present* key that `JSON.stringify`
 * drops, and the delivered bytes are the JSON.
 */

const TABLE_COLUMNS = [
  { _id: 'col-a', title: 'Col A' },
  { _id: 'col-b', title: 'Col B' },
]

type ValueRuleCase = {
  /** Answered input, and the bytes the rule produced for it before the hoist. */
  answered: () => unknown
  answeredJson: string
  /** The same rule with nothing filled in. */
  unanswered: () => unknown
  unansweredJson: string
}

/**
 * Keyed off `BasicField` on purpose: adding a field type to the enum breaks
 * compilation here until someone classifies it — either with a case, or with
 * `null` to say "this type emits no response entry at all".
 */
const VALUE_RULE_CASES: Record<BasicField, ValueRuleCase | null> = {
  [BasicField.Statement]: null,
  [BasicField.Image]: null,

  [BasicField.Section]: {
    answered: () => computeSectionAnswerValue(),
    answeredJson: '{"answer":"","isHeader":true}',
    unanswered: () => computeSectionAnswerValue(),
    unansweredJson: '{"answer":"","isHeader":true}',
  },

  [BasicField.Email]: {
    answered: () =>
      computeVerifiableAnswerValue({
        value: 'ada@example.com',
        signature: 'a-signature',
      }),
    answeredJson: '{"answer":"ada@example.com","signature":"a-signature"}',
    unanswered: () => computeVerifiableAnswerValue(undefined),
    unansweredJson: '{"answer":""}',
  },
  [BasicField.Mobile]: {
    answered: () => computeVerifiableAnswerValue({ value: '+6598765432' }),
    answeredJson: '{"answer":"+6598765432"}',
    unanswered: () => computeVerifiableAnswerValue(undefined),
    unansweredJson: '{"answer":""}',
  },

  // Every generic single-answer type is trimmed. The trim is one of the four
  // rules the CSV producer omits today, so it is asserted per type rather than
  // once.
  [BasicField.HomeNo]: {
    answered: () => computeSingleAnswerValue('  +6561234567  '),
    answeredJson: '{"answer":"+6561234567"}',
    unanswered: () => computeSingleAnswerValue(undefined),
    unansweredJson: '{"answer":""}',
  },
  [BasicField.Number]: {
    answered: () => computeSingleAnswerValue('  42  '),
    answeredJson: '{"answer":"42"}',
    unanswered: () => computeSingleAnswerValue(undefined),
    unansweredJson: '{"answer":""}',
  },
  [BasicField.Decimal]: {
    answered: () => computeSingleAnswerValue('  4.2  '),
    answeredJson: '{"answer":"4.2"}',
    unanswered: () => computeSingleAnswerValue(undefined),
    unansweredJson: '{"answer":""}',
  },
  [BasicField.ShortText]: {
    answered: () => computeSingleAnswerValue('  padded value  '),
    answeredJson: '{"answer":"padded value"}',
    unanswered: () => computeSingleAnswerValue(undefined),
    unansweredJson: '{"answer":""}',
  },
  [BasicField.LongText]: {
    answered: () => computeSingleAnswerValue('  padded\nparagraph  '),
    answeredJson: '{"answer":"padded\\nparagraph"}',
    unanswered: () => computeSingleAnswerValue(undefined),
    unansweredJson: '{"answer":""}',
  },
  [BasicField.Dropdown]: {
    answered: () => computeSingleAnswerValue('  Option A  '),
    answeredJson: '{"answer":"Option A"}',
    unanswered: () => computeSingleAnswerValue(undefined),
    unansweredJson: '{"answer":""}',
  },
  [BasicField.CountryRegion]: {
    answered: () => computeSingleAnswerValue('  Singapore  '),
    answeredJson: '{"answer":"Singapore"}',
    unanswered: () => computeSingleAnswerValue(undefined),
    unansweredJson: '{"answer":""}',
  },
  [BasicField.Rating]: {
    answered: () => computeSingleAnswerValue('  5  '),
    answeredJson: '{"answer":"5"}',
    unanswered: () => computeSingleAnswerValue(undefined),
    unansweredJson: '{"answer":""}',
  },
  [BasicField.Nric]: {
    answered: () => computeSingleAnswerValue('  S1234567D  '),
    answeredJson: '{"answer":"S1234567D"}',
    unanswered: () => computeSingleAnswerValue(undefined),
    unansweredJson: '{"answer":""}',
  },
  [BasicField.Uen]: {
    answered: () => computeSingleAnswerValue('  T09LL0001B  '),
    answeredJson: '{"answer":"T09LL0001B"}',
    unanswered: () => computeSingleAnswerValue(undefined),
    unansweredJson: '{"answer":""}',
  },

  // Not trimmed, and reformatted from the DATE_PARSE_FORMAT the input carries.
  [BasicField.Date]: {
    answered: () => computeDateAnswerValue('09/09/2026'),
    answeredJson: '{"answer":"09 Sep 2026"}',
    unanswered: () => computeDateAnswerValue(undefined),
    unansweredJson: '{"answer":""}',
  },

  // Not trimmed either — Yes/No is a closed set.
  [BasicField.YesNo]: {
    answered: () => computeYesNoAnswerValue('Yes'),
    answeredJson: '{"answer":"Yes"}',
    unanswered: () => computeYesNoAnswerValue(undefined),
    unansweredJson: '{"answer":""}',
  },

  [BasicField.Attachment]: {
    answered: () => computeAttachmentAnswerValue('my document.pdf'),
    answeredJson: '{"answer":"my document.pdf"}',
    unanswered: () => computeAttachmentAnswerValue(undefined),
    unansweredJson: '{"answer":""}',
  },

  // Others moves to the END of the array, not into the slot it was selected in.
  [BasicField.Checkbox]: {
    answered: () =>
      computeCheckboxAnswerValue({
        value: ['a', CLIENT_CHECKBOX_OTHERS_INPUT_VALUE, 'b'],
        othersInput: 'my other',
      }),
    answeredJson: '{"answerArray":["a","b","Others: my other"]}',
    unanswered: () => computeCheckboxAnswerValue(undefined),
    unansweredJson: '{"answerArray":[]}',
  },

  [BasicField.Radio]: {
    answered: () => computeRadioAnswerValue({ value: 'Option A' }),
    answeredJson: '{"answer":"Option A"}',
    unanswered: () => computeRadioAnswerValue(undefined),
    unansweredJson: '{"answer":""}',
  },

  // Composes the column titles into the question, trims each cell, and
  // synthesises `minimumRows` blank rows when there is no input at all.
  [BasicField.Table]: {
    answered: () =>
      computeTableAnswerValue({
        title: 'Table',
        columns: TABLE_COLUMNS,
        minimumRows: 2,
        input: [{ 'col-a': ' cell a ', 'col-b': 'cell b' }],
      }),
    answeredJson:
      '{"answerArray":[["cell a","cell b"]],"question":"Table (Col A, Col B)"}',
    unanswered: () =>
      computeTableAnswerValue({
        title: 'Table',
        columns: TABLE_COLUMNS,
        minimumRows: 2,
      }),
    unansweredJson:
      '{"answerArray":[["",""],["",""]],"question":"Table (Col A, Col B)"}',
  },

  [BasicField.Children]: {
    answered: () =>
      computeChildrenAnswerValue({
        numberOfSubFields: 2,
        input: { child: [['Kid One', '01/01/2015']] },
      }),
    answeredJson: '{"answerArray":[["Kid One","01/01/2015"]]}',
    unanswered: () => computeChildrenAnswerValue({ numberOfSubFields: 2 }),
    unansweredJson: '{"answerArray":[["",""]]}',
  },

  // Postal code moves to the end of the array.
  [BasicField.Address]: {
    answered: () =>
      computeAddressAnswerValue({
        addressSubFields: {
          postalCode: '123456',
          blockNumber: '10',
          streetName: 'Main Street',
          buildingName: 'The Building',
          levelNumber: '05',
          unitNumber: '09',
        },
      }),
    answeredJson:
      '{"answerArray":["10","Main Street","The Building","05","09","123456"]}',
    unanswered: () => computeAddressAnswerValue(undefined),
    unansweredJson: '{"answerArray":[]}',
  },

  [BasicField.Signature]: {
    answered: () =>
      computeSignatureAnswerValue({ type: 'draw', value: [[[1, 2, 0.5]]] }),
    answeredJson: '{"answerArray":["draw","[[[1,2,0.5]]]"]}',
    unanswered: () => computeSignatureAnswerValue(undefined),
    unansweredJson: '{"answerArray":["",""]}',
  },
}

describe('response value rules', () => {
  const classified = Object.entries(VALUE_RULE_CASES).filter(
    (entry): entry is [BasicField, ValueRuleCase] => entry[1] !== null,
  )

  describe.each(classified)('%s', (_fieldType, ruleCase) => {
    it('produces the pre-hoist bytes when answered', () => {
      expect(JSON.stringify(ruleCase.answered())).toBe(ruleCase.answeredJson)
    })

    it('produces the pre-hoist bytes when unanswered', () => {
      expect(JSON.stringify(ruleCase.unanswered())).toBe(
        ruleCase.unansweredJson,
      )
    })
  })

  it('classifies every field type', () => {
    expect(Object.keys(VALUE_RULE_CASES).sort()).toEqual(
      Object.values(BasicField).sort(),
    )
  })

  it('keeps an absent verifiable signature as a present key', () => {
    expect('signature' in computeVerifiableAnswerValue(undefined)).toBe(true)
  })

  describe('checkbox', () => {
    it('leaves a selection without Others in its original order', () => {
      expect(computeCheckboxAnswerValue({ value: ['b', 'a'] })).toEqual({
        answerArray: ['b', 'a'],
      })
    })

    it('treats an untouched checkbox group as unanswered', () => {
      // `false` is a react-hook-form artifact of a group that never fired a
      // change event.
      expect(
        computeCheckboxAnswerValue({ value: false, othersInput: 'ignored' }),
      ).toEqual({ answerArray: [] })
    })
  })

  describe('radio', () => {
    it('prefixes the Others free-text answer', () => {
      expect(
        computeRadioAnswerValue({
          value: '!!FORMSG_INTERNAL_RADIO_OTHERS_VALUE!!',
          othersInput: 'my other',
        }),
      ).toEqual({ answer: 'Others: my other' })
    })

    it('accepts the V3 Others-only response shape', () => {
      expect(computeRadioAnswerValue({ othersInput: 'from v3' })).toEqual({
        answer: 'from v3',
      })
    })
  })

  describe('table', () => {
    it('synthesises no rows when minimumRows is absent', () => {
      expect(
        computeTableAnswerValue({ title: 'Table', columns: TABLE_COLUMNS }),
      ).toEqual({ answerArray: [], question: 'Table (Col A, Col B)' })
    })

    it("treats the form builder's empty-string minimumRows as no minimum", () => {
      expect(
        computeTableAnswerValue({
          title: 'Table',
          columns: TABLE_COLUMNS,
          minimumRows: '',
        }),
      ).toEqual({ answerArray: [], question: 'Table (Col A, Col B)' })
    })

    it('orders cells by the column order, not the input key order', () => {
      expect(
        computeTableAnswerValue({
          title: 'Table',
          columns: TABLE_COLUMNS,
          input: [{ 'col-b': 'b', 'col-a': 'a' }],
        }).answerArray,
      ).toEqual([['a', 'b']])
    })
  })

  describe('throwUnsupportedFieldType', () => {
    it('throws so an unclassified field type cannot be silently dropped', () => {
      expect(() =>
        throwUnsupportedFieldType({ fieldType: 'not_a_field_type' } as never),
      ).toThrow('Unsupported field type: [object Object]')
    })
  })
})
