import { FieldResponsesV4 } from '@opengovsg/formsg-sdk'

import { BasicField, FormFieldDto } from 'formsg-shared/types'
import {
  SgidFieldTitle,
  SPCPFieldTitle,
} from 'formsg-shared/utils/verified-content'

import { processDecryptedContentV4 } from './processDecryptedContent'

const FIELD_ID = '000000000000000000000001'

const FORM_FIELDS = [
  {
    _id: FIELD_ID,
    fieldType: BasicField.ShortText,
    title: 'Your name',
  },
] as unknown as FormFieldDto[]

const RESPONSES: FieldResponsesV4 = {
  [FIELD_ID]: {
    fieldType: BasicField.ShortText,
    question: 'Your name',
    answer: { value: 'Alice' },
  },
} as unknown as FieldResponsesV4

describe('processDecryptedContentV4', () => {
  it('returns only the form fields when there is no verified content', () => {
    const result = processDecryptedContentV4(FORM_FIELDS, RESPONSES)

    expect(result.map((field) => field._id)).toEqual([FIELD_ID])
  })

  it('appends the Singpass verified NRIC after the form fields', () => {
    const result = processDecryptedContentV4(FORM_FIELDS, RESPONSES, {
      'uinFin (Step 1)': 'S1234567A',
    })

    expect(result.map((field) => field._id)).toEqual([
      FIELD_ID,
      SPCPFieldTitle.SpNric,
    ])
    expect(result[1]).toMatchObject({
      _id: SPCPFieldTitle.SpNric,
      question: SPCPFieldTitle.SpNric,
      fieldType: BasicField.Nric,
      answer: 'S1234567A',
    })
  })

  it('appends the Corppass verified UEN then UID, in verified-object order', () => {
    const result = processDecryptedContentV4(FORM_FIELDS, RESPONSES, {
      'cpUen (Step 1)': 'T09LL0001B',
      'cpUid (Step 1)': 'S1234567A',
    })

    expect(result.map((field) => field._id)).toEqual([
      FIELD_ID,
      SPCPFieldTitle.CpUen,
      SPCPFieldTitle.CpUid,
    ])
    expect(result[1]).toMatchObject({
      fieldType: BasicField.ShortText,
      answer: 'T09LL0001B',
    })
    expect(result[2]).toMatchObject({
      fieldType: BasicField.Nric,
      answer: 'S1234567A',
    })
  })

  it('appends the sgID verified NRIC after the form fields', () => {
    const result = processDecryptedContentV4(FORM_FIELDS, RESPONSES, {
      sgidUinFin: 'S1234567A',
    })

    expect(result.map((field) => field._id)).toEqual([
      FIELD_ID,
      SgidFieldTitle.SgidNric,
    ])
    expect(result[1]).toMatchObject({
      _id: SgidFieldTitle.SgidNric,
      question: SgidFieldTitle.SgidNric,
      fieldType: 'nric',
      answer: 'S1234567A',
    })
  })

  it('emits nothing for an unrecognised verified key', () => {
    const result = processDecryptedContentV4(FORM_FIELDS, RESPONSES, {
      notAVerifiedKey: 'some value',
    })

    expect(result.map((field) => field._id)).toEqual([FIELD_ID])
  })

  it('emits every form field before any verified entry', () => {
    const secondId = '000000000000000000000002'
    const formFields = [
      ...FORM_FIELDS,
      {
        _id: secondId,
        fieldType: BasicField.ShortText,
        title: 'Your favourite colour',
      },
    ] as unknown as FormFieldDto[]

    const result = processDecryptedContentV4(formFields, RESPONSES, {
      'uinFin (Step 1)': 'S1234567A',
    })

    expect(result.map((field) => field._id)).toEqual([
      FIELD_ID,
      secondId,
      SPCPFieldTitle.SpNric,
    ])
  })
})
