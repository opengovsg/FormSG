import { FieldResponsesV4 } from '@opengovsg/formsg-sdk'

import { CLIENT_CHECKBOX_OTHERS_INPUT_VALUE } from 'formsg-shared/constants'
import { BasicField, FormFieldDto } from 'formsg-shared/types'

import { flattenV4ToFormFields } from './flattenV4ToFormFields'

/**
 * Tests only the responsibilities of flattenV4ToFormFields: form-definition
 * ordering, empty entries for unanswered fields, and appending entries with
 * no form field.
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

const textfieldResponse: FieldResponsesV4[string] = {
  fieldType: 'textfield',
  question: 'Your name',
  answer: { value: 'TAN AH KOW' },
  provenance: { stepNumber: 1 },
}

const dropdownResponse: FieldResponsesV4[string] = {
  fieldType: 'dropdown',
  question: 'Citizenship',
  answer: { value: 'SINGAPORE CITIZEN' },
  provenance: { stepNumber: 1 },
}

const checkboxOthersResponse: FieldResponsesV4[string] = {
  fieldType: 'checkbox',
  question: 'Sauces',
  answer: {
    value: ['Ketchup', CLIENT_CHECKBOX_OTHERS_INPUT_VALUE],
    othersInput: 'sambal',
  },
  provenance: { stepNumber: 1 },
}

const flattenedTextfield = {
  _id: 'f-textfield',
  fieldType: 'textfield',
  question: 'Your name',
  answer: 'TAN AH KOW',
}

describe('flattenV4ToFormFields', () => {
  it('delegates per-field value mapping to the SDK adapter', () => {
    const result = flattenV4ToFormFields({
      v4Responses: {
        'f-textfield': textfieldResponse,
        'f-checkbox-others': checkboxOthersResponse,
      },
      formFields: [
        makeFieldDto('f-textfield', BasicField.ShortText, 'Your name'),
        makeFieldDto('f-checkbox-others', BasicField.Checkbox, 'Sauces'),
      ],
    })

    expect(result).toEqual([
      flattenedTextfield,
      {
        _id: 'f-checkbox-others',
        fieldType: 'checkbox',
        question: 'Sauces',
        answerArray: ['Ketchup', 'Others: sambal'],
      },
    ])
  })

  it('synthesizes empty entries for unanswered fields', () => {
    const result = flattenV4ToFormFields({
      v4Responses: { 'f-textfield': textfieldResponse },
      formFields: allTypeFormFields,
    })

    expect(result).toEqual([
      {
        _id: 'f-section',
        fieldType: 'section',
        question: 'Part A',
        answer: '',
        isHeader: true,
      },
      flattenedTextfield,
      {
        _id: 'f-dropdown',
        fieldType: 'dropdown',
        question: 'Citizenship',
        answer: '',
      },
      {
        _id: 'f-yesno',
        fieldType: 'yes_no',
        question: 'Do you agree?',
        answer: '',
      },
      {
        _id: 'f-email-verified',
        fieldType: 'email',
        question: 'Your email',
        answer: '',
      },
      {
        _id: 'f-email-plain',
        fieldType: 'email',
        question: 'Alternate email',
        answer: '',
      },
      {
        _id: 'f-mobile-verified',
        fieldType: 'mobile',
        question: 'Your mobile',
        answer: '',
      },
      {
        _id: 'f-radio-plain',
        fieldType: 'radiobutton',
        question: 'Favourite colour',
        answer: '',
      },
      {
        _id: 'f-radio-others',
        fieldType: 'radiobutton',
        question: 'Favourite fruit',
        answer: '',
      },
      {
        _id: 'f-checkbox',
        fieldType: 'checkbox',
        question: 'Toppings',
        answerArray: [],
      },
      {
        _id: 'f-checkbox-others',
        fieldType: 'checkbox',
        question: 'Sauces',
        answerArray: [],
      },
      {
        _id: 'f-checkbox-empty',
        fieldType: 'checkbox',
        question: 'Optional extras',
        answerArray: [],
      },
      {
        _id: 'f-attachment',
        fieldType: 'attachment',
        question: 'Upload your CV',
        answer: '',
      },
      {
        _id: 'f-table',
        fieldType: 'table',
        question: 'Employment history (Company, Role)',
        answerArray: [],
      },
      {
        _id: 'f-address',
        fieldType: 'address',
        question: 'Home address',
        answerArray: [],
      },
      {
        _id: 'f-address-partial',
        fieldType: 'address',
        question: 'Office address',
        answerArray: [],
      },
      {
        _id: 'f-signature',
        fieldType: 'signature',
        question: 'Sign here',
        answerArray: ['', ''],
      },
    ])
  })

  it('orders output by the form definition when responses arrive out of order', () => {
    const outOfOrder: FieldResponsesV4 = {
      'f-dropdown': dropdownResponse,
      'f-textfield': textfieldResponse,
    }
    const formFields = [
      makeFieldDto('f-textfield', BasicField.ShortText, 'Your name'),
      makeFieldDto('f-dropdown', BasicField.Dropdown, 'Citizenship'),
    ]

    const result = flattenV4ToFormFields({
      v4Responses: outOfOrder,
      formFields,
    })

    expect(result.map((f) => f._id)).toEqual(['f-textfield', 'f-dropdown'])
  })

  it('appends extra verified entries not present in the form definition', () => {
    const v4Responses: FieldResponsesV4 = {
      'f-textfield': textfieldResponse,
      'SP NRIC': {
        fieldType: 'nric',
        question: 'SingPass Validated NRIC',
        answer: { value: 'S1234567A' },
        provenance: { stepNumber: 1 },
      },
    }
    const formFields = [
      makeFieldDto('f-textfield', BasicField.ShortText, 'Your name'),
    ]

    const result = flattenV4ToFormFields({ v4Responses, formFields })

    expect(result).toEqual([
      flattenedTextfield,
      {
        _id: 'SP NRIC',
        fieldType: 'nric',
        question: 'SingPass Validated NRIC',
        answer: 'S1234567A',
      },
    ])
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
      formFields: [
        makeFieldDto('f-textfield', BasicField.ShortText, 'Your name'),
      ],
    })

    expect(result).toEqual([
      { ...flattenedTextfield, answer: '' },
      {
        _id: 'unknown-field-id',
        fieldType: 'textfield',
        question: 'Orphaned question',
        answer: 'orphaned answer',
      },
    ])
  })

  it('renders a duplicated form field once per occurrence', () => {
    const textfield = makeFieldDto(
      'f-textfield',
      BasicField.ShortText,
      'Your name',
    )

    const result = flattenV4ToFormFields({
      v4Responses: { 'f-textfield': textfieldResponse },
      formFields: [textfield, textfield],
    })

    expect(result).toEqual([flattenedTextfield, flattenedTextfield])
  })

  it('ignores myInfo and previousAnswers metadata', () => {
    const withMetadata: FieldResponsesV4 = {
      'f-textfield': {
        ...textfieldResponse,
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
      makeFieldDto('f-textfield', BasicField.ShortText, 'Your name'),
    ]

    expect(
      flattenV4ToFormFields({ v4Responses: withMetadata, formFields }),
    ).toEqual(
      flattenV4ToFormFields({
        v4Responses: { 'f-textfield': textfieldResponse },
        formFields,
      }),
    )
  })
})
