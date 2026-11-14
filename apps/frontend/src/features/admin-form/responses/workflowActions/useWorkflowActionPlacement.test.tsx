import {
  getActionPlacement,
  isRowFullyVisible,
} from './useWorkflowActionPlacement'

describe('workflow action placement', () => {
  it('uses top actions when both rows are visible', () => {
    expect(getActionPlacement(true, true, true, null)).toEqual({
      showCurrentActions: false,
      showStickyActions: false,
    })
  })
  it('shows sticky actions when the top row is clipped', () => {
    expect(getActionPlacement(true, false, false, null)).toEqual({
      showCurrentActions: false,
      showStickyActions: true,
    })
  })
  it('uses current actions when the top row leaves view', () => {
    expect(getActionPlacement(false, false, true, null)).toEqual({
      showCurrentActions: true,
      showStickyActions: false,
    })
  })
  it('keeps the currently focused row mounted', () => {
    expect(
      getActionPlacement(true, true, false, 'current').showCurrentActions,
    ).toBe(true)
    expect(
      getActionPlacement(true, true, false, 'sticky').showStickyActions,
    ).toBe(true)
  })
  it('requires the whole wrapped button row inside the usable bounds', () => {
    expect(
      isRowFullyVisible(
        { top: 20, bottom: 120, left: 10, right: 300, width: 290, height: 100 },
        { top: 30, bottom: 500, left: 0, right: 320 },
      ),
    ).toBe(false)
    expect(
      isRowFullyVisible(
        { top: 30, bottom: 130, left: 10, right: 300, width: 290, height: 100 },
        { top: 30, bottom: 500, left: 0, right: 320 },
      ),
    ).toBe(true)
    expect(
      isRowFullyVisible(
        { top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0 },
        { top: 0, bottom: 500, left: 0, right: 320 },
      ),
    ).toBe(false)
  })
})
