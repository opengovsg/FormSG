import { getWorkflowCardPose } from './workflowCardPose'

describe('getWorkflowCardPose', () => {
  it('always re-centres the card, landed or not', () => {
    // Without this the absolutely-positioned card overhangs to the right of
    // left:50% and gives a narrow viewport a horizontal scrollbar.
    expect(getWorkflowCardPose(0, false).transform).toContain(
      'translate(-50%, 0)',
    )
    expect(getWorkflowCardPose(0, true).transform).toContain(
      'translate(-50%, 0)',
    )
  })

  it('hides a card that has not landed yet', () => {
    expect(getWorkflowCardPose(1, false).opacity).toBe(0)
    expect(getWorkflowCardPose(1, true).opacity).toBe(1)
  })

  it('waits above the stack and lands below it', () => {
    expect(getWorkflowCardPose(0, false).transform).toContain(
      'translateY(-120px)',
    )
    expect(getWorkflowCardPose(0, true).transform).toContain('translateY(30px)')
  })

  it('steps each landed card down by a fixed amount', () => {
    expect(getWorkflowCardPose(1, true).transform).toContain('translateY(74px)')
    expect(getWorkflowCardPose(2, true).transform).toContain(
      'translateY(118px)',
    )
  })

  it('alternates the tilt by index so the stack is not a list', () => {
    expect(getWorkflowCardPose(0, true).transform).toContain('rotate(-1.5deg)')
    expect(getWorkflowCardPose(1, true).transform).toContain('rotate(1.5deg)')
    expect(getWorkflowCardPose(2, true).transform).toContain('rotate(-1.5deg)')
  })

  it('settles from an exaggerated tilt, which is what reads as weight', () => {
    expect(getWorkflowCardPose(0, false).transform).toContain('rotate(-7deg)')
    expect(getWorkflowCardPose(0, true).transform).toContain('rotate(-1.5deg)')
  })
})
