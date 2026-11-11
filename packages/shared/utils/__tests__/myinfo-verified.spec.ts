import { MyInfoAttribute } from '../../types'
import { isMyInfoVerifiedFor } from '../myinfo-verified'

describe('isMyInfoVerifiedFor', () => {
  it('is true for an attribute verified for the respondent type', () => {
    expect(isMyInfoVerifiedFor(MyInfoAttribute.Name, 'SG')).toBe(true)
    expect(isMyInfoVerifiedFor(MyInfoAttribute.Occupation, 'F')).toBe(true)
  })

  it.each([
    MyInfoAttribute.Occupation,
    MyInfoAttribute.MobileNo,
    MyInfoAttribute.Marital,
  ])('is false for %s for a Singaporean', (attr) => {
    expect(isMyInfoVerifiedFor(attr, 'SG')).toBe(false)
  })

  it('is false for an unknown attribute', () => {
    expect(isMyInfoVerifiedFor('unknown' as MyInfoAttribute, 'SG')).toBe(false)
  })
})
