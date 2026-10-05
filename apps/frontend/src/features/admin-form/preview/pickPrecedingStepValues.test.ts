import { pickPrecedingStepValues } from './pickPrecedingStepValues'

const requestor = { edit: ['reason'] }
const approver = { edit: ['comments'] }

describe('pickPrecedingStepValues', () => {
  it("keeps an earlier step's answer", () => {
    expect(
      pickPrecedingStepValues([requestor], {
        reason: 'New laptop',
        comments: 'typed at step 2',
      }),
    ).toEqual({ reason: 'New laptop' })
  })

  it('keeps answers from every preceding step', () => {
    expect(
      pickPrecedingStepValues([requestor, approver], {
        reason: 'New laptop',
        comments: 'Looks fine',
        approval: 'typed at step 3',
      }),
    ).toEqual({ reason: 'New laptop', comments: 'Looks fine' })
  })

  it('keeps nothing for the first step', () => {
    expect(
      pickPrecedingStepValues([], { reason: 'New laptop', approval: 'Yes' }),
    ).toEqual({})
  })

  it('keeps an empty answer rather than dropping it', () => {
    expect(pickPrecedingStepValues([requestor], { reason: '' })).toEqual({
      reason: '',
    })
  })

  it('skips a field with no entered value', () => {
    expect(pickPrecedingStepValues([requestor], {})).toEqual({})
  })
})
