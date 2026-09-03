import { ReactNode } from 'react'
import { GrowthBook, GrowthBookProvider } from '@growthbook/growthbook-react'
import { render, screen } from '@testing-library/react'

import { featureFlags } from 'formsg-shared/constants'

import {
  Spotlight,
  SPOTLIGHT_TEST_ID,
  SpotlightGroup,
  SpotlightProps,
} from './Spotlight'

const CHILD_LABEL = 'Pick a field'

const withFlag = (isFlagOn: boolean, children: ReactNode) => (
  <GrowthBookProvider
    growthbook={
      new GrowthBook({
        features: {
          [featureFlags.workflowBuilderRedesign]: { defaultValue: isFlagOn },
        },
      })
    }
  >
    {children}
  </GrowthBookProvider>
)

const renderSpotlight = (
  props: Omit<SpotlightProps, 'children'>,
  { isFlagOn = true }: { isFlagOn?: boolean } = {},
) =>
  render(
    withFlag(
      isFlagOn,
      <Spotlight {...props}>
        <button type="button">{CHILD_LABEL}</button>
      </Spotlight>,
    ),
  )

const renderGroup = (
  {
    activeIndex,
    isEnabled,
  }: { activeIndex: number | null; isEnabled?: boolean },
  { isFlagOn = true }: { isFlagOn?: boolean } = {},
) =>
  render(
    withFlag(
      isFlagOn,
      <SpotlightGroup activeIndex={activeIndex} isEnabled={isEnabled}>
        <button type="button">Step name</button>
        <button type="button">Who fills this in</button>
        <button type="button">What they can see</button>
      </SpotlightGroup>,
    ),
  )

const child = () => screen.getByRole('button', { name: CHILD_LABEL })
const wrapper = () => screen.queryByTestId(SPOTLIGHT_TEST_ID)
const bands = () => screen.queryAllByTestId(SPOTLIGHT_TEST_ID)

describe('Spotlight', () => {
  it('should wrap its children when active and when merely dimmed', () => {
    const view = renderSpotlight({ isActive: true })
    expect(wrapper()).toBeInTheDocument()
    expect(child()).toBeInTheDocument()
    view.unmount()

    renderSpotlight({ isActive: false })
    expect(wrapper()).toBeInTheDocument()
    expect(child()).toBeInTheDocument()
  })

  // Requirement 4. A dimmed section stays fully interactive, so an admin can
  // scroll up and fix an earlier answer without leaving the flow.
  it('should not disable anything when inactive', () => {
    renderSpotlight({ isActive: false })

    expect(child()).toBeEnabled()
    expect(child()).not.toHaveAttribute('aria-disabled')
    expect(wrapper()).not.toHaveAttribute('aria-disabled')
    expect(wrapper()).not.toHaveAttribute('disabled')
    expect(wrapper()).not.toHaveStyle({ pointerEvents: 'none' })
  })

  // The spotlight moves on every Continue, so activation must cost no layout.
  // Design's enlargement is a transform and the ring is an outline, neither of
  // which reflows; padding and border width are what would, so they are pinned
  // identical across the two states. Re-implementing the ring as a `border`
  // reintroduces the 2px jump this replaced.
  it('should occupy the same space active as inactive', () => {
    const view = renderSpotlight({ isActive: false, hasTopBorder: true })
    const inactive = getComputedStyle(wrapper()!)
    const inactiveBox = {
      paddingTop: inactive.paddingTop,
      paddingBottom: inactive.paddingBottom,
      borderTopWidth: inactive.borderTopWidth,
      marginLeft: inactive.marginLeft,
    }
    view.unmount()

    renderSpotlight({ isActive: true, hasTopBorder: true })
    const active = getComputedStyle(wrapper()!)

    expect(active.paddingTop).toBe(inactiveBox.paddingTop)
    expect(active.paddingBottom).toBe(inactiveBox.paddingBottom)
    expect(active.borderTopWidth).toBe(inactiveBox.borderTopWidth)
    // Design rejected the inset: the lit band stays full card width.
    expect(active.marginLeft).toBe(inactiveBox.marginLeft)
    expect(active.marginLeft).toBe('')
  })

  // The enlargement is what design asked for in place of the inset, and it is
  // also what makes the band cover the boundary line of the section below it.
  it('should enlarge and raise the active band, and neither when inactive', () => {
    const view = renderSpotlight({ isActive: true })
    expect(getComputedStyle(wrapper()!).transform).toBe('scale(1.02)')
    expect(getComputedStyle(wrapper()!).zIndex).toBe('1')
    view.unmount()

    renderSpotlight({ isActive: false })
    expect(getComputedStyle(wrapper()!).transform).toBe('none')
    expect(getComputedStyle(wrapper()!).zIndex).toBe('0')
  })

  // The ring is colour-switched rather than switched off. `outline: none` loses
  // to the `outlineColor` longhand beside it, which painted the ring on every
  // band and showed as a rectangle around the whole group at 0.5 opacity.
  it('should show the ring only when active', () => {
    const view = renderSpotlight({ isActive: true })
    const activeRing = getComputedStyle(wrapper()!).outlineColor
    view.unmount()

    renderSpotlight({ isActive: false })
    const inactiveRing = getComputedStyle(wrapper()!).outlineColor

    expect(inactiveRing).not.toBe(activeRing)
    expect(inactiveRing).toMatch(/transparent|rgba\(0, 0, 0, 0\)/)
  })

  // Requirement 1: when off, children render untouched. Asserted as "there is
  // no wrapper at all", so nothing can leak an outline, a band or an opacity,
  // rather than checking each property in turn.
  it('should render children with no wrapper at all when disabled', () => {
    renderSpotlight({ isActive: true, isEnabled: false })

    expect(wrapper()).not.toBeInTheDocument()
    expect(child()).toBeInTheDocument()
  })

  // Requirement 7, and the one that matters most: this is live for the whole
  // Singapore government, so flag-off must leave every section exactly as it
  // was, including one the flow would otherwise have spotlit.
  it('should render children with no wrapper at all when the flag is off', () => {
    renderSpotlight({ isActive: true }, { isFlagOn: false })

    expect(wrapper()).not.toBeInTheDocument()
    expect(child()).toBeInTheDocument()
  })
})

describe('SpotlightGroup', () => {
  it('should light exactly one band', () => {
    renderGroup({ activeIndex: 1 })

    expect(bands()).toHaveLength(3)
    const transforms = bands().map((b) => getComputedStyle(b).transform)
    expect(transforms).toEqual(['none', 'scale(1.02)', 'none'])
  })

  it('should ring exactly one band', () => {
    renderGroup({ activeIndex: 1 })
    const rings = bands().map((b) => getComputedStyle(b).outlineColor)

    expect(rings[1]).not.toMatch(/transparent|rgba\(0, 0, 0, 0\)/)
    expect(rings[0]).toMatch(/transparent|rgba\(0, 0, 0, 0\)/)
    expect(rings[2]).toMatch(/transparent|rgba\(0, 0, 0, 0\)/)
  })

  // The two lines the outline is drawn on have to go, or a grey hairline shows
  // a pixel inside the blue. The line below section N belongs to section N+1,
  // which is the whole reason the lines live in the group rather than the band.
  it('should suppress the boundary lines the active outline is drawn on', () => {
    renderGroup({ activeIndex: 1 })
    const [first, active, belowActive] = bands()

    // The first section's boundary is the card edge, so it never has a line.
    const suppressed = getComputedStyle(first).borderTopColor
    expect(getComputedStyle(active).borderTopColor).toBe(suppressed)
    expect(getComputedStyle(belowActive).borderTopColor).toBe(suppressed)
  })

  it('should draw the boundary line on a section the outline does not touch', () => {
    renderGroup({ activeIndex: 0 })
    const [first, , unaffected] = bands()

    // Section 3 is neither active nor below the active one, so its line stays.
    expect(getComputedStyle(unaffected).borderTopColor).not.toBe(
      getComputedStyle(first).borderTopColor,
    )
  })

  // The last section's lower boundary belongs to the group, not the container.
  // If the container owned that gap the last band could not reach its own line
  // and the outline would float above it while every other section's sat on it.
  it('should give the last band a lower boundary of its own', () => {
    renderGroup({ activeIndex: 0 })
    const [first, , last] = bands()

    expect(getComputedStyle(last).borderBottomColor).not.toBe(
      getComputedStyle(first).borderBottomColor,
    )
    expect(getComputedStyle(first).borderBottomColor).toMatch(
      /transparent|rgba\(0, 0, 0, 0\)/,
    )
  })

  it('should suppress the trailing boundary when the last band is lit', () => {
    renderGroup({ activeIndex: 2 })
    const [first, , last] = bands()

    expect(getComputedStyle(last).borderBottomColor).toBe(
      getComputedStyle(first).borderBottomColor,
    )
  })

  // Every boundary line gets the same clearance, which is what EditStepBlock's
  // Stack spacing already gives its sibling dividers. Halving it on the theory
  // that two bands share one gap makes the whole card tighter than it is today.
  it('should clear every boundary line by the same amount', () => {
    renderGroup({ activeIndex: 1 })

    bands().forEach((band) => {
      const style = getComputedStyle(band)
      expect(style.paddingTop).toBe('1.5rem')
      expect(style.paddingBottom).toBe('1.5rem')
    })
  })

  it('should light nothing when there is no active section', () => {
    renderGroup({ activeIndex: null })

    expect(bands().map((b) => getComputedStyle(b).transform)).toEqual([
      'none',
      'none',
      'none',
    ])
  })

  // Flag-off and spotlight-off keep the pre-redesign structure: sibling
  // dividers, no bands. Asserted as structure rather than styling, because
  // "looks the same" is exactly what a band with neutral styling would pass.
  it.each([
    ['disabled', { activeIndex: 0, isEnabled: false }, { isFlagOn: true }],
    ['the flag is off', { activeIndex: 0 }, { isFlagOn: false }],
  ])(
    'should render sibling dividers and no bands when %s',
    (_, props, opts) => {
      renderGroup(props, opts)

      expect(bands()).toHaveLength(0)
      // Two between the three sections, plus the group's trailing boundary.
      expect(screen.getAllByRole('separator')).toHaveLength(3)
      expect(
        screen.getByRole('button', { name: 'Who fills this in' }),
      ).toBeInTheDocument()
    },
  )
})
