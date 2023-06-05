import {
  generateAttachmentResponse,
  generateCheckboxResponse,
  generateDefaultField,
  generateSingleAnswerResponse,
} from '__tests__/unit/backend/helpers/generate-form-data'
import fs from 'fs'

import { IAttachmentFieldSchema, ICheckboxFieldSchema } from 'src/types'

import { BasicField, FieldBase } from '../../../../../../../shared/types'

export const MOCK_NO_RESPONSES_BODY = {
  responses: [],
}

export const MOCK_TEXT_FIELD = generateDefaultField(BasicField.ShortText)
export const MOCK_TEXTFIELD_RESPONSE =
  generateSingleAnswerResponse(MOCK_TEXT_FIELD)

export const MOCK_ATTACHMENT_FIELD = generateDefaultField(BasicField.Attachment)
export const MOCK_ATTACHMENT_RESPONSE = generateAttachmentResponse(
  MOCK_ATTACHMENT_FIELD as IAttachmentFieldSchema,
  'valid.txt',
  fs.readFileSync('__tests__/unit/backend/resources/valid.txt'),
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
