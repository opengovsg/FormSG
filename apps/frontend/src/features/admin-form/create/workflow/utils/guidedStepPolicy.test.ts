import {
  getGuidedSecondaryAction,
  GuidedSecondaryAction,
} from './guidedStepPolicy'

describe('getGuidedSecondaryAction', () => {
  it('offers nothing on the first section of step 1', () => {
    expect(
      getGuidedSecondaryAction({ sectionIndex: 0, isFirstStep: true }),
    ).toBe(GuidedSecondaryAction.None)
  })

  it('offers Cancel on the first section of a later step', () => {
    expect(
      getGuidedSecondaryAction({ sectionIndex: 0, isFirstStep: false }),
    ).toBe(GuidedSecondaryAction.Cancel)
  })

  it.each([1, 2, 3])(
    'offers Back on section %i, which has one behind it',
    (sectionIndex) => {
      expect(
        getGuidedSecondaryAction({ sectionIndex, isFirstStep: true }),
      ).toBe(GuidedSecondaryAction.Back)
    },
  )
})
