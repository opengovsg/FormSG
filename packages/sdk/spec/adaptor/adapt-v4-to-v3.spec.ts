import { adaptV4ToV3 } from '../../src/adapt-v4-to-v3'
import { FieldResponsesV4 } from '../../src/types-v4'

describe('adaptV4ToV3', () => {

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
      'should convert %s field answer back to plain string',
      (fieldType) => {
        const v4: FieldResponsesV4 = {
          field1: {
            fieldType,
            question: 'Q',
            answer: { value: 'hello' },
            provenance: {},
          },
        }

        const result = adaptV4ToV3(v4)

        expect(result.field1).toEqual({
          fieldType,
          answer: 'hello',
        })
      }
    )
  })

  describe('yes_no field', () => {
    it('should convert Yes answer back', () => {
      const v4: FieldResponsesV4 = {
        field1: {
          fieldType: 'yes_no',
          question: 'Q',
          answer: { value: 'Yes' },
          provenance: {},
        },
      }

      const result = adaptV4ToV3(v4)

      expect(result.field1.answer).toBe('Yes')
    })

    it('should convert No answer back', () => {
      const v4: FieldResponsesV4 = {
        field1: {
          fieldType: 'yes_no',
          question: 'Q',
          answer: { value: 'No' },
          provenance: {},
        },
      }

      const result = adaptV4ToV3(v4)

      expect(result.field1.answer).toBe('No')
    })
  })

  describe('email field', () => {
    it('should convert email answer with signature', () => {
      const v4: FieldResponsesV4 = {
        field1: {
          fieldType: 'email',
          question: 'Q',
          answer: { value: 'test@example.com', signature: 'abc123' },
          provenance: {},
        },
      }

      const result = adaptV4ToV3(v4)

      expect(result.field1.answer).toEqual({
        value: 'test@example.com',
        signature: 'abc123',
      })
    })

    it('should convert email answer without signature', () => {
      const v4: FieldResponsesV4 = {
        field1: {
          fieldType: 'email',
          question: 'Q',
          answer: { value: 'test@example.com' },
          provenance: {},
        },
      }

      const result = adaptV4ToV3(v4)

      expect(result.field1.answer).toEqual({ value: 'test@example.com' })
      expect(result.field1.answer).not.toHaveProperty('signature')
    })
  })

  describe('mobile field', () => {
    it('should convert mobile answer with signature', () => {
      const v4: FieldResponsesV4 = {
        field1: {
          fieldType: 'mobile',
          question: 'Q',
          answer: { value: '+6591234567', signature: 'sig' },
          provenance: {},
        },
      }

      const result = adaptV4ToV3(v4)

      expect(result.field1.answer).toEqual({
        value: '+6591234567',
        signature: 'sig',
      })
    })
  })

  describe('radiobutton field', () => {
    it('should convert normal radio selection back to { value }', () => {
      const v4: FieldResponsesV4 = {
        field1: {
          fieldType: 'radiobutton',
          question: 'Q',
          answer: { value: 'Option A', isOthersInput: false },
          provenance: {},
        },
      }

      const result = adaptV4ToV3(v4)

      expect(result.field1.answer).toEqual({ value: 'Option A' })
    })

    it('should convert others input back to { othersInput }', () => {
      const v4: FieldResponsesV4 = {
        field1: {
          fieldType: 'radiobutton',
          question: 'Q',
          answer: { value: 'Custom answer', isOthersInput: true },
          provenance: {},
        },
      }

      const result = adaptV4ToV3(v4)

      expect(result.field1.answer).toEqual({ othersInput: 'Custom answer' })
    })
  })

  describe('checkbox field', () => {
    it('should convert checkbox answer without others', () => {
      const v4: FieldResponsesV4 = {
        field1: {
          fieldType: 'checkbox',
          question: 'Q',
          answer: { value: ['A', 'B'] },
          provenance: {},
        },
      }

      const result = adaptV4ToV3(v4)

      expect(result.field1.answer).toEqual({ value: ['A', 'B'] })
      expect(result.field1.answer).not.toHaveProperty('othersInput')
    })

    it('should convert checkbox answer with others', () => {
      const v4: FieldResponsesV4 = {
        field1: {
          fieldType: 'checkbox',
          question: 'Q',
          answer: { value: ['A'], othersInput: 'Custom' },
          provenance: {},
        },
      }

      const result = adaptV4ToV3(v4)

      expect(result.field1.answer).toEqual({
        value: ['A'],
        othersInput: 'Custom',
      })
    })
  })

  describe('attachment field', () => {
    it('should convert attachment answer with md5Hash', () => {
      const v4: FieldResponsesV4 = {
        field1: {
          fieldType: 'attachment',
          question: 'Q',
          answer: {
            value: 'file.pdf',
            hasBeenScanned: true,
            md5Hash: 'abc123',
          },
          provenance: {},
        },
      }

      const result = adaptV4ToV3(v4)

      expect(result.field1.answer).toEqual({
        answer: 'file.pdf',
        hasBeenScanned: true,
        md5Hash: 'abc123',
      })
    })

    it('should convert attachment answer without md5Hash', () => {
      const v4: FieldResponsesV4 = {
        field1: {
          fieldType: 'attachment',
          question: 'Q',
          answer: { value: 'doc.txt', hasBeenScanned: false },
          provenance: {},
        },
      }

      const result = adaptV4ToV3(v4)

      expect(result.field1.answer).toEqual({
        answer: 'doc.txt',
        hasBeenScanned: false,
      })
      expect(result.field1.answer).not.toHaveProperty('md5Hash')
    })
  })

  describe('table field', () => {
    it('should convert table rows back to array', () => {
      const v4: FieldResponsesV4 = {
        field1: {
          fieldType: 'table',
          question: 'Q',
          answer: {
            row0: { rowNum: 0, value: { col1: 'a', col2: 'b' } },
            row1: { rowNum: 1, value: { col1: 'c', col2: 'd' } },
          },
          provenance: {},
        },
      }

      const result = adaptV4ToV3(v4)

      expect(result.field1.answer).toEqual([
        { col1: 'a', col2: 'b' },
        { col1: 'c', col2: 'd' },
      ])
    })

    it('should sort table rows by rowNum', () => {
      const v4: FieldResponsesV4 = {
        field1: {
          fieldType: 'table',
          question: 'Q',
          answer: {
            rowB: { rowNum: 1, value: { col1: 'second' } },
            rowA: { rowNum: 0, value: { col1: 'first' } },
          },
          provenance: {},
        },
      }

      const result = adaptV4ToV3(v4)

      expect(result.field1.answer).toEqual([
        { col1: 'first' },
        { col1: 'second' },
      ])
    })
  })

  describe('children field', () => {
    it('should convert children answer back', () => {
      const v4: FieldResponsesV4 = {
        field1: {
          fieldType: 'children',
          question: 'Q',
          answer: {
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
          },
          provenance: {},
        },
      }

      const result = adaptV4ToV3(v4)

      expect(result.field1.answer).toEqual({
        child: [
          ['Alice', '10'],
          ['Bob', '12'],
        ],
        childFields: ['name', 'age'],
      })
    })

    it('should return empty arrays for empty children', () => {
      const v4: FieldResponsesV4 = {
        field1: {
          fieldType: 'children',
          question: 'Q',
          answer: {},
          provenance: {},
        },
      }

      const result = adaptV4ToV3(v4)

      expect(result.field1.answer).toEqual({
        child: [],
        childFields: [],
      })
    })
  })

  describe('address field', () => {
    it('should convert address answer back', () => {
      const v4: FieldResponsesV4 = {
        field1: {
          fieldType: 'address',
          question: 'Q',
          answer: {
            postalCode: { value: '123456' },
            blockNumber: { value: '1' },
            streetName: { value: 'Test St' },
            buildingName: { value: 'Tower' },
            levelNumber: { value: '10' },
            unitNumber: { value: '01' },
          },
          provenance: {},
        },
      }

      const result = adaptV4ToV3(v4)

      expect(result.field1.answer).toEqual({
        addressSubFields: {
          postalCode: '123456',
          blockNumber: '1',
          streetName: 'Test St',
          buildingName: 'Tower',
          levelNumber: '10',
          unitNumber: '01',
        },
      })
    })
  })

  describe('signature field', () => {
    it('should convert signature answer back', () => {
      const strokeData: [number, number, number][][] = [
        [
          [10, 20, 0.5],
          [11, 21, 0.6],
        ],
      ]
      const v4: FieldResponsesV4 = {
        field1: {
          fieldType: 'signature',
          question: 'Q',
          answer: { value: strokeData, type: 'draw' },
          provenance: {},
        },
      }

      const result = adaptV4ToV3(v4)

      expect(result.field1.answer).toEqual({
        type: 'draw',
        value: strokeData,
      })
    })
  })

  describe('myInfo preservation', () => {
    it('should preserve myInfo metadata in v3 output', () => {
      const v4: FieldResponsesV4 = {
        field1: {
          fieldType: 'textfield',
          question: '[Myinfo] Name',
          answer: { value: 'Alice' },
          provenance: {},
          myInfo: { attr: 'name' },
        },
      }

      const result = adaptV4ToV3(v4)

      expect(result.field1).toEqual({
        fieldType: 'textfield',
        answer: 'Alice',
        myInfo: { attr: 'name' },
      })
    })

    it('should not include myInfo when not present', () => {
      const v4: FieldResponsesV4 = {
        field1: {
          fieldType: 'textfield',
          question: 'Name',
          answer: { value: 'Alice' },
          provenance: {},
        },
      }

      const result = adaptV4ToV3(v4)

      expect(result.field1).not.toHaveProperty('myInfo')
    })
  })

  describe('multiple fields', () => {
    it('should convert multiple fields in a single call', () => {
      const v4: FieldResponsesV4 = {
        f1: {
          fieldType: 'textfield',
          question: 'Q1',
          answer: { value: 'hello' },
          provenance: {},
        },
        f2: {
          fieldType: 'yes_no',
          question: 'Q2',
          answer: { value: 'Yes' },
          provenance: {},
        },
        f3: {
          fieldType: 'number',
          question: 'Q3',
          answer: { value: '42' },
          provenance: {},
        },
      }

      const result = adaptV4ToV3(v4)

      expect(Object.keys(result)).toEqual(['f1', 'f2', 'f3'])
      expect(result.f1.answer).toBe('hello')
      expect(result.f2.answer).toBe('Yes')
      expect(result.f3.answer).toBe('42')
    })
  })
})
