import { FormOrigin } from '../../types/form/form'
import {
  FORM_ORIGIN_MEDIUM_OPTIONS,
  FORM_ORIGIN_OPTIONS,
  isNewProcessFormOrigin,
} from '../form-origin'

describe('FORM_ORIGIN_OPTIONS', () => {
  it('lists every recognised origin code exactly once', () => {
    expect([...FORM_ORIGIN_OPTIONS].sort()).toEqual(
      [...Object.values(FormOrigin)].sort(),
    )
  })

  it('places form-builder first among the mediums, ahead of email/document/spreadsheet/paper', () => {
    expect(FORM_ORIGIN_MEDIUM_OPTIONS).toEqual([
      FormOrigin.DigitalFormBuilder,
      FormOrigin.DigitalEmail,
      FormOrigin.DigitalDocument,
      FormOrigin.DigitalSpreadsheet,
      FormOrigin.Paper,
    ])
  })
})

describe('FORM_ORIGIN_MEDIUM_OPTIONS', () => {
  it('excludes exactly the new-process value and preserves the master ordering', () => {
    expect(FORM_ORIGIN_MEDIUM_OPTIONS).toEqual(
      FORM_ORIGIN_OPTIONS.filter((code) => code !== FormOrigin.DigitalNew),
    )
    expect(FORM_ORIGIN_MEDIUM_OPTIONS).not.toContain(FormOrigin.DigitalNew)
  })
})

describe('isNewProcessFormOrigin', () => {
  it('returns true when the value is solely the new-process code', () => {
    expect(isNewProcessFormOrigin([FormOrigin.DigitalNew])).toBe(true)
  })

  it('returns false for an empty value', () => {
    expect(isNewProcessFormOrigin([])).toBe(false)
  })

  it('returns false for medium-only values', () => {
    expect(isNewProcessFormOrigin([FormOrigin.Paper])).toBe(false)
    expect(
      isNewProcessFormOrigin([FormOrigin.Paper, FormOrigin.DigitalEmail]),
    ).toBe(false)
  })

  it('returns false for a value mixing the new-process code with a medium', () => {
    expect(
      isNewProcessFormOrigin([FormOrigin.DigitalNew, FormOrigin.Paper]),
    ).toBe(false)
  })
})
