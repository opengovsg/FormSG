import { render, screen } from '@testing-library/react'

import { SaveActionGroup } from './SaveActionGroup'

const noop = () => undefined

describe('SaveActionGroup on a phone', () => {
  it('gives every action the same full width, delete included', () => {
    render(
      <SaveActionGroup
        isLoading={false}
        handleSubmit={noop}
        handleCancel={noop}
        handleDelete={noop}
        submitButtonLabel="Save step"
        ariaLabelName="step"
      />,
    )

    screen.getAllByRole('button').forEach((button) => {
      expect(button).toHaveStyle({ width: '100%' })
    })
  })
})
