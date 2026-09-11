import { withPreviewStepParam } from './previewStepParam'

describe('withPreviewStepParam', () => {
  it('sets the step param for a non-zero step', () => {
    expect(withPreviewStepParam(new URLSearchParams(), 2).toString()).toBe(
      'step=2',
    )
  })

  it('removes the step param for step 0', () => {
    expect(
      withPreviewStepParam(new URLSearchParams('step=3'), 0).toString(),
    ).toBe('')
  })

  it('overwrites an existing step param', () => {
    expect(
      withPreviewStepParam(new URLSearchParams('step=999'), 2).toString(),
    ).toBe('step=2')
  })

  it('preserves unrelated params', () => {
    expect(
      withPreviewStepParam(new URLSearchParams('foo=bar&step=1'), 0).toString(),
    ).toBe('foo=bar')
  })

  it('does not mutate the input params', () => {
    const prev = new URLSearchParams('step=1')
    withPreviewStepParam(prev, 2)
    expect(prev.toString()).toBe('step=1')
  })
})
