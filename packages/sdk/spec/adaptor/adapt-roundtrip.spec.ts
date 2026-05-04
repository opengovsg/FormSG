import { adaptV3ToV4 } from '../../src/adapt-v3-to-v4'
import { adaptV4ToV3 } from '../../src/adapt-v4-to-v3'
import { plaintext } from '../resources/crypto-v3-data-20260428'
import { FormFieldsV3 } from '../../src/types'
import { FieldResponsesV4, TableAnswerV4 } from '../../src/types-v4'

/**
 * Normalise table answer keys so that two V4 objects can be compared even when
 * the random UUID keys differ between conversion runs.  Keys are replaced with
 * deterministic `row0`, `row1`, … based on `rowNum` order.
 */
function normaliseTableKeys(v4: FieldResponsesV4): FieldResponsesV4 {
  const out: FieldResponsesV4 = {}
  for (const [fieldId, field] of Object.entries(v4)) {
    if (field.fieldType === 'table') {
      const table = field.answer as TableAnswerV4
      const sorted = Object.values(table).sort((a, b) => a.rowNum - b.rowNum)
      const normalised: TableAnswerV4 = {}
      sorted.forEach((row, i) => {
        normalised[`row${i}`] = row
      })
      out[fieldId] = { ...field, answer: normalised }
    } else {
      out[fieldId] = field
    }
  }
  return out
}

/**
 * Round-trip tests using real submission data from 2026-04-28.
 *
 * Ensures that converting v3 → v4 → v3 → v4 produces stable, identical
 * results at each version, proving the adaptors are fully backwards compatible.
 */
describe('v3 ↔ v4 round-trip backwards compatibility (2026-04-28 data)', () => {
  const v3Original = plaintext.responses as FormFieldsV3

  // Fix provenance so comparisons are deterministic.
  const provenance = {}

  it('should produce identical v3 after v3 → v4 → v3', () => {
    const v4First = adaptV3ToV4(v3Original, { provenance })
    const v3RoundTripped = adaptV4ToV3(v4First)

    expect(v3RoundTripped).toEqual(v3Original)
  })

  it('should produce identical v4 after v3 → v4 → v3 → v4', () => {
    const v4First = adaptV3ToV4(v3Original, { provenance })
    const v3RoundTripped = adaptV4ToV3(v4First)
    const v4Second = adaptV3ToV4(v3RoundTripped, { provenance })

    // Table row keys are random UUIDs, so normalise before comparing
    expect(normaliseTableKeys(v4Second)).toEqual(normaliseTableKeys(v4First))
  })

  it('should preserve all field IDs through the round-trip', () => {
    const originalFieldIds = Object.keys(v3Original).sort()
    const v4First = adaptV3ToV4(v3Original, { provenance })
    const v3RoundTripped = adaptV4ToV3(v4First)
    const v4Second = adaptV3ToV4(v3RoundTripped, { provenance })

    expect(Object.keys(v3RoundTripped).sort()).toEqual(originalFieldIds)
    expect(Object.keys(v4Second).sort()).toEqual(originalFieldIds)
  })

  it('should preserve fieldType for every field through the round-trip', () => {
    const v4First = adaptV3ToV4(v3Original, { provenance })
    const v3RoundTripped = adaptV4ToV3(v4First)
    const v4Second = adaptV3ToV4(v3RoundTripped, { provenance })

    for (const fieldId of Object.keys(v3Original)) {
      expect(v3RoundTripped[fieldId].fieldType).toBe(
        v3Original[fieldId].fieldType,
      )
      expect(v4Second[fieldId].fieldType).toBe(v4First[fieldId].fieldType)
    }
  })
})
