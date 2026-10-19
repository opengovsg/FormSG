import { generateDefaultFieldV4 } from '__tests__/unit/backend/helpers/generate-form-data'
import { BasicField } from 'formsg-shared/types'
import { isLeft, isRight } from 'fp-ts/lib/Either'

import { ValidateFieldErrorV4 } from 'src/app/modules/submission/submission.errors'
import { ParsedClearFormFieldResponseV4 } from 'src/types/api'

import { validateResponseShapeV4 } from '../response-shape-validator'
import { validateFieldV4 } from '..'

const emptyString = { value: '' }
const emptyAnswers = {
  [BasicField.Section]: emptyString,
  [BasicField.Number]: emptyString,
  [BasicField.Decimal]: emptyString,
  [BasicField.ShortText]: emptyString,
  [BasicField.LongText]: emptyString,
  [BasicField.HomeNo]: emptyString,
  [BasicField.Dropdown]: emptyString,
  [BasicField.Rating]: emptyString,
  [BasicField.Nric]: emptyString,
  [BasicField.Uen]: emptyString,
  [BasicField.Date]: emptyString,
  [BasicField.CountryRegion]: emptyString,
  [BasicField.YesNo]: emptyString,
  [BasicField.Email]: emptyString,
  [BasicField.Mobile]: emptyString,
  [BasicField.Radio]: { value: '', isOthersInput: false },
  [BasicField.Checkbox]: { value: [] },
  [BasicField.Attachment]: { value: '', hasBeenScanned: false },
  [BasicField.Table]: {},
  [BasicField.Children]: {},
  [BasicField.Address]: {
    postalCode: emptyString,
    blockNumber: emptyString,
    streetName: emptyString,
    buildingName: emptyString,
    levelNumber: emptyString,
    unitNumber: emptyString,
  },
  [BasicField.Signature]: { value: [], type: 'draw' },
} satisfies Record<
  Exclude<BasicField, BasicField.Image | BasicField.Statement>,
  unknown
>

const makeResponse = (
  fieldType: BasicField,
  answer: unknown,
): ParsedClearFormFieldResponseV4 => {
  const response: ParsedClearFormFieldResponseV4 = {
    fieldType,
    answer: { value: '' },
    question: 'Test field',
    provenance: {},
  }
  // Exercise malformed request bodies without asserting that they are typed.
  Object.assign(response, { answer })
  return response
}

const malformedAnswers: [BasicField, unknown][] = [
  [BasicField.ShortText, {}],
  [BasicField.YesNo, { value: 1 }],
  [BasicField.Email, { value: '', signature: 1 }],
  [BasicField.Mobile, { value: null }],
  [BasicField.Radio, { value: [], isOthersInput: false }],
  [BasicField.Checkbox, { value: 'option' }],
  [BasicField.Checkbox, { value: [null] }],
  [BasicField.Checkbox, { value: [], othersInput: 1 }],
  [BasicField.Attachment, { hasBeenScanned: false }],
  [
    BasicField.Attachment,
    { value: 'file.pdf', hasBeenScanned: false, content: null },
  ],
  [BasicField.Table, { row1: null }],
  [BasicField.Table, { row1: { rowNum: 1 } }],
  [BasicField.Table, { row1: { rowNum: 1, value: { col1: null } } }],
  [BasicField.Children, { child1: null }],
  [BasicField.Children, { child1: { value: { name: { value: 1 } } } }],
  [BasicField.Address, {}],
  [BasicField.Address, { ...emptyAnswers[BasicField.Address], extra: null }],
  [BasicField.Signature, { value: 'signature', type: 'draw' }],
  [BasicField.Signature, { value: [[[1, 2]]], type: 'draw' }],
]

for (const fieldType of Object.values(BasicField)) {
  if (fieldType === BasicField.Image || fieldType === BasicField.Statement)
    continue
  for (const answer of [undefined, null, [], 123, 'legacy answer']) {
    malformedAnswers.push([fieldType, answer])
  }
}

describe('V4 response shape validation', () => {
  it.each(Object.entries(emptyAnswers))(
    'allows a structurally valid empty %s answer',
    (fieldType, answer) => {
      const response = makeResponse(BasicField.ShortText, answer)
      Object.assign(response, { fieldType })
      expect(isRight(validateResponseShapeV4(response))).toBe(true)
    },
  )

  it.each<[BasicField, unknown]>([
    [BasicField.Email, { value: 'test@example.com', signature: 'signed' }],
    [
      BasicField.Attachment,
      {
        value: 'file.pdf',
        hasBeenScanned: true,
        filename: 'file.pdf',
        content: Buffer.from('file content'),
      },
    ],
    [BasicField.Table, { row1: { rowNum: 1, value: { col1: 42 } } }],
    [
      BasicField.Children,
      {
        child1: {
          value: { name: { value: 'Alice', myInfo: { attr: 'name' } } },
          type: 'children',
        },
      },
    ],
    [BasicField.Signature, { value: [[[1, 2, 0.5]]], type: 'draw' }],
  ])(
    'preserves valid %s responses without transforming them',
    (fieldType, answer) => {
      const response = makeResponse(fieldType, answer)
      const result = validateResponseShapeV4(response)
      expect(isRight(result)).toBe(true)
      if (isLeft(result)) throw new Error(result.left)
      expect(result.right).toBe(response)
    },
  )

  it.each(malformedAnswers)(
    'rejects malformed %s answer %p before visibility and change checks',
    (fieldType, answer) => {
      const response = makeResponse(fieldType, answer)
      expect(isLeft(validateResponseShapeV4(response))).toBe(true)

      for (const required of [true, false]) {
        for (const isVisible of [true, false]) {
          const formField = generateDefaultFieldV4(fieldType, { required })
          for (const prevResponse of [undefined, response]) {
            const result = validateFieldV4({
              formId: '507f1f77bcf86cd799439011',
              formField,
              response,
              prevResponse,
              isVisible,
            })
            expect(result._unsafeUnwrapErr()).toEqual(
              new ValidateFieldErrorV4('Invalid answer submitted'),
            )
          }
        }
      }
    },
  )
})
