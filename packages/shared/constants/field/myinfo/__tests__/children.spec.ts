import { MyInfoChildAttributes } from '../../../../types/field'
import {
  DEPRECATED_MYINFO_CHILD_ATTRIBUTES,
  MYINFO_ATTRIBUTE_MAP,
  SELECTABLE_MYINFO_CHILD_ATTRIBUTES,
} from '../index'

describe('children field attributes', () => {
  it('should offer every child sub-field except secondary race', () => {
    expect(SELECTABLE_MYINFO_CHILD_ATTRIBUTES).toEqual([
      MyInfoChildAttributes.ChildName,
      MyInfoChildAttributes.ChildBirthCertNo,
      MyInfoChildAttributes.ChildDateOfBirth,
      MyInfoChildAttributes.ChildVaxxStatus,
      MyInfoChildAttributes.ChildGender,
      MyInfoChildAttributes.ChildRace,
    ])
  })

  it('should account for every attribute as either selectable or deprecated', () => {
    expect(
      [
        ...SELECTABLE_MYINFO_CHILD_ATTRIBUTES,
        ...DEPRECATED_MYINFO_CHILD_ATTRIBUTES,
      ].sort(),
    ).toEqual(Object.values(MyInfoChildAttributes).sort())
  })

  // Existing responses render their sub-field label from this map, so dropping
  // the secondary race entry would break them.
  it('should keep secondary race resolvable in MYINFO_ATTRIBUTE_MAP', () => {
    expect(
      MYINFO_ATTRIBUTE_MAP[MyInfoChildAttributes.ChildSecondaryRace]
        ?.description,
    ).toBe('Secondary race')
  })
})
