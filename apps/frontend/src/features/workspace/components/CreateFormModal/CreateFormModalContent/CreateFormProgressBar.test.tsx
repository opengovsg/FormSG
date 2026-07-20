import { screen } from '@testing-library/react'

import { render } from '~/test-utils'

import { CreateFormProgressBar } from './CreateFormProgressBar'

describe('CreateFormProgressBar', () => {
  it('reports the current step through progressbar aria attributes', () => {
    render(<CreateFormProgressBar currentStepIdx={1} numSteps={3} />)

    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '2')
    expect(bar).toHaveAttribute('aria-valuemin', '1')
    expect(bar).toHaveAttribute('aria-valuemax', '3')
    expect(bar).toHaveAccessibleName('Step 2 of 3')
  })

  it('fills proportionally to the current step', () => {
    render(<CreateFormProgressBar currentStepIdx={0} numSteps={4} />)

    expect(screen.getByTestId('progress-fill')).toHaveStyle({ width: '25%' })
  })

  it('is fully filled on the final step', () => {
    render(<CreateFormProgressBar currentStepIdx={2} numSteps={3} />)

    expect(screen.getByTestId('progress-fill')).toHaveStyle({ width: '100%' })
  })
})
