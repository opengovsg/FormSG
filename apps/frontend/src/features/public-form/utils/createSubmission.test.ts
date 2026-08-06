import { adaptV3ToV4, type TableAnswerV4 } from '@opengovsg/formsg-sdk'

import { BasicField, FormFieldDto } from 'formsg-shared/types'

import { FormFieldValues } from '~templates/Field'
import { RADIO_OTHERS_INPUT_VALUE } from '~templates/Field/Radio/constants'

import { FieldIdToQuarantineKeyType } from '../PublicFormService'

import { createResponsesV3, createResponsesV4 } from './createSubmission'

const fieldId = (n: number) => n.toString(16).padStart(24, '0')

const mockField = (id: string, fieldType: BasicField): FormFieldDto =>
  ({ _id: id, fieldType, title: `Question ${id}` }) as FormFieldDto

const TEXT_ID = fieldId(1)
const YESNO_ID = fieldId(2)
const EMAIL_ID = fieldId(3)
const RADIO_ID = fieldId(4)
const CHECKBOX_ID = fieldId(5)
const TABLE_ID = fieldId(6)
const ADDRESS_ID = fieldId(7)
const ATTACHMENT_ID = fieldId(8)
const SIGNATURE_ID = fieldId(9)
const MOBILE_ID = fieldId(10)

const QUARANTINE_MAP: FieldIdToQuarantineKeyType[] = [
  { fieldId: ATTACHMENT_ID, quarantineBucketKey: 'quarantine/key-123' },
]

describe('createResponsesV4', () => {
  it('wraps string-like and yes/no answers in { value }', () => {
    const formFields = [
      mockField(TEXT_ID, BasicField.ShortText),
      mockField(YESNO_ID, BasicField.YesNo),
    ]
    const formInputs = {
      [TEXT_ID]: 'hello world',
      [YESNO_ID]: 'Yes',
    } as FormFieldValues

    const responses = createResponsesV4(formFields, formInputs, [])

    expect(responses[TEXT_ID]).toEqual({
      fieldType: BasicField.ShortText,
      answer: { value: 'hello world' },
      provenance: {},
    })
    expect(responses[YESNO_ID]).toEqual({
      fieldType: BasicField.YesNo,
      answer: { value: 'Yes' },
      provenance: {},
    })
  })

  it('includes signature on verifiable answers only when present', () => {
    const formFields = [
      mockField(EMAIL_ID, BasicField.Email),
      mockField(MOBILE_ID, BasicField.Mobile),
    ]
    const formInputs = {
      [EMAIL_ID]: { value: 'a@example.com', signature: 'sig' },
      [MOBILE_ID]: { value: '+6598765432' },
    } as FormFieldValues

    const responses = createResponsesV4(formFields, formInputs, [])

    expect(responses[EMAIL_ID].answer).toEqual({
      value: 'a@example.com',
      signature: 'sig',
    })
    expect(responses[MOBILE_ID].answer).toEqual({ value: '+6598765432' })
  })

  it('maps radio answers to { value, isOthersInput }', () => {
    const formFields = [mockField(RADIO_ID, BasicField.Radio)]

    const regular = createResponsesV4(
      formFields,
      { [RADIO_ID]: { value: 'Option A' } } as FormFieldValues,
      [],
    )
    expect(regular[RADIO_ID].answer).toEqual({
      value: 'Option A',
      isOthersInput: false,
    })

    const others = createResponsesV4(
      formFields,
      {
        [RADIO_ID]: {
          value: RADIO_OTHERS_INPUT_VALUE,
          othersInput: 'my custom answer',
        },
      } as FormFieldValues,
      [],
    )
    expect(others[RADIO_ID].answer).toEqual({
      value: 'my custom answer',
      isOthersInput: true,
    })
  })

  it('omits a checkbox with no selection even when othersInput has text', () => {
    const formFields = [mockField(CHECKBOX_ID, BasicField.Checkbox)]

    // othersInput text is only submitted when the Others sentinel is
    // selected, so every no-selection state is unanswered: `false` (untouched
    // group artifact), `undefined` (othersInput set without a group change
    // event) and an emptied-out selection.
    const noSelectionInputs = [
      { value: false, othersInput: 'other only' },
      { othersInput: 'other only' },
      { value: [], othersInput: 'other only' },
    ]
    for (const input of noSelectionInputs) {
      const responses = createResponsesV4(
        formFields,
        { [CHECKBOX_ID]: input } as unknown as FormFieldValues,
        [],
      )
      expect(responses).toEqual({})
    }
  })

  it('keys table rows by generated rowId with rowNum ordering', () => {
    const formFields = [mockField(TABLE_ID, BasicField.Table)]
    const formInputs = {
      [TABLE_ID]: [
        { col1: 'r1c1', col2: 'r1c2' },
        { col1: 'r2c1', col2: 'r2c2' },
      ],
    } as unknown as FormFieldValues

    const responses = createResponsesV4(formFields, formInputs, [])

    const answer = responses[TABLE_ID].answer as TableAnswerV4
    const rows = Object.entries(answer)
    expect(rows).toHaveLength(2)
    for (const [rowId] of rows) {
      expect(rowId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      )
    }
    const byRowNum = Object.values(answer).sort((a, b) => a.rowNum - b.rowNum)
    expect(byRowNum[0]).toEqual({
      rowNum: 0,
      value: { col1: 'r1c1', col2: 'r1c2' },
    })
    expect(byRowNum[1]).toEqual({
      rowNum: 1,
      value: { col1: 'r2c1', col2: 'r2c2' },
    })
  })

  it('wraps each address sub-field in { value }', () => {
    const formFields = [mockField(ADDRESS_ID, BasicField.Address)]
    const formInputs = {
      [ADDRESS_ID]: {
        addressSubFields: {
          postalCode: '123456',
          blockNumber: '12A',
          streetName: 'Main Street',
          buildingName: '',
          levelNumber: '05',
          unitNumber: '01',
        },
      },
    } as unknown as FormFieldValues

    const responses = createResponsesV4(formFields, formInputs, [])

    expect(responses[ADDRESS_ID].answer).toEqual({
      postalCode: { value: '123456' },
      blockNumber: { value: '12A' },
      streetName: { value: 'Main Street' },
      buildingName: { value: '' },
      levelNumber: { value: '05' },
      unitNumber: { value: '01' },
    })
  })

  it('uses the quarantine bucket key for attachment answers', () => {
    const formFields = [mockField(ATTACHMENT_ID, BasicField.Attachment)]
    const formInputs = {
      [ATTACHMENT_ID]: new File(['content'], 'file.pdf'),
    } as unknown as FormFieldValues

    const responses = createResponsesV4(formFields, formInputs, QUARANTINE_MAP)

    expect(responses[ATTACHMENT_ID].answer).toEqual({
      value: 'quarantine/key-123',
      hasBeenScanned: false,
    })
  })

  it('throws when an attachment has no quarantine bucket key', () => {
    const formFields = [mockField(ATTACHMENT_ID, BasicField.Attachment)]
    const formInputs = {
      [ATTACHMENT_ID]: new File(['content'], 'file.pdf'),
    } as unknown as FormFieldValues

    expect(() => createResponsesV4(formFields, formInputs, [])).toThrow(
      `Attachment response with fieldId ${ATTACHMENT_ID} not found among attachments uploaded to quarantine bucket`,
    )
  })

  it('skips empty inputs the same way as V3', () => {
    const formFields = [
      mockField(TEXT_ID, BasicField.ShortText),
      mockField(CHECKBOX_ID, BasicField.Checkbox),
      mockField(TABLE_ID, BasicField.Table),
      mockField(SIGNATURE_ID, BasicField.Signature),
    ]
    const formInputs = {
      [TEXT_ID]: '',
      [CHECKBOX_ID]: { value: false },
      [TABLE_ID]: [{ col1: '', col2: '' }],
      [SIGNATURE_ID]: { type: '', value: [] },
    } as unknown as FormFieldValues

    const responses = createResponsesV4(formFields, formInputs, [])

    expect(responses).toEqual({})
  })

  it('stamps provenance: {} on every response (V4 detection is duck-typed on it)', () => {
    const formFields = [
      mockField(TEXT_ID, BasicField.ShortText),
      mockField(RADIO_ID, BasicField.Radio),
    ]
    const formInputs = {
      [TEXT_ID]: 'answer',
      [RADIO_ID]: { value: 'Option A' },
    } as FormFieldValues

    const responses = createResponsesV4(formFields, formInputs, [])

    for (const response of Object.values(responses)) {
      expect(response.provenance).toEqual({})
    }
  })

  describe('parity with adaptV3ToV4(createResponsesV3(x))', () => {
    it('produces the same fieldType and answer for every field type', () => {
      const formFields = [
        mockField(TEXT_ID, BasicField.ShortText),
        mockField(YESNO_ID, BasicField.YesNo),
        mockField(EMAIL_ID, BasicField.Email),
        mockField(MOBILE_ID, BasicField.Mobile),
        mockField(RADIO_ID, BasicField.Radio),
        mockField(CHECKBOX_ID, BasicField.Checkbox),
        mockField(TABLE_ID, BasicField.Table),
        mockField(ADDRESS_ID, BasicField.Address),
        mockField(ATTACHMENT_ID, BasicField.Attachment),
        mockField(SIGNATURE_ID, BasicField.Signature),
      ]
      const formInputs = {
        [TEXT_ID]: 'hello',
        [YESNO_ID]: 'No',
        [EMAIL_ID]: { value: 'a@example.com', signature: 'sig' },
        [MOBILE_ID]: { value: '+6598765432' },
        [RADIO_ID]: {
          value: RADIO_OTHERS_INPUT_VALUE,
          othersInput: 'custom radio',
        },
        [CHECKBOX_ID]: { value: ['A', 'B'], othersInput: 'custom checkbox' },
        [TABLE_ID]: [
          { col1: 'r1c1', col2: 'r1c2' },
          { col1: 'r2c1', col2: 'r2c2' },
        ],
        [ADDRESS_ID]: {
          addressSubFields: {
            postalCode: '123456',
            blockNumber: '12A',
            streetName: 'Main Street',
            buildingName: 'Tower 1',
            levelNumber: '05',
            unitNumber: '01',
          },
        },
        [ATTACHMENT_ID]: new File(['content'], 'file.pdf'),
        [SIGNATURE_ID]: {
          type: 'draw',
          value: [
            [
              [1, 2, 0.5],
              [3, 4, 0.6],
            ],
          ],
        },
      } as unknown as FormFieldValues

      const v4 = createResponsesV4(formFields, formInputs, QUARANTINE_MAP)
      const adapted = adaptV3ToV4(
        createResponsesV3(
          formFields,
          formInputs,
          QUARANTINE_MAP,
        ) as unknown as Parameters<typeof adaptV3ToV4>[0],
      )

      expect(Object.keys(v4).sort()).toEqual(Object.keys(adapted).sort())

      for (const id of Object.keys(v4)) {
        expect(v4[id].fieldType as string).toEqual(adapted[id].fieldType)
        if (v4[id].fieldType === BasicField.Table) {
          // rowIds are freshly generated on both sides; compare row contents
          const normalize = (answer: TableAnswerV4) =>
            Object.values(answer).sort((a, b) => a.rowNum - b.rowNum)
          expect(normalize(v4[id].answer as TableAnswerV4)).toEqual(
            normalize(adapted[id].answer as TableAnswerV4),
          )
        } else {
          expect(v4[id].answer).toEqual(adapted[id].answer)
        }
      }
    })
  })
})
