import {
  FORM_ORIGIN_OTHER_DETAIL_MAX_LENGTH,
  FORM_ORIGIN_OTHERS_PREFIX,
} from '../../constants/form-origin'
import { FormOrigin } from '../../types/form/form'
import {
  isValidFormOrigin,
  normalizeFormOrigins,
  validateFormOriginsSelection,
} from '../form-origin-validation'

describe('isValidFormOrigin', () => {
  it('accepts every recognised code', () => {
    Object.values(FormOrigin).forEach((code) => {
      expect(isValidFormOrigin(code)).toBe(true)
    })
  })

  it('rejects unknown or malformed values', () => {
    expect(isValidFormOrigin('digital-doc')).toBe(false)
    expect(isValidFormOrigin('')).toBe(false)
    expect(isValidFormOrigin(undefined)).toBe(false)
    expect(isValidFormOrigin(5)).toBe(false)
  })

  it('rejects an "Others" entry — embedded detail is not a bare code', () => {
    expect(
      isValidFormOrigin(`${FORM_ORIGIN_OTHERS_PREFIX}Carrier pigeon`),
    ).toBe(false)
  })
})

describe('validateFormOriginsSelection', () => {
  it('requires at least one origin', () => {
    expect(validateFormOriginsSelection([])).toBe('AT_LEAST_ONE')
    expect(validateFormOriginsSelection(undefined)).toBe('AT_LEAST_ONE')
  })

  it('rejects an unknown code in the selection', () => {
    expect(
      validateFormOriginsSelection([FormOrigin.Paper, 'digital-doc']),
    ).toBe('INVALID_VALUE')
  })

  it('passes a recognised single selection', () => {
    expect(validateFormOriginsSelection([FormOrigin.Paper])).toBeNull()
  })

  it('passes a recognised multi-selection (paper + spreadsheet)', () => {
    expect(
      validateFormOriginsSelection([
        FormOrigin.Paper,
        FormOrigin.DigitalSpreadsheet,
      ]),
    ).toBeNull()
  })

  it('passes an "Others" entry with its free-text detail embedded', () => {
    expect(
      validateFormOriginsSelection([
        FormOrigin.Paper,
        `${FORM_ORIGIN_OTHERS_PREFIX}Carrier pigeon`,
      ]),
    ).toBeNull()
  })

  it('requires the embedded detail when "Others" is selected bare', () => {
    expect(validateFormOriginsSelection([FormOrigin.DigitalOthers])).toBe(
      'OTHER_DETAIL_REQUIRED',
    )
  })

  it('requires non-blank embedded detail on an "Others" entry', () => {
    expect(
      validateFormOriginsSelection([`${FORM_ORIGIN_OTHERS_PREFIX}   `]),
    ).toBe('OTHER_DETAIL_REQUIRED')
  })

  it('passes embedded detail exactly at the length cap', () => {
    expect(
      validateFormOriginsSelection([
        `${FORM_ORIGIN_OTHERS_PREFIX}${'a'.repeat(
          FORM_ORIGIN_OTHER_DETAIL_MAX_LENGTH,
        )}`,
      ]),
    ).toBeNull()
  })

  it('rejects embedded detail longer than the length cap', () => {
    expect(
      validateFormOriginsSelection([
        `${FORM_ORIGIN_OTHERS_PREFIX}${'a'.repeat(
          FORM_ORIGIN_OTHER_DETAIL_MAX_LENGTH + 1,
        )}`,
      ]),
    ).toBe('OTHER_DETAIL_TOO_LONG')
  })

  it('rejects a repeated origin', () => {
    expect(
      validateFormOriginsSelection([FormOrigin.Paper, FormOrigin.Paper]),
    ).toBe('DUPLICATE_VALUE')
  })

  it('rejects two "Others" entries even when their details differ', () => {
    expect(
      validateFormOriginsSelection([
        `${FORM_ORIGIN_OTHERS_PREFIX}clinic system`,
        `${FORM_ORIGIN_OTHERS_PREFIX}google form`,
      ]),
    ).toBe('DUPLICATE_VALUE')
  })
})

describe('normalizeFormOrigins', () => {
  it('rebuilds a padded "Others" entry into canonical form', () => {
    expect(
      normalizeFormOrigins([
        FormOrigin.Paper,
        `${FORM_ORIGIN_OTHERS_PREFIX}   Carrier pigeon  `,
      ]),
    ).toEqual([FormOrigin.Paper, `${FORM_ORIGIN_OTHERS_PREFIX}Carrier pigeon`])
  })

  it('returns already-canonical entries unchanged', () => {
    const entries = [
      FormOrigin.Paper,
      `${FORM_ORIGIN_OTHERS_PREFIX}Carrier pigeon`,
    ]
    expect(normalizeFormOrigins(entries)).toEqual(entries)
  })
})
