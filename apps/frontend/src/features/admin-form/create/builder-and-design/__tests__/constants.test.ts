import { FormResponseMode, MyInfoChildAttributes } from 'formsg-shared/types'

import {
  CREATE_MYINFO_CHILDREN_SUBFIELDS_OPTIONS,
  getCreateMyInfoChildrenSubFieldsOptions,
} from '../constants'

const WITHOUT_CHILD_TYPE = [
  MyInfoChildAttributes.ChildBirthCertNo,
  MyInfoChildAttributes.ChildDateOfBirth,
  MyInfoChildAttributes.ChildVaxxStatus,
  MyInfoChildAttributes.ChildGender,
  MyInfoChildAttributes.ChildRace,
]

// These are the options the children field's sub-field MultiSelect renders, and
// that dropdown cannot be opened under jsdom, so assert the source of truth.
describe('CREATE_MYINFO_CHILDREN_SUBFIELDS_OPTIONS', () => {
  it('offers every child sub-field except secondary race and the always-collected name', () => {
    expect(
      CREATE_MYINFO_CHILDREN_SUBFIELDS_OPTIONS.map((o) => o.value),
    ).toEqual([...WITHOUT_CHILD_TYPE, MyInfoChildAttributes.ChildType])
  })
})

describe('getCreateMyInfoChildrenSubFieldsOptions', () => {
  it('offers child type on a Multirespondent form when sponsored children are enabled', () => {
    expect(
      getCreateMyInfoChildrenSubFieldsOptions({
        responseMode: FormResponseMode.Multirespondent,
        isSponsoredChildrenEnabled: true,
      }).map((o) => o.value),
    ).toEqual([...WITHOUT_CHILD_TYPE, MyInfoChildAttributes.ChildType])
  })

  it('hides child type on a Multirespondent form when the flag is off', () => {
    expect(
      getCreateMyInfoChildrenSubFieldsOptions({
        responseMode: FormResponseMode.Multirespondent,
        isSponsoredChildrenEnabled: false,
      }).map((o) => o.value),
    ).toEqual(WITHOUT_CHILD_TYPE)
  })

  it('hides child type on a Storage mode form even when the flag is on', () => {
    expect(
      getCreateMyInfoChildrenSubFieldsOptions({
        responseMode: FormResponseMode.Encrypt,
        isSponsoredChildrenEnabled: true,
      }).map((o) => o.value),
    ).toEqual(WITHOUT_CHILD_TYPE)
  })

  it('hides child type while the form is still loading', () => {
    expect(
      getCreateMyInfoChildrenSubFieldsOptions({
        responseMode: undefined,
        isSponsoredChildrenEnabled: true,
      }).map((o) => o.value),
    ).toEqual(WITHOUT_CHILD_TYPE)
  })
})
