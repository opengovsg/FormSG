import {
  getVerifiedFieldTitle,
  parseVerifiedFieldTitle,
  VerifiedKeys,
} from '../verified-content'

describe('parseVerifiedFieldTitle', () => {
  it('reads the step from a later step title', () => {
    expect(parseVerifiedFieldTitle('CorpPass Validated UEN (Step 2)')).toEqual({
      stepNumber: 2,
    })
  })

  it('returns no step for the plain Step 1 title', () => {
    expect(parseVerifiedFieldTitle('SingPass Validated NRIC')).toEqual({})
  })

  it('round-trips titles from getVerifiedFieldTitle', () => {
    const title = getVerifiedFieldTitle({
      baseKey: VerifiedKeys.CpUid,
      stepNumber: 3,
    })
    expect(parseVerifiedFieldTitle(title)).toEqual({ stepNumber: 3 })
  })

  it('returns null for titles that are not verified field titles', () => {
    expect(parseVerifiedFieldTitle('Full name')).toBeNull()
    expect(parseVerifiedFieldTitle('SingPass Validated NRIC extra')).toBeNull()
  })
})
