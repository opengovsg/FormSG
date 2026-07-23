import type { FieldResponseV4 } from '@opengovsg/formsg-sdk'

import { isFieldResponseV4Equal } from '../response-v4'

describe('isFieldResponseV4Equal', () => {
  const makeTableResponse = (
    answer: FieldResponseV4['answer'],
  ): FieldResponseV4 =>
    ({
      fieldType: 'table',
      question: 'Table question',
      answer,
      provenance: {},
    }) as FieldResponseV4

  describe('table fields', () => {
    it('should return true when rows match but row keys differ', () => {
      // Arrange
      // Same content adapted twice from V3 mints different row keys.
      const incoming = makeTableResponse({
        '06e4a2bc-f496-4e75-b326-65bcd209fa76': {
          rowNum: 0,
          value: { col1: 'a', col2: 'b' },
        },
        '1cec1e99-0201-427e-ada0-fe6b1cd60904': {
          rowNum: 1,
          value: { col1: 'c', col2: 'd' },
        },
      })
      const previous = makeTableResponse({
        '89e090e1-362b-4320-9906-38f96656e8cd': {
          rowNum: 0,
          value: { col1: 'a', col2: 'b' },
        },
        '2365c0c9-69fc-40c9-a55f-9834369cab3d': {
          rowNum: 1,
          value: { col1: 'c', col2: 'd' },
        },
      })

      // Act + Assert
      expect(isFieldResponseV4Equal(incoming, previous)).toBe(true)
    })

    it('should return true when rows are enumerated in different orders', () => {
      // Arrange
      const incoming = makeTableResponse({
        rowB: { rowNum: 1, value: { col1: 'c' } },
        rowA: { rowNum: 0, value: { col1: 'a' } },
      })
      const previous = makeTableResponse({
        rowX: { rowNum: 0, value: { col1: 'a' } },
        rowY: { rowNum: 1, value: { col1: 'c' } },
      })

      // Act + Assert
      expect(isFieldResponseV4Equal(incoming, previous)).toBe(true)
    })

    it('should return false when a cell value differs', () => {
      // Arrange
      const incoming = makeTableResponse({
        rowA: { rowNum: 0, value: { col1: 'a' } },
      })
      const previous = makeTableResponse({
        rowX: { rowNum: 0, value: { col1: 'CHANGED' } },
      })

      // Act + Assert
      expect(isFieldResponseV4Equal(incoming, previous)).toBe(false)
    })

    it('should return false when row counts differ', () => {
      // Arrange
      const incoming = makeTableResponse({
        rowA: { rowNum: 0, value: { col1: 'a' } },
        rowB: { rowNum: 1, value: { col1: 'c' } },
      })
      const previous = makeTableResponse({
        rowX: { rowNum: 0, value: { col1: 'a' } },
      })

      // Act + Assert
      expect(isFieldResponseV4Equal(incoming, previous)).toBe(false)
    })

    it('should return false when rowNums differ for the same content', () => {
      // Arrange
      const incoming = makeTableResponse({
        rowA: { rowNum: 0, value: { col1: 'a' } },
      })
      const previous = makeTableResponse({
        rowX: { rowNum: 1, value: { col1: 'a' } },
      })

      // Act + Assert
      expect(isFieldResponseV4Equal(incoming, previous)).toBe(false)
    })
  })

  describe('non-table fields', () => {
    it('should return false when field types differ', () => {
      // Arrange
      const l = {
        fieldType: 'textfield',
        question: 'Q',
        answer: { value: 'a' },
        provenance: {},
      } as FieldResponseV4
      const r = {
        fieldType: 'number',
        question: 'Q',
        answer: { value: 'a' },
        provenance: {},
      } as FieldResponseV4

      // Act + Assert
      expect(isFieldResponseV4Equal(l, r)).toBe(false)
    })

    it('should compare non-table answers by deep equality', () => {
      // Arrange
      const l = {
        fieldType: 'textfield',
        question: 'Q',
        answer: { value: 'a' },
        provenance: {},
      } as FieldResponseV4
      const r = {
        fieldType: 'textfield',
        question: 'Q',
        answer: { value: 'a' },
        provenance: { submittedAt: '2026-07-21T01:44:40.231Z' },
      } as FieldResponseV4

      // Act + Assert
      expect(isFieldResponseV4Equal(l, r)).toBe(true)
    })
  })
})
