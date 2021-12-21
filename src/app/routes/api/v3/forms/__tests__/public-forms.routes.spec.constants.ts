import fs from 'fs'

import {
  IAttachmentFieldSchema,
  ICheckboxFieldSchema,
  ITableFieldSchema,
} from 'src/types'

import {
  generateAttachmentResponse,
  generateCheckboxResponse,
  generateDefaultField,
  generateSingleAnswerResponse,
} from 'tests/unit/backend/helpers/generate-form-data'

import {
  BasicField,
  Column,
  FieldBase,
} from '../../../../../../../shared/types'

export const MOCK_NO_RESPONSES_BODY = {
  responses: [],
}

const MOCK_TABLE_COLUMNS = [
  {
    title: 'Test Column Title 1',
    required: true,
    columnType: BasicField.ShortText,
  },
  {
    title: 'Test Column Title 2',
    required: true,
    columnType: BasicField.Dropdown,
    fieldOptions: ['Option 1', 'Option 2', 'Option 3'],
  },
] as const
export const MOCK_TEXT_FIELD = generateDefaultField(BasicField.ShortText)
export const MOCK_TABLE_FIELD = generateDefaultField(BasicField.Table, {
  minimumRows: 2,
  columns: MOCK_TABLE_COLUMNS as unknown as Column[],
}) as ITableFieldSchema
export const MOCK_TEXTFIELD_RESPONSE =
  generateSingleAnswerResponse(MOCK_TEXT_FIELD)
export const MOCK_TABLE_RESPONSE = {
  _id: MOCK_TABLE_FIELD._id,
  fieldType: BasicField.Table,
  question: MOCK_TABLE_FIELD.title,
  answerArray: [
    ['Test', MOCK_TABLE_COLUMNS[1].fieldOptions[1]],
    ['Test 2', MOCK_TABLE_COLUMNS[1].fieldOptions[2]],
  ],
}

export const MOCK_ATTACHMENT_FIELD = generateDefaultField(BasicField.Attachment)
export const MOCK_ATTACHMENT_RESPONSE = generateAttachmentResponse(
  MOCK_ATTACHMENT_FIELD as IAttachmentFieldSchema,
  'valid.txt',
  fs.readFileSync('tests/unit/backend/resources/valid.txt'),
)

export const MOCK_SECTION_FIELD = generateDefaultField(BasicField.Section)
export const MOCK_SECTION_RESPONSE =
  generateSingleAnswerResponse(MOCK_SECTION_FIELD)

export const MOCK_CHECKBOX_FIELD = generateDefaultField(BasicField.Checkbox)
export const MOCK_CHECKBOX_RESPONSE = generateCheckboxResponse(
  MOCK_CHECKBOX_FIELD as ICheckboxFieldSchema,
)

export const MOCK_OPTIONAL_VERIFIED_FIELD = generateDefaultField(
  BasicField.Email,
  {
    isVerifiable: true,
    required: false,
  } as Partial<FieldBase>,
)
export const MOCK_OPTIONAL_VERIFIED_RESPONSE = generateSingleAnswerResponse(
  MOCK_OPTIONAL_VERIFIED_FIELD,
  '',
)

export const MOCK_COOKIE_AGE = 2000
export const MOCK_UINFIN = 'S1234567A'
