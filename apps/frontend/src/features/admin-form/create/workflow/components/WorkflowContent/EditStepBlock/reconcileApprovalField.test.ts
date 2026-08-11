import { addApprovalFieldToEdit } from './reconcileApprovalField'

describe('addApprovalFieldToEdit', () => {
  it('adds the approval field to an empty edit list', () => {
    expect(addApprovalFieldToEdit([], 'field-a')).toEqual(['field-a'])
  })

  it('adds the approval field alongside existing fields', () => {
    expect(addApprovalFieldToEdit(['field-x'], 'field-a')).toEqual([
      'field-x',
      'field-a',
    ])
  })

  it('does not duplicate a field already in edit', () => {
    expect(addApprovalFieldToEdit(['field-a'], 'field-a')).toEqual(['field-a'])
  })

  it('switching the approval field from A to B leaves A in edit (§4.5.1 — intended, not a bug)', () => {
    const afterA = addApprovalFieldToEdit([], 'field-a')
    const afterSwitchToB = addApprovalFieldToEdit(afterA, 'field-b')
    expect(afterSwitchToB).toEqual(['field-a', 'field-b'])
  })
})
