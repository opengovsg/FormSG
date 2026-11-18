import {
  getGuidedSecondaryAction,
  GuidedSecondaryAction,
} from './guidedStepPolicy'

describe('getGuidedSecondaryAction', () => {
  it('offers nothing on a first section with nothing to cancel to', () => {
    expect(
      getGuidedSecondaryAction({ sectionIndex: 0, canCancel: false }),
    ).toBe(GuidedSecondaryAction.None)
  })

  it('offers Cancel on a first section that has somewhere to cancel to', () => {
    expect(getGuidedSecondaryAction({ sectionIndex: 0, canCancel: true })).toBe(
      GuidedSecondaryAction.Cancel,
    )
  })

  it.each([1, 2, 3])(
    'offers Back on section %i, which has one behind it',
    (sectionIndex) => {
      expect(getGuidedSecondaryAction({ sectionIndex, canCancel: false })).toBe(
        GuidedSecondaryAction.Back,
      )
    },
  )
})
