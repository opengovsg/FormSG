import { FieldResponsesV4 } from '@opengovsg/formsg-sdk'

import { CLIENT_CHECKBOX_OTHERS_INPUT_VALUE } from 'formsg-shared/constants'
import { BasicField, FormFieldDto } from 'formsg-shared/types'

import { flattenV4ToFormFields } from './flattenV4ToFormFields'

/**
 * Golden parity suite.
 *
 * The snapshots were generated from the pre-refactor implementation (the one
 * with all per-field-type conversion logic inline). The refactor to delegate
 * per-field mapping to the SDK's adaptV4ToV1 must keep every snapshot
 * byte-identical — only dead branches (children answers, empty signatures,
 * see ADR 0001) are allowed to differ, and those are deliberately absent
 * from these fixtures.
 */
const makeFieldDto = (
  id: string,
  fieldType: BasicField,
  title = `Question ${id}`,
  extra: Record<string, unknown> = {},
): FormFieldDto =>
  ({
    _id: id,
    fieldType,
    title,
    ...extra,
  }) as unknown as FormFieldDto

const allTypeFormFields: FormFieldDto[] = [
  makeFieldDto('f-section', BasicField.Section, 'Part A'),
  makeFieldDto('f-statement', BasicField.Statement, 'Read this'),
  makeFieldDto('f-textfield', BasicField.ShortText, 'Your name'),
  makeFieldDto('f-dropdown', BasicField.Dropdown, 'Citizenship'),
  makeFieldDto('f-yesno', BasicField.YesNo, 'Do you agree?'),
  makeFieldDto('f-email-verified', BasicField.Email, 'Your email'),
  makeFieldDto('f-email-plain', BasicField.Email, 'Alternate email'),
  makeFieldDto('f-mobile-verified', BasicField.Mobile, 'Your mobile'),
  makeFieldDto('f-radio-plain', BasicField.Radio, 'Favourite colour'),
  makeFieldDto('f-radio-others', BasicField.Radio, 'Favourite fruit'),
  makeFieldDto('f-checkbox', BasicField.Checkbox, 'Toppings'),
  makeFieldDto('f-checkbox-others', BasicField.Checkbox, 'Sauces'),
  makeFieldDto('f-checkbox-empty', BasicField.Checkbox, 'Optional extras'),
  makeFieldDto('f-attachment', BasicField.Attachment, 'Upload your CV'),
  makeFieldDto('f-table', BasicField.Table, 'Employment history', {
    columns: [{ title: 'Company' }, { title: 'Role' }],
  }),
  makeFieldDto('f-address', BasicField.Address, 'Home address'),
  makeFieldDto('f-address-partial', BasicField.Address, 'Office address'),
  makeFieldDto('f-signature', BasicField.Signature, 'Sign here'),
]

const allTypeResponses: FieldResponsesV4 = {
  'f-section': {
    fieldType: 'section',
    question: 'Part A',
    answer: { value: '' },
    provenance: { stepNumber: 1 },
  },
  'f-textfield': {
    fieldType: 'textfield',
    question: 'Your name',
    answer: { value: 'TAN AH KOW' },
    provenance: { stepNumber: 1 },
  },
  'f-dropdown': {
    fieldType: 'dropdown',
    question: 'Citizenship',
    answer: { value: 'SINGAPORE CITIZEN' },
    provenance: { stepNumber: 1 },
  },
  'f-yesno': {
    fieldType: 'yes_no',
    question: 'Do you agree?',
    answer: { value: 'Yes' },
    provenance: { stepNumber: 1 },
  },
  'f-email-verified': {
    fieldType: 'email',
    question: 'Your email',
    answer: { value: 'user@example.com', signature: 'dGVzdC1zaWduYXR1cmU=' },
    provenance: { stepNumber: 1 },
  },
  'f-email-plain': {
    fieldType: 'email',
    question: 'Alternate email',
    answer: { value: 'other@example.com' },
    provenance: { stepNumber: 1 },
  },
  'f-mobile-verified': {
    fieldType: 'mobile',
    question: 'Your mobile',
    answer: { value: '+6598765432', signature: 'bW9iaWxlLXNpZw==' },
    provenance: { stepNumber: 1 },
  },
  'f-radio-plain': {
    fieldType: 'radiobutton',
    question: 'Favourite colour',
    answer: { value: 'Blue', isOthersInput: false },
    provenance: { stepNumber: 1 },
  },
  'f-radio-others': {
    fieldType: 'radiobutton',
    question: 'Favourite fruit',
    answer: { value: 'durian', isOthersInput: true },
    provenance: { stepNumber: 1 },
  },
  'f-checkbox': {
    fieldType: 'checkbox',
    question: 'Toppings',
    answer: { value: ['Cheese', 'Mushroom'] },
    provenance: { stepNumber: 1 },
  },
  'f-checkbox-others': {
    fieldType: 'checkbox',
    question: 'Sauces',
    answer: {
      value: ['Ketchup', CLIENT_CHECKBOX_OTHERS_INPUT_VALUE],
      othersInput: 'sambal',
    },
    provenance: { stepNumber: 1 },
  },
  'f-checkbox-empty': {
    fieldType: 'checkbox',
    question: 'Optional extras',
    answer: { value: [] },
    provenance: { stepNumber: 1 },
  },
  'f-attachment': {
    fieldType: 'attachment',
    question: 'Upload your CV',
    answer: {
      value: 'resume.pdf',
      hasBeenScanned: true,
      md5Hash: 'd41d8cd98f00b204e9800998ecf8427e',
    },
    provenance: { stepNumber: 1 },
  },
  'f-table': {
    fieldType: 'table',
    question: 'Employment history',
    answer: {
      row2: { rowNum: 1, value: { col1: 'GovTech', col2: 'Manager' } },
      row1: { rowNum: 0, value: { col1: 'OGP', col2: 'Engineer' } },
    },
    provenance: { stepNumber: 1 },
  },
  'f-address': {
    fieldType: 'address',
    question: 'Home address',
    answer: {
      postalCode: { value: '654321' },
      blockNumber: { value: '123' },
      streetName: { value: 'Main Street' },
      buildingName: { value: 'Sunshine Tower' },
      levelNumber: { value: '10' },
      unitNumber: { value: '01' },
    },
    provenance: { stepNumber: 1 },
  },
  'f-address-partial': {
    fieldType: 'address',
    question: 'Office address',
    answer: {
      postalCode: { value: '111111' },
      blockNumber: { value: '1' },
      streetName: { value: 'Short Road' },
      buildingName: { value: '' },
      levelNumber: { value: '' },
      unitNumber: { value: '' },
    },
    provenance: { stepNumber: 1 },
  },
  'f-signature': {
    fieldType: 'signature',
    question: 'Sign here',
    answer: {
      type: 'draw',
      value: [
        [
          [1, 2, 0],
          [3, 4, 1],
        ],
      ],
    },
    provenance: { stepNumber: 1 },
  },
}

describe('flattenV4ToFormFields', () => {
  it('renders every answered field type identically to the pre-refactor implementation', () => {
    const result = flattenV4ToFormFields({
      v4Responses: allTypeResponses,
      formFields: allTypeFormFields,
    })

    expect(result).toMatchSnapshot()
  })

  it('synthesizes empty entries for unanswered fields', () => {
    // Only one field answered; everything else must be synthesized in the
    // empty shape its field type demands (statement/image excluded).
    const v4Responses: FieldResponsesV4 = {
      'f-textfield': allTypeResponses['f-textfield'],
    }

    const result = flattenV4ToFormFields({
      v4Responses,
      formFields: allTypeFormFields,
    })

    expect(result).toMatchSnapshot()
  })

  it('orders output by the form definition when responses arrive out of order', () => {
    const outOfOrder: FieldResponsesV4 = {
      'f-dropdown': allTypeResponses['f-dropdown'],
      'f-textfield': allTypeResponses['f-textfield'],
    }
    const formFields = [
      allTypeFormFields.find((f) => f._id === 'f-textfield'),
      allTypeFormFields.find((f) => f._id === 'f-dropdown'),
    ] as FormFieldDto[]

    const result = flattenV4ToFormFields({
      v4Responses: outOfOrder,
      formFields,
    })

    expect(result.map((f) => f._id)).toEqual(['f-textfield', 'f-dropdown'])
  })

  it('appends extra verified entries not present in the form definition', () => {
    const v4Responses: FieldResponsesV4 = {
      'f-textfield': allTypeResponses['f-textfield'],
      'SP NRIC': {
        fieldType: 'nric',
        question: 'SingPass Validated NRIC',
        answer: { value: 'S1234567A' },
        provenance: { stepNumber: 1 },
      },
    }
    const formFields = [
      allTypeFormFields.find((f) => f._id === 'f-textfield'),
    ] as FormFieldDto[]

    const result = flattenV4ToFormFields({ v4Responses, formFields })

    expect(result).toMatchSnapshot()
  })

  it('appends a response whose _id is not in the form definition', () => {
    const v4Responses: FieldResponsesV4 = {
      'unknown-field-id': {
        fieldType: 'textfield',
        question: 'Orphaned question',
        answer: { value: 'orphaned answer' },
        provenance: { stepNumber: 1 },
      },
    }

    const result = flattenV4ToFormFields({
      v4Responses,
      formFields: [allTypeFormFields.find((f) => f._id === 'f-textfield')!],
    })

    expect(result).toMatchSnapshot()
  })

  it('renders a duplicated form field once per occurrence', () => {
    const textfield = allTypeFormFields.find((f) => f._id === 'f-textfield')!

    const result = flattenV4ToFormFields({
      v4Responses: { 'f-textfield': allTypeResponses['f-textfield'] },
      formFields: [textfield, textfield],
    })

    expect(result).toMatchSnapshot()
  })

  it('ignores myInfo and previousAnswers metadata', () => {
    const withMetadata: FieldResponsesV4 = {
      'f-textfield': {
        ...allTypeResponses['f-textfield'],
        myInfo: { attr: 'name' },
        previousAnswers: [
          {
            answer: { value: 'OLD NAME' },
            provenance: { stepNumber: 1 },
          },
        ],
      },
    }
    const formFields = [
      allTypeFormFields.find((f) => f._id === 'f-textfield'),
    ] as FormFieldDto[]

    expect(
      flattenV4ToFormFields({ v4Responses: withMetadata, formFields }),
    ).toEqual(
      flattenV4ToFormFields({
        v4Responses: {
          'f-textfield': allTypeResponses['f-textfield'],
        },
        formFields,
      }),
    )
  })
})
