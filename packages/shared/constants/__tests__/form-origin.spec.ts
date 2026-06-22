import { FormOrigin } from '../../types/form/form'
import { FORM_ORIGIN_OPTIONS } from '../form-origin'

describe('FORM_ORIGIN_OPTIONS', () => {
  it('lists every recognised origin code exactly once', () => {
    expect([...FORM_ORIGIN_OPTIONS].sort()).toEqual(
      [...Object.values(FormOrigin)].sort(),
    )
  })
})
