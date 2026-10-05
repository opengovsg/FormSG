import {
  getPreviewStepLabel,
  parsePreviewStep,
  withPreviewStep,
} from './usePreviewStep'

describe('parsePreviewStep', () => {
  it.each([
    ['', 0],
    ['step=1', 0],
    ['step=2', 1],
    ['step=3', 2],
    ['step=999', 2],
    ['step=0', 0],
    ['step=-1', 0],
    ['step=abc', 0],
  ])('reads "%s" as step index %i of 3', (query, expected) => {
    expect(parsePreviewStep(new URLSearchParams(query), 3)).toBe(expected)
  })

  it('returns the first step when there is no workflow yet', () => {
    expect(parsePreviewStep(new URLSearchParams('step=3'), 0)).toBe(0)
  })
})

describe('withPreviewStep', () => {
  it('writes the step one-indexed', () => {
    expect(withPreviewStep(new URLSearchParams(), 1).toString()).toBe('step=2')
  })

  it('drops the param for the first step', () => {
    expect(withPreviewStep(new URLSearchParams('step=3'), 0).toString()).toBe(
      '',
    )
  })

  it('keeps unrelated params', () => {
    expect(
      withPreviewStep(new URLSearchParams('foo=bar&step=9'), 2).toString(),
    ).toBe('foo=bar&step=3')
  })

  it('does not mutate its input', () => {
    const params = new URLSearchParams('step=2')
    withPreviewStep(params, 2)
    expect(params.toString()).toBe('step=2')
  })
})

describe('getPreviewStepLabel', () => {
  it('shows the one-indexed step and its name', () => {
    expect(getPreviewStepLabel({ step_name: 'Approver' }, 1)).toBe(
      'Step 2: Approver',
    )
  })

  it('shows only the step number when the step is unnamed', () => {
    expect(getPreviewStepLabel({}, 0)).toBe('Step 1')
  })
})
