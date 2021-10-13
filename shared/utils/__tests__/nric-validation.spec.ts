import { isMFinSeriesValid } from '../nric-validation'

describe('isMFinSeriesValid', () => {
  it('should pass valid M-series FIN numbers', () => {
    expect(isMFinSeriesValid('M1234567K')).toBe(true)
  })

  it('should fail invalid M-series FIN numbers with an incorrect checksum digit', () => {
    expect(isMFinSeriesValid('M1234567L')).toBe(false)
  })

  it('should fail M-series FIN numbers with checksum digits outside of the prescribed range', () => {
    expect(isMFinSeriesValid('M1234567I')).toBe(false)
  })
})
