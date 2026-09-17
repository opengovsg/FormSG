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

/**
 * The flatten's own unit gates. Byte parity with the storage-mode producer is
 * measured elsewhere — `apps/backend/.../flattenV4ToV1.parity.spec.ts`, which
 * is the only place both producers can be run on one input. What is asserted
 * here is what that differential gate structurally cannot see: where the
 * question text comes from, that an unclassified field type throws rather than
 * emitting a blank entry, that nothing outside the form definition is emitted,
 * and the `myInfo` append (the differential fixture carries no MyInfo field,
 * because storage mode also rewrites their question text and #9975 owns
 * reproducing that prefix).
 */

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
    // The MRF middleware strips `question` on the way in, so anything that
    // reaches the flatten under that key is respondent-supplied.
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
    // Decided: no MRF form should have a Children field. The old passthrough
    // exported `answer: ""` — a blank CSV column with no error.
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
    // The compiler is the real gate here and cannot be asserted from a test;
    // what is asserted is that the construction giving it to us still exists.
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
 * V4 content drops an untouched Address and a logic-hidden one alike, so the
 * flatten reconstructs the difference storage mode records: six empty strings
 * for the field the respondent saw, an empty array for the field logic hid.
 * The byte-level assertion lives in the differential gate; what is pinned here
 * is that visibility, and only visibility, decides between the two.
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
 * Radio is the one logic condition type whose V4 answer shape cannot be handed
 * to the evaluator as-is: V4 flattens the Others sentinel away and carries the
 * free text in `value`, while the evaluator's client branch matches an
 * `Others` condition on an absent `value` plus a non-empty `othersInput`.
 *
 * These cases fail if the transformer forwards the V4 answer unconverted — the
 * condition would then be evaluated against the respondent's own words, which
 * is a silently wrong visibility answer rather than a type error.
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
    // The visibility pass used to be skipped unless the form held an Address
    // at all; an answered Address takes its value from the answer either way.
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
