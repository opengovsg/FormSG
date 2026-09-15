import { isSpotlightEnabled } from './spotlightPolicy'

describe('isSpotlightEnabled', () => {
  // The only situation the spotlight is off in. All three conditions have to
  // hold, which is the part the prototype's naming obscured.
  it('should be off only on step 3+ with every section visible and guidance off', () => {
    expect(
      isSpotlightEnabled({
        stepNumber: 2,
        areAllSectionsVisible: true,
        isGuidanceOn: false,
      }),
    ).toBe(false)
  })

  it('should stay on for steps 1 and 2 regardless of the other two facts', () => {
    ;[0, 1].forEach((stepNumber) => {
      ;[true, false].forEach((areAllSectionsVisible) => {
        ;[true, false].forEach((isGuidanceOn) => {
          expect(
            isSpotlightEnabled({
              stepNumber,
              areAllSectionsVisible,
              isGuidanceOn,
            }),
          ).toBe(true)
        })
      })
    })
  })

  // Turning the toggle on re-enables it, which is what lets an admin who
  // skipped guidance ask for it back.
  it('should be on when guidance is on, even on a later step with all sections visible', () => {
    expect(
      isSpotlightEnabled({
        stepNumber: 4,
        areAllSectionsVisible: true,
        isGuidanceOn: true,
      }),
    ).toBe(true)
  })

  // Mid-step on a later step with guidance off: sections are still being
  // revealed, so the spotlight is still doing the revealing.
  it('should be on while a later step still has sections to reveal', () => {
    expect(
      isSpotlightEnabled({
        stepNumber: 2,
        areAllSectionsVisible: false,
        isGuidanceOn: false,
      }),
    ).toBe(true)
  })

  // Step 3 is index 2. Off by one in either direction changes which step first
  // gets to skip the spotlight.
  it('should treat step index 2 as the first later step', () => {
    const allVisibleGuidanceOff = {
      areAllSectionsVisible: true,
      isGuidanceOn: false,
    }

    expect(
      isSpotlightEnabled({ stepNumber: 1, ...allVisibleGuidanceOff }),
    ).toBe(true)
    expect(
      isSpotlightEnabled({ stepNumber: 2, ...allVisibleGuidanceOff }),
    ).toBe(false)
  })
})
