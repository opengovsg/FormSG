import { sortFieldIdsByFormOrder } from './sortFieldIdsByFormOrder'

const formFields = [{ _id: 'q1' }, { _id: 'q2' }, { _id: 'q3' }]

describe('sortFieldIdsByFormOrder', () => {
  it('lists picked fields in question order, not the order they were picked', () => {
    expect(sortFieldIdsByFormOrder(['q1', 'q3', 'q2'], formFields)).toEqual([
      'q1',
      'q2',
      'q3',
    ])
  })

  it('keeps fields deleted from the form, after the rest', () => {
    expect(
      sortFieldIdsByFormOrder(['deleted', 'q3', 'q1'], formFields),
    ).toEqual(['q1', 'q3', 'deleted'])
  })
})
