import { readFileSync } from 'fs'
import { join } from 'path'

import { BasicField, FormFieldDto, MyInfoAttribute } from '../../types'
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
      flattenV4ToFormFields({ v4Responses, formFields: [shortTextField()] }),
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
    expect(
      () =>
        flattenV4ToFormFields({
          v4Responses: {},
          formFields: [shortTextField({ fieldType: 'a_field_type_from_2030' })],
        }),
      // The shared helper takes `never`, so it can only stringify the field it
      // was handed; the throw itself is the contract, not the wording.
    ).toThrow('Unsupported field type')
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
        v4Responses,
        formFields: [shortTextField()],
      }).map((entry) => entry._id),
    ).toEqual([FIELD_ID])
  })

  it('emits an empty entry for a field the respondent never answered', () => {
    expect(
      flattenV4ToFormFields({
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
      flattenV4ToFormFields({ v4Responses, formFields: [shortTextField()] }),
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
      JSON.stringify(flattenV4ToFormFields({ v4Responses, formFields })),
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
        v4Responses: shortTextAnswer('an answer'),
        formFields: [shortTextField({ isVerifiable: false })],
      })[0],
    ).not.toHaveProperty('isUserVerified')
  })
})
