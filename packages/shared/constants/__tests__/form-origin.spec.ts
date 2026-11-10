import { FormOrigin } from '../../types/form/form'
import { isNewProcessFormOrigin } from '../form-origin'

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
