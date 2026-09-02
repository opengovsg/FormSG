import { GrowthBook, GrowthBookProvider } from '@growthbook/growthbook-react'
import { render, screen } from '@testing-library/react'

import { featureFlags } from 'formsg-shared/constants'

import { Spotlight, SPOTLIGHT_TEST_ID, SpotlightProps } from './Spotlight'

const CHILD_LABEL = 'Pick a field'

const renderSpotlight = (
  props: Omit<SpotlightProps, 'children'>,
  { isFlagOn = true }: { isFlagOn?: boolean } = {},
) =>
  render(
    <GrowthBookProvider
      growthbook={
        new GrowthBook({
          features: {
            [featureFlags.workflowBuilderRedesign]: { defaultValue: isFlagOn },
          },
        })
      }
    >
      <Spotlight {...props}>
        <button type="button">{CHILD_LABEL}</button>
      </Spotlight>
    </GrowthBookProvider>,
  )

const child = () => screen.getByRole('button', { name: CHILD_LABEL })
const wrapper = () => screen.queryByTestId(SPOTLIGHT_TEST_ID)

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

  // The transparent border is load-bearing: it reserves the space the active
  // border occupies, so sections do not shift when the spotlight moves onto
  // them. Simplifying the inactive branch to `border: none` reintroduces a 2px
  // jump on every Continue.
  it('should reserve the same border width when inactive as when active', () => {
    const view = renderSpotlight({ isActive: true })
    const activeBorder = getComputedStyle(wrapper()!).borderWidth
    view.unmount()

    renderSpotlight({ isActive: false })

    expect(getComputedStyle(wrapper()!).borderWidth).toBe(activeBorder)
    expect(activeBorder).toBe('2px')
  })

  // Requirement 1: when off, children render untouched. Asserted as "there is
  // no wrapper at all", so nothing can leak a border, padding or an opacity,
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
