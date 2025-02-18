import { composeStories } from '@storybook/react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'

import { verifyAddress } from '~/services/OneMapService'

import {
  INVALID_BLOCK_UNIT_ERROR,
  INVALID_NON_NUMERICAL_ERROR,
  REQUIRED_ERROR,
  VALID_POSTAL_CODE_NO_ADDRESS_ERROR,
} from '~constants/validation'

import * as stories from './AddressField.stories'

const {
  ValidationRequired,
  ValidationNotRequired,
  InvalidPostalCode,
  InvalidLevelUnit,
  ValidPostalCodeApiFail,
} = composeStories(stories)

// Mock the verifyAddress function
vi.mock('~/services/OneMapService', () => ({
  verifyAddress: vi.fn(),
}))

describe('validation required', () => {
  it('renders error when field is not filled before submitting', async () => {
    // Arrange
    const user = userEvent.setup()
    render(<ValidationRequired />)
    const submitButton = screen.getByText('Submit')

    // Act
    await user.click(submitButton)

    // Assert
    // Should show error message.
    const error = screen.getAllByText(REQUIRED_ERROR)
    expect(error).toHaveLength(3)
  })

  it('renders success when field is not required & inputs are empty', async () => {
    const user = userEvent.setup()
    render(<ValidationNotRequired />)
    const submitButton = screen.getByText('Submit')

    await user.click(submitButton)

    const success = screen.getByText('You have submitted: Nothing was selected')
    expect(success).not.toBeNull()
  })

  it('renders invalid postal code error when postalCode has invalid format', async () => {
    const user = userEvent.setup()
    render(<InvalidPostalCode />)
    const submitButton = screen.getByText('Submit')

    await user.click(submitButton)
    const error = screen.queryByText(INVALID_NON_NUMERICAL_ERROR)
    expect(error).not.toBeNull()
  })

  it('renders invalid block/unit number when input has special characters', async () => {
    const user = userEvent.setup()
    render(<InvalidLevelUnit />)
    const submitButton = screen.getByText('Submit')

    await user.click(submitButton)
    const error = screen.queryByText(INVALID_BLOCK_UNIT_ERROR)
    expect(error).not.toBeNull()
  })

  it('renders failed api resp when api fails to grab address info', async () => {
    ;(verifyAddress as jest.Mock).mockResolvedValue({
      success: false,
    })
    const user = userEvent.setup()
    render(<ValidPostalCodeApiFail />)
    const verifyButton = screen.getByRole('button', { name: /Find Address/i })

    await user.click(verifyButton)
    const error = screen.getAllByText(VALID_POSTAL_CODE_NO_ADDRESS_ERROR)
    expect(error).toHaveLength(2)
  })
})
