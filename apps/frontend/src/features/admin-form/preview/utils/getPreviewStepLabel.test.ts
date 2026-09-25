import { getPreviewStepLabel } from './getPreviewStepLabel'

describe('getPreviewStepLabel', () => {
  it('appends the step name when there is one', () => {
    expect(getPreviewStepLabel({ step_name: 'Approver' }, 1)).toBe(
      'Step 2: Approver',
    )
  })

  it('shows the position alone when the step is unnamed', () => {
    expect(getPreviewStepLabel({}, 2)).toBe('Step 3')
  })

  it('treats an empty step name as unnamed', () => {
    expect(getPreviewStepLabel({ step_name: '' }, 0)).toBe('Step 1')
  })

  it('displays the zero-indexed first step as Step 1', () => {
    expect(getPreviewStepLabel({ step_name: 'Requestor' }, 0)).toBe(
      'Step 1: Requestor',
    )
  })
})
