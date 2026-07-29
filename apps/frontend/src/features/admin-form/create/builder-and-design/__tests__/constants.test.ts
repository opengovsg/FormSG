import { MyInfoChildAttributes } from 'formsg-shared/types'

import { CREATE_MYINFO_CHILDREN_SUBFIELDS_OPTIONS } from '../constants'

// These are the options the children field's sub-field MultiSelect renders, and
// that dropdown cannot be opened under jsdom, so assert the source of truth.
describe('CREATE_MYINFO_CHILDREN_SUBFIELDS_OPTIONS', () => {
  it('offers every child sub-field except secondary race and the always-collected name', () => {
    expect(
      CREATE_MYINFO_CHILDREN_SUBFIELDS_OPTIONS.map((o) => o.value),
    ).toEqual([
      MyInfoChildAttributes.ChildBirthCertNo,
      MyInfoChildAttributes.ChildDateOfBirth,
      MyInfoChildAttributes.ChildVaxxStatus,
      MyInfoChildAttributes.ChildGender,
      MyInfoChildAttributes.ChildRace,
    ])
  })
})
