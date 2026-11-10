import { MyInfoAttribute } from '../../types'
import { isMyInfoAttrLockedWhenVerified } from '../myinfo-read-only'

describe('isMyInfoAttrLockedWhenVerified', () => {
  it.each([
    MyInfoAttribute.Name,
    MyInfoAttribute.Sex,
    MyInfoAttribute.DateOfBirth,
    MyInfoAttribute.Occupation,
    MyInfoAttribute.WorkpassStatus,
  ])('locks %s', (attr) => {
    expect(isMyInfoAttrLockedWhenVerified(attr)).toBe(true)
  })

  it.each([
    MyInfoAttribute.Marital,
    MyInfoAttribute.MarriageDate,
    MyInfoAttribute.DivorceDate,
    MyInfoAttribute.CountryOfMarriage,
    MyInfoAttribute.MarriageCertNo,
    MyInfoAttribute.VehicleNo,
  ])('leaves %s editable', (attr) => {
    expect(isMyInfoAttrLockedWhenVerified(attr)).toBe(false)
  })

  it('leaves the login identity and children attributes to their own rules', () => {
    expect(isMyInfoAttrLockedWhenVerified(MyInfoAttribute.UinFin)).toBe(false)
    expect(
      isMyInfoAttrLockedWhenVerified(MyInfoAttribute.ChildrenBirthRecords),
    ).toBe(false)
  })
})
