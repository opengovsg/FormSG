import {
  getGuidedSecondaryAction,
  GuidedSecondaryAction,
} from './guidedStepPolicy'

describe('getGuidedSecondaryAction', () => {
  it('offers nothing on a first section with nothing to cancel to', () => {
    expect(
      getGuidedSecondaryAction({ isFirstSection: true, canCancel: false }),
    ).toBe(GuidedSecondaryAction.None)
  })

  it('offers Cancel on a first section that has somewhere to cancel to', () => {
    expect(
      getGuidedSecondaryAction({ isFirstSection: true, canCancel: true }),
    ).toBe(GuidedSecondaryAction.Cancel)
  })

  it('offers Back on a later section', () => {
    expect(
      getGuidedSecondaryAction({ isFirstSection: false, canCancel: true }),
    ).toBe(GuidedSecondaryAction.Back)
  })
})
