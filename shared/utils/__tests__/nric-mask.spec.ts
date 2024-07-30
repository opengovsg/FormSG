import { maskNric } from '../nric-mask'

describe('Nric masking utility', () => {
  it('should mask the nric', () => {
    const unmasked_nric = 'S1234567A'
    const masked_nric = '*****567A'

    expect(maskNric(unmasked_nric)).toEqual(masked_nric)
  })
})
