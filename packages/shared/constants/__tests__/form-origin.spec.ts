import { FormOrigin } from '../../types/form/form'
import { FORM_ORIGIN_OPTIONS, FORM_ORIGIN_OTHERS_VALUE } from '../form-origin'

describe('FORM_ORIGIN_OPTIONS', () => {
  it('lists every recognised origin code exactly once', () => {
    expect([...FORM_ORIGIN_OPTIONS].sort()).toEqual(
      [...Object.values(FormOrigin)].sort(),
    )
  })

  it('includes the free-text trigger option', () => {
    expect(FORM_ORIGIN_OPTIONS).toContain(FORM_ORIGIN_OTHERS_VALUE)
  })
})
