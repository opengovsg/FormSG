import { nextEditFieldsForApproval } from './nextEditFieldsForApproval'

describe('nextEditFieldsForApproval', () => {
  it('adds the approval field to an empty edit list', () => {
    expect(
      nextEditFieldsForApproval({
        edit: [],
        approvalFieldId: 'field-a',
      }),
    ).toEqual(['field-a'])
  })

  it('adds the approval field alongside existing fields', () => {
    expect(
      nextEditFieldsForApproval({
        edit: ['field-x'],
        approvalFieldId: 'field-a',
      }),
    ).toEqual(['field-x', 'field-a'])
  })

  it('does not duplicate a field already in edit', () => {
    expect(
      nextEditFieldsForApproval({
        edit: ['field-a'],
        approvalFieldId: 'field-a',
      }),
    ).toEqual(['field-a'])
  })

  it('leaves the previous approval field in edit when switching A to B', () => {
    const afterA = nextEditFieldsForApproval({
      edit: [],
      approvalFieldId: 'field-a',
    })
    expect(
      nextEditFieldsForApproval({
        edit: afterA,
        approvalFieldId: 'field-b',
      }),
    ).toEqual(['field-a', 'field-b'])
  })

  it('leaves edit untouched when the approval field is cleared', () => {
    expect(
      nextEditFieldsForApproval({
        edit: ['field-a'],
        approvalFieldId: '',
      }),
    ).toEqual(['field-a'])
  })

  it('returns the same array reference when there is nothing to add', () => {
    const edit = ['field-a']
    expect(
      nextEditFieldsForApproval({
        edit,
        approvalFieldId: 'field-a',
      }),
    ).toBe(edit)
  })
})
