import { readFileSync } from 'fs'
import { join } from 'path'

import {
  BasicField,
  FormFieldDto,
  LogicConditionState,
  LogicDto,
  LogicType,
  MyInfoAttribute,
} from '../../types'
import { flattenV4ToFormFields } from '../flatten-v4-to-v1'
import { FieldResponsesV4Input } from '../v4-answer'

const FIELD_ID = '000000000000000000000001'

const shortTextField = (
  overrides: Record<string, unknown> = {},
): FormFieldDto =>
  ({
    _id: FIELD_ID,
    fieldType: BasicField.ShortText,
    title: 'the question in the form definition',
    description: '',
    required: true,
    disabled: false,
    ...overrides,
  }) as unknown as FormFieldDto

const shortTextAnswer = (value: string): FieldResponsesV4Input => ({
  [FIELD_ID]: { fieldType: BasicField.ShortText, answer: { value } },
})

describe('question injection', () => {
  it('takes every question from the snapshot when the V4 responses carry none', () => {
    const formFields = [
      shortTextField(),
      shortTextField({ _id: '000000000000000000000002', title: 'second' }),
    ]

    expect(
      flattenV4ToFormFields({
        formLogics: [],
        v4Responses: shortTextAnswer('an answer'),
        formFields,
      }).map((entry) => entry.question),
    ).toEqual(['the question in the form definition', 'second'])
  })

  it('ignores a question carried on the V4 response', () => {
    const v4Responses = {
      [FIELD_ID]: {
        fieldType: BasicField.ShortText,
        answer: { value: 'an answer' },
        question: 'a question the respondent supplied',
      },
    } as unknown as FieldResponsesV4Input

    expect(
      flattenV4ToFormFields({
        formLogics: [],
        v4Responses,
        formFields: [shortTextField()],
      }),
    ).toEqual([
      {
        _id: FIELD_ID,
        question: 'the question in the form definition',
        answer: 'an answer',
        fieldType: BasicField.ShortText,
      },
    ])
  })
})

describe('exhaustiveness', () => {
  it('throws on a Children field rather than emitting a blank entry', () => {
    expect(() =>
      flattenV4ToFormFields({
        formLogics: [],
        v4Responses: {},
        formFields: [
          shortTextField({
            fieldType: BasicField.Children,
            childrenSubFields: [],
          }),
        ],
      }),
    ).toThrow('Unsupported field type: children')
  })

  it('throws on an unknown field type rather than emitting an entry', () => {
    expect(() =>
      flattenV4ToFormFields({
        formLogics: [],
        v4Responses: {},
        formFields: [shortTextField({ fieldType: 'a_field_type_from_2030' })],
      }),
    ).toThrow(
      'Unsupported field type: a_field_type_from_2030 for field id: 000000000000000000000001',
    )
  })

  it('routes its default through the `never` check, so a new BasicField member breaks the build', () => {
    expect(
      readFileSync(join(__dirname, '..', 'flatten-v4-to-v1.ts'), 'utf8'),
    ).toContain('return throwUnsupportedFieldType(field)')
  })
})

describe('entries come from the form definition and nowhere else', () => {
  it('drops a V4 response with no matching form field', () => {
    // Verified SPCP/sgID content is keyed by its title, never by a form field
    // id. It is the caller's job to concatenate it after the flatten.
    const v4Responses = {
      ...shortTextAnswer('an answer'),
      'SingPass Validated NRIC': {
        fieldType: BasicField.Nric,
        answer: { value: 'S1234567D' },
      },
    } as unknown as FieldResponsesV4Input

    expect(
      flattenV4ToFormFields({
        formLogics: [],
        v4Responses,
        formFields: [shortTextField()],
      }).map((entry) => entry._id),
    ).toEqual([FIELD_ID])
  })

  it('emits an empty entry for a field the respondent never answered', () => {
    expect(
      flattenV4ToFormFields({
        formLogics: [],
        v4Responses: {},
        formFields: [shortTextField()],
      }),
    ).toEqual([
      {
        _id: FIELD_ID,
        question: 'the question in the form definition',
        answer: '',
        fieldType: BasicField.ShortText,
      },
    ])
  })

  it('emits no entry at all for Statement and Image, answered or not', () => {
    expect(
      flattenV4ToFormFields({
        formLogics: [],
        v4Responses: {
          [FIELD_ID]: {
            fieldType: BasicField.Statement,
            answer: { value: 'ignored' },
          },
        },
        formFields: [
          shortTextField({ fieldType: BasicField.Statement }),
          shortTextField({
            _id: '000000000000000000000002',
            fieldType: BasicField.Image,
          }),
        ],
      }),
    ).toEqual([])
  })
})

describe('the server-derived keys come from the snapshot', () => {
  it('appends myInfo after fieldType, from the form field', () => {
    const formFields = [
      shortTextField({ myInfo: { attr: MyInfoAttribute.Name } }),
    ]

    // On the JSON, not `Object.keys`: the key *order* is the thing under test.
    expect(
      JSON.stringify(
        flattenV4ToFormFields({
          formLogics: [],
          v4Responses: shortTextAnswer('Alice'),
          formFields,
        }),
      ),
    ).toBe(
      JSON.stringify([
        {
          _id: FIELD_ID,
          question: 'the question in the form definition',
          answer: 'Alice',
          fieldType: BasicField.ShortText,
          myInfo: { attr: MyInfoAttribute.Name },
        },
      ]),
    )
  })

  it('ignores a myInfo carried on the V4 response', () => {
    // The MRF response schema accepts a client-supplied `myInfo: { attr }`.
    const v4Responses = {
      [FIELD_ID]: {
        fieldType: BasicField.ShortText,
        answer: { value: 'Alice' },
        myInfo: { attr: MyInfoAttribute.Name },
      },
    } as unknown as FieldResponsesV4Input

    expect(
      flattenV4ToFormFields({
        formLogics: [],
        v4Responses,
        formFields: [shortTextField()],
      }),
    ).toEqual([
      {
        _id: FIELD_ID,
        question: 'the question in the form definition',
        answer: 'Alice',
        fieldType: BasicField.ShortText,
      },
    ])
  })

  it('appends isUserVerified before myInfo, both from the form field', () => {
    const formFields = [
      shortTextField({
        fieldType: BasicField.Mobile,
        isVerifiable: true,
        myInfo: { attr: MyInfoAttribute.MobileNo },
      }),
    ]
    const v4Responses = {
      [FIELD_ID]: {
        fieldType: BasicField.Mobile,
        answer: { value: '+6591234567', signature: 'a-signature' },
      },
    } as unknown as FieldResponsesV4Input

    expect(
      JSON.stringify(
        flattenV4ToFormFields({ formLogics: [], v4Responses, formFields }),
      ),
    ).toBe(
      JSON.stringify([
        {
          signature: 'a-signature',
          _id: FIELD_ID,
          question: 'the question in the form definition',
          answer: '+6591234567',
          fieldType: BasicField.Mobile,
          isUserVerified: true,
          myInfo: { attr: MyInfoAttribute.MobileNo },
        },
      ]),
    )
  })

  it('never reports a field the snapshot does not mark verifiable', () => {
    expect(
      flattenV4ToFormFields({
        formLogics: [],
        v4Responses: shortTextAnswer('an answer'),
        formFields: [shortTextField({ isVerifiable: false })],
      })[0],
    ).not.toHaveProperty('isUserVerified')
  })
})

const ADDRESS_ID = '000000000000000000000010'
const YESNO_ID = '000000000000000000000011'

const addressField = (): FormFieldDto =>
  ({
    _id: ADDRESS_ID,
    fieldType: BasicField.Address,
    title: 'address question',
    description: '',
    required: false,
    disabled: false,
  }) as unknown as FormFieldDto

const yesNoField = (): FormFieldDto =>
  ({
    _id: YESNO_ID,
    fieldType: BasicField.YesNo,
    title: 'show the address?',
    description: '',
    required: false,
    disabled: false,
  }) as unknown as FormFieldDto

/** Shows the Address only when the Yes/No field answers `Yes`. */
const showAddressWhenYes = (): LogicDto =>
  ({
    _id: '000000000000000000000012',
    logicType: LogicType.ShowFields,
    conditions: [
      { field: YESNO_ID, state: LogicConditionState.Equal, value: 'Yes' },
    ],
    show: [ADDRESS_ID],
  }) as LogicDto

/**
 * RATIONALE: V4 content omits an untouched Address and a logic-hidden one
 * alike. The flatten must reconstruct the storage-mode difference: six empty
 * strings when visible, an empty array when hidden. This suite pins that
 * visibility alone decides between the two; the byte-level check lives in
 * the differential gate.
 */
describe('an Address with no answer in the V4 content', () => {
  it('reconstructs six empty subfields when the field was visible', () => {
    expect(
      flattenV4ToFormFields({
        v4Responses: {},
        formFields: [addressField()],
        formLogics: [],
      }),
    ).toEqual([
      {
        _id: ADDRESS_ID,
        question: 'address question',
        fieldType: BasicField.Address,
        answerArray: ['', '', '', '', '', ''],
      },
    ])
  })

  it('emits an empty array when logic hid the field', () => {
    const flattened = flattenV4ToFormFields({
      v4Responses: {
        [YESNO_ID]: { fieldType: BasicField.YesNo, answer: { value: 'No' } },
      },
      formFields: [yesNoField(), addressField()],
      formLogics: [showAddressWhenYes()],
    })

    expect(flattened.find((entry) => entry._id === ADDRESS_ID)).toEqual({
      _id: ADDRESS_ID,
      question: 'address question',
      fieldType: BasicField.Address,
      answerArray: [],
    })
  })

  it('reconstructs the subfields when the same logic shows the field', () => {
    const flattened = flattenV4ToFormFields({
      v4Responses: {
        [YESNO_ID]: { fieldType: BasicField.YesNo, answer: { value: 'Yes' } },
      },
      formFields: [yesNoField(), addressField()],
      formLogics: [showAddressWhenYes()],
    })

    expect(flattened.find((entry) => entry._id === ADDRESS_ID)).toEqual({
      _id: ADDRESS_ID,
      question: 'address question',
      fieldType: BasicField.Address,
      answerArray: ['', '', '', '', '', ''],
    })
  })
})

const RADIO_ID = '000000000000000000000013'

const radioField = (): FormFieldDto =>
  ({
    _id: RADIO_ID,
    fieldType: BasicField.Radio,
    title: 'why?',
    description: '',
    required: false,
    disabled: false,
    fieldOptions: ['a reason'],
    othersRadioButton: true,
  }) as unknown as FormFieldDto

/** Shows the Address only when the Radio answer is an `Others` free text. */
const showAddressWhenRadioOthers = (): LogicDto =>
  ({
    _id: '000000000000000000000014',
    logicType: LogicType.ShowFields,
    conditions: [
      { field: RADIO_ID, state: LogicConditionState.Equal, value: 'Others' },
    ],
    show: [ADDRESS_ID],
  }) as LogicDto

/**
 * RATIONALE: V4 drops the Others sentinel and puts the free text in `value`.
 * The evaluator instead matches an `Others` condition on an absent `value`
 * with a non-empty `othersInput`. Radio is the only condition type needing
 * this conversion. An unconverted answer evaluates against the respondent's
 * own words — a silently wrong visibility answer, not a type error.
 */
describe('a Radio `Others` answer as a logic condition', () => {
  it('satisfies an `Others` condition and shows the Address', () => {
    const flattened = flattenV4ToFormFields({
      v4Responses: {
        [RADIO_ID]: {
          fieldType: BasicField.Radio,
          answer: { value: 'my own reason', isOthersInput: true },
        },
      },
      formFields: [radioField(), addressField()],
      formLogics: [showAddressWhenRadioOthers()],
    })

    expect(flattened.find((entry) => entry._id === ADDRESS_ID)).toEqual({
      _id: ADDRESS_ID,
      question: 'address question',
      fieldType: BasicField.Address,
      answerArray: ['', '', '', '', '', ''],
    })
  })

  it('leaves the Address hidden when a listed option was chosen instead', () => {
    const flattened = flattenV4ToFormFields({
      v4Responses: {
        [RADIO_ID]: {
          fieldType: BasicField.Radio,
          answer: { value: 'a reason' },
        },
      },
      formFields: [radioField(), addressField()],
      formLogics: [showAddressWhenRadioOthers()],
    })

    expect(flattened.find((entry) => entry._id === ADDRESS_ID)).toEqual({
      _id: ADDRESS_ID,
      question: 'address question',
      fieldType: BasicField.Address,
      answerArray: [],
    })
  })

  it('leaves an answered Address alone whatever the logic says', () => {
    // RATIONALE: Regression guard. The visibility pass used to be skipped
    // unless the form held an Address; an answered Address must keep its
    // value regardless.
    const flattened = flattenV4ToFormFields({
      v4Responses: {
        [RADIO_ID]: {
          fieldType: BasicField.Radio,
          answer: { value: 'a reason' },
        },
        [ADDRESS_ID]: {
          fieldType: BasicField.Address,
          answer: {
            postalCode: { value: '123456' },
            blockNumber: { value: '1' },
            streetName: { value: 'a street' },
            buildingName: { value: '' },
            levelNumber: { value: '' },
            unitNumber: { value: '' },
          },
        },
      },
      formFields: [radioField(), addressField()],
      formLogics: [showAddressWhenRadioOthers()],
    })

    expect(flattened.find((entry) => entry._id === ADDRESS_ID)).toEqual({
      _id: ADDRESS_ID,
      question: 'address question',
      fieldType: BasicField.Address,
      answerArray: ['1', 'a street', '', '', '', '123456'],
    })
  })
})
