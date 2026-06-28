import { adaptV3ToV4 } from '../../src/adapt-v3-to-v4'
import { FieldType, FormFieldsV3 } from '../../src/types'
import { AddressAnswerV4 } from '../../src/types-v4'

describe('adaptV3ToV4', () => {

  describe('generic string fields', () => {
    const stringFieldTypes = [
      'section',
      'number',
      'decimal',
      'textfield',
      'textarea',
      'homeno',
      'dropdown',
      'rating',
      'nric',
      'uen',
      'date',
      'country_region',
    ] as const

    it.each(stringFieldTypes)(
      'should convert %s field answer to { value } shape',
      (fieldType) => {
        const v3: FormFieldsV3 = {
          field1: { fieldType, answer: 'hello' },
        }

        const result = adaptV3ToV4(v3)

        expect(result.field1).toEqual(
          expect.objectContaining({
            fieldType,
            answer: { value: 'hello' },
          })
        )
      }
    )
  })

  describe('yes_no field', () => {
    it('should convert Yes answer', () => {
      const v3: FormFieldsV3 = {
        field1: { fieldType: 'yes_no', answer: 'Yes' },
      }

      const result = adaptV3ToV4(v3)

      expect(result.field1.answer).toEqual({ value: 'Yes' })
    })

    it('should convert No answer', () => {
      const v3: FormFieldsV3 = {
        field1: { fieldType: 'yes_no', answer: 'No' },
      }

      const result = adaptV3ToV4(v3)

      expect(result.field1.answer).toEqual({ value: 'No' })
    })
  })

  describe('email field', () => {
    it('should convert email answer with signature', () => {
      const v3: FormFieldsV3 = {
        field1: {
          fieldType: 'email',
          answer: { value: 'test@example.com', signature: 'abc123' },
        },
      }

      const result = adaptV3ToV4(v3)

      expect(result.field1.answer).toEqual({
        value: 'test@example.com',
        signature: 'abc123',
      })
    })

    it('should convert email answer without signature', () => {
      const v3: FormFieldsV3 = {
        field1: {
          fieldType: 'email',
          answer: { value: 'test@example.com' },
        },
      }

      const result = adaptV3ToV4(v3)

      expect(result.field1.answer).toEqual({ value: 'test@example.com' })
      expect(result.field1.answer).not.toHaveProperty('signature')
    })
  })

  describe('mobile field', () => {
    it('should convert mobile answer with signature', () => {
      const v3: FormFieldsV3 = {
        field1: {
          fieldType: 'mobile',
          answer: { value: '+6591234567', signature: 'sig' },
        },
      }

      const result = adaptV3ToV4(v3)

      expect(result.field1.answer).toEqual({
        value: '+6591234567',
        signature: 'sig',
      })
    })
  })

  describe('radiobutton field', () => {
    it('should convert normal radio selection', () => {
      const v3: FormFieldsV3 = {
        field1: {
          fieldType: 'radiobutton',
          answer: { value: 'Option A' },
        },
      }

      const result = adaptV3ToV4(v3)

      expect(result.field1.answer).toEqual({
        value: 'Option A',
        isOthersInput: false,
      })
    })

    it('should convert others input', () => {
      const v3: FormFieldsV3 = {
        field1: {
          fieldType: 'radiobutton',
          answer: { othersInput: 'Custom answer' },
        },
      }

      const result = adaptV3ToV4(v3)

      expect(result.field1.answer).toEqual({
        value: 'Custom answer',
        isOthersInput: true,
      })
    })
  })

  describe('checkbox field', () => {
    it('should convert checkbox answer without others', () => {
      const v3: FormFieldsV3 = {
        field1: {
          fieldType: 'checkbox',
          answer: { value: ['A', 'B'] },
        },
      }

      const result = adaptV3ToV4(v3)

      expect(result.field1.answer).toEqual({ value: ['A', 'B'] })
      expect(result.field1.answer).not.toHaveProperty('othersInput')
    })

    it('should convert checkbox answer with others', () => {
      const v3: FormFieldsV3 = {
        field1: {
          fieldType: 'checkbox',
          answer: { value: ['A'], othersInput: 'Custom' },
        },
      }

      const result = adaptV3ToV4(v3)

      expect(result.field1.answer).toEqual({
        value: ['A'],
        othersInput: 'Custom',
      })
    })

    it('should preserve internal checkbox others sentinel in value array', () => {
      const v3: FormFieldsV3 = {
        field1: {
          fieldType: 'checkbox',
          answer: {
            value: ['A', '!!FORMSG_INTERNAL_CHECKBOX_OTHERS_VALUE!!'],
            othersInput: 'Custom',
          },
        },
      }

      const result = adaptV3ToV4(v3)

      expect(result.field1.answer).toEqual({
        value: ['A', '!!FORMSG_INTERNAL_CHECKBOX_OTHERS_VALUE!!'],
        othersInput: 'Custom',
      })
    })
  })

  describe('attachment field', () => {
    it('should convert attachment answer with md5Hash', () => {
      const v3: FormFieldsV3 = {
        field1: {
          fieldType: 'attachment',
          answer: {
            hasBeenScanned: true,
            answer: 'file.pdf',
            md5Hash: 'abc123',
          },
        },
      }

      const result = adaptV3ToV4(v3)

      expect(result.field1.answer).toEqual({
        value: 'file.pdf',
        hasBeenScanned: true,
        md5Hash: 'abc123',
      })
    })

    it('should convert attachment answer without md5Hash', () => {
      const v3: FormFieldsV3 = {
        field1: {
          fieldType: 'attachment',
          answer: { hasBeenScanned: false, answer: 'doc.txt' },
        },
      }

      const result = adaptV3ToV4(v3)

      expect(result.field1.answer).toEqual({
        value: 'doc.txt',
        hasBeenScanned: false,
      })
      expect(result.field1.answer).not.toHaveProperty('md5Hash')
    })
  })

  describe('table field', () => {
    it('should convert table rows to keyed object with UUID keys', () => {
      const v3: FormFieldsV3 = {
        field1: {
          fieldType: 'table',
          answer: [
            { col1: 'a', col2: 'b' },
            { col1: 'c', col2: 'd' },
          ],
        },
      }

      const result = adaptV3ToV4(v3)

      const tableAnswer = result.field1.answer as Record<string, { rowNum: number; value: Record<string, string> }>
      const rows = Object.entries(tableAnswer)
      expect(rows).toHaveLength(2)

      // Keys should be UUIDs
      for (const [key] of rows) {
        expect(key).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
      }

      // Sort by rowNum to verify values
      rows.sort((a, b) => a[1].rowNum - b[1].rowNum)
      expect(rows[0][1]).toEqual({ rowNum: 0, value: { col1: 'a', col2: 'b' } })
      expect(rows[1][1]).toEqual({ rowNum: 1, value: { col1: 'c', col2: 'd' } })
    })
  })

  describe('children field', () => {
    it('should convert children answer', () => {
      const v3: FormFieldsV3 = {
        field1: {
          fieldType: 'children',
          answer: {
            child: [
              ['Alice', '10'],
              ['Bob', '12'],
            ],
            childFields: ['name', 'age'],
          },
        },
      }

      const result = adaptV3ToV4(v3)

      expect(result.field1.answer).toEqual({
        child0: {
          value: {
            name: { value: 'Alice', myInfo: { attr: 'name' } },
            age: { value: '10', myInfo: { attr: 'age' } },
          },
        },
        child1: {
          value: {
            name: { value: 'Bob', myInfo: { attr: 'name' } },
            age: { value: '12', myInfo: { attr: 'age' } },
          },
        },
      })
    })

    // Characterisation test for the children-v2 storage shape (ADR-0001).
    // The v4 answerObject already produces exactly what v2 needs for a local
    // child: a single un-numbered `[Myinfo] Children` field whose answer nests
    // each sub-field under one child key — no `Child 1 / Child 2` numbering in
    // the question label or the sub-field keys. This locks that shape so it is
    // ready to flip on when storage-mode v4 lands; the per-child `type`
    // (nuclear/sponsored) stamp is added with sponsored support (slice 03).
    it('produces the children-v2 shape: one un-numbered local child, nested per sub-field', () => {
      const v3: FormFieldsV3 = {
        childrenField: {
          fieldType: 'children',
          answer: {
            child: [['Tan Wen Jie', 'S1234567A', 'MALE']],
            childFields: ['childname', 'childbirthcertno', 'childgender'],
          },
        },
      }

      const result = adaptV3ToV4(v3, {
        formFields: {
          childrenField: {
            question: 'Children',
            myInfo: { attr: 'childrenbirthrecords' },
          },
        },
      })

      expect(result.childrenField.question).toBe('[Myinfo] Children')
      expect(result.childrenField.question).not.toMatch(/Child\s*\d/)
      expect(Object.keys(result.childrenField.answer)).toEqual(['child0'])
      expect(result.childrenField.answer).toEqual({
        child0: {
          value: {
            childname: {
              value: 'Tan Wen Jie',
              myInfo: { attr: 'childname' },
            },
            childbirthcertno: {
              value: 'S1234567A',
              myInfo: { attr: 'childbirthcertno' },
            },
            childgender: { value: 'MALE', myInfo: { attr: 'childgender' } },
          },
        },
      })
    })

    // children-v2 sponsored support (ADR-0002): a per-child record type
    // (nuclear/sponsored) is threaded into ChildEntryV4.type when the V3
    // answer carries a parallel `childrenTypes` array.
    it('stamps per-child record type from childrenTypes', () => {
      const v3: FormFieldsV3 = {
        field1: {
          fieldType: 'children',
          answer: {
            child: [
              ['Local Tan', 'S1111111A'],
              ['Sponsored Lee', 'T2222222B'],
            ],
            childFields: ['childname', 'childbirthcertno'],
            childrenTypes: ['nuclear', 'sponsored'],
          },
        },
      }

      const result = adaptV3ToV4(v3)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const answer = result.field1.answer as any
      expect(answer.child0.type).toBe('nuclear')
      expect(answer.child1.type).toBe('sponsored')
    })
  })

  describe('address field', () => {
    it('should convert address answer', () => {
      const v3: FormFieldsV3 = {
        field1: {
          fieldType: 'address',
          answer: {
            addressSubFields: {
              postalCode: '123456',
              blockNumber: '1',
              streetName: 'Test St',
              buildingName: 'Tower',
              levelNumber: '10',
              unitNumber: '01',
            },
          },
        },
      }

      const result = adaptV3ToV4(v3)

      expect(result.field1.answer).toEqual({
        postalCode: { value: '123456' },
        blockNumber: { value: '1' },
        streetName: { value: 'Test St' },
        buildingName: { value: 'Tower' },
        levelNumber: { value: '10' },
        unitNumber: { value: '01' },
      })
    })

    it('should default missing address subfields to empty string', () => {
      const v3: FormFieldsV3 = {
        field1: {
          fieldType: 'address',
          answer: {
            addressSubFields: { postalCode: '123456' },
          },
        },
      }

      const result = adaptV3ToV4(v3)

      expect((result.field1.answer as AddressAnswerV4).blockNumber).toEqual({
        value: '',
      })
    })
  })

  describe('signature field', () => {
    it('should convert signature answer', () => {
      const strokeData: [number, number, number][][] = [
        [
          [10, 20, 0.5],
          [11, 21, 0.6],
        ],
      ]
      const v3: FormFieldsV3 = {
        field1: {
          fieldType: 'signature',
          answer: { type: 'draw', value: strokeData },
        },
      }

      const result = adaptV3ToV4(v3)

      expect(result.field1.answer).toEqual({
        value: strokeData,
        type: 'draw',
      })
    })
  })

  describe('options', () => {
    it('should use provided provenance', () => {
      const provenance = { submittedAt: '2025-06-01T12:00:00.000Z' }
      const v3: FormFieldsV3 = {
        field1: { fieldType: 'textfield', answer: 'hi' },
      }

      const result = adaptV3ToV4(v3, { provenance })

      expect(result.field1.provenance).toEqual(provenance)
    })

    it('should generate default provenance if none provided', () => {
      const v3: FormFieldsV3 = {
        field1: { fieldType: 'textfield', answer: 'hi' },
      }

      const result = adaptV3ToV4(v3)

      expect(result.field1.provenance).toHaveProperty('submittedAt')
      expect(typeof result.field1.provenance.submittedAt).toBe('string')
    })

    it('should populate question from formFields metadata', () => {
      const v3: FormFieldsV3 = {
        field1: { fieldType: 'textfield', answer: 'hi' },
      }

      const result = adaptV3ToV4(v3, {
        formFields: { field1: { question: 'What is your name?' } },
      })

      expect(result.field1.question).toBe('What is your name?')
    })

    it('should prepend [Myinfo] to question when myInfo is present', () => {
      const v3: FormFieldsV3 = {
        field1: { fieldType: 'textfield', answer: 'hi' },
      }

      const result = adaptV3ToV4(v3, {
        formFields: {
          field1: { question: 'Name', myInfo: { attr: 'name' } },
        },
      })

      expect(result.field1.question).toBe('[Myinfo] Name')
      expect(result.field1.myInfo).toEqual({ attr: 'name' })
    })

    it('should use empty question when formFields not provided', () => {
      const v3: FormFieldsV3 = {
        field1: { fieldType: 'textfield', answer: 'hi' },
      }

      const result = adaptV3ToV4(v3)

      expect(result.field1.question).toBe('')
    })
  })

  describe('multiple fields', () => {
    it('should convert multiple fields in a single call', () => {
      const v3: FormFieldsV3 = {
        f1: { fieldType: 'textfield', answer: 'hello' },
        f2: { fieldType: 'yes_no', answer: 'Yes' },
        f3: { fieldType: 'number', answer: '42' },
      }

      const result = adaptV3ToV4(v3)

      expect(Object.keys(result)).toEqual(['f1', 'f2', 'f3'])
      expect(result.f1.answer).toEqual({ value: 'hello' })
      expect(result.f2.answer).toEqual({ value: 'Yes' })
      expect(result.f3.answer).toEqual({ value: '42' })
    })
  })

  describe('unknown field types', () => {
    it('should coerce unknown field type answer to string', () => {
      const v3: FormFieldsV3 = {
        field1: {
          fieldType: 'unknown_type' as FieldType,
          answer: 'some value',
        },
      }

      const result = adaptV3ToV4(v3)

      expect(result.field1.answer).toEqual({ value: 'some value' })
    })
  })
})
