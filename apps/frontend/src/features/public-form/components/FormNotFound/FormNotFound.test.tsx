import { screen } from '@testing-library/react'

import { render } from '~/test-utils'

import { FormNotFound } from './FormNotFound'

vi.mock('../FormFooter', () => ({
  FormFooter: () => <div>Footer</div>,
}))

describe('FormNotFound', () => {
  it('renders markdown links in the message', () => {
    render(
      <FormNotFound
        header="This form is closed."
        message="Please visit our [help page](https://example.com/help)."
      />,
    )

    expect(screen.getByRole('link', { name: /help page/i })).toHaveAttribute(
      'href',
      'https://example.com/help',
    )
  })
})
